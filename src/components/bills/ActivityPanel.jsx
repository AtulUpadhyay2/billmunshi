import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import ActivityTimeline from "@/components/bills/ActivityTimeline";

/**
 * The bill's history, in a panel that slides in from the right.
 *
 * It used to sit at the bottom of the form in a collapsed `<details>`,
 * which put it below everything an operator scrolls past and meant
 * reading the history cost them their place in the form. A panel keeps
 * the form where it was and closes back onto it.
 *
 * The timeline itself is unchanged — this only decides where it is
 * shown and how it is dismissed.
 */

const ActivityPanel = ({ open, onClose, organizationId, billId }) => {
  // Escape closes, and the page behind does not scroll while it is up:
  // a panel over a long form that scrolls the form underneath reads as
  // a glitch.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      {/* Scrim. Rendered always and faded, so the panel animates in and
          out rather than appearing and vanishing. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-900/20 dark:bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-label="Bill activity"
        aria-hidden={!open}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[26rem] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/50 flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
            <Icon icon="heroicons:clock" className="text-sm" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
              Activity
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Who did what to this bill, newest first.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close activity"
            className="inline-flex w-7 h-7 items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-base" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {/* Mounted only while open, so opening the panel is what
              fetches the timeline rather than every bill page load. */}
          {open && (
            <ActivityTimeline organizationId={organizationId} billId={billId} />
          )}
        </div>
      </aside>
    </>
  );
};

export default ActivityPanel;
