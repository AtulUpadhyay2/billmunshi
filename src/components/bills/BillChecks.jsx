import React from "react";
import { Icon } from "@iconify/react";

/**
 * What the Verify button is waiting on — and, when nothing is, what the
 * server noticed about the bill's own arithmetic.
 *
 * Four banners used to stack above the form: the server's arithmetic
 * checks, the OCR totals check, the line rate/quantity corrections, and
 * the blocking list. Two of them reported the same arithmetic in
 * different words, and between them they buried the only item an
 * operator could act on. So everything except the blocking list was
 * removed, on the reasoning that someone who cannot verify until they
 * fix three named fields is about to read every figure anyway.
 *
 * That reasoning has a hole, and a real client bill fell through it. On
 * a bill with **no** blockers the advisory check is the only signal
 * there is, and suppressing it means the operator is told nothing at
 * all. One such bill was verified with line items plus tax coming to
 * ₹415.97 against a stated total of ₹397.05 — the server had detected
 * it, written `total_mismatch` onto the bill, and shown no one.
 *
 * So the rule is now: blockers win and are shown alone; with no
 * blockers, the server's checks are shown, as advice rather than an
 * error. Still never two banners.
 *
 * Shown after verifying too. The figures are what will post to Tally,
 * and "already verified" is not a reason to stop saying they do not add
 * up.
 */

const BillChecks = ({ blockers = [], isVerified = false, checks = [] }) => {
  const list = Array.isArray(blockers) ? blockers : [];
  const advisories = (Array.isArray(checks) ? checks : [])
    .map((c) => (typeof c === "string" ? c : c?.message))
    .filter(Boolean);

  const blocking = !isVerified && list.length > 0;
  if (!blocking && advisories.length === 0) return null;

  const items = blocking ? list : advisories;
  const tone = blocking
    ? {
        box: "border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/25",
        icon: "text-amber-600 dark:text-amber-400",
        head: "text-amber-900 dark:text-amber-300",
        dot: "text-amber-600 dark:text-amber-500",
        title: "Fix before verifying",
      }
    : {
        box: "border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40",
        icon: "text-slate-500 dark:text-slate-400",
        head: "text-slate-900 dark:text-slate-200",
        dot: "text-slate-400 dark:text-slate-500",
        title: "Worth a look before this posts",
      };

  return (
    <div className={`mb-5 rounded-xl border px-4 py-3 ${tone.box}`}>
      <div className="flex items-start gap-2.5">
        <Icon
          icon={blocking ? "heroicons:exclamation-triangle" : "heroicons:information-circle"}
          className={`${tone.icon} text-base shrink-0 mt-0.5`}
        />
        <div className="min-w-0 text-xs leading-relaxed">
          <p className={`font-bold ${tone.head}`}>{tone.title}</p>
          <ul className="mt-1 space-y-0.5 text-slate-700 dark:text-slate-300">
            {items.slice(0, 6).map((entry, i) => (
              <li key={i} className="flex gap-1.5">
                <span className={tone.dot}>·</span>
                <span className="break-words">{entry}</span>
              </li>
            ))}
          </ul>
          {items.length > 6 && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              …and {items.length - 6} more.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillChecks;
