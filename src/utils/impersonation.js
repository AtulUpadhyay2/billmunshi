/**
 * Acting inside a client's account, in its own browser tab.
 *
 * The problem this solves: an agent already has a session of their own,
 * and the desk runs on it. Writing the impersonation token over
 * `access_token` would swap their identity everywhere at once — the
 * queue, the ticket they are reading, the panel they clicked — with no
 * way back except signing out.
 *
 * So the two sessions live in different storages:
 *
 *   localStorage.access_token          the agent, shared by every tab
 *   sessionStorage.impersonation       the client, THIS TAB ONLY
 *
 * sessionStorage is per-tab by definition, so the desk tab cannot
 * accidentally act as the client and the client tab cannot accidentally
 * act as the agent. Closing the tab ends the illusion; the server-side
 * session is ended explicitly, or by its own expiry.
 *
 * The token reaches the new tab through a one-shot handoff key rather
 * than the URL. A token in a URL survives in history, in the referer
 * header and in any proxy log on the way; this key lives in
 * localStorage for the few milliseconds between `window.open` and the
 * new tab booting, is same-origin, and is deleted by the first tab that
 * claims it.
 */

const SESSION_KEY = "impersonation";
const HANDOFF_KEY = "__impersonation_handoff";
const HANDOFF_TTL_MS = 30_000;

const read = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** The impersonation session this tab is acting under, if any. */
export const getImpersonation = () => read(sessionStorage, SESSION_KEY);

export const isImpersonating = () => Boolean(getImpersonation()?.token);

export const clearImpersonation = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
};

/**
 * Put a redeemed session where a new tab can pick it up, and return the
 * URL to open. The caller opens it; this never navigates on its own.
 */
export const openImpersonatedTab = (payload, path = "/dashboard") => {
  const handoff = { ...payload, at: Date.now() };
  try {
    localStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    return null;
  }
  const url = `${window.location.origin}${path}`;
  const tab = window.open(url, "_blank", "noopener");
  // If the popup was blocked the handoff would sit in localStorage
  // waiting for a tab that never comes, so it is dropped immediately.
  if (!tab) {
    try {
      localStorage.removeItem(HANDOFF_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
  return url;
};

/**
 * Called once at boot. If a handoff is waiting and this tab has no
 * session yet, take it — and delete it, so a second tab opened later
 * cannot inherit the same access.
 */
export const claimHandoff = () => {
  if (getImpersonation()) return getImpersonation();
  const handoff = read(localStorage, HANDOFF_KEY);
  try {
    localStorage.removeItem(HANDOFF_KEY);
  } catch {
    /* ignore */
  }
  if (!handoff?.token) return null;
  // A handoff that has been sitting around is not one we just made.
  if (Date.now() - (handoff.at || 0) > HANDOFF_TTL_MS) return null;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(handoff));
  } catch {
    return null;
  }
  return handoff;
};

/**
 * Which requests may carry the impersonation token.
 *
 * Everything the client app does, and nothing on the desk — an agent
 * acting as a client must not be able to read the queue or another
 * ticket through the client's session. The one exception is ending the
 * session, which is the way out and has to work from inside.
 */
export const mayImpersonate = (url = "") => {
  const path = String(url).split("?")[0];
  if (path.includes("support-desk/access/end")) return true;
  if (path.includes("support-desk/")) return false;
  return true;
};
