import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  CONTROL_SELECT_ARROW,
  DESK_BTN_INTERNAL,
  DESK_BTN_PRIMARY,
  DESK_BTN_SECONDARY,
  DESK_LABEL,
  DESK_SELECT,
  DESK_TEXTAREA,
} from "@/constants/ui";
import AccessPanel from "@/components/support/AccessPanel";
import { globalToast } from "@/utils/toast";
import {
  ACCESS_ENDING_STATUSES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  ageLabel,
  authorLabel,
  dateTimeLabel,
  isForbidden,
  priorityLabel,
  statusLabel,
  useAssignDeskTicket,
  useCurrentUserId,
  useDeskReply,
  useIsSupportAgent,
  useLiveAccessSession,
  useSupportDeskTicket,
  useUpdateDeskTicket,
} from "@/services/support/supportDeskService";

/**
 * One ticket.
 *
 * The thread reads down the left, the controls and the access panel sit on
 * the right, and the composer is pinned under the thread where the agent's
 * hands already are.
 *
 * The one thing this screen must never do is send an internal note to the
 * client. So the choice is not a checkbox tucked under a textarea — it is
 * two mutually exclusive modes, and picking one repaints the whole
 * composer: its band, its border, its placeholder and its submit button.
 * Amber and a padlock mean "the client never sees this", in the composer
 * and again on every internal note in the thread, so the two are the same
 * fact in the same colour wherever it appears.
 */

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
  high: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/60",
  medium:
    "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/60",
  low: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700",
};

const pill = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1";

const Card = ({ title, icon, right, children, className = "" }) => (
  <section
    className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${className}`}
  >
    <div className="flex items-center gap-2 mb-2.5">
      {icon && (
        <Icon icon={icon} className="text-sm text-slate-400 dark:text-slate-500" />
      )}
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
        {title}
      </h2>
      <span className="flex-1" />
      {right}
    </div>
    {children}
  </section>
);

/* ---------------------------------------------------------------------------
 * Thread
 * ------------------------------------------------------------------------ */

const Message = ({ author, at, body, isInternal, isAgent, isOriginal }) => (
  <article
    className={`rounded-lg border p-2.5 ${
      isInternal
        ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-l-amber-400 dark:border-l-amber-500"
        : isAgent
          ? "border-slate-200 dark:border-slate-800 bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-l-blue-500"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 border-l-4 border-l-slate-300 dark:border-l-slate-700"
    }`}
  >
    <header className="flex items-center gap-2 flex-wrap mb-1.5">
      {isInternal ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
          <Icon icon="heroicons:lock-closed" className="text-xs" />
          Internal note
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          <Icon
            icon={isAgent ? "heroicons:arrow-uturn-left" : "heroicons:user"}
            className="text-xs"
          />
          {isOriginal ? "Original request" : isAgent ? "Public reply" : "From client"}
        </span>
      )}
      <span className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
        {author}
      </span>
      <span className="flex-1" />
      <time className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
        {dateTimeLabel(at)}
      </time>
    </header>
    <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
      {body}
    </p>
    {isInternal && (
      <p className="mt-1.5 text-[11px] text-amber-700/80 dark:text-amber-400/80">
        Visible to support agents only — never emailed to the client.
      </p>
    )}
  </article>
);

/* ---------------------------------------------------------------------------
 * Composer
 * ------------------------------------------------------------------------ */

const MODES = {
  public: {
    key: "public",
    label: "Public reply",
    icon: "heroicons:paper-airplane",
    band:
      "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
    shell: "border-blue-300 dark:border-blue-900",
    field: "border-blue-200 dark:border-blue-900/70 focus:border-blue-500 focus:ring-blue-500/20",
    tab: "bg-blue-600 text-white ring-1 ring-blue-700/30",
    placeholder: "Write what the client will read…",
    submit: "Send public reply",
    pending: "Sending…",
  },
  internal: {
    key: "internal",
    label: "Internal note",
    icon: "heroicons:lock-closed",
    band:
      "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800",
    shell: "border-amber-400 dark:border-amber-700",
    field: "border-amber-300 dark:border-amber-800 focus:border-amber-500 focus:ring-amber-500/20",
    tab: "bg-amber-400 text-amber-950 ring-1 ring-amber-600/40",
    placeholder: "Write a note only other agents will read…",
    submit: "Save internal note",
    pending: "Saving…",
  },
};

const Composer = ({ ticketId, clientLabel, disabled, disabledReason }) => {
  const [mode, setMode] = useState("public");
  const [body, setBody] = useState("");
  const m = MODES[mode];
  const isInternal = mode === "internal";

  const reply = useDeskReply(ticketId, {
    onSuccess: () => {
      setBody("");
      globalToast.success(
        isInternal ? "Internal note saved — not sent to the client" : "Reply sent to the client",
      );
    },
    onError: (e) =>
      globalToast.error(e?.message || "Could not post that — nothing was sent"),
  });

  const canSend = body.trim().length > 0 && !reply.isPending && !disabled;

  return (
    <div
      className={`rounded-xl border-2 bg-white dark:bg-slate-900 overflow-hidden ${m.shell}`}
    >
      {/* Mode picker. Two buttons, not a checkbox: the thing being chosen
          is who reads this, and that is too big a difference to express as
          a tick box the eye skips. */}
      <div className="flex items-stretch gap-1 p-1.5 pb-0">
        {Object.values(MODES).map((option) => {
          const active = option.key === mode;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              onClick={() => setMode(option.key)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-[13px] font-bold cursor-pointer transition-all ${
                active
                  ? option.tab
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon icon={option.icon} className="text-sm" />
              {option.label}
            </button>
          );
        })}
      </div>

      {/* The band says who reads it, in words, every time. */}
      <div
        className={`mx-1.5 mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-bold uppercase tracking-[0.14em] ${m.band}`}
      >
        <Icon icon={m.icon} className="text-xs" />
        {isInternal ? (
          <span>Internal note — the client never sees this</span>
        ) : (
          <span className="truncate">
            Public reply — goes to {clientLabel || "the client"}
          </span>
        )}
      </div>

      <div className="p-1.5">
        <textarea
          rows={isInternal ? 4 : 5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={disabled || reply.isPending}
          placeholder={m.placeholder}
          aria-label={isInternal ? "Internal note body" : "Public reply body"}
          className={`${DESK_TEXTAREA} ${m.field}`}
        />
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {disabled ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {disabledReason}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isInternal
                ? "Nothing is emailed. The note stays on the ticket for other agents."
                : "The client is emailed a copy of this reply."}
            </p>
          )}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => canSend && reply.mutate({ body: body.trim(), isInternal })}
            disabled={!canSend}
            className={isInternal ? DESK_BTN_INTERNAL : DESK_BTN_PRIMARY}
          >
            <Icon
              icon={reply.isPending ? "heroicons:arrow-path" : m.icon}
              className={`text-sm ${reply.isPending ? "animate-spin" : ""}`}
            />
            {reply.isPending ? m.pending : m.submit}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------ */

const SupportDeskTicket = () => {
  const { id } = useParams();
  const isAgent = useIsSupportAgent();
  const myId = useCurrentUserId();
  const { ticket, isLoading, isFetching, error, refetch } = useSupportDeskTicket(id);
  const { session } = useLiveAccessSession();

  const update = useUpdateDeskTicket(id, {
    onError: (e) => globalToast.error(e?.message || "Could not save that change"),
  });
  const assign = useAssignDeskTicket(id, {
    onError: (e) => globalToast.error(e?.message || "Could not change the assignee"),
  });

  const thread = useMemo(() => {
    if (!ticket) return [];
    const items = [];
    if (ticket.message) {
      items.push({
        id: "original",
        author:
          ticket.submitter_email || ticket.contact_email || ticket.contact_name || "Client",
        at: ticket.created_at,
        body: ticket.message,
        isInternal: false,
        isAgent: false,
        isOriginal: true,
      });
    }
    (ticket.messages || []).forEach((msg) => {
      const authorId =
        msg.author_user && typeof msg.author_user === "object"
          ? msg.author_user.id
          : msg.author_user;
      items.push({
        id: msg.id,
        author: authorLabel(msg),
        at: msg.created_at,
        body: msg.body,
        isInternal: Boolean(msg.is_internal),
        // An agent wrote it when the backend says so, and otherwise when
        // the author is not the person who raised the ticket.
        isAgent:
          msg.is_staff_author ??
          msg.is_agent ??
          (Boolean(msg.is_internal) ||
            (authorId != null &&
              ticket.user != null &&
              String(authorId) !== String(ticket.user))),
        isOriginal: false,
      });
    });
    return items;
  }, [ticket]);

  const assignedId =
    ticket?.assigned_to && typeof ticket.assigned_to === "object"
      ? ticket.assigned_to.id
      : ticket?.assigned_to ?? null;
  const assignedName =
    ticket?.assigned_to_name ||
    ticket?.assignee_name ||
    (ticket?.assigned_to && typeof ticket.assigned_to === "object"
      ? ticket.assigned_to.display_name || ticket.assigned_to.email
      : null);
  const isMine = myId != null && String(assignedId) === String(myId);
  const isShut = ["resolved", "closed"].includes(ticket?.status);

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

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        <div className="h-9 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-2.5">
          <div className="h-80 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          <div className="h-80 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2.5">
          <Icon
            icon={isForbidden(error) ? "heroicons:lock-closed" : "heroicons:exclamation-triangle"}
            className="text-lg"
          />
        </div>
        <p className="text-xs font-semibold text-slate-900 dark:text-white">
          {isForbidden(error)
            ? "You are not an active support agent"
            : "Could not load this ticket"}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
          {isForbidden(error)
            ? "The desk needs staff access and an active support agent record."
            : error?.message || "The ticket may have been deleted."}
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <Link to="/support-desk" className={DESK_BTN_SECONDARY}>
            <Icon icon="heroicons:arrow-left" className="text-sm" />
            Back to queue
          </Link>
          {!isForbidden(error) && (
            <button type="button" onClick={() => refetch()} className={DESK_BTN_SECONDARY}>
              <Icon icon="heroicons:arrow-path" className="text-sm" />
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
        <Link
          to="/support-desk"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pr-2 mr-1 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap"
        >
          ‹ Queue
        </Link>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          #{String(ticket.id || "").slice(0, 8)}
        </span>
        <span className={`${pill} ${STATUS_TONE[ticket.status] || STATUS_TONE.closed}`}>
          {statusLabel(ticket.status)}
        </span>
        <span className={`${pill} ${PRIORITY_TONE[ticket.priority] || PRIORITY_TONE.low}`}>
          {priorityLabel(ticket.priority)}
        </span>
        <span className="flex-1 min-w-[8px]" />
        {isFetching && (
          <Icon
            icon="heroicons:arrow-path"
            className="text-xs text-slate-400 animate-spin"
            aria-label="Refreshing"
          />
        )}
        <button type="button" onClick={() => refetch()} className={DESK_BTN_SECONDARY}>
          <Icon icon="heroicons:arrow-path" className="text-sm" />
          Refresh
        </button>
      </div>

      {/* Subject */}
      <div className="min-w-0">
        <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white break-words">
          {ticket.subject || "(no subject)"}
        </h1>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {ticket.organization_name || "No organization"}
          {ticket.submitter_email ? ` · ${ticket.submitter_email}` : ""}
          {` · opened ${ageLabel(ticket.created_at)} ago`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] gap-2.5 items-start">
        {/* Thread + composer */}
        <div className="min-w-0 flex flex-col gap-2.5">
          <Card
            title="Thread"
            icon="heroicons:chat-bubble-left-right"
            right={
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {thread.length} message{thread.length === 1 ? "" : "s"}
              </span>
            }
          >
            {thread.length === 0 ? (
              <p className="text-[13px] text-slate-500 dark:text-slate-400">
                Nothing on this ticket yet.
              </p>
            ) : (
              <div className="space-y-2">
                {thread.map((msg) => (
                  <Message key={msg.id} {...msg} />
                ))}
              </div>
            )}
          </Card>

          <Composer
            ticketId={id}
            clientLabel={ticket.submitter_email || ticket.contact_email}
            disabled={isShut}
            disabledReason={`This ticket is ${statusLabel(ticket.status).toLowerCase()}. Re-open it to reply.`}
          />
        </div>

        {/* Controls + access */}
        <div className="min-w-0 flex flex-col gap-2.5">
          <Card
            title="Ticket"
            icon="heroicons:adjustments-horizontal"
            right={
              update.isPending || assign.isPending ? (
                <Icon
                  icon="heroicons:arrow-path"
                  className="text-xs text-slate-400 animate-spin"
                />
              ) : null
            }
          >
            <div className="space-y-2.5">
              <label className="block">
                <span className={`${DESK_LABEL} block mb-1`}>Status</span>
                <select
                  value={ticket.status || ""}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ status: e.target.value })}
                  className={DESK_SELECT}
                  style={CONTROL_SELECT_ARROW}
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {session && !ACCESS_ENDING_STATUSES.has(ticket.status) && (
                  <span className="mt-1 block text-[11px] text-rose-700 dark:text-rose-400">
                    Resolving or closing this ticket ends the live access session.
                  </span>
                )}
              </label>

              <label className="block">
                <span className={`${DESK_LABEL} block mb-1`}>Priority</span>
                <select
                  value={ticket.priority || ""}
                  disabled={update.isPending}
                  onChange={(e) => update.mutate({ priority: e.target.value })}
                  className={DESK_SELECT}
                  style={CONTROL_SELECT_ARROW}
                >
                  {TICKET_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className={`${DESK_LABEL} block mb-1`}>Assignee</span>
                <p className="text-[13px] text-slate-700 dark:text-slate-300 truncate">
                  {assignedName ||
                    (assignedId ? `Agent ${assignedId}` : (
                      <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                        <Icon icon="heroicons:user-minus" className="text-xs" />
                        Unassigned
                      </span>
                    ))}
                  {isMine && (
                    <span className="ml-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      you
                    </span>
                  )}
                </p>
                {/* Assignment is advisory — any agent may take or drop a
                    ticket. There is no endpoint that lists agents, so this
                    offers the two moves an agent makes about their own
                    queue rather than a picker of names it cannot fetch. */}
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {!isMine && (
                    <button
                      type="button"
                      disabled={assign.isPending}
                      onClick={() => assign.mutate({ assignee: myId })}
                      className={DESK_BTN_SECONDARY}
                    >
                      <Icon icon="heroicons:hand-raised" className="text-sm" />
                      Assign to me
                    </button>
                  )}
                  {assignedId != null && (
                    <button
                      type="button"
                      disabled={assign.isPending}
                      onClick={() => assign.mutate({ assignee: null })}
                      className={DESK_BTN_SECONDARY}
                    >
                      <Icon icon="heroicons:user-minus" className="text-sm" />
                      Unassign
                    </button>
                  )}
                </div>
                {ticket.assigned_at && (
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Assigned {dateTimeLabel(ticket.assigned_at)}
                  </p>
                )}
              </div>

              <dl className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                {[
                  ["Opened", dateTimeLabel(ticket.created_at)],
                  ["Last update", dateTimeLabel(ticket.updated_at)],
                  ["Category", ticket.category || "—"],
                  ["Page", ticket.page_url || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-2">
                    <dt className={DESK_LABEL}>{k}</dt>
                    <dd className="text-[13px] text-slate-700 dark:text-slate-300 truncate max-w-[60%] text-right">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Card>

          <AccessPanel ticket={ticket} />
        </div>
      </div>
    </div>
  );
};

export default SupportDeskTicket;
