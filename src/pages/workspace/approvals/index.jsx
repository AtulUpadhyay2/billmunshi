import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useApprovalQueue, useOrgPermissions } from "@/services/approvalService";
import TablePagination from "@/components/ui/TablePagination";

/**
 * Bills waiting on a decision, oldest first, across every module.
 *
 * The queue is keyed on the organisation, not on an accounting package:
 * a Tally voucher and a Zoho bill wait in the same line.
 *
 * Oldest first because a queue is worked through: the bill that has
 * waited longest is the one holding somebody up. Deciding happens on
 * the bill itself, where the figures are — this page is the way in,
 * not a place to approve things sight unseen.
 */

/**
 * Where a queued bill's "Review" button goes.
 *
 * Keyed on module AND bill type, not type alone: a Tally purchase and a
 * Zoho purchase both arrive as ``vendor`` and would otherwise collide,
 * sending half the queue to the wrong screen. A row whose pair is not
 * here renders no Review button, which strands it — so every pair that
 * the backend can produce has an entry.
 */
const DETAIL_ROUTE = {
  tally: {
    vendor: "/tally/vendor-bill",
    sales: "/tally/sales-bill",
    expense: "/tally/expense-bill",
    payment: "/tally/payment-voucher",
    receipt: "/tally/receipt-voucher",
  },
  zoho: {
    vendor: "/zoho/vendor-bill",
    sales: "/zoho/sales-bill",
    expense: "/zoho/expense-bill",
    journal: "/zoho/journal-entry",
    payment: "/zoho/payment-voucher",
    receipt: "/zoho/receipt-voucher",
  },
};

const detailRoute = (row) =>
  DETAIL_ROUTE[row.module]?.[row.bill_type] || null;

const MODULES = [
  { value: "", label: "All modules" },
  { value: "tally", label: "Tally" },
  { value: "zoho", label: "Zoho" },
];

// Labels match BillActivity.BillType on the backend, so a filter here
// and a row in the activity log read the same way.
const BILL_TYPES = [
  { value: "", label: "All vouchers" },
  { value: "vendor", label: "Purchase Voucher" },
  { value: "sales", label: "Sales Voucher" },
  { value: "payment", label: "Payment Voucher" },
  { value: "receipt", label: "Receipt Voucher" },
  { value: "expense", label: "Journal Entry" },
  { value: "journal", label: "Journal" },
];

const PAGE_SIZE = 25;

const selectClass =
  "h-8 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 " +
  "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer";

const when = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  const stamp = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  if (days <= 0) return `today · ${stamp}`;
  return `${days} day${days === 1 ? "" : "s"} ago · ${stamp}`;
};

const Approvals = () => {
  const navigate = useNavigate();
  const { selectedOrganization } = useSelector((state) => state.auth);
  const organizationId = selectedOrganization?.id;
  const { approvalRequired, isLoading: loadingPermissions } = useOrgPermissions();

  const [module, setModule] = useState("");
  const [billType, setBillType] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ module, bill_type: billType, page, page_size: PAGE_SIZE }),
    [module, billType, page],
  );

  const { data, isLoading, isError, refetch, isFetching } = useApprovalQueue(
    organizationId,
    filters,
    { keepPreviousData: true },
  );

  // Any filter change restarts paging; otherwise page 3 of an old
  // filter shows an empty table under a new one.
  const onFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

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
  const total = data?.count ?? 0;

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
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={module}
            onChange={(e) => onFilter(setModule)(e.target.value)}
            className={selectClass}
            aria-label="Filter by module"
          >
            {MODULES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={billType}
            onChange={(e) => onFilter(setBillType)(e.target.value)}
            className={selectClass}
            aria-label="Filter by voucher type"
          >
            {BILL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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
      </div>

      {!loadingPermissions && !approvalRequired && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Approvals are off for this workspace
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            A verified bill posts straight to Tally or Zoho Books. Turn the
            approval step on to have a Manager sign off first.
          </p>
        </div>
      )}

      {isError && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Could not load the approval queue.
        </p>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex-1 min-h-0 overflow-auto">
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
                const route = detailRoute(row);
                return (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {row.bill_type_label}
                      {/* The queue carries both modules, and a purchase
                          voucher looks the same in either — say which. */}
                      <span className="ml-1.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {row.module}
                      </span>
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

        {total > PAGE_SIZE && (
          <div className="border-t border-slate-200 dark:border-slate-800">
            <TablePagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
