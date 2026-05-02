import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import TablePagination from "@/components/ui/TablePagination";

const inputBase =
  "w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600";

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Shared, design-system-consistent table for Zoho config pages
 * (Chart of Accounts, Vendors, Taxes, TDS/TCS, Vendor Credits).
 *
 * Props:
 *   - title:      string                   page title
 *   - subtitle:   string                   description below title
 *   - icon:       string                   iconify icon for the title chip
 *   - itemLabel:  string                   "vendor", "tax", "account", etc. (for empty state)
 *   - useGet:     hook                     fetches list. Receives orgId (or { organizationId } for paginated hooks)
 *   - useSync:    hook                     mutation that triggers a sync
 *   - paginated:  boolean                  if true, the hook expects { organizationId, page } and the response has { results, count, next, previous }
 *   - columns:    Array<{ key, label, render?(row, index) }>
 *   - searchKeys: Array<string>            keys on each row that should be searched
 *   - getRowKey:  (row) => string          unique key per row
 */
const ZohoSyncTable = ({
  title,
  subtitle,
  icon = "heroicons:rectangle-stack",
  itemLabel = "item",
  useGet,
  useSync,
  paginated = false,
  columns = [],
  searchKeys = [],
  getRowKey = (r) => r.id,
}) => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const orgId = selectedOrganization?.id;

  // Some hooks accept a plain orgId, others accept { organizationId, page }.
  // We pass both shapes via the `paginated` flag.
  const queryArg = paginated
    ? { organizationId: orgId, page: 1 }
    : orgId;

  const { data, isLoading, isError, error, refetch } = useGet(queryArg, {
    enabled: !!orgId,
  });

  const { mutateAsync: syncMutation, isPending } = useSync();
  const isSyncing = !!isPending;

  const rows = useMemo(() => data?.results || [], [data]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, pageSize, rows.length]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) =>
      searchKeys.some((k) => {
        const v = r[k];
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, searchQuery, searchKeys]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSync = async () => {
    if (!orgId) {
      toast.error("No workspace selected");
      return;
    }
    try {
      await syncMutation(orgId);
      toast.success(`${title} synced successfully`);
      refetch();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || `Failed to sync ${title.toLowerCase()}`
      );
    }
  };

  if (!orgId) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
          <Icon icon="heroicons:building-office" className="text-2xl" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Please select a client to view {title.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-base ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || !orgId}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
          >
            <Icon
              icon={isSyncing ? "heroicons:arrow-path" : "heroicons:cloud-arrow-down"}
              className={`text-base ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Syncing…" : "Sync from Zoho"}
          </button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: `Total ${itemLabel}s`, value: data?.count ?? rows.length, icon },
          { label: "Showing", value: filtered.length, icon: "heroicons:eye" },
          { label: "Page size", value: pageSize, icon: "heroicons:bars-3" },
          { label: "Status", value: isError ? "Error" : "OK", icon: isError ? "heroicons:exclamation-triangle" : "heroicons:check-badge" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 flex items-center gap-3"
          >
            <span className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
              <Icon icon={s.icon} className="text-sm" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {s.label}
              </div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                {isLoading ? "—" : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-5 md:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative w-full md:max-w-sm">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${itemLabel}s…`}
              className={inputBase}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="px-5 md:px-6 py-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <Icon icon="heroicons:exclamation-triangle" className="text-2xl" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Failed to load {title.toLowerCase()}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                {error?.data?.message || error?.message || "An error occurred while fetching data."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Icon icon="heroicons:arrow-path" className="text-base" />
                Try again
              </button>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 w-12">#</th>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 ${c.className || ""}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                        <Icon icon={searchQuery ? "heroicons:magnifying-glass" : icon} className="text-2xl" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery ? `No ${itemLabel}s match your search` : `No ${itemLabel}s yet`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery
                          ? "Try a different keyword or clear the search."
                          : `Click "Sync from Zoho" to fetch the latest ${itemLabel}s.`}
                      </p>
                      {!searchQuery && (
                        <button
                          type="button"
                          onClick={handleSync}
                          disabled={isSyncing}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
                        >
                          <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:cloud-arrow-down"} className={`text-base ${isSyncing ? "animate-spin" : ""}`} />
                          {isSyncing ? "Syncing…" : "Sync from Zoho"}
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paged.map((row, idx) => {
                    const serial = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={getRowKey(row) ?? `${idx}`}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-slate-400 dark:text-slate-500">
                          {String(serial).padStart(3, "0")}
                        </td>
                        {columns.map((c) => (
                          <td key={c.key} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {c.render ? c.render(row, idx) : c.format === "date"
                              ? formatDate(row[c.key])
                              : row[c.key] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && filtered.length > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 15, 25, 50, 100]}
          />
        )}
      </div>
    </div>
  );
};

export default ZohoSyncTable;
