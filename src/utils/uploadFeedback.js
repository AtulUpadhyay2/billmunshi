import { globalToast } from "@/utils/toast";

/**
 * Toast helpers for bill uploads.
 *
 * The API screens every file before saving it as a draft and reports the ones
 * it refused under `rejected_files`. Without handling that explicitly the user
 * gets a plain success toast and silently ends up with fewer bills than they
 * selected — which is exactly the confusion the screening was meant to remove.
 *
 * Two shapes to handle:
 *   - some files rejected  -> HTTP 201, `rejected_files` alongside the bills
 *   - every file rejected  -> HTTP 400, `rejected_files` in the error body
 */

const describe = (rejected) =>
  rejected.length === 1
    ? rejected[0].message
    : `${rejected.length} files were not bills and were skipped: ` +
      rejected.map((r) => r.file).join(", ");

/**
 * Report a successful upload response, downgrading to a warning when some
 * files were refused. Returns true if anything was actually created.
 */
export const notifyUploadResult = (result, successMessage) => {
  const rejected = result?.rejected_files || [];
  const warnings = result?.upload_warnings || [];
  // API returns `bills_created` or (older shape) an array of bills.
  const created =
    result?.bills_created ??
    (Array.isArray(result?.bills) ? result.bills.length : undefined);

  // All files rejected upfront — hard error.
  if (rejected.length && created === 0) {
    globalToast.error(describe(rejected));
    return false;
  }

  // Classify warnings so we can speak to the user in their language, not
  // in DRF/warning-type jargon. Two shapes come from the backend:
  //   - exact-duplicate (SHA-256 hash match)   -> warning_type === "exact_duplicate"
  //   - filename / size similarity heuristic   -> no warning_type; has `warning` + `existing_bills`
  const isExactDup = (w) => w?.warning_type === "exact_duplicate";
  const isMaybeDup = (w) =>
    !!w &&
    !isExactDup(w) &&
    (Array.isArray(w.existing_bills) || typeof w.warning === "string");
  const exactDupCount = warnings.filter(isExactDup).length;
  const maybeDupCount = warnings.filter(isMaybeDup).length;

  const firstExactName = warnings.find(isExactDup)?.existing_bill_name;
  const firstMaybeName =
    warnings.find(isMaybeDup)?.existing_bills?.[0]?.bill_name;

  const dedupMessage = () => {
    // All warnings are hard dedup (hash) — no new rows.
    if (exactDupCount && !maybeDupCount) {
      return exactDupCount === 1
        ? `This bill is already in the system${
            firstExactName ? ` (as ${firstExactName})` : ""
          }. Nothing new was added — open the existing entry to continue.`
        : `${exactDupCount} of the uploaded files are already in the system (byte-identical to existing bills). Nothing new was added.`;
    }
    // All warnings are soft dedup (filename/size look-alike).
    if (maybeDupCount && !exactDupCount) {
      return maybeDupCount === 1
        ? `This file looks like a duplicate of an existing bill${
            firstMaybeName ? ` (${firstMaybeName})` : ""
          } — review it before analysing.`
        : `${maybeDupCount} uploaded file(s) look like duplicates of existing bills — review them before analysing.`;
    }
    // Mixed — some hash-dedup, some soft.
    return `${warnings.length} uploaded file(s) match existing bills in this workspace. Review them before analysing.`;
  };

  // Nothing new was created. Give a specific, human reason instead of
  // the previous cryptic message the client called out as confusing.
  if (created === 0) {
    if (warnings.length) {
      globalToast.warning(dedupMessage());
    } else {
      // Server accepted the request but saved nothing and gave no reason
      // — almost always a race with the hash-dedup path.
      globalToast.warning(
        "This bill already exists in the system. Nothing new was added — open the existing entry to continue.",
      );
    }
    return false;
  }

  if (rejected.length) {
    globalToast.warning(describe(rejected));
    return true;
  }
  if (warnings.length) {
    // Some created, some just soft-flagged. Success + a helpful hint.
    globalToast.success(successMessage);
    globalToast.info(dedupMessage());
    return true;
  }
  globalToast.success(successMessage);
  return true;
};

/** Report a failed upload, preferring the screening explanation when present. */
export const notifyUploadError = (err, fallbackMessage) => {
  const data = err?.response?.data;
  const rejected = data?.rejected_files || [];

  if (rejected.length) {
    globalToast.error(describe(rejected));
    return;
  }
  globalToast.error(
    data?.message || data?.detail || err?.message || fallbackMessage,
  );
};
