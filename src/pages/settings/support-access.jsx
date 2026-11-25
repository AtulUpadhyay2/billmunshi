import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import GrantAccessDialog from "@/components/support/GrantAccessDialog";
import { globalToast } from "@/utils/toast";
import { useMySupportTickets } from "@/services/support/supportService";
import {
  isGrantLive,
  personName,
  SCOPE_FULL,
  useAccessGrants,
  useRevokeAccessGrant,
} from "@/services/support/supportAccessService";
import {
  BADGE,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SOFT,
  LABEL_CAPS,
  PAGE_TITLE,
  SECTION_TITLE,
  TD,
  TH,
} from "@/constants/ui";

/**
 * Support access — the history.
 *
 * Every grant this organisation has ever minted, who used it, when, and
 * which are still alive. It is the audit the client can read themselves,
 * which is the half of "nothing is anonymous" that faces them.
 *
 * Two rules this page keeps absolutely:
 *
 *  - It never renders a full code. The server does not have one to give —
 *    only `sha256(code)` is stored — and the only display label is
 *    `code_label` (`BM-7KQ4`), the first group, which is safe to say out
 *    loud on a call.
 *  - A grant whose ticket has been resolved or closed reads as *closed*,
 *    never as live, even if the status column has not caught up. That
 *    derivation lives in `effectiveStatus` in the service.
 */

const STATUS_META = {
  pending: {
    label: "Waiting to be used",
    badge:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-900",
    icon: "heroicons:clock",
  },
  active: {
    label: "Live now",
    badge:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-900",
    icon: "heroicons:signal",
  },
  expired: {
    label: "Expired",
    badge:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700",
    icon: "heroicons:clock",
  },
  revoked: {
    label: "You ended it",
    badge:
      "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-900",
    icon: "heroicons:hand-raised",
  },
  closed: {
    label: "Closed with the ticket",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-900",
    icon: "heroicons:check-circle",
  },
  unknown: {
    label: "Unknown",
    badge:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700",
    icon: "heroicons:question-mark-circle",
  },
};

const SCOPE_LABEL = {
  [SCOPE_FULL]: "Could change data",
  read_only: "Read only",
};

const when = (value) => {
  if (!value) return null;
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return null;
  return at.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const OPEN_TICKET_STATUSES = new Set(["open", "in_progress"]);

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.unknown;
  return (
    <span className={`${BADGE} ${meta.badge}`}>
      <Icon icon={meta.icon} className="text-[11px]" aria-hidden="true" />
      {meta.label}
    </span>
  );
};

const Dash = () => (
  <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">
    —
  </span>
);

const SupportAccess = () => {
  const { selectedOrganization, user } = useSelector((state) => state.auth);
  const organizationId = selectedOrganization?.id;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAccessGrants(organizationId);

  // A grant always has a ticket — it is where the reason lives — so the
  // ticket is picked here before the dialog opens rather than inside it.
  const { data: tickets } = useMySupportTickets();
  const openTickets = useMemo(
    () =>
      (Array.isArray(tickets) ? tickets : []).filter((t) =>
        OPEN_TICKET_STATUSES.has(t.status),
      ),
    [tickets],
  );

  const [ticketId, setTicketId] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [revoking, setRevoking] = useState(null);

  const revoke = useRevokeAccessGrant();

  const chosenTicket = openTickets.find(
    (t) => String(t.id) === String(ticketId),
  );

  const grants = data?.grants || [];
  const liveCount = grants.filter(isGrantLive).length;

  const openGrantDialog = () => {
    const next = ticketId || (openTickets[0] ? String(openTickets[0].id) : "");
    setTicketId(next);
    setGrantOpen(true);
  };

  const confirmRevoke = async () => {
    if (!revoking) return;
    try {
      await revoke.mutateAsync({ grantId: revoking.id });
      globalToast.success(`Access ${revoking.code_label || ""} ended`.trim());
      setRevoking(null);
    } catch (err) {
      globalToast.error(err?.message || "Could not revoke. Try again.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0">
          <h1 className={PAGE_TITLE}>Support access</h1>
          <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
            Nobody from support can see this account unless you create a code
            and read it to them. Everything you have ever granted is listed
            below.
          </p>
        </div>
        <span className="flex-1" />
        {liveCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 ring-1 ring-amber-300 dark:ring-amber-900">
            <Icon icon="heroicons:signal" className="text-xs" aria-hidden="true" />
            {liveCount} grant{liveCount > 1 ? "s" : ""} still usable
          </span>
        )}
        <button
          type="button"
          className={BTN_SECONDARY}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <Icon
            icon="heroicons:arrow-path"
            className={`text-sm ${isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </button>
      </div>

      {/* Minting lives on this page, next to the history, so the act of
          granting and the record of it are never in two different places. */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        <h2 className={SECTION_TITLE}>Give support access</h2>
        {openTickets.length === 0 ? (
          <p className="mt-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
            Access is always attached to a support ticket, and you have no open
            one. Raise a ticket first on{" "}
            <Link
              to="/support/tickets"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Support tickets
            </Link>
            , then come back here.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="grant-ticket" className={LABEL_CAPS}>
                Which ticket is this for
              </label>
              <div className="relative mt-1.5">
                <select
                  id="grant-ticket"
                  value={ticketId || String(openTickets[0]?.id ?? "")}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="w-full h-9 pl-2.5 pr-8 text-[13px] appearance-none cursor-pointer bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md transition-colors hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {openTickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.subject}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="heroicons:chevron-down"
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                  aria-hidden="true"
                />
              </div>
            </div>
            <button type="button" className={BTN_PRIMARY} onClick={openGrantDialog}>
              <Icon icon="heroicons:key" className="text-sm" aria-hidden="true" />
              Create access code
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-3 py-2">
          <h2 className={SECTION_TITLE}>Grant history</h2>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Only the short label is ever shown — the code itself is not stored
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-9 rounded-md bg-slate-50 dark:bg-slate-800/60 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="text-xl text-rose-500"
              aria-hidden="true"
            />
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
              Could not load the grant history
            </p>
            <p className="max-w-md text-[12px] text-slate-500 dark:text-slate-400">
              {error?.message ||
                "The server did not answer. Nothing has changed about who can get in."}
            </p>
            <button type="button" className={BTN_SOFT} onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : grants.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
            <Icon
              icon="heroicons:lock-closed"
              className="text-xl text-slate-300 dark:text-slate-600"
              aria-hidden="true"
            />
            <p className="text-[13px] font-semibold text-slate-900 dark:text-white">
              Support has never had access to this account
            </p>
            <p className="max-w-md text-[12px] text-slate-500 dark:text-slate-400">
              You have not granted any. When you do, the grant and whoever
              used it will be listed here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200">
              <thead>
                <tr>
                  <th className={`${TH} text-left`}>Code</th>
                  <th className={`${TH} text-left`}>What it allowed</th>
                  <th className={`${TH} text-left`}>Ticket</th>
                  <th className={`${TH} text-left`}>State</th>
                  <th className={`${TH} text-left`}>Granted</th>
                  <th className={`${TH} text-left`}>Used by</th>
                  <th className={`${TH} text-left`}>Expires</th>
                  <th className={`${TH} text-right`}>&nbsp;</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {grants.map((grant) => {
                  const live = isGrantLive(grant);
                  const redeemedBy =
                    personName(grant.redeemed_by) ||
                    personName(grant.redeemed_by_name);
                  // The ticket id is a UUID, so the subject is what a person
                  // can actually match against their own ticket list.
                  const ticketSubject =
                    grant.ticket_subject || grant.ticket?.subject || null;
                  const ticketId = grant.ticket?.id || grant.ticket || null;
                  // `created_by` comes back as a pk. Naming the person only
                  // makes sense when it is the reader; anyone else's name is
                  // not in the payload and a bare id tells nobody anything.
                  const mintedByMe =
                    user?.id != null &&
                    String(grant.created_by) === String(user.id);
                  const grantedBy =
                    personName(grant.created_by_name) ||
                    personName(grant.created_by) ||
                    (mintedByMe ? "you" : null);
                  return (
                    <tr
                      key={grant.id}
                      className={
                        live ? "bg-amber-50/40 dark:bg-amber-950/10" : undefined
                      }
                    >
                      <td className={TD}>
                        <span className="font-mono text-[12px] font-semibold tracking-[0.08em] text-slate-900 dark:text-white">
                          {grant.code_label || "—"}
                        </span>
                      </td>
                      <td className={TD}>
                        {grant.scope === SCOPE_FULL ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            {SCOPE_LABEL[SCOPE_FULL]}
                          </span>
                        ) : (
                          SCOPE_LABEL[grant.scope] || grant.scope || <Dash />
                        )}
                      </td>
                      <td className={TD}>
                        {ticketSubject ? (
                          <span
                            className="block max-w-56 truncate"
                            title={ticketId ? String(ticketId) : undefined}
                          >
                            {ticketSubject}
                          </span>
                        ) : (
                          <Dash />
                        )}
                      </td>
                      <td className={TD}>
                        <StatusBadge status={grant.display_status} />
                      </td>
                      <td className={TD}>
                        <div>{when(grant.created_at) || <Dash />}</div>
                        {grantedBy && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            by {grantedBy}
                          </div>
                        )}
                      </td>
                      <td className={TD}>
                        {grant.redeemed_at || redeemedBy ? (
                          <div>
                            <div>{redeemedBy || "a support agent"}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {when(grant.redeemed_at) || "time not recorded"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Never used
                          </span>
                        )}
                      </td>
                      <td className={TD}>{when(grant.expires_at) || <Dash />}</td>
                      <td className={`${TD} text-right`}>
                        {live ? (
                          <button
                            type="button"
                            onClick={() => setRevoking(grant)}
                            className="inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-100 transition-all hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900/60 dark:hover:bg-rose-950/60"
                          >
                            <Icon
                              icon="heroicons:hand-raised"
                              className="text-[11px]"
                              aria-hidden="true"
                            />
                            Revoke
                          </button>
                        ) : (
                          <Dash />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GrantAccessDialog
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        ticketId={chosenTicket?.id || openTickets[0]?.id}
        ticketLabel={(chosenTicket || openTickets[0])?.subject || null}
      />

      <ConfirmDialog
        open={!!revoking}
        onClose={() => setRevoking(null)}
        onConfirm={confirmRevoke}
        variant="danger"
        title={`Revoke ${revoking?.code_label || "this grant"}?`}
        message="Access ends immediately — the code stops working and any agent currently in the account is shut out on their next click. Nothing they have already changed is undone."
        confirmText="Yes, revoke now"
        cancelText="Keep it"
        isLoading={revoke.isPending}
      />
    </div>
  );
};

export default SupportAccess;
