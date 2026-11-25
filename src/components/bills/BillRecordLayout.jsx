import React from "react";
import { Icon } from "@iconify/react";

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
  // Content
  notice,
  scan,
  scanOpen = true,
  onToggleScan,
  children,
}) => {
  const hasToolbar = Boolean(backTo || position || onPrev || onNext || actions);

  const navBtn =
    "inline-flex items-center justify-center h-7 w-7 rounded-md border " +
    "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 " +
    "hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 " +
    "disabled:cursor-not-allowed cursor-pointer";

  return (
    <div>
      {hasToolbar && (
        <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-xl px-3 py-1.5">
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
          {/* The scan toggle used to sit on a tab row of its own. With
              the tabs gone it moves in here — on the left, because the
              right of this bar is where the page puts Verify and Sync,
              and a row that ends in two primary actions pushes anything
              after them off the edge on a narrow window. */}
          {scan && (
            <button
              type="button"
              onClick={onToggleScan}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 hover:border-blue-500 hover:text-blue-600 cursor-pointer whitespace-nowrap"
            >
              {scanOpen ? "Hide scan" : "Show scan"}
            </button>
          )}
          <span className="flex-1 min-w-[8px]" />
          {actions}
        </div>
      )}

      {/* The Bill / Comments & History tabs are gone. History was
          reachable two ways — this tab and the clock button in the
          toolbar, which opens ActivityPanel over the record — and the
          tab cost a whole row of chrome to duplicate a control sitting
          an inch above it. The slide-over won: it keeps the voucher on
          screen behind it, which the tab did not. */}
      <div
        className={`bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-xl overflow-hidden ${
          hasToolbar ? "" : "border-t rounded-t-xl"
        }`}
      >
        {(
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
              <aside className="border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 lg:sticky lg:top-4 lg:self-start min-w-0 p-2.5">
                {scan}
              </aside>
            )}
            <div className="min-w-0">
              {notice && <div className="px-4 md:px-5 pt-3 md:pt-3.5">{notice}</div>}
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillRecordLayout;
