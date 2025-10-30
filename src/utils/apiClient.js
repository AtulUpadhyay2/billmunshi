import axios from "axios";
import { API_CONFIG } from "../config/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT || 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorData = error.response?.data;

      // Check if it's a token expiration error
      const isTokenExpired =
        errorData?.code === "token_not_valid" ||
        errorData?.detail === "Given token not valid for any token type" ||
        (errorData?.messages &&
          errorData.messages.some(
            (msg) =>
              msg.message === "Token is expired" || msg.token_type === "access"
          ));

      if (isTokenExpired) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem("refresh_token");

          if (!refreshToken || !refreshToken.trim()) {
            throw new Error("No refresh token available");
          }

          console.log("Access token expired, attempting refresh...");

          // Attempt to refresh the token
          const response = await axios.post(
            `${API_CONFIG.BASE_URL}/auth/refresh/`,
            { refresh: refreshToken },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data?.access) {
            const { access, refresh: newRefreshToken, user } = response.data;

            // Update tokens in localStorage
            localStorage.setItem("access_token", access);

            if (newRefreshToken) {
              localStorage.setItem("refresh_token", newRefreshToken);
            }

            if (user) {
              localStorage.setItem("user", JSON.stringify(user));
            }

            console.log("Token refresh successful, retrying original request...");

            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;

            // Retry the original request
            return apiClient(originalRequest);
          } else {
            throw new Error("Invalid refresh response");
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);

          // Clear auth data
          localStorage.removeItem("user");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("selected_org");

          // Show toast notification if available
          if (typeof window !== "undefined" && window.globalToast) {
            window.globalToast.error(
              "Your session has expired. Please login again."
            );
          }

          // Redirect to login
          if (typeof window !== "undefined" && window.location) {
            setTimeout(() => {
              window.location.href = "/";
            }, 100);
          }

          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Generic API fetch function using axios
export const apiFetch = async (endpoint, options = {}) => {
  try {
    const response = await apiClient({
      url: endpoint,
      method: options.method || "GET",
      data: options.body,
      headers: options.headers,
      ...options,
    });

    return response.data;
  } catch (error) {
    // Extract meaningful error data including details
    const errorData = error.response?.data || {};
    const errorMessage =
      errorData.message ||
      errorData.detail ||
      error.message ||
      "An error occurred";

    // Create a custom error object that preserves all error data
    const customError = new Error(errorMessage);
    customError.data = errorData; // Preserve the full error data including details
    customError.status = error.response?.status;
    customError.statusText = error.response?.statusText;

    throw customError;
  }
};

// Export axios instance for direct use if needed
export default apiClient;
