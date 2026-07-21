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
export async function tallySyncWithMastersGuard(syncFn, opts = {}) {
  const {
    retryFn,
    pollMs = 15000,
    maxWaitMs = 180000,
    onStateChange,
  } = opts;

  const start = performance.now();

  const attempt = async () => {
    try {
      const result = await syncFn();
      onStateChange?.("success", { result });
      return { status: "success", result };
    } catch (err) {
      // ApiClient's custom error preserves .status and .data
      const httpStatus = err?.status || err?.response?.status;
      const errorCode = err?.data?.error_code || err?.response?.data?.error_code;
      const pending = err?.data?.pending_masters || err?.response?.data?.pending_masters || [];

      if (httpStatus === 409 && errorCode === "MASTERS_PENDING") {
        const elapsed = performance.now() - start;
        if (elapsed >= maxWaitMs) {
          onStateChange?.("timeout", { pending });
          globalToast.error(
            `Sync timed out: ${pending.length} master(s) still not imported by Tally. ` +
              `Check the Tally TCP is running and retry manually.`,
          );
          return { status: "timeout", pending };
        }

        onStateChange?.("waiting", { pending, elapsed });
        globalToast(
          `Waiting for Tally to import ${pending.length} new master${pending.length > 1 ? "s" : ""}…`,
          { icon: "⏳" },
        );

        // If no retryFn, we can't do anything but return.
        if (typeof retryFn !== "function") {
          return { status: "waiting", pending };
        }

        await new Promise((r) => setTimeout(r, pollMs));
        const keepWaiting = await retryFn().catch(() => false);
        if (!keepWaiting) return { status: "waiting", pending };
        return attempt(); // recurse — will re-fire syncFn
      }

      // Any other error — bubble to caller.
      onStateChange?.("failed", { err });
      throw err;
    }
  };

  return attempt();
}
