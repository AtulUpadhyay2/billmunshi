import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logOut, setUser, forceLogout } from "./auth/authSlice";
import { API_CONFIG } from "../../config/api";

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    // Don't set Content-Type here at all - let individual endpoints handle it
    return headers;
  },
});

// Mutex to prevent concurrent refresh attempts
let isRefreshing = false;
let refreshPromise = null;

// Refresh token using native fetch (without Authorization header)
const refreshAccessToken = async (refreshToken) => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Explicitly NOT sending Authorization header
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Token refresh failed");
  }

  return response.json();
};

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
        const refreshToken = localStorage.getItem("refresh_token");
        
        if (refreshToken && refreshToken.trim()) {
          try {
            // Use mutex to prevent concurrent refresh attempts
            if (!isRefreshing) {
              isRefreshing = true;
              console.log("Access token expired, attempting refresh...");
              refreshPromise = refreshAccessToken(refreshToken);
            } else {
              console.log("Refresh already in progress, waiting...");
            }

            const refreshData = await refreshPromise;

            if (refreshData && refreshData.access) {
              // Successfully refreshed the token
              const { access, refresh: newRefreshToken, user: updatedUser } = refreshData;
              
              console.log("Token refresh successful:", {
                hasAccess: !!access,
                hasRefresh: !!newRefreshToken,
                hasUser: !!updatedUser
              });
              
              // Update tokens in localStorage
              localStorage.setItem("access_token", access);
              
              // Update refresh token if a new one is provided
              if (newRefreshToken) {
                localStorage.setItem("refresh_token", newRefreshToken);
                console.log("Updated refresh token in localStorage");
              }
              
              // Update Redux state with fresh user data from refresh response
              const state = api.getState();
              const userToUpdate = updatedUser || state.auth.user;
              
              if (userToUpdate) {
                api.dispatch(setUser({
                  user: userToUpdate,
                  access: access,
                  refresh: newRefreshToken || refreshToken
                }));
                console.log("Updated user state with new tokens");
              }

              console.log("Token refreshed successfully - retrying original request");

              // Retry the original request with new token
              result = await baseQuery(args, api, extraOptions);
            } else {
              // Refresh response doesn't contain access token
              console.log("Token refresh failed - invalid response structure");
              api.dispatch(forceLogout());
              
              if (typeof window !== 'undefined' && window.globalToast) {
                window.globalToast.error("Session refresh failed. Please login again.");
              }
            }
          } catch (refreshError) {
            // Refresh request failed
            console.log("Token refresh request failed:", refreshError);
            api.dispatch(forceLogout());
            
            if (typeof window !== 'undefined' && window.globalToast) {
              window.globalToast.error("Your session has expired. Please login again.");
            }
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        } else {
          // No refresh token, logout user
          console.log("No refresh token available, logging out user");
          api.dispatch(forceLogout());
          
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
