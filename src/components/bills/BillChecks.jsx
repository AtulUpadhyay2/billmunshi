import React from "react";
import { Icon } from "@iconify/react";

/**
 * What the Verify button is waiting on, and nothing else.
 *
 * Four banners used to stack above the form — the server's arithmetic
 * checks, the OCR totals check, the line rate/quantity corrections, and
 * this list. Two of them reported the same arithmetic in different
 * words, and between them they buried the only item an operator could
 * actually act on.
 *
 * So only the blocking list is shown. The advisory checks still run and
 * are still stored on the bill; they are simply not worth a banner,
 * because an operator who cannot verify until they fix three named
 * fields does not also need to be told the totals look odd — they are
 * about to read every figure anyway.
 */
const BillChecks = ({ blockers = [], isVerified = false }) => {
  const list = Array.isArray(blockers) ? blockers : [];
  if (isVerified || list.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/25 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Icon
          icon="heroicons:exclamation-triangle"
          className="text-amber-600 dark:text-amber-400 text-base shrink-0 mt-0.5"
        />
        <div className="min-w-0 text-xs leading-relaxed">
          <p className="font-bold text-amber-900 dark:text-amber-300">
            Fix before verifying
          </p>
          <ul className="mt-1 space-y-0.5 text-slate-700 dark:text-slate-300">
            {list.slice(0, 6).map((err, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-amber-600 dark:text-amber-500">·</span>
                <span className="break-words">{err}</span>
              </li>
            ))}
          </ul>
          {list.length > 6 && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              …and {list.length - 6} more.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillChecks;
