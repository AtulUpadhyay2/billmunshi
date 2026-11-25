import React from "react";
import { Icon } from "@iconify/react";

/**
 * The analysis half of the dashboard.
 *
 * The rest of the page counts documents. This answers the two questions
 * an accountant actually opens it for:
 *
 *   Where does the GST stand — tax paid on purchases against tax charged
 *   on sales, and so what is payable or carried forward. That is the
 *   figure the return is built from, and reading it meant opening every
 *   voucher.
 *
 *   What is stuck — bills with no party, bills the extraction flagged,
 *   bills analysed a week ago and never synced. The funnel said how many
 *   sat at each stage; it did not say which ones were waiting on a
 *   person, so the queue grew while the page looked healthy.
 *
 * Every row is a link into the work, not a number to admire.
 */

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Card = ({ icon, title, hint, right, children, className = "" }) => (
  <div
    className={`flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 ${className}`}
  >
    <div className="flex items-center gap-2 mb-2.5">
      <Icon icon={icon} className="text-sm text-slate-400 dark:text-slate-500" />
      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
        {title}
      </h3>
      {hint && (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
          {hint}
        </span>
      )}
      <span className="flex-1" />
      {right}
    </div>
    <div className="min-h-0 flex-1">{children}</div>
  </div>
);

/** One side of the GST position: three heads and their sum. */
const TaxSide = ({ label, data, tone }) => (
  <div className="min-w-0">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p className={`mt-0.5 font-mono text-[17px] font-semibold ${tone}`}>
      {money(data?.tax)}
    </p>
    <div className="mt-1 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
      {[
        ["CGST", data?.cgst],
        ["SGST", data?.sgst],
        ["IGST", data?.igst],
      ].map(([k, v]) => (
        <div key={k} className="flex justify-between gap-2">
          <span>{k}</span>
          <span className="font-mono">{money(v)}</span>
        </div>
      ))}
    </div>
  </div>
);

const ATTENTION = [
  {
    key: "no_party",
    label: "No party picked",
    icon: "heroicons:user-minus",
    why: "Cannot post to Tally without one",
    tone: "text-rose-600 dark:text-rose-400",
  },
  {
    key: "flagged",
    label: "Flagged by extraction",
    icon: "heroicons:exclamation-triangle",
    why: "Totals or GSTIN worth a second look",
    tone: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "stale_unsynced",
    label: "Over 7 days, unsynced",
    icon: "heroicons:clock",
    why: "Sitting in the queue",
    tone: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "duplicates",
    label: "Possible duplicates",
    icon: "heroicons:document-duplicate",
    why: "Same bill uploaded twice",
    tone: "text-violet-600 dark:text-violet-400",
  },
];

const InsightsSection = ({ data, isLoading, onOpenModule }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 animate-pulse"
          />
        ))}
      </div>
    );
  }
  if (!data) return null;

  const gst = data.gst || {};
  const net = Number(gst.net || 0);
  const payable = net > 0;
  const attention = data.attention || {};
  const stale = data.stale_unsynced || [];
  const parties = [
    ...(data.top_vendors || []).map((p) => ({ ...p, side: "Vendor" })),
    ...(data.top_customers || []).map((p) => ({ ...p, side: "Customer" })),
  ]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
  const maxAmount = parties.length ? parties[0].amount || 1 : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <Card
        icon="heroicons:scale"
        title="GST position"
        hint="All analysed vouchers"
        className="lg:col-span-1"
      >
        <div className="grid grid-cols-2 gap-3">
          <TaxSide
            label="Input (paid)"
            data={gst.input}
            tone="text-blue-600 dark:text-blue-400"
          />
          <TaxSide
            label="Output (charged)"
            data={gst.output}
            tone="text-emerald-600 dark:text-emerald-400"
          />
        </div>
        {/* The sign is the whole message, so it is said in words as well
            as colour — a figure that is merely red does not tell an
            operator which way it points. */}
        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 dark:border-slate-700 flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {payable ? "Net payable" : "Credit carried forward"}
          </span>
          <span
            className={`font-mono text-[17px] font-semibold ${
              payable
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {money(Math.abs(net))}
          </span>
        </div>
      </Card>

      <Card
        icon="heroicons:inbox-stack"
        title="Needs attention"
        hint="Waiting on a person"
      >
        <div className="space-y-1">
          {ATTENTION.map((row) => {
            const n = Number(attention[row.key] || 0);
            return (
              <div
                key={row.key}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                  n > 0
                    ? "bg-slate-50 dark:bg-slate-800/50"
                    : "opacity-45"
                }`}
              >
                <Icon icon={row.icon} className={`text-sm shrink-0 ${row.tone}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {row.label}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {row.why}
                  </p>
                </div>
                <span
                  className={`font-mono text-[15px] font-semibold ${
                    n > 0 ? row.tone : "text-slate-400 dark:text-slate-600"
                  }`}
                >
                  {n}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card
        icon="heroicons:building-storefront"
        title="Largest counterparties"
        hint="By analysed value"
      >
        {parties.length === 0 ? (
          <p className="text-[12px] text-slate-500 dark:text-slate-400 py-6 text-center">
            No party matched to a voucher yet.
          </p>
        ) : (
          <div className="space-y-1.5">
            {parties.map((p) => (
              <div key={`${p.side}-${p.name}`} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[12px] text-slate-700 dark:text-slate-300">
                    {p.name}
                  </span>
                  <span className="shrink-0 font-mono text-[12px] font-semibold text-slate-900 dark:text-white">
                    {money(p.amount)}
                  </span>
                </div>
                {/* A bar rather than a second number: the question is
                    which of these dwarfs the rest, and a ratio answers
                    it faster than comparing digits. */}
                <div className="mt-0.5 h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      p.side === "Vendor" ? "bg-blue-500" : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.max(2, (p.amount / maxAmount) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {p.side} · {p.count} voucher{p.count === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
};

/**
 * The same queue, as a narrow column card.
 *
 * It was a full-width strip of four-across tiles under the three
 * Position cards — a whole row of page for eight short lines. It reads
 * better as a list beside the pipeline, which is where an operator is
 * already looking when they wonder what has not posted.
 */
export const StaleUnsyncedCard = ({ data, onOpenModule, className = "" }) => {
  const stale = data?.stale_unsynced || [];
  if (!stale.length) return null;
  return (
    <Card
      icon="heroicons:queue-list"
      title="Oldest unsynced"
      hint="Never posted"
      className={className}
    >
      {/* Capped and scrollable rather than stretched: the list used to
          set the height of the whole Pipeline row, so eight entries
          decided how tall five funnel cards had to be. It scrolls, and
          the row is as tall as the funnels need. */}
      <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
        {stale.map((b) => (
          <button
            key={`${b.module}-${b.name}`}
            type="button"
            onClick={() => onOpenModule?.(b.module)}
            className="flex w-full items-center gap-2 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer min-w-0 px-1 -mx-1 rounded"
          >
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                {b.name}
              </p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                {b.module} · {b.status}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              {b.days}d
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default InsightsSection;
