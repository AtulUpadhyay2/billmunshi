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

// Queue for requests waiting on a token refresh
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
  },
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      isTokenExpiredError(error.response?.data)
    ) {
      originalRequest._retry = true;

      try {
        // Use the shared refresh — if another refresh is already in flight,
        // this will wait for it instead of starting a second one.
        const data = await refreshAccessToken();

        // Process any queued requests
        processQueue(null, data.access);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
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
