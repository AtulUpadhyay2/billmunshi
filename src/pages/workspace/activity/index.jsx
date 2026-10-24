import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useOrgActivity } from "@/services/activityService";
import TablePagination from "@/components/ui/TablePagination";

/**
 * Organisation-wide activity feed, across every module.
 *
 * The log is keyed on the organisation, not on an accounting package:
 * a Tally voucher and a Zoho bill land in the same feed. It used to say
 * "Tally" throughout and offer only Tally's three voucher types, so
 * half the rows had no filter that could reach them and no link that
 * could open them.
 *
 * Reads the same log the per-bill timeline does, filtered server-side so
 * the page never pulls more than one screen of rows.
 */

const ACTIONS = [
  { value: "", label: "All actions" },
  { value: "uploaded", label: "Uploaded" },
  { value: "analysis_completed", label: "Analysis completed" },
  { value: "analysis_failed", label: "Analysis failed" },
  { value: "duplicate_flagged", label: "Flagged as duplicate" },
  { value: "verified", label: "Verified" },
  { value: "sync_requested", label: "Sent to accounting software" },
  { value: "sync_confirmed", label: "Posted" },
  { value: "sync_failed", label: "Posting failed" },
  { value: "moved", label: "Moved" },
  { value: "trashed", label: "Moved to Trash" },
  { value: "restored", label: "Restored" },
  { value: "deleted", label: "Deleted permanently" },
];

const MODULES = [
  { value: "", label: "All modules" },
  { value: "tally", label: "Tally" },
  { value: "zoho", label: "Zoho" },
];

const BILL_TYPES = [
  { value: "", label: "All vouchers" },
  { value: "vendor", label: "Purchase Voucher" },
  { value: "sales", label: "Sales Voucher" },
  { value: "payment", label: "Payment Voucher" },
  { value: "receipt", label: "Receipt Voucher" },
  { value: "expense", label: "Journal Entry" },
  { value: "journal", label: "Journal" },
];

/**
 * Where a row's bill lives, so the row can link straight to it.
 *
 * Keyed on module AND type: both packages produce a ``vendor``, and
 * keying on the type alone sent half the feed to the wrong screen.
 */
const DETAIL_ROUTE = {
  tally: {
    vendor: "/tally/vendor-bill",
    sales: "/tally/sales-bill",
    payment: "/tally/payment-voucher",
    receipt: "/tally/receipt-voucher",
    expense: "/tally/expense-bill",
  },
  zoho: {
    vendor: "/zoho/vendor-bill",
    sales: "/zoho/sales-bill",
    payment: "/zoho/payment-voucher",
    receipt: "/zoho/receipt-voucher",
    expense: "/zoho/expense-bill",
    journal: "/zoho/journal-entry",
  },
};

const detailRoute = (row) => DETAIL_ROUTE[row.module]?.[row.bill_type] || null;

const TONE = {
  analysis_failed: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-rose-100 dark:ring-rose-900/60",
  sync_failed: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-rose-100 dark:ring-rose-900/60",
  deleted: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-rose-100 dark:ring-rose-900/60",
  sync_confirmed: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-emerald-100 dark:ring-emerald-900/60",
  verified: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-blue-100 dark:ring-blue-900/60",
  duplicate_flagged: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-amber-100 dark:ring-amber-900/60",
  trashed: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-amber-100 dark:ring-amber-900/60",
};
const TONE_DEFAULT =
  "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 ring-slate-200 dark:ring-slate-700";

const PAGE_SIZE = 25;

const formatWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const selectClass =
  "h-8 px-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer";

const Activity = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [billType, setBillType] = useState("");
  const [since, setSince] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      module,
      action,
      bill_type: billType,
      // A date input gives a plain date; the API wants a datetime.
      since: since ? `${since}T00:00:00` : "",
      page,
      page_size: PAGE_SIZE,
    }),
    [module, action, billType, since, page],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useOrgActivity(selectedOrganization?.id, filters, {
      keepPreviousData: true,
    });

  const rows = data?.results || [];
  const total = data?.count ?? 0;

  // Any filter change restarts paging; otherwise page 4 of an old filter
  // shows an empty table under a new one.
  const onFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  if (!selectedOrganization?.id) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
          <Icon icon="heroicons:building-office" className="text-lg" />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Please select a client to view activity.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Activity
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Every change to every bill, Tally and Zoho, newest first.
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={module}
            onChange={(e) => onFilter(setModule)(e.target.value)}
            className={selectClass}
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
          >
            {BILL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => onFilter(setAction)(e.target.value)}
            className={selectClass}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={since}
            onChange={(e) => onFilter(setSince)(e.target.value)}
            className={selectClass}
            aria-label="Show activity from this date"
          />
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

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur">
              <tr className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                <th className="px-3 py-2 font-bold">When</th>
                <th className="px-3 py-2 font-bold">Action</th>
                <th className="px-3 py-2 font-bold">Voucher</th>
                <th className="px-3 py-2 font-bold">Who</th>
                <th className="px-3 py-2 font-bold">Detail</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    <Icon icon="heroicons:arrow-path" className="text-base animate-spin inline-block mr-1.5" />
                    Loading activity…
                  </td>
                </tr>
              )}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-rose-600 dark:text-rose-400">
                    Could not load activity
                    {error?.data?.detail || error?.message
                      ? `: ${error.data?.detail || error.message}`
                      : "."}
                  </td>
                </tr>
              )}

              {!isLoading && !isError && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                    No activity matches these filters.
                  </td>
                </tr>
              )}

              {rows.map((row) => {
                const route = detailRoute(row);
                // A deleted bill has no page left to open.
                const canOpen = Boolean(route) && row.action !== "deleted";
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatWhen(row.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 whitespace-nowrap ${
                          TONE[row.action] || TONE_DEFAULT
                        }`}
                      >
                        {row.action_label}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {row.bill_type_label}
                      {/* Both packages produce a "Purchase Voucher" —
                          say which one this row came from. */}
                      <span className="ml-1.5 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {row.module}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {row.actor_label}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                      <span className="block">{row.summary}</span>
                      {Array.isArray(row.changes) && row.changes.length > 0 && (
                        <span className="block text-[11px] text-slate-500 dark:text-slate-500">
                          {row.changes
                            .slice(0, 3)
                            .map((c) => `${c.field}: ${c.from || "—"} → ${c.to || "—"}`)
                            .join(" · ")}
                          {row.changes.length > 3
                            ? ` · +${row.changes.length - 3} more`
                            : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {canOpen && (
                        <button
                          type="button"
                          onClick={() => navigate(`${route}/${row.bill_id}`)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Open
                          <Icon icon="heroicons:arrow-top-right-on-square" className="text-[11px]" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

export default Activity;
