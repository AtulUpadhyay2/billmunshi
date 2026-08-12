import { globalToast } from "@/utils/toast";

/**
 * Handle a Tally bill sync attempt with master-sync guard awareness.
 *
 * If the backend returns HTTP 409 with ``error_code: MASTERS_PENDING``
 * we surface a friendly "waiting for Tally to import N masters"
 * message instead of a generic error, and optionally poll the
 * ``retryFn`` on a short cadence so the sync auto-fires once Tally has
 * caught up.
 *
 * @param {() => Promise<any>} syncFn         The mutation call.
 * @param {Object} opts
 * @param {() => Promise<any>} [opts.retryFn] Called every ``pollMs`` while masters are pending. Return truthy to keep waiting; falsy/throw to stop.
 * @param {number} [opts.pollMs=15000]        Poll cadence in ms (default 15s).
 * @param {number} [opts.maxWaitMs=180000]    Give up after this many ms (default 3 min).
 * @param {(state, meta) => void} [opts.onStateChange] Fires with ``"waiting"``/``"success"``/``"failed"``/``"timeout"``.
 */
function _describePending(pending) {
  if (!Array.isArray(pending) || pending.length === 0) return "";
  return pending
    .slice(0, 3)
    .map((p) => `${p?.name || p?.id || "?"} (${p?.type || "master"})`)
    .join(", ") + (pending.length > 3 ? `, +${pending.length - 3} more` : "");
}

export async function tallySyncWithMastersGuard(syncFn, opts = {}) {
  const {
    retryFn,
    // Shorter cadence so status updates feel responsive.
    pollMs = 10000,
    // Cap total wait tight enough that the user isn't stuck watching a
    // spinner if Tally TCP isn't running at all. Was 3 min — the user
    // reported the sync spinner just hung.
    maxWaitMs = 45000,
    onStateChange,
  } = opts;

  const start = performance.now();
  let waitToastShown = false;

  const attempt = async () => {
    try {
      const result = await syncFn();
      onStateChange?.("success", { result });
      return { status: "success", result };
    } catch (err) {
      const httpStatus = err?.status || err?.response?.status;
      const errorCode = err?.data?.error_code || err?.response?.data?.error_code;
      const pending = err?.data?.pending_masters || err?.response?.data?.pending_masters || [];

      if (httpStatus === 409 && errorCode === "MASTERS_PENDING") {
        const elapsed = performance.now() - start;
        const desc = _describePending(pending);

        if (elapsed >= maxWaitMs) {
          onStateChange?.("timeout", { pending });
          globalToast.error(
            `Sync blocked — Tally hasn't imported ${pending.length} master` +
              `${pending.length > 1 ? "s" : ""}${desc ? ": " + desc : ""}. ` +
              "Make sure the Tally TCP bridge is running, then retry.",
          );
          return { status: "timeout", pending };
        }

        onStateChange?.("waiting", { pending, elapsed });
        if (!waitToastShown) {
          globalToast.info(
            `Waiting for Tally to import ${pending.length} master` +
              `${pending.length > 1 ? "s" : ""}${desc ? ": " + desc : ""}…`,
          );
          waitToastShown = true;
        }

        if (typeof retryFn !== "function") {
          return { status: "waiting", pending };
        }

        await new Promise((r) => setTimeout(r, pollMs));
        const keepWaiting = await retryFn().catch(() => false);
        if (!keepWaiting) return { status: "waiting", pending };
        return attempt();
      }

      onStateChange?.("failed", { err });
      throw err;
    }
  };

  return attempt();
}
