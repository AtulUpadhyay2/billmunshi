import { API_CONFIG } from "../config/api";
import store from "../store";
import { forceLogout, setTokens, updateProfile } from "../store/api/auth/authSlice";
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

  // The refresh token now lives in an httpOnly cookie that this code
  // cannot read — which is the point: a script that gets onto the page
  // can no longer steal it and mint access tokens indefinitely.
  //
  // A value in localStorage means this browser last signed in on the
  // older bundle. Send it so that session survives the deploy; the
  // server replies with the cookie and we drop the copy.
  const legacyToken = localStorage.getItem("refresh_token");

  isRefreshing = true;
  refreshPromise = performRefresh(legacyToken);

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

async function performRefresh(legacyToken) {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Without this the browser withholds the httpOnly refresh cookie
      // and every refresh fails as unauthenticated.
      credentials: "include",
      body: JSON.stringify(legacyToken ? { refresh: legacyToken } : {}),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await response.json();

    if (!data.access) {
      throw new Error("Invalid refresh response");
    }

    // Update localStorage with the new token pair. We update Redux's auth
    // tokens directly via setTokens so the auth slice stays consistent
    // WITHOUT touching the user object or selectedOrganization (those
    // pathways used to trigger a re-render storm after every refresh).
    localStorage.setItem("access_token", data.access);
    // Deliberately NOT stored. The server has put it in an httpOnly
    // cookie; writing it back to localStorage would undo the whole
    // point. Any copy left over from the previous bundle is removed
    // here, so a browser upgrades itself on its first refresh.
    localStorage.removeItem("refresh_token");
    store.dispatch(
      setTokens({
        access: data.access,
        refresh: null,
      }),
    );

    if (data.user) {
      store.dispatch(updateProfile(data.user));
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
