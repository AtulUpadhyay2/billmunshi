/**
 * What GST is actually charged on.
 *
 * The sum of the line amounts is not always the taxable value. Two
 * things on the invoice move it, and the bill itself says which:
 *   - a trade discount shown on the invoice is excluded from taxable
 *     value (CGST s.15(3)(a)), so the base is lower than the lines;
 *   - freight charged on the invoice is part of it (s.15(2)(c)), so
 *     the base is higher.
 *
 * Returns null when neither applies. That is the common bill, where a
 * line's taxable value is its own amount and nothing is pro-rated.
 *
 * Mirrors ``taxable_base`` in apps/common/services/line_gst.py — the
 * two have to agree, because the frontend's figures are what verify
 * stores and the backend's are what a re-analysis produces.
 */
export const resolveTaxableBase = ({
  gross,
  discount,
  freight,
  discountBeforeTax,
  freightTaxable,
}) => {
  if (!discountBeforeTax && !freightTaxable) return null;
  let base = parseFloat(gross) || 0;
  // The discount is held as a negative amount on the bill form, so
  // take its magnitude rather than trusting the sign.
  if (discountBeforeTax) base -= Math.abs(parseFloat(discount) || 0);
  if (freightTaxable) base += Math.abs(parseFloat(freight) || 0);
  return Math.max(base, 0);
};

/** A line's share of the taxable base, by its share of the lines. */
export const lineTaxableValue = (amount, gross, base) => {
  const amt = Math.max(parseFloat(amount) || 0, 0);
  if (base === null || base === undefined || !(gross > 0)) return amt;
  return (amt / gross) * base;
};

/** Sum of the line amounts the base is spread across. */
export const grossOfLines = (products) =>
  (products || []).reduce(
    (sum, p) => sum + Math.max(parseFloat(p.amount) || 0, 0),
    0,
  );

/** Numeric GST rate out of "18%" / "5" / "Exempted"; 0 when unreadable. */
export const rateOf = (rateText) => {
  const m = rateText ? String(rateText).match(/([\d.]+)/) : null;
  return m ? Number(m[1]) : 0;
};

/**
 * Tax carried by one line's share of the base.
 *
 * With *inclusive*, the share already holds its tax — an MRP-priced
 * retail or pharmacy line — so the rate is applied the other way
 * round: `v x r / (100 + r)`, not `v x r / 100`. Charging the usual
 * way on such a line taxes an amount that was taxed once already.
 */
export const taxOnLine = (taxableValue, rateText, inclusive) => {
  const value = parseFloat(taxableValue) || 0;
  const rate = rateOf(rateText);
  if (!rate || !value) return 0;
  return inclusive
    ? (value * rate) / (100 + rate)
    : (value * rate) / 100;
};

/** What a line is taxed on, once its own tax is out of the way. */
export const netOfTax = (taxableValue, rateText, inclusive) => {
  const value = parseFloat(taxableValue) || 0;
  return inclusive ? value - taxOnLine(value, rateText, inclusive) : value;
};
