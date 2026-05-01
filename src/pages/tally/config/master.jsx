import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import TablePagination from "@/components/ui/TablePagination";
import { useGetTallyMasters } from "@/services/tally/tallyApiService";

const inputBase =
  "w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600";

const TallyMaster = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const {
    data: mastersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTallyMasters(selectedOrganization?.id, {
    enabled: !!selectedOrganization?.id,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [gstFilter, setGstFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, gstFilter, pageSize]);

  const stockItems = mastersData?.stock_items || [];

  const stats = useMemo(() => {
    const total = stockItems.length;
    const applicable = stockItems.filter(
      (i) => (i.gst_applicable || "").trim() === "Applicable"
    ).length;
    const categories = new Set(
      stockItems.map((i) => (i.category || "").trim()).filter(Boolean)
    ).size;
    const units = new Set(
      stockItems.map((i) => (i.unit || "").trim()).filter(Boolean)
    ).size;
    return { total, applicable, categories, units };
  }, [stockItems]);

  const filtered = useMemo(() => {
    return stockItems.filter((item) => {
      if (gstFilter !== "ALL") {
        const isApplicable = (item.gst_applicable || "").trim() === "Applicable";
        if (gstFilter === "APPLICABLE" && !isApplicable) return false;
        if (gstFilter === "NOT_APPLICABLE" && isApplicable) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.alias?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.parent?.toLowerCase().includes(q) ||
        item.unit?.toLowerCase().includes(q)
      );
    });
  }, [stockItems, searchQuery, gstFilter]);

  const paged = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filtered.slice(startIdx, startIdx + pageSize);
  }, [filtered, page, pageSize]);

  if (!selectedOrganization?.id) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
          <Icon icon="heroicons:building-office" className="text-2xl" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Please select a client to view masters data.
        </p>
      </div>
    );
  }

  const GstBadge = ({ value }) => {
    const isApplicable = (value || "").trim() === "Applicable";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${
          isApplicable
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60"
            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isApplicable ? "bg-emerald-500" : "bg-slate-400"}`} />
        {(value || "").trim() || "Not specified"}
      </span>
    );
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Inventory items
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Stock items synced from Tally for{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {selectedOrganization?.name}
            </span>
            .
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
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Total items", value: stats.total, icon: "heroicons:cube" },
          { label: "GST applicable", value: stats.applicable, icon: "heroicons:receipt-percent" },
          { label: "Categories", value: stats.categories, icon: "heroicons:rectangle-group" },
          { label: "Units", value: stats.units, icon: "heroicons:scale" },
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
        <div className="px-5 md:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="relative w-full md:max-w-sm">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, alias, category, parent…"
              className={inputBase}
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 self-start md:self-auto">
            {[
              { value: "ALL", label: "All", count: stats.total },
              { value: "APPLICABLE", label: "GST applicable", count: stats.applicable },
              { value: "NOT_APPLICABLE", label: "Not applicable", count: stats.total - stats.applicable },
            ].map((tab) => {
              const isActive = gstFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setGstFilter(tab.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60"
                        : "bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
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
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Failed to load masters</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                {error?.response?.data?.message || error?.message || "An error occurred while fetching the masters data."}
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
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Item</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden lg:table-cell">Parent</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden md:table-cell">Unit</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">GST status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                        <Icon
                          icon={searchQuery || gstFilter !== "ALL" ? "heroicons:magnifying-glass" : "heroicons:cube"}
                          className="text-2xl"
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery || gstFilter !== "ALL" ? "No items match your filters" : "No stock items yet"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery || gstFilter !== "ALL"
                          ? "Try a different keyword or filter."
                          : "Sync from Tally to populate inventory items."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paged.map((item, idx) => {
                    const serial = (page - 1) * pageSize + idx + 1;
                    const showAlias = item.alias && item.alias !== "0";
                    return (
                      <tr
                        key={item.id || `${item.name}-${idx}`}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-mono text-slate-400 dark:text-slate-500 align-top pt-3.5">
                          {String(serial).padStart(3, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 flex items-center justify-center">
                              <Icon icon="heroicons:cube" className="text-base" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {item.name}
                              </div>
                              {showAlias && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  Alias: <span className="font-mono">{item.alias}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {item.category || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {item.parent || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-1 text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
                            {item.unit || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <GstBadge value={item.gst_applicable} />
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

export default TallyMaster;
