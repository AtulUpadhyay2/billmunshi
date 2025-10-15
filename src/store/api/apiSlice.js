import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logOut, setUser, forceLogout } from "./auth/authSlice";

const baseQuery = fetchBaseQuery({
  baseUrl: "https://billmunshi.com/api/v1/",
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    // Don't set Content-Type here at all - let individual endpoints handle it
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Check if the error indicates token expiration
  if (result.error) {
    const { status, data } = result.error;
    
    // Handle token expiration (401 status with specific error codes)
    if (status === 401 && data) {
      const isTokenExpired = 
        data.code === "token_not_valid" ||
        data.detail === "Given token not valid for any token type" ||
        (data.messages && data.messages.some(msg => 
          msg.message === "Token is expired" || 
          msg.token_type === "access"
        ));

      if (isTokenExpired) {
        console.log("Access token expired, attempting refresh...");
        
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken && refreshToken.trim()) {
          try {
            const refreshResult = await baseQuery({
              url: "auth/refresh/",
              method: "POST",
              body: { refresh: refreshToken },
            }, api, extraOptions);

            if (refreshResult.data && refreshResult.data.access) {
              // Successfully refreshed the token
              const { access, refresh: newRefreshToken, user: updatedUser } = refreshResult.data;
              
              console.log("Token refresh successful:", {
                hasAccess: !!access,
                hasRefresh: !!newRefreshToken,
                hasUser: !!updatedUser
              });
              
              // Update tokens in localStorage
              localStorage.setItem("access_token", access);
              
              // Update refresh token if a new one is provided (your API returns both)
              if (newRefreshToken) {
                localStorage.setItem("refresh_token", newRefreshToken);
                console.log("Updated refresh token in localStorage");
              }
              
              // Update Redux state with fresh user data from refresh response
              const state = api.getState();
              const userToUpdate = updatedUser || state.auth.user; // Use updated user if provided, fallback to current user
              
              if (userToUpdate) {
                api.dispatch(setUser({
                  user: userToUpdate,
                  access: access,
                  refresh: newRefreshToken || refreshToken // Use new refresh token if provided, otherwise keep current
                }));
                console.log("Updated user state with new tokens");
              }

              console.log("Token refreshed successfully - retrying original request");

              // Retry the original request with new token
              result = await baseQuery(args, api, extraOptions);
            } else {
              // Refresh response doesn't contain access token
              console.log("Token refresh failed - invalid response structure:", refreshResult);
              api.dispatch(forceLogout());
              
              // Show a toast notification
              if (typeof window !== 'undefined' && window.globalToast) {
                window.globalToast.error("Session refresh failed. Please login again.");
              }
            }
          } catch (refreshError) {
            // Refresh request failed
            console.log("Token refresh request failed:", refreshError);
            api.dispatch(forceLogout());
            
            // Show a toast notification
            if (typeof window !== 'undefined' && window.globalToast) {
              window.globalToast.error("Your session has expired. Please login again.");
            }
          }
        } else {
          // No refresh token, logout user
          console.log("No refresh token available, logging out user");
          api.dispatch(forceLogout());
          
          // Show a toast notification
          if (typeof window !== 'undefined' && window.globalToast) {
            window.globalToast.error("Your session has expired. Please login again.");
          }
        }
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ApiKeys"],
  endpoints: (builder) => ({}),
});
