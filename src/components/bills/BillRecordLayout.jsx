import React from "react";
import { Icon } from "@iconify/react";
import ActivityTimeline from "@/components/bills/ActivityTimeline";

/**
 * The shell every bill detail page is laid out in.
 *
 * Purchase, Sales and Journal had grown into three near-copies of the
 * same 5,500-line page — the same four things to fill in, grouped
 * differently and named differently ("Bill from" / "Bill Information",
 * "Line items" / "Credit / Debit items"), so what an operator learns on
 * one screen does not carry to the next. Every fix had to be made
 * three times, which is how those differences got in. The layout lives
 * here once; each page passes its own labels and sections.
 *
 * The shape is a record page rather than a form: tabs for the voucher
 * and its history, the scan pinned on the left where the operator's eye
 * goes first, and the voucher reading down the right like the document
 * it is.
 *
 * Nothing here owns bill state. Pages keep their own handlers and pass
 * finished nodes in, so moving a page onto this shell does not change
 * how any field is entered or saved.
 */
const BillRecordLayout = ({
  // Toolbar — skipped entirely when a page carries its own header.
  backTo,
  backLabel = "Back",
  position,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  actions,
  // Tabs
  tab = "bill",
  onTabChange,
  historyLabel = "Comments & History",
  organizationId,
  billId,
  // Content
  notice,
  scan,
  scanOpen = true,
  onToggleScan,
  children,
}) => {
  const isBill = tab !== "history";
  const hasToolbar = Boolean(backTo || position || onPrev || onNext || actions);

  const navBtn =
    "inline-flex items-center justify-center h-7 w-7 rounded-md border " +
    "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 " +
    "hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 " +
    "disabled:cursor-not-allowed cursor-pointer";

  return (
    <div>
      {hasToolbar && (
        <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-xl px-3 py-2">
          {backTo && (
            <a
              href={backTo}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pr-2 mr-1 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap"
            >
              ‹ {backLabel}
            </a>
          )}
          {position && (
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {position}
            </span>
          )}
          {(onPrev || onNext) && (
            <>
              <button
                type="button"
                onClick={onPrev}
                disabled={prevDisabled}
                aria-label="Previous bill"
                className={navBtn}
              >
                <Icon icon="heroicons:chevron-left" className="text-sm" />
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                aria-label="Next bill"
                className={navBtn}
              >
                <Icon icon="heroicons:chevron-right" className="text-sm" />
              </button>
            </>
          )}
          <span className="flex-1 min-w-[8px]" />
          {actions}
        </div>
      )}

      <div
        className={`flex gap-1 px-3 bg-white dark:bg-slate-900 border-x border-t border-slate-200 dark:border-slate-800 ${
          hasToolbar ? "border-t-0" : "rounded-t-xl"
        }`}
      >
        {[
          { key: "bill", label: "Bill" },
          { key: "history", label: historyLabel },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => onTabChange?.(t.key)}
            className={`px-3 py-2 text-xs border-b-2 cursor-pointer ${
              tab === t.key
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-bold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <span className="flex-1" />
        {scan && isBill && (
          <button
            type="button"
            onClick={onToggleScan}
            className="self-center text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-0.5 mb-1 hover:border-blue-500 hover:text-blue-600 cursor-pointer"
          >
            {scanOpen ? "Hide scan" : "Show scan"}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-xl overflow-hidden">
        {isBill ? (
          <div
            className={
              scan && scanOpen
                ? "grid gap-0 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]"
                : "grid grid-cols-1"
            }
          >
            {scan && scanOpen && (
              /* Sticky, so the document stays put while the voucher
                 beside it scrolls. Today it scrolls away exactly when
                 the operator needs to read a figure off it. */
              <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 lg:sticky lg:top-4 lg:self-start min-w-0 p-3">
                {scan}
              </aside>
            )}
            <div className="min-w-0">
              {notice && <div className="px-4 md:px-5 pt-4 md:pt-5">{notice}</div>}
              {children}
            </div>
          </div>
        ) : (
          <div className="p-4 md:p-5">
            <ActivityTimeline organizationId={organizationId} billId={billId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BillRecordLayout;
