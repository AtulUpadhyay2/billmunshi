import axios from "axios";
import { API_CONFIG } from "../config/api";
import { refreshAccessToken, isTokenExpiredError } from "./tokenRefresh";

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
  (error) => Promise.reject(error),
);

// Response interceptor for token refresh.
// Concurrent 401s are deduplicated inside refreshAccessToken (single shared
// promise + mutex), so each in-flight request waits on the same refresh
// without spawning duplicate refresh calls.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      isTokenExpiredError(error.response?.data)
    ) {
      originalRequest._retry = true;

      try {
        const data = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
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
