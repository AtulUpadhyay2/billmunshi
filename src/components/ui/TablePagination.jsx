import React from "react";
import { Icon } from "@iconify/react";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const buildPageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("…");
    result.push(sorted[i]);
  }
  return result;
};

const TablePagination = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);
  const pageList = buildPageList(safePage, totalPages);

  const goTo = (p) => {
    if (p < 1 || p > totalPages || p === safePage) return;
    onPageChange(p);
  };

  return (
    <div className="px-5 md:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        <span>
          Showing{" "}
          <span className="font-semibold text-slate-900 dark:text-white">{start}</span>–
          <span className="font-semibold text-slate-900 dark:text-white">{end}</span> of{" "}
          <span className="font-semibold text-slate-900 dark:text-white">{total}</span>
        </span>
        <span className="hidden md:inline-flex items-center gap-1.5">
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <label className="inline-flex items-center gap-1.5">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="cursor-pointer pl-2 pr-6 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goTo(safePage - 1)}
          disabled={safePage === 1}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <Icon icon="heroicons:chevron-left" className="text-sm" />
        </button>

        {pageList.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1.5 text-slate-400 dark:text-slate-500">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              className={`inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                safePage === p
                  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
              aria-current={safePage === p ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => goTo(safePage + 1)}
          disabled={safePage === totalPages}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <Icon icon="heroicons:chevron-right" className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
