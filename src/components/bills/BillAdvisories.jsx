import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import { getOcrVendorWarnings } from "@/utils/gstin";

/**
 * Everything the bill has to say that is not a missing mandatory field.
 *
 * Three things used to be scattered: an OCR party warning tucked under
 * the customer picker, a "no tax ledger mapped" note wedged above the
 * totals, and the server's own arithmetic checks in a banner across the
 * top of the form. Each pushed the bill further down the page, and the
 * one an operator could act on was whichever happened to be first.
 *
 * They gather here, in the space beside the totals that was empty on
 * every voucher — next to the figures they are usually about.
 *
 * Nothing about a blank mandatory field belongs in here. Those are said
 * by the field itself, which is outlined until it is filled: a message
 * repeating what the outline already shows is a second thing to read
 * and a second thing to dismiss.
 */

const TONES = {
  warn: {
    box: "border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30",
    icon: "text-amber-600 dark:text-amber-400",
    head: "text-amber-900 dark:text-amber-300",
    glyph: "heroicons:exclamation-triangle",
  },
  info: {
    box: "border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40",
    icon: "text-slate-500 dark:text-slate-400",
    head: "text-slate-900 dark:text-slate-200",
    glyph: "heroicons:information-circle",
  },
};

const Advisory = ({ tone = "info", title, children }) => {
  const t = TONES[tone] || TONES.info;
  return (
    <div className={`rounded-lg border px-3 py-2 text-[12px] ${t.box}`}>
      <div className="flex items-start gap-2">
        <Icon icon={t.glyph} className={`${t.icon} text-sm shrink-0 mt-0.5`} />
        <div className="min-w-0">
          {title && (
            <p className={`font-semibold ${t.head}`}>{title}</p>
          )}
          <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const BillAdvisories = ({
  analysedData,
  organization,
  // Rates with no tax ledger mapped, e.g. ["18%"].
  unmapped = [],
  // The server's arithmetic checks, written onto the bill at analysis.
  checks = [],
  // Whether the figures ON SCREEN currently agree with the bill's own
  // stated total. The checks are computed once, at analysis, from the
  // data as extracted — so flipping "Lines include GST", or correcting
  // a line, leaves a stored finding that contradicts the live total
  // sitting an inch away from it. A client reported exactly that: the
  // advisory said the lines plus tax came to 5,174.80 against a stated
  // 4,489.90, while the totals panel beside it read "matches the bill".
  liveTotalsAgree = false,
  className = "",
}) => {
  const ocr = useMemo(
    () =>
      getOcrVendorWarnings({
        from: analysedData?.from,
        to: analysedData?.to,
        organization,
      }),
    [analysedData?.from, analysedData?.to, organization],
  );

  // Findings the live figures have already answered are dropped rather
  // than shown and disbelieved.
  const STALE_WHEN_TOTALS_AGREE = new Set(["total_mismatch"]);
  const notes = (Array.isArray(checks) ? checks : [])
    .filter(
      (c) =>
        !(
          liveTotalsAgree &&
          typeof c === "object" &&
          STALE_WHEN_TOTALS_AGREE.has(c?.code)
        ),
    )
    .map((c) => (typeof c === "string" ? c : c?.message))
    .filter(Boolean);

  if (!ocr.length && !unmapped.length && !notes.length) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {ocr.length > 0 && (
        <Advisory
          tone="warn"
          title="Check the party"
        >
          <div className="space-y-1">
            {ocr.map((warning) => (
              <p key={warning} className="break-words">
                {warning}
              </p>
            ))}
          </div>
        </Advisory>
      )}

      {unmapped.length > 0 && (
        <Advisory tone="warn" title="No tax ledger mapped">
          {unmapped.join(", ")} — set it in{" "}
          <span className="font-semibold">Tally setup → Tax &amp; Adjustments</span>.
        </Advisory>
      )}

      {notes.length > 0 && (
        <Advisory tone="info" title="Before you post">
          <ul className="space-y-0.5">
            {notes.slice(0, 6).map((note, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="break-words">{note}</span>
              </li>
            ))}
          </ul>
          {notes.length > 6 && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              …and {notes.length - 6} more.
            </p>
          )}
        </Advisory>
      )}
    </div>
  );
};

export default BillAdvisories;
