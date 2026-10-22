/**
 * GST slabs offered in every rate dropdown and in the Tally setup
 * rate → ledger mapping.
 *
 * GST 2.0 (in force from 22 Sep 2025) removed the 12% and 28% slabs and
 * added 40%. A bill dated before that — or one already saved — can still
 * carry 12% / 28%. Those values are kept exactly as they are (see
 * `withCurrentRate`), so an old bill never shows one rate while saving
 * another.
 */
export const GST_RATE_PERCENTS = [0, 5, 18, 40];

/** Slabs that no longer exist, still accepted on older bills. */
export const LEGACY_GST_RATE_PERCENTS = [12, 28];

/** "12%" / "28.00" → true. */
export const isLegacyGstRate = (value) => {
  const m = String(value ?? "").match(/^\s*([\d.]+)\s*%?\s*$/);
  return !!m && LEGACY_GST_RATE_PERCENTS.includes(Number(m[1]));
};

/**
 * Option label: "12%" → "12% (old)", anything else unchanged. Kept short —
 * the rate columns these selects sit in are ~80px wide.
 */
export const gstRateLabel = (value) =>
  isLegacyGstRate(value) ? `${value} (old)` : String(value);

/**
 * `options` plus `current` when a saved value is not one of them — a
 * controlled <select> would otherwise display the first option while the
 * state (and the save) still holds the old value.
 */
export const withCurrentRate = (options, current) =>
  current && !options.includes(current) ? [...options, current] : options;
