/**
 * The symbol to print in front of a bill's figures.
 *
 * The five Tally detail pages hardcoded `₹` in roughly twenty places
 * each. Most bills are in rupees so it read correctly, but the moment a
 * bill carries a foreign currency — which these pages support, and
 * which the exchange-rate box exists for — every total on the screen
 * claimed to be rupees while holding dollars. A figure labelled with
 * the wrong currency is worse than one with no label at all.
 *
 * Only the currencies the backend accepts are listed; anything else
 * falls back to the ISO code plus a space, which is unambiguous even
 * when it is not pretty. An absent currency means the bill predates the
 * currency field, and those are rupees.
 */
const SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  AED: "AED ",
  SGD: "S$",
};

export const currencySymbol = (code) => {
  if (!code) return SYMBOLS.INR;
  const key = String(code).trim().toUpperCase();
  return SYMBOLS[key] || `${key} `;
};

export default currencySymbol;
