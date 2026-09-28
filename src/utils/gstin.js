/**
 * GSTIN helpers — used to cross-check the vendor OCR picked against the
 * GSTIN it read, so a wrong party (bill-to customer, the software that
 * generated the invoice, …) is flagged before a wrong Tally ledger is made.
 *
 * GSTIN = 2-digit state + 10-char PAN + entity no. + "Z" + checksum.
 * For a company / firm / trust, the PAN's 5th character (GSTIN char 7) is
 * the first letter of the business name. For individuals and HUFs it is
 * the surname initial, so no name check is possible there.
 */

const GSTIN_RE = /^[0-9]{2}[A-Z0-9]{13}$/;
const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// PAN 4th character → entity type whose 5th character is the name initial.
const NAME_INITIAL_ENTITY_TYPES = new Set(["C", "F", "T"]);
const NAME_PREFIXES = /^(m\s*\/\s*s\.?|messrs\.?|the|shri|sri|smt\.?)\s+/i;

export const normalizeGstin = (gstin) =>
  String(gstin || "").replace(/\s+/g, "").toUpperCase();

/** Format + checksum check. */
export const isValidGstin = (gstin) => {
  const g = normalizeGstin(gstin);
  if (!GSTIN_RE.test(g)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = CHARSET.indexOf(g[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARSET[(36 - (sum % 36)) % 36] === g[14];
};

/** PAN part of a well-formed GSTIN, else null. */
export const gstinPan = (gstin) => {
  const g = normalizeGstin(gstin);
  return GSTIN_RE.test(g) ? g.slice(2, 12) : null;
};

/**
 * Does the business name fit the GSTIN?
 *   true  — first letter matches the PAN name initial
 *   false — it doesn't (probably the wrong party's name)
 *   null  — can't tell (invalid GSTIN, individual/HUF PAN, no name…)
 */
export const nameMatchesGstin = (name, gstin) => {
  const g = normalizeGstin(gstin);
  if (!isValidGstin(g)) return null;
  if (!NAME_INITIAL_ENTITY_TYPES.has(g[5])) return null;
  const raw = String(name || "").trim();
  if (!raw) return null;
  const initial = g[6];
  // First letter of the name as written, and after dropping "M/s", "The"…
  const candidates = [raw, raw.replace(NAME_PREFIXES, "")]
    .map((n) => (n.match(/[A-Za-z]/) || [""])[0].toUpperCase())
    .filter(Boolean);
  if (!candidates.length) return null;
  return candidates.includes(initial);
};

/** Letter the business name should start with, for messages. */
export const gstinNameInitial = (gstin) => {
  const g = normalizeGstin(gstin);
  return isValidGstin(g) && NAME_INITIAL_ENTITY_TYPES.has(g[5]) ? g[6] : null;
};

const normalizeName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(NAME_PREFIXES, "")
    .replace(/\b(private|pvt|limited|ltd|llp|india|co|company)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Warnings about the OCR'd vendor ("from") on a bill. Returns an array of
 * plain-language strings (empty when nothing looks off).
 */
export const getOcrVendorWarnings = ({ from, to, organization } = {}) => {
  const warnings = [];
  const fromName = String(from?.name || "").trim();
  const fromGst = normalizeGstin(from?.gst_number);
  const toName = String(to?.name || "").trim();
  const toGst = normalizeGstin(to?.gst_number);

  if (fromName && nameMatchesGstin(fromName, fromGst) === false) {
    warnings.push(
      `Vendor name "${fromName}" doesn't match GSTIN ${fromGst} — that GSTIN belongs to a business whose name starts with "${gstinNameInitial(fromGst)}". OCR may have picked the customer or the invoice software's name; check the vendor on the bill before creating it.`,
    );
  }

  const sameAsCustomer =
    (fromGst && toGst && gstinPan(fromGst) && gstinPan(fromGst) === gstinPan(toGst)) ||
    (fromName && toName && normalizeName(fromName) && normalizeName(fromName) === normalizeName(toName));
  if (sameAsCustomer) {
    warnings.push(
      "The vendor and the customer (bill-to) on this bill look like the same party — OCR may have mixed them up.",
    );
  }

  const orgGst = normalizeGstin(organization?.gst_number);
  const orgName = String(organization?.name || "").trim();
  const isOwnOrg =
    (fromGst && orgGst && gstinPan(fromGst) && gstinPan(fromGst) === gstinPan(orgGst)) ||
    (fromName && orgName && normalizeName(fromName) && normalizeName(fromName) === normalizeName(orgName));
  if (isOwnOrg) {
    warnings.push(
      `The vendor looks like your own organisation (${orgName || orgGst}) — OCR probably read the bill-to party as the vendor.`,
    );
  }
  return warnings;
};
