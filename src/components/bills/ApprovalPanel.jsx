import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  ACTIONS,
  useApproveBill,
  useBillApproval,
  useOrgPermissions,
  useRejectBill,
  useSubmitForApproval,
} from "@/services/approvalService";

/**
 * The approval step on one bill: submit it, or decide on it.
 *
 * Renders nothing where the organisation has not switched approvals on,
 * which is the default — a workspace that never asked for the extra
 * step never sees it. What the panel offers comes from the server's
 * answer to "may this person approve", not from a role string read
 * here, so the button and the endpoint agree.
 */

const STATE_STYLE = {
  pending: {
    icon: "heroicons:clock",
    label: "Waiting for approval",
    box: "border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-800 dark:text-amber-300",
  },
  approved: {
    icon: "heroicons:check-circle",
    label: "Approved",
    box: "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-800 dark:text-emerald-300",
  },
  rejected: {
    icon: "heroicons:arrow-uturn-left",
    label: "Sent back",
    box: "border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-800 dark:text-rose-300",
  },
};

const NOT_SUBMITTED = {
  icon: "heroicons:paper-airplane",
  label: "Not submitted for approval",
  box: "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40",
  text: "text-slate-700 dark:text-slate-300",
};

const when = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
};

const errorText = (error, fallback) =>
  error?.response?.data?.message || error?.data?.message || error?.message || fallback;

const Button = ({ tone = "slate", disabled, onClick, icon, children }) => {
  const tones = {
    slate:
      "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
    emerald:
      "border-emerald-200 dark:border-emerald-900/60 bg-emerald-600 text-white hover:bg-emerald-700",
    rose: "border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${tones[tone]}`}
    >
      {icon && <Icon icon={icon} className="text-sm" />}
      {children}
    </button>
  );
};

const ApprovalPanel = ({ organizationId, billId }) => {
  const { approvalRequired, can } = useOrgPermissions();
  const { data, isLoading } = useBillApproval(organizationId, billId, {
    enabled: Boolean(organizationId && billId && approvalRequired),
  });
  const submit = useSubmitForApproval(organizationId);
  const approve = useApproveBill(organizationId);
  const reject = useRejectBill(organizationId);

  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

  if (!approvalRequired) return null;
  if (isLoading) return null;

  const approval = data?.approval || null;
  const canApprove = Boolean(data?.can_approve);
  const style = approval ? STATE_STYLE[approval.state] || NOT_SUBMITTED : NOT_SUBMITTED;
  const busy = submit.isPending || approve.isPending || reject.isPending;

  const run = (mutation, payload, success, fallback) =>
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(success);
        setNote("");
        setRejecting(false);
      },
      onError: (error) => toast.error(errorText(error, fallback)),
    });

  return (
    <div className={`rounded-xl border p-3 ${style.box}`}>
      <div className="flex items-start gap-2">
        <Icon icon={style.icon} className={`text-base mt-0.5 shrink-0 ${style.text}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold ${style.text}`}>{style.label}</p>
          {approval && (
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
              Submitted by {approval.submitted_by_email || "someone"} ·{" "}
              {when(approval.submitted_at)}
              {approval.submitted_note ? ` — “${approval.submitted_note}”` : ""}
            </p>
          )}
          {approval?.decided_at && (
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
              {approval.state === "approved" ? "Approved" : "Sent back"} by{" "}
              {approval.decided_by_email || "someone"} · {when(approval.decided_at)}
              {approval.decided_note ? ` — “${approval.decided_note}”` : ""}
            </p>
          )}
          {!approval && (
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
              This workspace posts a bill only after a Manager approves it.
            </p>
          )}
        </div>
      </div>

      {(!approval || approval.state === "rejected") && can(ACTIONS.VERIFY_BILLS) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for the approver (optional)"
            maxLength={500}
            className="h-8 flex-1 min-w-[12rem] px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          />
          <Button
            tone="emerald"
            icon="heroicons:paper-airplane"
            disabled={busy}
            onClick={() =>
              run(
                submit,
                { billId, note },
                "Sent for approval",
                "Could not submit this bill",
              )
            }
          >
            Submit for approval
          </Button>
        </div>
      )}

      {approval?.state === "pending" && canApprove && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {rejecting && (
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is it going back?"
              maxLength={500}
              autoFocus
              className="h-8 flex-1 min-w-[12rem] px-2.5 text-xs rounded-lg border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            />
          )}
          <Button
            tone="emerald"
            icon="heroicons:hand-thumb-up"
            disabled={busy || rejecting}
            onClick={() =>
              run(approve, { billId, note }, "Approved", "Could not approve this bill")
            }
          >
            Approve
          </Button>
          <Button
            tone="rose"
            icon="heroicons:arrow-uturn-left"
            disabled={busy || (rejecting && !note.trim())}
            onClick={() => {
              if (!rejecting) {
                setRejecting(true);
                return;
              }
              run(reject, { billId, note }, "Sent back", "Could not send this bill back");
            }}
          >
            {rejecting ? "Confirm send back" : "Send back"}
          </Button>
          {rejecting && (
            <Button
              disabled={busy}
              onClick={() => {
                setRejecting(false);
                setNote("");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      {approval?.state === "pending" && !canApprove && (
        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
          A Manager or Admin has to decide on it before it can be posted.
        </p>
      )}
    </div>
  );
};

export default ApprovalPanel;
