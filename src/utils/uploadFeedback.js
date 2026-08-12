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

  // Nothing was created AND a warning explains why (usually
  // exact-duplicate hash short-circuit). Surface the warning instead of
  // the misleading "uploaded" success toast.
  if (created === 0 && warnings.length) {
    const dupCount = warnings.filter(
      (w) => w?.warning_type === "exact_duplicate",
    ).length;
    if (dupCount === warnings.length) {
      const first = warnings[0];
      globalToast.warning(
        first?.message ||
          `${dupCount} file${dupCount > 1 ? "s were" : " was"} identical to an existing bill and skipped.`,
      );
    } else {
      globalToast.warning(
        warnings[0]?.message ||
          "Upload accepted but no new bills were created.",
      );
    }
    return false;
  }

  if (rejected.length) {
    globalToast.warning(describe(rejected));
    return true;
  }
  if (warnings.length) {
    // Some created, some warned — success + a heads-up.
    globalToast.success(successMessage);
    globalToast.info(
      warnings[0]?.message ||
        `${warnings.length} file${warnings.length > 1 ? "s" : ""} had a warning; check the list.`,
    );
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
