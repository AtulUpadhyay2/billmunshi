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

  if (rejected.length && !result?.bills_created) {
    globalToast.error(describe(rejected));
    return false;
  }
  if (rejected.length) {
    globalToast.warning(describe(rejected));
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
