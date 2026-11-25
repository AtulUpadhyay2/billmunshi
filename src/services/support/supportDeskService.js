import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiFetch } from "@/utils/apiClient";

/**
 * The support desk's half of the support API.
 *
 * Everything here lives under `support-desk/` and is answered only for a
 * support agent (`is_staff` AND an active `SupportAgent` row). The client
 * half — minting and revoking grants — is deliberately absent: no endpoint
 * in this file can create access, only redeem a code the client read out
 * and end the session it opened. If a hook for minting ever appears here,
 * the whole consent model has been undone.
 *
 * Same shape as `@/services/tally/tallyDashboardService.js`: thin
 * `useQuery` / `useMutation` wrappers over `apiFetch`, with the option
 * spread *before* `onSuccess` so a caller-supplied `onSuccess` cannot
 * silently cancel cache invalidation (the bug fixed in supportService.js).
 */

const BASE = "support-desk";

/* ---------------------------------------------------------------------------
 * Response unwrapping
 *
 * The existing support endpoints answer `{ data: [...] }`; DRF pagination
 * answers `{ results: [...] }`; some views answer a bare array. The desk
 * backend is being built in parallel, so read all three rather than pick
 * one and break on the first deploy.
 * ------------------------------------------------------------------------ */

const asRows = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.data?.results)) return res.data.results;
  return [];
};

const asTotal = (res, rows) =>
  Number(res?.count ?? res?.data?.count ?? rows.length) || rows.length;

const asObject = (res) => {
  if (!res) return null;
  // `{ data: {...} }`, but not `{ data: [...] }` and not a ticket that
  // happens to carry a `data` field of its own.
  if (res.data && !Array.isArray(res.data) && typeof res.data === "object") {
    return res.data;
  }
  return res;
};

/* ---------------------------------------------------------------------------
 * Choices — mirror SupportTicket's model choices
 * ------------------------------------------------------------------------ */

export const TICKET_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/** Statuses that revoke every live grant on the ticket, per the spec. */
export const ACCESS_ENDING_STATUSES = new Set(["resolved", "closed"]);

export const statusLabel = (v) =>
  TICKET_STATUSES.find((s) => s.value === v)?.label || v || "—";

export const priorityLabel = (v) =>
  TICKET_PRIORITIES.find((p) => p.value === v)?.label || v || "—";

/* ---------------------------------------------------------------------------
 * The access code
 *
 * Crockford base32 minus I, L, O and U — no character that is heard or
 * written as another, because this code is read out on a phone call. The
 * shape is `BM-7KQ4-9M2X-R8VD`: a fixed prefix, then 12 characters in three
 * groups of four. `code_label` is the prefix plus the first group only.
 *
 * These live in the service rather than the component because they are part
 * of the API contract — the string the redeem endpoint accepts.
 * ------------------------------------------------------------------------ */

export const ACCESS_CODE_PREFIX = "BM";
export const ACCESS_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const ACCESS_CODE_GROUPS = 3;
export const ACCESS_CODE_GROUP_SIZE = 4;
export const ACCESS_CODE_LENGTH = ACCESS_CODE_GROUPS * ACCESS_CODE_GROUP_SIZE;

/** The four characters the alphabet drops, and what each is usually meant to be. */
export const AMBIGUOUS_CHARS = { I: "1", L: "1", O: "0", U: "V" };

/**
 * Keep only characters the alphabet contains, uppercased.
 *
 * Returns the cleaned string *and* which rejected characters were typed, so
 * the field can say "I is not used — did you mean 1?" at the keystroke
 * rather than failing at submit.
 */
export const sanitizeCodeChars = (raw) => {
  const upper = String(raw || "").toUpperCase();
  let value = "";
  const rejected = [];
  for (const ch of upper) {
    if (ACCESS_CODE_ALPHABET.includes(ch)) value += ch;
    else if (ch in AMBIGUOUS_CHARS) rejected.push(ch);
    // Everything else (spaces, dashes, punctuation) is dropped silently —
    // people paste the dashes back in and that is not a mistake worth a
    // warning.
  }
  return { value, rejected };
};

/** `["7KQ4","9M2X","R8VD"]` → `"BM-7KQ4-9M2X-R8VD"`. */
export const formatAccessCode = (groups) =>
  [ACCESS_CODE_PREFIX, ...groups].join("-");

export const isCompleteCode = (groups) =>
  groups.length === ACCESS_CODE_GROUPS &&
  groups.every((g) => g.length === ACCESS_CODE_GROUP_SIZE);

/* ---------------------------------------------------------------------------
 * Who is allowed in
 * ------------------------------------------------------------------------ */

/**
 * The client-side half of the agent gate.
 *
 * `is_staff` is the only half of the check the browser can see — the active
 * `SupportAgent` row is server-side and there is no endpoint in the spec
 * that reports it. So this hides the desk from everyone who obviously is
 * not an agent, and the API's 403 is the real answer; every screen here
 * renders that 403 as "not a support agent" rather than as a failure.
 */
export const useIsSupportAgent = () => {
  const user = useSelector((state) => state.auth.user);
  // `is_staff` is not what the backend means by an agent — that is staff
  // AND an active SupportAgent row, and the desk endpoints enforce both.
  // Gating here on the flag alone made every staff user poll the desk
  // from every page and collect a 403 each time. `is_support_agent` is
  // the server's own answer to the same question.
  return Boolean(user?.is_support_agent);
};

export const useCurrentUserId = () =>
  useSelector((state) => state.auth.user?.id ?? null);

/** True when a query failed because the caller is not an agent. */
export const isForbidden = (error) => error?.status === 403;

/* ---------------------------------------------------------------------------
 * Tickets
 * ------------------------------------------------------------------------ */

/**
 * GET support-desk/tickets/
 *
 * `status` and `assignee` are passed straight through as query params.
 * `assignee` carries the two sentinel values the queue needs beyond a user
 * id: `me` and `unassigned`.
 *
 * Short `staleTime` and a poll, against the app-wide 5-minute default: this
 * is a queue somebody watches all day, and a stale queue means two agents
 * pick up the same ticket.
 */
export const useSupportDeskTickets = (filters = {}, options = {}) => {
  const enabled = useIsSupportAgent();
  const params = {};
  if (filters.status && filters.status !== "all") params.status = filters.status;
  if (filters.assignee && filters.assignee !== "all")
    params.assignee = filters.assignee;
  if (filters.priority && filters.priority !== "all")
    params.priority = filters.priority;

  const query = useQuery({
    queryKey: ["supportDeskTickets", params],
    queryFn: () => apiFetch(`${BASE}/tickets/`, { params }),
    enabled,
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnMount: true,
    ...options,
  });

  const rows = useMemo(() => asRows(query.data), [query.data]);
  return { ...query, tickets: rows, total: asTotal(query.data, rows) };
};

/** GET support-desk/tickets/{id}/ — the ticket and its full thread. */
export const useSupportDeskTicket = (ticketId, options = {}) => {
  const enabled = useIsSupportAgent();
  const query = useQuery({
    queryKey: ["supportDeskTicket", ticketId],
    queryFn: () => apiFetch(`${BASE}/tickets/${ticketId}/`),
    enabled: enabled && !!ticketId,
    staleTime: 10 * 1000,
    refetchOnMount: true,
    ...options,
  });
  return { ...query, ticket: useMemo(() => asObject(query.data), [query.data]) };
};

const useTicketInvalidation = (ticketId) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["supportDeskTickets"] });
    queryClient.invalidateQueries({ queryKey: ["supportDeskTicket", ticketId] });
    // Resolving or closing a ticket revokes its grants, so the access
    // session the desk is showing may have just ended server-side.
    queryClient.invalidateQueries({ queryKey: ["supportAccessSessions"] });
  };
};

/**
 * POST support-desk/tickets/{id}/reply/ — body `{ body, is_internal }`.
 *
 * `is_internal` is always sent explicitly, never left to a default. A
 * missing flag that the server reads as `false` is exactly the failure this
 * screen exists to prevent.
 */
export const useDeskReply = (ticketId, options = {}) => {
  const invalidate = useTicketInvalidation(ticketId);
  return useMutation({
    mutationFn: ({ body, isInternal }) =>
      apiFetch(`${BASE}/tickets/${ticketId}/reply/`, {
        method: "POST",
        body: { body, is_internal: Boolean(isInternal) },
      }),
    ...options,
    onSuccess: (...args) => {
      invalidate();
      options.onSuccess?.(...args);
    },
  });
};

/** POST support-desk/tickets/{id}/assign/ — `{ assignee }`, null to unassign. */
export const useAssignDeskTicket = (ticketId, options = {}) => {
  const invalidate = useTicketInvalidation(ticketId);
  return useMutation({
    mutationFn: ({ assignee }) =>
      apiFetch(`${BASE}/tickets/${ticketId}/assign/`, {
        method: "POST",
        body: { assignee: assignee ?? null },
      }),
    ...options,
    onSuccess: (...args) => {
      invalidate();
      options.onSuccess?.(...args);
    },
  });
};

/** PATCH support-desk/tickets/{id}/ — status and priority. */
export const useUpdateDeskTicket = (ticketId, options = {}) => {
  const invalidate = useTicketInvalidation(ticketId);
  return useMutation({
    mutationFn: (patch) =>
      apiFetch(`${BASE}/tickets/${ticketId}/`, { method: "PATCH", body: patch }),
    ...options,
    onSuccess: (...args) => {
      invalidate();
      options.onSuccess?.(...args);
    },
  });
};

/* ---------------------------------------------------------------------------
 * Access
 * ------------------------------------------------------------------------ */

/**
 * GET support-desk/access/sessions/ — this agent's own session history.
 *
 * Polled on a short interval because it is the only thing that tells the
 * desk a client has revoked access. Expiry is enforced on every request
 * server-side; this poll is what makes the *interface* stop claiming a
 * session is live.
 */
export const useAccessSessions = (options = {}) => {
  const enabled = useIsSupportAgent();
  const query = useQuery({
    queryKey: ["supportAccessSessions"],
    queryFn: () => apiFetch(`${BASE}/access/sessions/`),
    enabled,
    staleTime: 5 * 1000,
    refetchInterval: 20 * 1000,
    refetchOnMount: true,
    retry: false,
    ...options,
  });
  const sessions = useMemo(() => asRows(query.data), [query.data]);
  return { ...query, sessions };
};

/**
 * Normalise a session row into what the interface draws.
 *
 * The grant may arrive nested (`session.grant.code_label`) or flattened
 * (`session.code_label`) depending on how the desk serializer ends up; read
 * both. Note what is *not* read: there is no field here for the code
 * itself. The full code exists once, in the response to the client's mint
 * call, and must never reach this screen.
 */
export const normalizeSession = (session) => {
  if (!session) return null;
  const grant = session.grant && typeof session.grant === "object" ? session.grant : {};
  const expiresAt = grant.expires_at || session.expires_at || null;
  return {
    id: session.id ?? null,
    grantId: grant.id || session.grant_id || session.grant || null,
    codeLabel: grant.code_label || session.code_label || null,
    scope: grant.scope || session.scope || null,
    ticketId: grant.ticket || session.ticket || session.ticket_id || null,
    organizationId:
      grant.organization || session.organization || session.organization_id || null,
    organizationName:
      grant.organization_name ||
      session.organization_name ||
      grant.organization?.name ||
      null,
    startedAt: session.started_at || null,
    endedAt: session.ended_at || null,
    endReason: session.end_reason || null,
    expiresAt,
    isLive: !session.ended_at && (!expiresAt || new Date(expiresAt) > new Date()),
  };
};

/**
 * The one session that is live right now, or null.
 *
 * A grant redeems once and resumes for the same agent, so there is at most
 * one. Returning the first live row rather than asserting that keeps the
 * banner honest if the backend ever answers more.
 */
export const useLiveAccessSession = () => {
  const { sessions, ...rest } = useAccessSessions();
  const live = useMemo(
    () => sessions.map(normalizeSession).find((s) => s?.isLive) || null,
    [sessions],
  );
  return { ...rest, session: live, sessions };
};

/**
 * POST support-desk/access/redeem/ — `{ code }` → impersonation token.
 *
 * The token is deliberately *not* written to localStorage here. Installing
 * it as the agent's access token would swap their identity for the client's
 * across the whole app, including the desk itself, and there is no way back
 * without a re-login. Opening a client account with it is a separate piece
 * of plumbing (an `act`-aware request path) that this screen does not do.
 */
export const useRedeemAccessCode = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code }) =>
      apiFetch(`${BASE}/access/redeem/`, { method: "POST", body: { code } }),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["supportAccessSessions"] });
      options.onSuccess?.(...args);
    },
  });
};

/** POST support-desk/access/end/ — end this agent's own session. */
export const useEndAccessSession = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload = {}) =>
      apiFetch(`${BASE}/access/end/`, { method: "POST", body: payload }),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["supportAccessSessions"] });
      options.onSuccess?.(...args);
    },
  });
};

/* ---------------------------------------------------------------------------
 * Small formatters shared by the two pages
 * ------------------------------------------------------------------------ */

/** "4d", "7h", "22m", "just now" — a queue column, not a sentence. */
export const ageLabel = (iso) => {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

/** Milliseconds until `iso`, floored at zero. */
export const msUntil = (iso) => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, t - Date.now());
};

/** `2_730_000` → `"45:30"`, and over an hour `"1:05:30"`. */
export const countdownLabel = (ms) => {
  const total = Math.floor(ms / 1000);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export const dateTimeLabel = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Who wrote a thread message — never the raw email when a name exists. */
export const authorLabel = (message) =>
  message?.author_display_name ||
  message?.author_name ||
  message?.author_email ||
  "Unknown";
