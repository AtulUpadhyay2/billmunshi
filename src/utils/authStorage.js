/**
 * Everything a sign-out must remove from the browser.
 *
 * There were three sign-out paths and they disagreed: the Redux
 * reducers cleared four keys, while the button on the organisation
 * picker cleared only the two tokens and left the cached `user` object
 * and the selected organisation behind. That leaves a signed-out
 * browser holding the previous user's name and email, and the next
 * person to add a sign-out button has no single thing to copy.
 *
 * Keep this the only list. Adding something to localStorage that
 * belongs to a session means adding it here too.
 */
export const AUTH_STORAGE_KEYS = [
  "access_token",
  "refresh_token",
  "user",
  "selected_org",
];

/**
 * Tell the server to revoke the refresh token and drop its cookie.
 *
 * The refresh token is httpOnly now, so the browser cannot delete it —
 * only the server that set it can. Without this call a sign-out would
 * clear everything visible and leave a working refresh token behind,
 * which is worse than keeping it in localStorage was.
 *
 * Deliberately fire-and-forget and never throws: a user who clicked
 * "sign out" must end up signed out locally even if the network is
 * down. The token still expires on its own.
 */
export const revokeSession = async () => {
  try {
    const base = import.meta.env.VITE_API_BASE_URL || "/api/v1";
    await fetch(`${base.replace(/\/$/, "")}/auth/logout/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: "{}",
      keepalive: true,
    });
  } catch {
    // Offline, blocked, already gone — local sign-out proceeds regardless.
  }
};

export const clearAuthStorage = () => {
  try {
    AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    // Per-organisation UI state keyed by org id — meaningless once
    // signed out, and it points at which client was being worked on.
    Object.keys(localStorage)
      .filter((key) => key.startsWith("bm_adj_autopick_done_"))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Private mode, blocked storage: nothing to clear and nothing to do.
  }
};
