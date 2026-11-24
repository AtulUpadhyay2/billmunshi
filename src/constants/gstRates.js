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

/**
 * The day GST 2.0 came into force. Bills dated before it were charged
 * under the old slabs and still have to be entered that way.
 */
export const GST_2_0_START = "2025-09-22";

/** True when a bill of this date predates GST 2.0. */
export const isPreGst2Bill = (billDate) => {
  if (!billDate) return false;
  const d = new Date(billDate);
  return !Number.isNaN(d.getTime()) && d < new Date(GST_2_0_START);
};

/**
 * The rate options a given bill may legitimately use.
 *
 * ``withCurrentRate`` alone was not enough. It adds an old slab only to
 * the row that already holds one, so on a pre-GST-2.0 bill with two 12%
 * lines — one read by OCR and one not — the operator could see "12%
 * (old)" on the first row and had no way to set the same rate on the
 * second. The bill was from 16 Aug 2025; 12% was simply the rate.
 *
 * So the bill's own date decides, not today's date: a bill from before
 * 22 Sep 2025 offers 12% and 28% as well, and a bill from after it does
 * not — which is what keeps a dead slab off a current invoice.
 *
 * Numeric slabs stay in ascending order (0, 5, 12, 18, 28, 40) and the
 * word options ("Exempted", "N/A") keep their place at the end.
 */
export const gstRateOptionsFor = (options, current, billDate) => {
  const numeric = (v) => {
    const m = String(v ?? "").match(/^\s*([\d.]+)\s*%?\s*$/);
    return m ? Number(m[1]) : null;
  };

  let out = [...options];
  if (isPreGst2Bill(billDate)) {
    for (const rate of LEGACY_GST_RATE_PERCENTS) {
      const label = `${rate}%`;
      if (!out.includes(label)) out.push(label);
    }
    const nums = out.filter((o) => numeric(o) !== null)
      .sort((a, b) => numeric(a) - numeric(b));
    const words = out.filter((o) => numeric(o) === null);
    out = [...nums, ...words];
  }
  return withCurrentRate(out, current);
};
