import axios from "axios";
import { API_CONFIG } from "../config/api";
import { refreshAccessToken, isTokenExpiredError } from "./tokenRefresh";
import { reportMaintenanceResponse } from "@/components/MaintenanceGate";
import {
  clearImpersonation,
  getImpersonation,
  mayImpersonate,
} from "./impersonation";

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
    // In a tab that is acting inside a client's account, the client's
    // token wins — except on the desk, which stays the agent's. See
    // utils/impersonation.js for why the two live in different
    // storages at all.
    const acting = getImpersonation();
    const token =
      acting?.token && mayImpersonate(config.url)
        ? acting.token
        : localStorage.getItem("access_token");
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

    // An impersonation token must never be refreshed. The refresh
    // endpoint mints an ordinary token for whoever holds the refresh
    // cookie — the AGENT — so a silent refresh here would quietly
    // promote a revoked, consent-bound session back into a full one.
    // When it stops working, it is meant to stop working.
    if (
      error.response?.status === 401 &&
      getImpersonation()?.token &&
      mayImpersonate(originalRequest?.url)
    ) {
      clearImpersonation();
      window.dispatchEvent(new CustomEvent("impersonation:ended", {
        detail: { reason: "expired_or_revoked" },
      }));
      return Promise.reject(error);
    }

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
    // Only forward what apiFetch's contract covers. The old trailing
    // `...options` re-injected `body` as a stray axios key and would
    // clobber `data`/`url` if a caller ever passed them.
    const { method, body, headers, signal, params, responseType } = options;
    const response = await apiClient({
      url: endpoint,
      method: method || "GET",
      data: body,
      headers,
      ...(signal ? { signal } : {}),
      ...(params ? { params } : {}),
      ...(responseType ? { responseType } : {}),
    });

    return response.data;
  } catch (error) {
    // Extract meaningful error data including details
    const errorData = error.response?.data || {};

    // The backend returns 503 with maintenance: true while it is down
    // for work. Telling the gate immediately means the first failed
    // request flips to the maintenance screen, rather than the user
    // watching several requests fail until the next status poll.
    if (error.response?.status === 503 && errorData?.maintenance) {
      reportMaintenanceResponse(errorData);
    }
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
