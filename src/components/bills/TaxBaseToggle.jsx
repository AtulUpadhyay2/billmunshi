import React from "react";

/**
 * Whether GST is charged before or after this adjustment.
 *
 * The flag existed on the model, the serializer and the analysis path,
 * and nowhere on screen — so whatever the extraction decided was
 * applied silently and could not be corrected. It is not a cosmetic
 * setting: it moves the value GST is charged on.
 *
 * For a discount, CGST s.15(3)(a) excludes a trade discount from
 * taxable value when it is shown on the invoice, so a bill that
 * discounts the sub-total and then taxes it must be read that way or
 * the input credit is over-claimed. For freight, s.15(2)(c) puts
 * invoice freight *inside* taxable value, so the opposite error
 * under-claims it.
 *
 * Two labelled segments rather than a checkbox: "before GST" and
 * "after GST" are two readings of the document, and a checkbox would
 * make one of them the unlabelled default. Both rows use the same two
 * words — the question is the same one either way, "is GST worked out
 * after this amount, or before it?" — and the longer sentence lives in
 * the tooltip, where it does not wrap the row.
 */
const TaxBaseToggle = ({
  value,
  onChange,
  disabled,
  beforeLabel = "GST After",
  afterLabel = "Post GST",
  beforeTitle,
  afterTitle,
}) => {
  const seg =
    "px-2 py-[3px] text-[10px] font-semibold rounded-full leading-none " +
    "transition-colors disabled:cursor-not-allowed whitespace-nowrap";
  const on = "bg-blue-600 text-white shadow-sm";
  const off =
    "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200";

  return (
    <div
      className="mt-1 inline-flex items-center gap-0.5 p-[2px] rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700"
      role="group"
    >
      <button
        type="button"
        disabled={disabled}
        title={beforeTitle}
        aria-pressed={value === true}
        onClick={() => onChange(true)}
        className={`${seg} ${value ? on : off}`}
      >
        {beforeLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        title={afterTitle}
        aria-pressed={value === false}
        onClick={() => onChange(false)}
        className={`${seg} ${!value ? on : off}`}
      >
        {afterLabel}
      </button>
    </div>
  );
};

export default TaxBaseToggle;
