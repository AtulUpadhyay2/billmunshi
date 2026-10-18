import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch } from "@/utils/apiClient";

/**
 * useNotificationPoll — polls the bill-notifications endpoint every
 * ``intervalMs`` (default 15s) and accumulates unread notifications
 * client-side.
 *
 * Backend: ``GET /api/v1/org/<orgId>/notifications/?since=<iso>``
 * Returns any bill that transitioned into a user-visible state
 * (analysis done / errored / duplicate flagged) since ``since``.
 *
 * Consumers get:
 *   { notifications, unreadCount, markAllRead, refetch }
 */
export default function useNotificationPoll(orgId, { intervalMs = 15000 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const cursorRef = useRef(null); // ISO string of last server_time
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  // Ids already shown, so dedup can happen outside the state updater.
  const seenIdsRef = useRef(new Set());

  const poll = useCallback(async () => {
    if (!orgId) return;
    const qs = cursorRef.current
      ? `?since=${encodeURIComponent(cursorRef.current)}`
      : "";
    try {
      const res = await apiFetch(`org/${orgId}/notifications/${qs}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!mountedRef.current) return;
      cursorRef.current = res.server_time || cursorRef.current;
      if (res.notifications && res.notifications.length > 0) {
        // The dedup used to run inside the setNotifications updater, with
        // setUnreadCount called from within it. Updaters must be pure —
        // React re-invokes them (StrictMode, update re-basing), which
        // double-counted the badge. Compute first, then set both.
        const seen = new Set(seenIdsRef.current);
        const fresh = res.notifications.filter((n) => !seen.has(n.id));
        if (fresh.length) {
          fresh.forEach((n) => seenIdsRef.current.add(n.id));
          setNotifications((prev) => [...fresh, ...prev].slice(0, 100));
          setUnreadCount((c) => c + fresh.length);
        }
      }
    } catch (err) {
      // Silent — a poll failure shouldn't spam the console; the next
      // tick will retry.
      if (import.meta.env.DEV) {
        console.debug("[useNotificationPoll] fetch failed", err);
      }
    }
  }, [orgId]);

  useEffect(() => {
    mountedRef.current = true;
    if (!orgId) return () => {};
    poll();
    timerRef.current = setInterval(poll, intervalMs);
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [orgId, intervalMs, poll]);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return { notifications, unreadCount, markAllRead, refetch: poll };
}
