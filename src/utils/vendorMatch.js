/**
 * Client Correction 50: pick the vendor ledger from the dropdown options
 * that matches the bill, instead of leaving it empty when the vendor is
 * already in the list (e.g. bill says "ASHISH FURNISHERS", ledger is
 * "Ashish Furnishers").
 *
 * Deliberately strict so it never fills in the WRONG vendor:
 *   1. same ledger id (a saved / backend-matched vendor)
 *   2. same 15-char GSTIN
 *   3. same name, ignoring case, punctuation, extra spaces and "M/s"
 * No fuzzy / partial matching.
 */

export const normalizeVendorName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/^\s*(m\s*\/\s*s|messrs)\.?\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeGst = (gst) =>
  String(gst || "")
    .replace(/\s+/g, "")
    .toUpperCase();

export const findVendorOption = (options, { id, name, gst } = {}) => {
  if (!Array.isArray(options) || !options.length) return null;

  if (id) {
    const byId = options.find((v) => v.id === id);
    if (byId) return byId;
  }

  const wanted = normalizeVendorName(name);
  const gstin = normalizeGst(gst);
  if (gstin.length === 15) {
    const byGst = options.filter((v) => normalizeGst(v.gst_in) === gstin);
    // Several ledgers can share a GSTIN ("X", "X (Old)") — prefer the one
    // whose name also matches; otherwise only trust a unique GSTIN.
    const byGstAndName = wanted
      ? byGst.find((v) => normalizeVendorName(v.name) === wanted)
      : null;
    if (byGstAndName) return byGstAndName;
    if (byGst.length === 1) return byGst[0];
  }

  if (wanted) {
    // A same-name ledger registered under a DIFFERENT business (other PAN)
    // is not this vendor — e.g. OCR put the customer's name next to the
    // supplier's GSTIN. Same PAN in another state is still fine.
    const billPan = gstin.length === 15 ? gstin.slice(2, 12) : "";
    const byName = options.find((v) => {
      if (normalizeVendorName(v.name) !== wanted) return false;
      const ledgerGst = normalizeGst(v.gst_in);
      return !(billPan && ledgerGst.length === 15 && ledgerGst.slice(2, 12) !== billPan);
    });
    if (byName) return byName;
  }

  return null;
};
