import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

/**
 * Consent-gated support access — the client half.
 *
 * Four endpoints, from docs/support-desk/SPEC.md:
 *
 *   POST support/tickets/{id}/access-grants/     mint, returns the code ONCE
 *   GET  organizations/{org}/access-grants/      history + live sessions
 *   POST support/access-grants/{id}/revoke/      revoke now, kills sessions
 *   GET  organizations/{org}/access-status/      is support in here (banner)
 *
 * Shapes are normalised here rather than in the components, because the
 * list endpoint can reasonably come back as a bare array, a DRF page
 * (`{results: []}`) or a two-key object (`{grants, sessions}`) and the
 * screens should not each guess. Everything below tolerates all three and
 * tolerates a user field arriving as an id, a string or an object.
 *
 * The full code is never cached. `useMintAccessGrant` hands it to its
 * caller as the mutation result and nothing here stores it — the server
 * keeps only `sha256(code)`, so a second read is impossible by design and
 * the UI must not pretend otherwise.
 */

/** TTL choices. Hard cap is 8 h (spec: default 60 min, hard cap 8 h). */
export const TTL_OPTIONS = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 240, label: "4 hours" },
  { minutes: 480, label: "8 hours — the longest allowed" },
];

export const DEFAULT_TTL_MINUTES = 60;

export const SCOPE_READ_ONLY = "read_only";
export const SCOPE_FULL = "full";

/** A grant in one of these states can still be used, so it can be revoked. */
const LIVE_STATUSES = new Set(["pending", "active"]);

/** Pulls a displayable name out of a user field of unknown shape. */
export const personName = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  // A bare id is not a name. The list endpoint serialises `created_by` as
  // the user's pk, so returning "User 7" here would put that on screen;
  // callers compare the id against the signed-in user instead.
  if (typeof value === "number") return null;
  const name =
    value.display_name ||
    value.full_name ||
    [value.first_name, value.last_name].filter(Boolean).join(" ").trim() ||
    value.name ||
    value.email ||
    value.username;
  return name || null;
};

/**
 * What the row should *read* as, which is not always `status`.
 *
 * Two cases where the stored column lags behind the truth:
 *
 *  - Expiry is enforced per request, not by a sweeper, so a grant past
 *    `expires_at` is already dead while the column may still say active.
 *  - Resolving or closing the ticket revokes every live grant on it. If a
 *    payload carries the ticket's status and it is shut, the grant is
 *    closed — showing it as live would be the one lie this screen cannot
 *    afford.
 */
export const effectiveStatus = (grant) => {
  if (!grant) return "unknown";
  const status = grant.status || "pending";
  if (!LIVE_STATUSES.has(status)) return status;

  // `is_usable` is the server's own answer to "would this code work right
  // now", which folds in the ticket state and the clock. If it says no, the
  // row is not allowed to read as live whatever the status column says.
  if (grant.is_usable === false) {
    const at = grant.expires_at ? new Date(grant.expires_at) : null;
    if (at && !Number.isNaN(at.getTime()) && at <= new Date()) return "expired";
    return "closed";
  }

  const ticketStatus =
    grant.ticket_status || grant.ticket?.status || grant.ticket?.state || null;
  if (ticketStatus === "closed" || ticketStatus === "resolved") return "closed";

  const expiresAt = grant.expires_at ? new Date(grant.expires_at) : null;
  if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt <= new Date())
    return "expired";

  return status;
};

export const isGrantLive = (grant) => LIVE_STATUSES.has(effectiveStatus(grant));

/** Unwraps array | {results} | {grants} | {data} into an array. */
const asList = (payload, key) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const candidate =
    (key && payload[key]) || payload.results || payload.data || payload.items;
  return Array.isArray(candidate) ? candidate : [];
};

/**
 * Mint a grant. Body `{scope, ttl_minutes}`; the response carries the full
 * code exactly once.
 *
 * Invalidates the grant list and the banner's status so a freshly minted
 * grant appears on the history page without a reload — but note the code
 * itself only ever exists in the mutation result.
 */
export const useMintAccessGrant = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, scope, ttlMinutes }) =>
      apiFetch(`support/tickets/${ticketId}/access-grants/`, {
        method: "POST",
        body: { scope, ttl_minutes: ttlMinutes },
      }),
    // Spread first — a caller's own onSuccess would otherwise replace this
    // one wholesale and the invalidation below would never run. Same bug
    // the ticket hooks in supportService.js carry a note about.
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["supportAccessGrants"] });
      queryClient.invalidateQueries({ queryKey: ["supportAccessStatus"] });
      options.onSuccess?.(...args);
    },
  });
};

/**
 * The grant history for an organisation, newest first.
 *
 * Returns `{ grants, sessions }`. `grants` rows are passed through
 * untouched apart from a derived `display_status`, so a component never
 * has to repeat the expiry/ticket reasoning in `effectiveStatus`.
 */
export const useAccessGrants = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["supportAccessGrants", organizationId],
    queryFn: async () => {
      const payload = await apiFetch(
        `organizations/${organizationId}/access-grants/`,
      );
      const grants = asList(payload, "grants").map((grant) => ({
        ...grant,
        display_status: effectiveStatus(grant),
      }));
      return { grants, sessions: asList(payload, "sessions") };
    },
    enabled: !!organizationId,
    // A grant can expire while this page is open, and the page's whole job
    // is to say which are live — so it is not allowed to be stale.
    staleTime: 0,
    ...options,
  });
};

/**
 * Is support inside this account right now. Drives the banner, so it is
 * readable by any member, polls, and normalises hard.
 *
 * Returns `{ active, sessions }` where every session has at least
 * `grant_id`, `agent_name`, `scope` and `expires_at`.
 */
export const useAccessStatus = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["supportAccessStatus", organizationId],
    queryFn: async () => {
      const payload = await apiFetch(
        `organizations/${organizationId}/access-status/`,
      );

      const raw = asList(payload, "sessions");
      const sessions = raw
        .map((session) => ({
          id: session.id ?? session.session_id ?? null,
          grant_id:
            session.grant_id ??
            session.grant?.id ??
            session.grant ??
            session.access_grant ??
            null,
          agent_name:
            personName(session.agent) ||
            personName(session.agent_name) ||
            personName(session.agent_display_name) ||
            "a support agent",
          scope: session.scope || session.grant?.scope || null,
          // `grant_label` is what the session serializer calls it.
          code_label:
            session.grant_label ||
            session.code_label ||
            session.grant?.code_label ||
            null,
          ticket_id: session.ticket_id ?? session.grant?.ticket ?? null,
          // Optional: the live-status serializer does not currently send the
          // grant's expiry, so the banner states the other two ways access
          // ends rather than inventing a clock. If the field appears, the
          // countdown lights up with no further change here.
          expires_at:
            session.expires_at ||
            session.grant_expires_at ||
            session.grant?.expires_at ||
            null,
          started_at: session.started_at || null,
        }))
        // A session whose expiry has already passed is not live, whatever
        // the payload says: expiry is enforced on every request.
        .filter((session) => {
          if (!session.expires_at) return true;
          const at = new Date(session.expires_at);
          return Number.isNaN(at.getTime()) || at > new Date();
        });

      const active =
        sessions.length > 0 ||
        payload?.active === true ||
        payload?.is_active === true;

      return { active: active && sessions.length > 0, sessions };
    },
    enabled: !!organizationId,
    // The banner has to appear without a reload when an agent redeems, and
    // disappear when the grant dies. 30 s is the longest a client should
    // sit in front of a stale answer to "is someone in my books".
    staleTime: 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    // A failed poll must not spam a toast or trip the error boundary; the
    // banner renders nothing and the next tick retries.
    retry: 1,
    ...options,
  });
};

/**
 * Revoke a grant. Instant — it kills live sessions server-side, so the
 * banner's own poll is only a confirmation, not the mechanism.
 */
export const useRevokeAccessGrant = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ grantId, reason }) =>
      apiFetch(`support/access-grants/${grantId}/revoke/`, {
        method: "POST",
        body: reason ? { revoke_reason: reason } : {},
      }),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["supportAccessGrants"] });
      queryClient.invalidateQueries({ queryKey: ["supportAccessStatus"] });
      options.onSuccess?.(...args);
    },
  });
};
