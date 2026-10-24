import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useApprovalQueue, useOrgPermissions } from "@/services/approvalService";

/**
 * Bills waiting on a decision, oldest first.
 *
 * Oldest first because a queue is worked through: the bill that has
 * waited longest is the one holding somebody up. Deciding happens on
 * the bill itself, where the figures are — this page is the way in,
 * not a place to approve things sight unseen.
 */

const DETAIL_ROUTE = {
  vendor: "/tally/vendor-bill",
  expense: "/tally/expense-bill",
  payment: "/tally/payment-voucher",
};

const when = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  const stamp = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (days <= 0) return `today · ${stamp}`;
  return `${days} day${days === 1 ? "" : "s"} ago · ${stamp}`;
};

const TallyApprovals = () => {
  const navigate = useNavigate();
  const { selectedOrganization } = useSelector((state) => state.auth);
  const organizationId = selectedOrganization?.id;
  const { approvalRequired, isLoading: loadingPermissions } = useOrgPermissions();
  const { data, isLoading, isError, refetch, isFetching } = useApprovalQueue(organizationId);

  if (!organizationId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
      </div>
    );
  }

  const rows = data?.results || [];

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Approvals
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Bills waiting for a decision. Open one to see the figures before deciding.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
        >
          <Icon
            icon="heroicons:arrow-path"
            className={`text-sm ${isLoading || isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {!loadingPermissions && !approvalRequired && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Approvals are off for this workspace
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            A verified bill posts straight to Tally. Turn the approval step on to
            have a Manager sign off first.
          </p>
        </div>
      )}

      {isError && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Could not load the approval queue.
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {isLoading ? (
          <p className="p-4 text-xs text-slate-500 dark:text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center">
            <Icon
              icon="heroicons:check-circle"
              className="text-2xl text-slate-300 dark:text-slate-600"
            />
            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Nothing waiting
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur">
              <tr className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Submitted by</th>
                <th className="px-3 py-2">Waiting</th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const route = DETAIL_ROUTE[row.bill_type];
                return (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {row.bill_type_label}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      {row.submitted_by_email || "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {when(row.submitted_at)}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {row.submitted_note || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {route && (
                        <button
                          type="button"
                          onClick={() => navigate(`${route}/${row.bill_id}`)}
                          className="h-7 px-2.5 inline-flex items-center gap-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Review
                          <Icon icon="heroicons:arrow-right" className="text-xs" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TallyApprovals;
