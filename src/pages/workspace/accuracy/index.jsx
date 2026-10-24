import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";
import { ACTIONS, useOrgPermissions } from "@/services/approvalService";

/**
 * Extraction accuracy, measured from what people actually corrected.
 *
 * There is no labelled test set in production, but there is something
 * better: every verify records which fields a human changed. A field
 * nobody changes is a field the extractor gets right. That signal costs
 * nothing, grows by itself, and reflects the real mix of bills rather
 * than whichever samples someone collected.
 *
 * **Internal, admin-only.** These are our own error rates. A client
 * reading them has exactly one question, and it is not a question about
 * bills. The numbers also overstate error — a derived field
 * recomputing, or somebody reformatting a date, counts as a correction
 * — so they are a signal to work from, not one to quote.
 *
 * Covers every module: the events come from Tally and Zoho alike, and
 * extraction quality belongs to the extractor rather than to whichever
 * accounting package a bill is bound for.
 */

const WINDOWS = [7, 30, 90];

const useStats = (organizationId, days) =>
  useQuery({
    queryKey: ["activityStats", organizationId, days],
    queryFn: () =>
      apiFetch(`org/${organizationId}/activity/stats/?days=${days}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
    enabled: Boolean(organizationId),
  });

const Card = ({ title, hint, children }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
    <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
      {title}
    </h2>
    {hint && (
      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
    )}
    <div className="mt-3">{children}</div>
  </div>
);

const Bar = ({ label, value, total, tone = "slate", right }) => {
  const pct = total ? (value / total) * 100 : 0;
  const fill = {
    slate: "bg-slate-400 dark:bg-slate-600",
    blue: "bg-blue-500",
    rose: "bg-rose-500",
    emerald: "bg-emerald-500",
  }[tone];
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-baseline justify-between text-xs mb-0.5">
        <span className="text-slate-700 dark:text-slate-300 truncate pr-2">{label}</span>
        <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
          {right ?? `${value} · ${pct.toFixed(0)}%`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className={`h-full ${fill}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
};

const Empty = ({ children }) => (
  <p className="text-xs text-slate-500 dark:text-slate-400">{children}</p>
);

const TallyAccuracy = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const { can, isLoading: loadingPermissions } = useOrgPermissions();
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, error, refetch, isFetching } = useStats(
    selectedOrganization?.id,
    days,
  );

  // The server refuses this to anyone but an admin; saying so plainly
  // beats a page of empty cards or a bare 403.
  if (!loadingPermissions && !can(ACTIONS.MANAGE_SETTINGS)) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-1">
        <Icon
          icon="heroicons:lock-closed"
          className="text-2xl text-slate-300 dark:text-slate-600"
        />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Admins only
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
          Extraction accuracy is an internal measure of how the reader is
          performing.
        </p>
      </div>
    );
  }

  if (!selectedOrganization?.id) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
      </div>
    );
  }

  const extraction = data?.extraction || {};
  const routes = extraction.routes || {};
  const routeTotal = extraction.total || 0;
  const corrections = data?.corrections || [];
  const shadow = data?.shadow_agreement || [];
  const verifies = data?.verifies || 0;
  const byModule = Object.entries(data?.by_module || {}).filter(
    ([, m]) => m.uploaded > 0 || m.verifies > 0,
  );

  return (
    <div className="h-full flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Extraction accuracy
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Measured from the corrections people made while verifying, across
            Tally and Zoho. Internal — not for clients.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {WINDOWS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`h-8 px-2.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                d === days
                  ? "border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
          >
            <Icon
              icon="heroicons:arrow-path"
              className={`text-sm ${isLoading || isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading…</p>
      )}
      {isError && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          Could not load statistics
          {error?.data?.detail || error?.message
            ? `: ${error.data?.detail || error.message}`
            : "."}
        </p>
      )}

      {data && (
        <div className="flex-1 min-h-0 overflow-auto grid gap-3 md:grid-cols-2">
          {byModule.length > 0 && (
            <Card
              title="By module"
              hint="Tally and Zoho share one extractor, so a gap between them is worth a look."
            >
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {byModule.map(([name, m]) => (
                  <React.Fragment key={name}>
                    <span className="text-slate-600 dark:text-slate-400 capitalize">
                      {name}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 tabular-nums text-right">
                      {m.uploaded} uploaded · {m.verifies} verified
                      {m.clean_rate != null
                        ? ` · ${(m.clean_rate * 100).toFixed(0)}% clean`
                        : ""}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </Card>
          )}

          <Card
            title="Fields people corrected"
            hint={`Across ${verifies} verified bill${verifies === 1 ? "" : "s"}. A high rate means the extractor keeps getting that field wrong.`}
          >
            {corrections.length === 0 ? (
              <Empty>
                {verifies === 0
                  ? "No bills verified in this window yet."
                  : "Nothing was corrected — every field was accepted as extracted."}
              </Empty>
            ) : (
              corrections.map((c) => (
                <Bar
                  key={c.field}
                  label={c.field}
                  value={c.count}
                  total={verifies}
                  tone={c.rate > 0.5 ? "rose" : "slate"}
                  right={`${c.count}/${verifies} · ${((c.rate || 0) * 100).toFixed(0)}%`}
                />
              ))
            )}
          </Card>

          <Card
            title="How bills were read"
            hint="Text means OCR was good enough and the cheap model read it. Vision means the page image went to the expensive one."
          >
            {routeTotal === 0 ? (
              <Empty>
                No extraction telemetry yet — the OCR route has not been
                switched on for this workspace.
              </Empty>
            ) : (
              <>
                {Object.entries(routes).map(([name, n]) => (
                  <Bar
                    key={name}
                    label={name}
                    value={n}
                    total={routeTotal}
                    tone={name === "text" ? "emerald" : "blue"}
                  />
                ))}
                {extraction.mean_ocr_confidence != null && (
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Mean OCR confidence {extraction.mean_ocr_confidence.toFixed(2)}
                  </p>
                )}
              </>
            )}
          </Card>

          {shadow.length > 0 && (
            <Card
              title="Shadow agreement"
              hint="While shadow mode runs: how often the cheap route matched the live one, field by field. Agreement must hold before the route is switched on."
            >
              {shadow.map((f) => (
                <Bar
                  key={f.field}
                  label={f.field}
                  value={f.same}
                  total={f.same + f.differ}
                  tone={f.agreement >= 0.95 ? "emerald" : "rose"}
                  right={`${(f.agreement * 100).toFixed(0)}% of ${f.same + f.differ}`}
                />
              ))}
            </Card>
          )}

          <Card title="Everything recorded" hint={`Last ${data.window_days} days.`}>
            {Object.keys(data.counts || {}).length === 0 ? (
              <Empty>No activity in this window.</Empty>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {Object.entries(data.counts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([action, n]) => (
                    <div key={action} className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400 truncate pr-2">
                        {action.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 tabular-nums">
                        {n}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default TallyAccuracy;
