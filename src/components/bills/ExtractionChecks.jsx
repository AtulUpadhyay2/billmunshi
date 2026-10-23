import React from "react";
import { Icon } from "@iconify/react";

/**
 * Findings from the server-side arithmetic and identity checks, which run
 * on every bill whichever model read it.
 *
 * Advisory, never blocking. The checks catch a reading that does not add
 * up — a GSTIN that fails its check digit, lines that do not sum to the
 * total, IGST sitting alongside CGST — and the operator decides what to
 * do about it. Deciding on their behalf that a bill is wrong is how a
 * correct bill gets stuck.
 */

// A missing field is worth saying once, quietly. A number that disagrees
// with another number on the same page is worth stopping for.
const QUIET = new Set(["no_invoice_number", "no_date", "no_items"]);

const ACTION = {
  continued_elsewhere: "Upload the remaining pages and analyse again.",
  gstin_checksum: "Check the GSTIN against the bill before verifying.",
  same_gstin: "One of the two parties has been read from the wrong block.",
  line_arithmetic: "Check the rate and quantity on those lines.",
  total_mismatch: "Check the line amounts and the tax against the bill.",
  igst_with_cgst_sgst: "Clear whichever does not belong on this bill.",
  cgst_sgst_unequal: "Check both figures against the bill.",
};

const ExtractionChecks = ({ findings }) => {
  const list = Array.isArray(findings) ? findings : [];
  if (list.length === 0) return null;

  const serious = list.filter((f) => !QUIET.has(f.code));
  const quiet = list.filter((f) => QUIET.has(f.code));

  // All that happened is that some fields came out empty — the form
  // already shows that, so one line is enough.
  if (serious.length === 0) {
    return (
      <div className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
        <Icon
          icon="heroicons:information-circle"
          className="text-slate-500 dark:text-slate-400 text-lg shrink-0 mt-0.5"
        />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {quiet.map((f) => f.message).join(" ")} Fill them in before verifying.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
      <Icon
        icon="heroicons:exclamation-triangle"
        className="text-amber-600 dark:text-amber-400 text-lg shrink-0 mt-0.5"
      />
      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed min-w-0">
        <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
          {serious.length === 1
            ? "This reading does not add up"
            : `${serious.length} things in this reading do not add up`}
        </p>
        <ul className="space-y-1">
          {serious.map((f, i) => (
            <li key={`${f.code}-${i}`} className="break-words">
              {f.message}
              {ACTION[f.code] && (
                <span className="text-slate-500 dark:text-slate-400">
                  {" "}
                  {ACTION[f.code]}
                </span>
              )}
            </li>
          ))}
        </ul>
        {quiet.length > 0 && (
          <p className="mt-1.5 text-slate-500 dark:text-slate-400">
            {quiet.map((f) => f.message).join(" ")}
          </p>
        )}
        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          These are checks on the numbers, not a block — you can still verify
          the bill once you have looked.
        </p>
      </div>
    </div>
  );
};

export default ExtractionChecks;
