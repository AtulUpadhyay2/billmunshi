import React from "react";

/**
 * The pieces every voucher page is drawn from.
 *
 * They started as copies inside the vendor bill page. Purchase, Sales
 * and Journal had already drifted into three different vocabularies
 * for the same four things — "Bill from" against "Bill Information",
 * "Line items" against "Credit / Debit items" — because each page kept
 * its own markup. Keeping the parts here is what stops that happening
 * again: a change to how a field reads is made once.
 */

/**
 * A field that looks like text until it is reached for.
 *
 * The grid is a document, not a form, so a wall of boxes would be the
 * wrong reading of it. The border appears on hover and focus, which
 * still says plainly which figures can be corrected.
 */
export const FLAT_FIELD =
  "w-full bg-transparent border border-transparent rounded px-1.5 -ml-1.5 py-0.5 " +
  "text-[13px] font-semibold text-slate-900 dark:text-white " +
  "placeholder:font-normal placeholder:italic placeholder:text-slate-400 " +
  "hover:border-slate-300 dark:hover:border-slate-600 " +
  "focus:border-blue-500 focus:outline-none " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

/**
 * One labelled cell of the voucher's field grid.
 *
 * The hint is the label's tooltip rather than a line of its own: a
 * line under every cell cost the grid a whole extra row of height for
 * text that is read once and then never again. An error still gets a
 * line, because a rejection nobody sees is a rejection that did not
 * happen.
 */
export const FieldCell = ({ label, hint, error, children }) => (
  <div className="bg-white dark:bg-slate-900 px-2.5 py-1.5 min-w-0">
    <span
      title={hint || undefined}
      className={`block text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400 mb-1 ${
        hint ? "cursor-help" : ""
      }`}
    >
      {label}
      {hint && <span aria-hidden="true"> ·</span>}
    </span>
    {children}
    {error && (
      <p className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
        {error}
      </p>
    )}
  </div>
);

/**
 * The grid those cells sit in. Two rows of three at desktop width.
 *
 * Square corners, and no ``overflow-hidden``. The dropdowns a cell can
 * hold (currency, payment mode) render their panel as an ordinary
 * absolutely-positioned child, not a portal — so a clipping ancestor
 * cuts them off and no z-index can rescue them. Rounding the grid
 * needed that clip to hide the corner cells' own square backgrounds,
 * so the rounding goes instead. It reads as what it is: a table.
 */
export const FieldGrid = ({ children }) => (
  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
    {children}
  </div>
);

/**
 * The party picker at the head of a voucher, dressed as its title.
 *
 * It is the same control as every other ledger dropdown — it just does
 * not announce itself as one until the operator reaches for it,
 * because on a bill the party's name is a heading first. It used to be
 * printed as a heading *and* offered again as a dropdown below: the
 * same fact twice, in two different shapes.
 */
export const PARTY_TITLE_SKIN =
  "w-full flex items-center text-left rounded-md px-1.5 -ml-1.5 py-0.5 " +
  "text-lg md:text-xl font-semibold tracking-tight " +
  "text-slate-900 dark:text-white " +
  "bg-transparent border border-transparent " +
  "hover:border-slate-300 dark:hover:border-slate-600 " +
  "focus:border-blue-500 focus:outline-none " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

/**
 * One line of the totals stack.
 *
 * The stack reads the way a printed voucher does — sub-total, then
 * whatever is taken before GST, then the taxable value, then the tax,
 * then what is applied after — and ends with the two rows that answer
 * the only question left: does this agree with the paper in front of
 * the operator.
 *
 * Each line can carry the ledger it will post to and an editable
 * amount, because the figure and where it goes are one decision. They
 * used to be two: a table to set them and a summary below to read
 * them, with the same figures printed in both.
 */
export const TotalLine = ({
  label,
  rate,
  note,
  control,
  extra,
  amount,
  value,
  cur,
  grand,
  compare,
  tone,
}) => (
  <div
    className={`flex items-center gap-3 ${
      grand
        ? "border-t-2 border-slate-300 dark:border-slate-600 mt-2 pt-3"
        : compare
          ? "border-t border-dashed border-slate-300 dark:border-slate-600 mt-1.5 pt-2 text-[11px]"
          : "py-1.5"
    }`}
  >
    <span
      className={`shrink-0 ${
        grand
          ? "text-[13px] font-semibold text-slate-900 dark:text-white"
          : "text-[13px] text-slate-600 dark:text-slate-400"
      } ${control ? "w-[132px]" : ""}`}
    >
      {label}
      {/* What the tax was worked out on, beside the tax itself. An
          operator checking a bill against its print needs the base and
          the rate as much as the amount; they were only derivable by
          reading three other lines. */}
      {rate && (
        <span className="block font-mono text-[11px] text-slate-400 dark:text-slate-500">
          {rate}
        </span>
      )}
      {note && (
        <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">
          ({note})
        </span>
      )}
    </span>

    {control && <span className="flex-1 min-w-0">{control}</span>}
    {extra && <span className="shrink-0">{extra}</span>}
    {!control && <span className="flex-1" />}

    <span
      className={`shrink-0 text-right font-mono tabular-nums ${
        amount ? "w-[104px]" : ""
      } ${
        grand
          ? "text-[15px] font-semibold text-slate-900 dark:text-white"
          : tone === "bad"
            ? "text-[13px] font-semibold text-rose-600 dark:text-rose-400"
            : tone === "ok"
              ? "text-[13px] font-semibold text-emerald-600 dark:text-emerald-400"
              : "text-[13px] text-slate-800 dark:text-slate-200"
      }`}
    >
      {amount || (
        <>
          {cur}
          {value}
        </>
      )}
    </span>
  </div>
);

/** The amount input used on every editable totals row. */
export const TOTALS_AMOUNT =
  "w-full px-2 py-1 text-right text-[13px] font-mono font-semibold " +
  "text-slate-900 dark:text-white bg-white dark:bg-slate-900 " +
  "border border-slate-200 dark:border-slate-700 rounded-md " +
  "focus:outline-none focus:border-blue-500 " +
  "disabled:opacity-60 disabled:cursor-not-allowed " +
  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none " +
  "[&::-webkit-inner-spin-button]:appearance-none";

/**
 * A switch that decides how the lines post, with its label.
 *
 * Used for the three that have a plain default and an exception —
 * lines are normally taxed on top, the supplier normally charges the
 * GST, items are normally kept separate. Where neither reading is the
 * default, the page uses the two-segment TaxBaseToggle instead, so
 * that an unlabelled "off" never makes the choice silently.
 */
export const SwitchPill = ({ label, title, children }) => (
  <div className="flex items-center gap-2 h-8 px-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
    <span
      title={title}
      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
    >
      {label}
    </span>
    {children}
  </div>
);
