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
        title: "Fix before verifying",
      }
    : {
        box: "border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40",
        icon: "text-slate-500 dark:text-slate-400",
        head: "text-slate-900 dark:text-slate-200",
        title: "Before you post",
      };

  // One line, not a panel.
  //
  // This was a titled box with a bulleted list under it, and on the
  // common case — a single item, "Please select a customer" — it spent
  // four lines and the full width of the form saying one short thing,
  // pushing the bill itself below the fold. The field it refers to is
  // already outlined in the form, so this only has to name what is
  // missing, not explain it.
  //
  // Everything still gets said: the first two items read inline and
  // the rest collapse into a count, with the full list in the title
  // attribute for anyone who hovers.
  const shown = items.slice(0, 2).join(" · ");
  const rest = items.length - 2;

  return (
    <div
      title={items.join("\n")}
      className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${tone.box}`}
    >
      <Icon
        icon={blocking ? "heroicons:exclamation-triangle" : "heroicons:information-circle"}
        className={`${tone.icon} text-sm shrink-0`}
      />
      <span className={`font-semibold shrink-0 ${tone.head}`}>{tone.title}:</span>
      <span className="min-w-0 truncate text-slate-700 dark:text-slate-300">
        {shown}
        {rest > 0 && (
          <span className="text-slate-500 dark:text-slate-400">
            {" "}+{rest} more
          </span>
        )}
      </span>
    </div>
  );
};

export default BillChecks;
