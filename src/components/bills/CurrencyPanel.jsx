import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import CurrencyBox from "@/components/bills/CurrencyBox";

/**
 * The currency control, behind a toolbar button.
 *
 * It used to sit inline above the checks, which cost every bill a strip
 * of screen for a setting almost none of them change — the overwhelming
 * majority are rupee bills. Moved beside Activity, it stays one click
 * away and the button carries the current currency, so a foreign-currency
 * bill still announces itself without a row of its own.
 *
 * Same panel chrome as ActivityPanel on purpose: two toolbar buttons that
 * open two different-looking surfaces would read as two different kinds
 * of thing.
 */
const CurrencyPanel = ({ open, onClose, ...boxProps }) => {
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
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-900/20 dark:bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-label="Currency and exchange rate"
        aria-hidden={!open}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[26rem] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-black/50 flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
            <Icon icon="heroicons:banknotes" className="text-sm" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
              Currency
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              The rate this voucher posts at, frozen on save.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close currency"
            className="inline-flex w-7 h-7 items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-base" />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          {open && <CurrencyBox {...boxProps} />}
        </div>
      </aside>
    </>
  );
};

export default CurrencyPanel;
