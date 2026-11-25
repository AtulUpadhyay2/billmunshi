import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  CONTROL_SELECT_ARROW,
  DESK_BTN_SECONDARY,
  DESK_LABEL,
  DESK_SEARCH,
  DESK_SELECT,
} from "@/constants/ui";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  ageLabel,
  dateTimeLabel,
  isForbidden,
  priorityLabel,
  statusLabel,
  useCurrentUserId,
  useIsSupportAgent,
  useSupportDeskTickets,
} from "@/services/support/supportDeskService";

/**
 * The ticket queue.
 *
 * This is the screen an agent leaves open all day, so it is a table and
 * nothing else: no hero block, no summary tiles, no cards. The filters are
 * the two an agent actually switches between — what state a ticket is in
 * and whose it is — and both are pushed to the server, because the queue is
 * the whole organisation's and paging it in the browser would mean holding
 * every ticket to filter four of them.
 *
 * The search box is local on purpose. It narrows what is already loaded
 * while someone reads a subject line out to you; it is not a second query.
 */

/* Status and priority both colour by meaning, not by rank-as-decoration.
   Rose is "needs someone now", slate is "done with". */
const STATUS_TONE = {
  open: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60",
  in_progress:
    "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/60",
  resolved:
    "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60",
  closed:
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700",
};

const PRIORITY_TONE = {
  high: "text-rose-600 dark:text-rose-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-slate-500 dark:text-slate-400",
};

const PRIORITY_ICON = {
  high: "heroicons:chevron-double-up",
  medium: "heroicons:chevron-up",
  low: "heroicons:minus",
};

const CATEGORY_LABEL = {
  bug: "Bug",
  feature: "Feature",
  question: "Question",
  billing: "Billing",
  other: "Other",
};

/** Over a day untouched and still open is the thing the queue is scanned for. */
const isStale = (ticket) => {
  if (!["open", "in_progress"].includes(ticket?.status)) return false;
  const t = new Date(ticket?.updated_at || ticket?.created_at || 0).getTime();
  if (Number.isNaN(t) || !t) return false;
  return Date.now() - t > 24 * 60 * 60 * 1000;
};

const th =
  "px-3 py-1.5 ltr:text-left rtl:text-right text-[11px] font-bold uppercase " +
  "tracking-[0.12em] text-slate-500 dark:text-slate-400 whitespace-nowrap";
const td = "px-3 py-1.5 text-[13px] text-slate-700 dark:text-slate-300";

const assigneeName = (ticket) =>
  ticket?.assigned_to_name ||
  ticket?.assignee_name ||
  ticket?.assigned_to_display_name ||
  (ticket?.assigned_to && typeof ticket.assigned_to === "object"
    ? ticket.assigned_to.display_name || ticket.assigned_to.email
    : null) ||
  null;

const assigneeId = (ticket) => {
  const a = ticket?.assigned_to;
  if (a && typeof a === "object") return a.id ?? null;
  return a ?? null;
};

const SupportDeskQueue = () => {
  const navigate = useNavigate();
  const isAgent = useIsSupportAgent();
  const myId = useCurrentUserId();

  const [status, setStatus] = useState("open");
  const [assignee, setAssignee] = useState("all");
  const [priority, setPriority] = useState("all");
  const [search, setSearch] = useState("");

  const { tickets, isLoading, isFetching, error, refetch, dataUpdatedAt } =
    useSupportDeskTickets({ status, assignee, priority });

  /* The assignee picker's options come out of the queue itself. The spec
     gives the desk no endpoint that lists agents, and guessing one would
     be a 404 on every load; the names in front of the agent are the ones
     they need to filter by anyway. `me` and `unassigned` are sentinels the
     server reads, not user ids. */
  const assigneeOptions = useMemo(() => {
    const seen = new Map();
    tickets.forEach((t) => {
      const id = assigneeId(t);
      if (id == null) return;
      if (String(id) === String(myId)) return;
      if (!seen.has(String(id))) seen.set(String(id), assigneeName(t) || `Agent ${id}`);
    });
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tickets, myId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      [
        t.subject,
        t.organization_name,
        t.submitter_email,
        assigneeName(t),
        t.category,
        String(t.id || "").slice(0, 8),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [tickets, search]);

  if (!isAgent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
          <Icon icon="heroicons:lock-closed" className="text-lg" />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Support desk
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          This area is for support agents.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-2.5">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Support desk
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {isLoading
              ? "Loading the queue…"
              : `${rows.length} ticket${rows.length === 1 ? "" : "s"}${
                  search ? ` matching “${search.trim()}”` : ""
                }${
                  dataUpdatedAt
                    ? ` · updated ${new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                    : ""
                }`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={DESK_BTN_SECONDARY}
          >
            <Icon
              icon="heroicons:arrow-path"
              className={`text-sm ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Queue card — the only thing on the page that scrolls */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="px-3 md:px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end gap-2 shrink-0">
          <div className="relative w-full lg:max-w-xs">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by subject, organization, email…"
              aria-label="Filter the loaded queue"
              className={DESK_SEARCH}
            />
          </div>
          <span className="hidden lg:block flex-1" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:w-auto">
            <label className="min-w-0 sm:w-40">
              <span className={`${DESK_LABEL} block mb-1`}>Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={DESK_SELECT}
                style={CONTROL_SELECT_ARROW}
              >
                <option value="all">All statuses</option>
                {TICKET_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 sm:w-44">
              <span className={`${DESK_LABEL} block mb-1`}>Assignee</span>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className={DESK_SELECT}
                style={CONTROL_SELECT_ARROW}
              >
                <option value="all">Anyone</option>
                <option value="me">Assigned to me</option>
                <option value="unassigned">Unassigned</option>
                {assigneeOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 sm:w-36">
              <span className={`${DESK_LABEL} block mb-1`}>Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className={DESK_SELECT}
                style={CONTROL_SELECT_ARROW}
              >
                <option value="all">Any priority</option>
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="px-3 md:px-4 py-2.5 space-y-2">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2.5">
                <Icon
                  icon={isForbidden(error) ? "heroicons:lock-closed" : "heroicons:exclamation-triangle"}
                  className="text-lg"
                />
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {isForbidden(error)
                  ? "You are not an active support agent"
                  : "Could not load the queue"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3 max-w-md mx-auto">
                {isForbidden(error)
                  ? "The desk needs staff access and an active support agent record. Ask an administrator to create one."
                  : error?.message || "The support desk API did not answer."}
              </p>
              {!isForbidden(error) && (
                <button type="button" onClick={() => refetch()} className={DESK_BTN_SECONDARY}>
                  <Icon icon="heroicons:arrow-path" className="text-sm" />
                  Try again
                </button>
              )}
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className={`${th} w-8`} aria-label="Priority" />
                  <th className={th}>Subject</th>
                  <th className={th}>Organization</th>
                  <th className={`${th} hidden md:table-cell`}>Status</th>
                  <th className={`${th} hidden lg:table-cell`}>Assignee</th>
                  <th className={`${th} w-20`}>Age</th>
                  <th className={`${th} hidden xl:table-cell w-32`}>Last update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
                        <Icon
                          icon={search ? "heroicons:magnifying-glass" : "heroicons:inbox"}
                          className="text-lg"
                        />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {search
                          ? "No tickets match that filter"
                          : "Nothing in this queue"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {search
                          ? "Clear the search, or widen the status and assignee filters."
                          : "Try another status, or widen the assignee filter."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((ticket) => {
                    const name = assigneeName(ticket);
                    const mine =
                      myId != null && String(assigneeId(ticket)) === String(myId);
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => navigate(`/support-desk/${ticket.id}`)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                      >
                        <td className={`${td} text-center`}>
                          <Icon
                            icon={PRIORITY_ICON[ticket.priority] || PRIORITY_ICON.low}
                            title={`${priorityLabel(ticket.priority)} priority`}
                            className={`text-sm inline-block ${
                              PRIORITY_TONE[ticket.priority] || PRIORITY_TONE.low
                            }`}
                          />
                        </td>
                        <td className={`${td} max-w-[28rem]`}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Link
                              to={`/support-desk/${ticket.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {ticket.subject || "(no subject)"}
                            </Link>
                            {isStale(ticket) && (
                              <span
                                title="No movement in over 24 hours"
                                className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 ring-1 ring-rose-100 dark:ring-rose-900/60"
                              >
                                Stale
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {CATEGORY_LABEL[ticket.category] || ticket.category || "—"}
                            {ticket.submitter_email ? ` · ${ticket.submitter_email}` : ""}
                          </p>
                        </td>
                        <td className={`${td} max-w-[14rem]`}>
                          <span className="block truncate">
                            {ticket.organization_name || (
                              <span className="text-slate-400 dark:text-slate-500">
                                No organization
                              </span>
                            )}
                          </span>
                        </td>
                        <td className={`${td} hidden md:table-cell`}>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${
                              STATUS_TONE[ticket.status] || STATUS_TONE.closed
                            }`}
                          >
                            {statusLabel(ticket.status)}
                          </span>
                        </td>
                        <td className={`${td} hidden lg:table-cell max-w-[12rem]`}>
                          {name ? (
                            <span className="block truncate">
                              {name}
                              {mine && (
                                <span className="ml-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                  you
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              <Icon icon="heroicons:user-minus" className="text-xs" />
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className={`${td} font-mono tabular-nums whitespace-nowrap`}>
                          {ageLabel(ticket.created_at)}
                        </td>
                        <td className={`${td} hidden xl:table-cell whitespace-nowrap text-slate-500 dark:text-slate-400`}>
                          {dateTimeLabel(ticket.updated_at || ticket.created_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportDeskQueue;
