import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  BADGE,
  BTN_SECONDARY_SM,
  DESK_BTN_DANGER,
  DESK_BTN_PRIMARY,
  DESK_LABEL,
} from "@/constants/ui";
import {
  ACCESS_CODE_GROUPS,
  ACCESS_CODE_GROUP_SIZE,
  ACCESS_CODE_PREFIX,
  AMBIGUOUS_CHARS,
  countdownLabel,
  dateTimeLabel,
  formatAccessCode,
  isCompleteCode,
  isForbidden,
  msUntil,
  sanitizeCodeChars,
  useEndAccessSession,
  useIsSupportAgent,
  useLiveAccessSession,
  useRedeemAccessCode,
} from "@/services/support/supportDeskService";

/**
 * Where an agent turns a code the client read out into a live session, and
 * where they end it.
 *
 * The one thing this panel cannot do is grant itself access. There is no
 * "open account" button, no TTL field, no extend. The client mints the
 * grant, speaks six-to-twelve characters down the phone, and can revoke it
 * mid-sentence. Everything here is downstream of that.
 *
 * The full code is never drawn. The agent types it once into the field
 * below and from then on both sides refer to the grant by `code_label`
 * (`BM-7KQ4`) — enough to say "the one ending 7KQ4", not enough to replay.
 */

/* ---------------------------------------------------------------------------
 * Countdown
 *
 * Ticks locally once a second so the number moves, but it is not the
 * authority on anything: expiry is enforced on every request server-side,
 * and the session poll in `useLiveAccessSession` is what actually clears a
 * revoked session. This only stops the panel from showing a frozen "59:12"
 * for twenty seconds at a time.
 * ------------------------------------------------------------------------ */
const useCountdown = (expiresAt) => {
  const [ms, setMs] = useState(() => msUntil(expiresAt));
  useEffect(() => {
    setMs(msUntil(expiresAt));
    if (!expiresAt) return undefined;
    const t = setInterval(() => setMs(msUntil(expiresAt)), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return ms;
};

/** Under five minutes left is a different fact from "45 minutes left". */
const toneForRemaining = (ms) =>
  ms <= 0
    ? "text-rose-600 dark:text-rose-400"
    : ms < 5 * 60 * 1000
      ? "text-amber-600 dark:text-amber-400"
      : "text-slate-900 dark:text-white";

const SCOPE_COPY = {
  read_only: { label: "Read only", icon: "heroicons:eye" },
  full: { label: "Full access", icon: "heroicons:pencil-square" },
};

/* ---------------------------------------------------------------------------
 * The code field
 *
 * Three boxes of four, uppercase, with the fixed `BM-` prefix printed
 * rather than typed. The ambiguous characters are refused at the keystroke:
 * `I`, `L`, `O` and `U` are not in the alphabet, so a code read out as
 * "oh" is a zero, and telling the agent that while they are still on the
 * call is worth more than a validation error after they hang up.
 * ------------------------------------------------------------------------ */
const CodeInput = ({ groups, setGroups, disabled, onSubmit }) => {
  const refs = useRef([]);
  const [rejected, setRejected] = useState(null);

  // Clear the "I is not used" hint a few seconds after the last offence,
  // so it reads as a reaction to typing rather than a permanent error.
  useEffect(() => {
    if (!rejected) return undefined;
    const t = setTimeout(() => setRejected(null), 4000);
    return () => clearTimeout(t);
  }, [rejected]);

  const handleChange = (index, raw) => {
    // `BM` is itself two legal characters, so a pasted whole code would
    // otherwise come through as `BM7KQ4…` and be four characters long.
    // Strip the prefix only when a separator follows it, which typing it
    // by hand never produces.
    const incoming =
      index === 0
        ? String(raw || "").replace(
            new RegExp(`^\\s*${ACCESS_CODE_PREFIX}[\\s-]+`, "i"),
            "",
          )
        : raw;
    const { value, rejected: bad } = sanitizeCodeChars(incoming);
    if (bad.length) setRejected(bad[bad.length - 1]);

    // A paste lands entirely in one box; spill the overflow forward so
    // pasting `BM-7KQ4-9M2X-R8VD` fills all three. Boxes before the one
    // being edited, and boxes the overflow never reaches, are left alone.
    const next = [...groups];
    next[index] = value.slice(0, ACCESS_CODE_GROUP_SIZE);
    let remainder = value.slice(ACCESS_CODE_GROUP_SIZE);
    let last = index;
    for (let i = index + 1; i < ACCESS_CODE_GROUPS && remainder.length; i += 1) {
      next[i] = remainder.slice(0, ACCESS_CODE_GROUP_SIZE);
      remainder = remainder.slice(ACCESS_CODE_GROUP_SIZE);
      last = i;
    }
    setGroups(next);

    if (
      next[last]?.length === ACCESS_CODE_GROUP_SIZE &&
      last < ACCESS_CODE_GROUPS - 1
    ) {
      refs.current[last + 1]?.focus();
      refs.current[last + 1]?.select?.();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit?.();
      return;
    }
    if (e.key === "Backspace" && !groups[index] && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < ACCESS_CODE_GROUPS - 1)
      refs.current[index + 1]?.focus();
  };

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[13px] font-semibold text-slate-400 dark:text-slate-500 select-none">
          {ACCESS_CODE_PREFIX}&ndash;
        </span>
        {groups.map((group, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="font-mono text-[13px] text-slate-300 dark:text-slate-600 select-none">
                &ndash;
              </span>
            )}
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              aria-label={`Access code group ${i + 1} of ${ACCESS_CODE_GROUPS}`}
              value={group}
              disabled={disabled}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              placeholder="····"
              className={
                "w-[4.5rem] h-9 text-center text-[13px] rounded-md font-mono font-semibold uppercase tracking-[0.18em] " +
                "bg-white dark:bg-slate-900 text-slate-900 dark:text-white " +
                "placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:tracking-[0.1em] " +
                "border border-slate-200 dark:border-slate-700 transition-colors " +
                "hover:border-slate-300 dark:hover:border-slate-600 " +
                "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 " +
                "disabled:cursor-not-allowed disabled:opacity-60"
              }
            />
          </React.Fragment>
        ))}
      </div>
      <p
        className={`mt-1.5 text-[11px] ${
          rejected
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {rejected
          ? `${rejected} is not used in these codes — did you mean ${AMBIGUOUS_CHARS[rejected]}?`
          : "I, L, O and U are never used, so they cannot be misheard."}
      </p>
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * Live session
 * ------------------------------------------------------------------------ */

const LiveSession = ({ session, ticketId, onEnded }) => {
  const remaining = useCountdown(session.expiresAt);
  const [confirming, setConfirming] = useState(false);
  const end = useEndAccessSession({ onSuccess: () => onEnded?.() });

  const scope = SCOPE_COPY[session.scope] || { label: session.scope || "—", icon: "heroicons:key" };
  // A grant is bound to one ticket. If the live session belongs to another
  // one, say so here rather than letting the agent believe this ticket is
  // the reason they are inside the account.
  const otherTicket =
    session.ticketId && ticketId && String(session.ticketId) !== String(ticketId);

  return (
    <div className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3">
      <div className="flex items-start gap-2">
        <span className="relative mt-0.5 flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
            Access live — you are inside{" "}
            {session.organizationName || "this client's account"}
          </p>
          <p className="mt-0.5 text-[11px] text-rose-700/80 dark:text-rose-400/80">
            Every request you make is recorded against your name.
          </p>
        </div>
        <span
          className={`${BADGE} bg-white/70 dark:bg-slate-900/60 text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-900/60 shrink-0`}
        >
          <Icon icon={scope.icon} className="text-[11px]" />
          {scope.label}
        </span>
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
        <div className="min-w-0">
          <dt className={DESK_LABEL}>Time left</dt>
          <dd
            className={`mt-0.5 font-mono text-[15px] font-semibold tabular-nums ${toneForRemaining(remaining)}`}
          >
            {remaining > 0 ? countdownLabel(remaining) : "expired"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={DESK_LABEL}>Grant</dt>
          <dd className="mt-0.5 font-mono text-[13px] font-semibold text-slate-900 dark:text-white truncate">
            {session.codeLabel || "—"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={DESK_LABEL}>Started</dt>
          <dd className="mt-0.5 text-[13px] text-slate-700 dark:text-slate-300 truncate">
            {dateTimeLabel(session.startedAt)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={DESK_LABEL}>Expires</dt>
          <dd className="mt-0.5 text-[13px] text-slate-700 dark:text-slate-300 truncate">
            {dateTimeLabel(session.expiresAt)}
          </dd>
        </div>
      </dl>

      {otherTicket && (
        <p className="mt-2.5 flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <Icon icon="heroicons:exclamation-triangle" className="mt-px text-xs shrink-0" />
          This session was granted on a different ticket. A grant covers one
          ticket and one organization — end it and ask for a new code before
          working this one.
        </p>
      )}

      {end.isError && (
        <p className="mt-2.5 text-[11px] text-rose-700 dark:text-rose-400">
          Could not end the session: {end.error?.message || "request failed"}. The
          grant still expires on its own at {dateTimeLabel(session.expiresAt)}.
        </p>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={() => end.mutate({ session: session.id })}
              disabled={end.isPending}
              className={DESK_BTN_DANGER}
            >
              <Icon
                icon={end.isPending ? "heroicons:arrow-path" : "heroicons:check"}
                className={`text-sm ${end.isPending ? "animate-spin" : ""}`}
              />
              {end.isPending ? "Ending…" : "Confirm end access"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={end.isPending}
              className={BTN_SECONDARY_SM}
            >
              Keep working
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={DESK_BTN_DANGER}
          >
            <Icon icon="heroicons:lock-closed" className="text-sm" />
            End access
          </button>
        )}
        <span className="flex-1" />
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          The client can revoke this at any moment.
        </span>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * Redeem form
 * ------------------------------------------------------------------------ */

const EMPTY_GROUPS = Array.from({ length: ACCESS_CODE_GROUPS }, () => "");

const RedeemForm = ({ ticket }) => {
  const [groups, setGroups] = useState(EMPTY_GROUPS);
  const redeem = useRedeemAccessCode({ onSuccess: () => setGroups(EMPTY_GROUPS) });
  const complete = isCompleteCode(groups);

  const submit = () => {
    if (!complete || redeem.isPending) return;
    redeem.mutate({ code: formatAccessCode(groups) });
  };

  const error = redeem.error;
  const lockedOut = error?.status === 429;
  const message = lockedOut
    ? "Too many wrong codes. Redemption is locked for 15 minutes — ask the client to read the code out again after that."
    : error
      ? error.data?.detail || error.message || "That code was not accepted."
      : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Ask {ticket?.submitter_email ? "the caller" : "the client"} to mint a code
        in their own account and read it out. You cannot create one, extend one,
        or keep it after this ticket is resolved.
      </p>
      <div className="mt-2.5 flex flex-col gap-2.5">
        <CodeInput
          groups={groups}
          setGroups={setGroups}
          disabled={redeem.isPending || lockedOut}
          onSubmit={submit}
        />
        <button
          type="submit"
          disabled={!complete || redeem.isPending || lockedOut}
          className={`${DESK_BTN_PRIMARY} w-full`}
        >
          <Icon
            icon={redeem.isPending ? "heroicons:arrow-path" : "heroicons:key"}
            className={`text-sm ${redeem.isPending ? "animate-spin" : ""}`}
          />
          {redeem.isPending ? "Opening…" : "Open account"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2 flex items-start gap-1.5 text-[11px] ${
            lockedOut
              ? "text-amber-700 dark:text-amber-400"
              : "text-rose-700 dark:text-rose-400"
          }`}
        >
          <Icon icon="heroicons:exclamation-triangle" className="mt-px text-xs shrink-0" />
          {message}
        </p>
      )}
    </form>
  );
};

/* ---------------------------------------------------------------------------
 * The panel
 * ------------------------------------------------------------------------ */

const AccessPanel = ({ ticket, className = "" }) => {
  const isAgent = useIsSupportAgent();
  const { session, isLoading, error, refetch } = useLiveAccessSession();

  if (!isAgent) return null;

  return (
    <section
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Icon
          icon="heroicons:shield-check"
          className="text-sm text-slate-400 dark:text-slate-500"
        />
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
          Account access
        </h2>
        <span className="flex-1" />
        {session ? (
          <span
            className={`${BADGE} bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-900/60`}
          >
            Live
          </span>
        ) : (
          <span
            className={`${BADGE} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}
          >
            No access
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        </div>
      ) : error && !session ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2.5">
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {isForbidden(error)
              ? "You are not an active support agent."
              : "Could not read your access sessions."}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {isForbidden(error)
              ? "Staff access alone is not enough — an active support agent record is required."
              : error.message || "The support desk API did not answer."}
          </p>
          {!isForbidden(error) && (
            <button
              type="button"
              onClick={() => refetch()}
              className={`${BTN_SECONDARY_SM} mt-2`}
            >
              <Icon icon="heroicons:arrow-path" className="text-xs" />
              Try again
            </button>
          )}
        </div>
      ) : session ? (
        <LiveSession
          session={session}
          ticketId={ticket?.id}
          onEnded={() => refetch()}
        />
      ) : (
        <RedeemForm ticket={ticket} />
      )}
    </section>
  );
};

/* ---------------------------------------------------------------------------
 * The app-wide banner
 *
 * Mounted once in App.jsx, so a live session is visible on the dashboard,
 * on a bill, on a config screen — not only on the desk page that opened it.
 * An agent who forgets they are inside a client's account is the failure
 * this bar exists to prevent, so it is fixed to the viewport and does not
 * scroll away.
 * ------------------------------------------------------------------------ */

export const SupportAccessBanner = () => {
  const isAgent = useIsSupportAgent();
  const { session } = useLiveAccessSession();
  const remaining = useCountdown(session?.expiresAt);
  const [confirming, setConfirming] = useState(false);
  const end = useEndAccessSession({ onSuccess: () => setConfirming(false) });

  // Reset the two-step confirm whenever the session changes under it.
  useEffect(() => {
    setConfirming(false);
  }, [session?.id]);

  const live = isAgent && session;

  // Keep the bar from covering the last row of whatever page is open.
  useEffect(() => {
    if (!live) return undefined;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "34px";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [live]);

  if (!live) return null;

  return (
    <div
      role="status"
      className="fixed bottom-0 inset-x-0 z-[60] flex items-center gap-2 px-3 h-[34px]
                 bg-rose-600 text-white shadow-[0_-4px_16px_-6px_rgba(15,23,42,0.5)]"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] shrink-0">
        Access live
      </span>
      <span className="text-xs font-semibold truncate">
        {session.organizationName || "Client account"}
      </span>
      {session.codeLabel && (
        <span className="hidden sm:inline font-mono text-[11px] text-white/80 shrink-0">
          {session.codeLabel}
        </span>
      )}
      <span className="font-mono text-xs font-semibold tabular-nums shrink-0">
        {remaining > 0 ? `${countdownLabel(remaining)} left` : "expired"}
      </span>
      <span className="flex-1 min-w-[4px]" />
      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => end.mutate({ session: session.id })}
            disabled={end.isPending}
            className="h-7 px-2.5 text-[11px] font-bold rounded-md bg-white text-rose-700
                       hover:bg-rose-50 cursor-pointer disabled:opacity-60 shrink-0"
          >
            {end.isPending ? "Ending…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-7 px-2 text-[11px] font-semibold rounded-md ring-1 ring-white/50
                       hover:bg-white/10 cursor-pointer shrink-0"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="h-7 px-2.5 text-[11px] font-bold rounded-md bg-white text-rose-700
                     hover:bg-rose-50 cursor-pointer shrink-0"
        >
          End access
        </button>
      )}
    </div>
  );
};

export default AccessPanel;
