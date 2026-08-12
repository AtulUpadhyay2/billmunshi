import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import TablePagination from "@/components/ui/TablePagination";
import { useGetTallyLedgers } from "@/services/tally/tallyApiService";
import { CONTROL_SEARCH } from "@/constants/ui";


const btnBase =
  "inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50";
const btnNeutral =
  `${btnBase} text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`;

const thBase =
  "px-3 py-2 ltr:text-left rtl:text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 whitespace-nowrap";
const tdBase = "px-3 py-1.5";

const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const Ledgers = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const {
    data: ledgersData,
    error,
    isLoading,
    refetch,
  } = useGetTallyLedgers(selectedOrganization?.id, {
    enabled: !!selectedOrganization?.id,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [parentFilter, setParentFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, parentFilter, pageSize]);

  // Flatten grouped ledgers into a single list with parent_name attached
  const flatLedgers = useMemo(() => {
    const grouped = ledgersData?.grouped_ledgers || {};
    const rows = [];
    Object.values(grouped).forEach((group) => {
      (group.ledgers || []).forEach((l) => {
        rows.push({
          ...l,
          parent_name: group.parent_name,
          parent_id: group.parent_id,
        });
      });
    });
    return rows.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [ledgersData]);

  const parentList = useMemo(() => {
    const grouped = ledgersData?.grouped_ledgers || {};
    return Object.values(grouped)
      .map((g) => ({ id: g.parent_id, name: g.parent_name, count: g.ledger_count }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [ledgersData]);

  const stats = useMemo(() => {
    const grouped = ledgersData?.grouped_ledgers || {};
    const totalLedgers = ledgersData?.total_ledgers || flatLedgers.length;
    const totalParents = ledgersData?.total_parents || Object.keys(grouped).length;
    const withGst = flatLedgers.filter((l) => l.gst_in && l.gst_in.trim() !== "").length;
    return { totalLedgers, totalParents, withGst };
  }, [ledgersData, flatLedgers]);

  const filtered = useMemo(() => {
    return flatLedgers.filter((l) => {
      if (parentFilter !== "ALL" && l.parent_id !== parentFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        l.alias?.toLowerCase().includes(q) ||
        l.parent_name?.toLowerCase().includes(q) ||
        l.gst_in?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q)
      );
    });
  }, [flatLedgers, searchQuery, parentFilter]);

  const paged = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filtered.slice(startIdx, startIdx + pageSize);
  }, [filtered, page, pageSize]);

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
          Please select a client to view chart of accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Chart of accounts
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Ledgers synced from Tally for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {selectedOrganization?.name}
            </span>
            .
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className={btnNeutral}
          >
            <Icon icon="heroicons:arrow-path" className={`text-sm ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        {[
          { label: "Total ledgers", value: stats.totalLedgers, icon: "heroicons:book-open" },
          { label: "Parent groups", value: stats.totalParents, icon: "heroicons:rectangle-group" },
          { label: "With GSTIN", value: stats.withGst, icon: "heroicons:identification" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2"
          >
            <span className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
              <Icon icon={s.icon} className="text-xs" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {s.label}
              </div>
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                {isLoading ? "—" : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card — the only thing on the page that scrolls */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-3 md:px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
          <div className="relative w-full md:max-w-xs">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ledger, alias, parent, GSTIN…"
              className={CONTROL_SEARCH}
            />
          </div>

          {parentList.length > 0 && (
            <div className="relative">
              <Icon icon="heroicons:funnel" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className={`${CONTROL_SEARCH} pr-8 cursor-pointer appearance-none md:max-w-xs`}
              >
                <option value="ALL">All parent groups ({stats.totalParents})</option>
                {parentList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.count})
                  </option>
                ))}
              </select>
              <Icon icon="heroicons:chevron-down" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="px-3 md:px-4 py-2.5 space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2.5">
                <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Failed to load ledgers</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
                {error?.message || "An error occurred while fetching ledgers."}
              </p>
              <button type="button" onClick={() => refetch()} className={btnNeutral}>
                <Icon icon="heroicons:arrow-path" className="text-sm" />
                Try again
              </button>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className={thBase}>Ledger</th>
                  <th className={`${thBase} hidden md:table-cell`}>Parent group</th>
                  <th className={`${thBase} hidden lg:table-cell`}>GSTIN</th>
                  <th className={`${thBase} ltr:text-right rtl:text-left`}>Opening balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
                        <Icon
                          icon={searchQuery || parentFilter !== "ALL" ? "heroicons:magnifying-glass" : "heroicons:book-open"}
                          className="text-lg"
                        />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery || parentFilter !== "ALL" ? "No ledgers match your filters" : "No ledgers yet"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery || parentFilter !== "ALL"
                          ? "Try a different keyword or parent group."
                          : "Sync from Tally to populate the chart of accounts."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paged.map((ledger) => {
                    const showAlias = ledger.alias && ledger.alias !== "0";
                    const balance = parseFloat(ledger.opening_balance) || 0;
                    return (
                      <tr
                        key={ledger.id}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className={tdBase}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 flex items-center justify-center">
                              <Icon icon="heroicons:book-open" className="text-sm" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {ledger.name}
                              </div>
                              {showAlias && (
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                  Alias: <span className="font-mono">{ledger.alias}</span>
                                </div>
                              )}
                              <div className="md:hidden text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {ledger.parent_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`${tdBase} hidden md:table-cell`}>
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
                            {ledger.parent_name}
                          </span>
                        </td>
                        <td className={`${tdBase} hidden lg:table-cell`}>
                          {ledger.gst_in && ledger.gst_in.trim() !== "" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                              <Icon icon="heroicons:identification" className="text-xs text-slate-400" />
                              {ledger.gst_in}
                            </span>
                          ) : (
                            <span className="text-[10px] italic text-slate-400 dark:text-slate-500">
                              Not provided
                            </span>
                          )}
                        </td>
                        <td className={`${tdBase} ltr:text-right rtl:text-left`}>
                          <div
                            className={`text-xs font-mono font-semibold whitespace-nowrap ${
                              balance < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : balance > 0
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            ₹ {formatCurrency(ledger.opening_balance)}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Opening
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !error && filtered.length > 0 && (
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

export default Ledgers;
