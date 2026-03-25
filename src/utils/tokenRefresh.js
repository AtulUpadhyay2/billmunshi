import { API_CONFIG } from "../config/api";
import store from "../store";
import { setUser, forceLogout } from "../store/api/auth/authSlice";
import { globalToast } from "./toast";

// Single mutex + promise shared across ALL API layers (axios & RTK Query)
let isRefreshing = false;
let refreshPromise = null;

/**
 * Checks if a 401 error response indicates an expired/invalid token.
 */
export const isTokenExpiredError = (data) => {
  if (!data) return false;
  return (
    data.code === "token_not_valid" ||
    data.detail === "Given token not valid for any token type" ||
    (data.messages &&
      data.messages.some(
        (msg) =>
          msg.message === "Token is expired" || msg.token_type === "access",
      ))
  );
};

/**
 * Performs token refresh with a shared mutex so only one refresh happens
 * at a time across the entire app (both axios and RTK Query).
 *
 * Returns { access, refresh, user } on success, or throws on failure.
 */
export const refreshAccessToken = async () => {
  // If a refresh is already in flight, wait for it
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken || !refreshToken.trim()) {
    handleRefreshFailure();
    throw new Error("No refresh token available");
  }

  isRefreshing = true;
  refreshPromise = performRefresh(refreshToken);

  try {
    const result = await refreshPromise;
    return result;
  } catch (err) {
    throw err;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

async function performRefresh(refreshToken) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await response.json();

    if (!data.access) {
      throw new Error("Invalid refresh response");
    }

    // Update localStorage
    localStorage.setItem("access_token", data.access);
    if (data.refresh) {
      localStorage.setItem("refresh_token", data.refresh);
    }
    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    // Update Redux state
    const state = store.getState();
    const userToUpdate = data.user || state.auth.user;
    if (userToUpdate) {
      store.dispatch(
        setUser({
          user: userToUpdate,
          access: data.access,
          refresh: data.refresh || refreshToken,
        }),
      );
    }

    return data;
  } catch (err) {
    handleRefreshFailure();
    throw err;
  }
}

function handleRefreshFailure() {
  store.dispatch(forceLogout());
  if (typeof window !== "undefined" && window.globalToast) {
    window.globalToast.error("Your session has expired. Please login again.");
  }
}
