import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import BrandLogo from "@/components/BrandLogo";

/**
 * Shows a maintenance screen instead of the app while the backend is
 * down for work.
 *
 * Two things drive it, and both are needed:
 *
 *  - a poll of the public `/maintenance/` endpoint, so a client sitting
 *    on an idle page finds out rather than discovering it on their next
 *    click;
 *  - the 503 that `apiClient` reports, so the very first failed request
 *    switches the screen immediately instead of waiting for the poll.
 *
 * The endpoint is deliberately exempt from maintenance on the server —
 * a status endpoint that goes down with the thing it reports on tells
 * nobody anything.
 *
 * Staff accounts are never blocked by the backend, so for them the API
 * keeps answering and this screen never appears. That is how a release
 * gets checked against production before clients are let back in.
 */

const MaintenanceContext = createContext({ isDown: false, state: null });

export const useMaintenance = () => useContext(MaintenanceContext);

/** Called by apiClient when a request comes back 503 with maintenance: true. */
let notifyMaintenance = () => {};
export const reportMaintenanceResponse = (payload) => notifyMaintenance(payload);

const POLL_WHEN_UP = 60_000;
// Poll harder while down: the first thing a waiting client wants is for
// the page to come back on its own.
const POLL_WHEN_DOWN = 15_000;

const MaintenanceGate = ({ children }) => {
  const [state, setState] = useState(null);

  const check = useCallback(async () => {
    try {
      const base = import.meta.env.VITE_API_BASE_URL || "/api/v1";
      const res = await fetch(`${base.replace(/\/$/, "")}/maintenance/`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      setState(await res.json());
    } catch {
      // Offline or the API is unreachable. That is not the same as
      // maintenance, and claiming it would be a worse lie than the
      // ordinary request failures the user is about to see anyway.
    }
  }, []);

  useEffect(() => {
    notifyMaintenance = (payload) =>
      setState((prev) => ({ ...(prev || {}), ...payload, is_active: true }));
    check();
    return () => {
      notifyMaintenance = () => {};
    };
  }, [check]);

  const isDown = Boolean(state?.is_active);

  useEffect(() => {
    const id = setInterval(check, isDown ? POLL_WHEN_DOWN : POLL_WHEN_UP);
    return () => clearInterval(id);
  }, [check, isDown]);

  if (!isDown) {
    return (
      <MaintenanceContext.Provider value={{ isDown: false, state }}>
        {children}
      </MaintenanceContext.Provider>
    );
  }

  const backAt = state?.expected_back_at ? new Date(state.expected_back_at) : null;
  const backAtValid = backAt && !Number.isNaN(backAt.getTime());

  return (
    <MaintenanceContext.Provider value={{ isDown: true, state }}>
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8">
            <BrandLogo />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
            <span className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-900/60">
              <Icon icon="heroicons:wrench-screwdriver" className="text-2xl" />
            </span>

            <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Back shortly
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {state?.message ||
                "Bill Munshi is briefly down for scheduled maintenance."}
            </p>

            {/* Said plainly and first, because it is the only question a
                client actually has when a finance system is unavailable. */}
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              Your data is safe. Nothing has been lost.
            </p>

            {backAtValid && (
              <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Expected back
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {backAt.toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Icon icon="heroicons:arrow-path" className="text-xs animate-spin" />
              Checking every 15 seconds — this page returns on its own
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            Need help?{" "}
            <a
              href="mailto:support@billmunshi.com"
              className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
            >
              support@billmunshi.com
            </a>
          </p>
        </div>
      </div>
    </MaintenanceContext.Provider>
  );
};

export default MaintenanceGate;
