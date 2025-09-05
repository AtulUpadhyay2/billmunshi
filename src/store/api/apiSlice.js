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
        if (refreshToken) {
          const refreshResult = await baseQuery({
            url: "auth/token/refresh/",
            method: "POST",
            body: { refresh: refreshToken },
          }, api, extraOptions);

          if (refreshResult.data) {
            // Successfully refreshed the token
            const { access } = refreshResult.data;
            
            // Update tokens in localStorage
            localStorage.setItem("access_token", access);
            
            // Update Redux state
            const state = api.getState();
            const currentUser = state.auth.user;
            const currentRefreshToken = state.auth.refreshToken;
            
            if (currentUser) {
              api.dispatch(setUser({
                user: currentUser,
                access: access,
                refresh: currentRefreshToken
              }));
            }

            console.log("Token refreshed successfully");

            // Retry the original request with new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            // Refresh failed, logout user
            console.log("Token refresh failed, logging out user");
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
  endpoints: (builder) => ({}),
});
