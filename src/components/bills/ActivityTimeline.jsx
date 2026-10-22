import React from "react";
import { Icon } from "@iconify/react";
import { useBillActivity } from "@/services/activityService";

/**
 * Who did what to this bill, newest first.
 *
 * Every entry is a fact the server recorded at the time, so nothing here
 * is derived or guessed: the icon and tone come from the action, and the
 * before/after values come straight from the stored change set.
 */

const ACTION_STYLE = {
  uploaded: { icon: "heroicons:arrow-up-tray", tone: "slate" },
  analysis_queued: { icon: "heroicons:sparkles", tone: "slate" },
  analysis_completed: { icon: "heroicons:sparkles", tone: "violet" },
  analysis_failed: { icon: "heroicons:exclamation-triangle", tone: "rose" },
  duplicate_flagged: { icon: "heroicons:document-duplicate", tone: "amber" },
  verified: { icon: "heroicons:check-badge", tone: "blue" },
  sync_requested: { icon: "heroicons:arrow-path-rounded-square", tone: "slate" },
  sync_confirmed: { icon: "heroicons:check-circle", tone: "emerald" },
  sync_failed: { icon: "heroicons:x-circle", tone: "rose" },
  moved: { icon: "heroicons:arrows-right-left", tone: "slate" },
  trashed: { icon: "heroicons:trash", tone: "amber" },
  restored: { icon: "heroicons:arrow-uturn-left", tone: "slate" },
  deleted: { icon: "heroicons:trash", tone: "rose" },
};

// Any action this build does not know about still renders, neutrally.
const DEFAULT_STYLE = { icon: "heroicons:pencil-square", tone: "slate" };

const TONE_CLASS = {
  slate: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 ring-slate-200 dark:ring-slate-700",
  blue: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-blue-100 dark:ring-blue-900/60",
  violet: "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 ring-violet-100 dark:ring-violet-900/60",
  emerald: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-emerald-100 dark:ring-emerald-900/60",
  amber: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-amber-100 dark:ring-amber-900/60",
  rose: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-rose-100 dark:ring-rose-900/60",
};

const formatWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const blank = (v) => (v === null || v === undefined || v === "" ? "—" : v);

const ChangeRow = ({ change }) => (
  <li className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
    <span className="font-semibold text-slate-700 dark:text-slate-300">
      {change.field}
    </span>
    <span className="text-slate-400 dark:text-slate-500 line-through break-all">
      {blank(change.from)}
    </span>
    <Icon
      icon="heroicons:arrow-right"
      className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0"
    />
    <span className="text-slate-700 dark:text-slate-300 font-medium break-all">
      {blank(change.to)}
    </span>
    {change.suggested && (
      <span className="text-[10px] text-slate-400 dark:text-slate-500">
        (suggested {change.suggested})
      </span>
    )}
  </li>
);

const ActivityTimeline = ({ organizationId, billId }) => {
  const { data, isLoading, isError, error } = useBillActivity(
    organizationId,
    billId,
  );

  const entries = data?.results || (Array.isArray(data) ? data : []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-3">
        <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
        Loading activity…
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-xs text-rose-600 dark:text-rose-400 py-3">
        Could not load activity
        {error?.data?.detail || error?.message
          ? `: ${error.data?.detail || error.message}`
          : "."}
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
        No activity recorded for this bill yet.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {entries.map((entry, index) => {
        const style = ACTION_STYLE[entry.action] || DEFAULT_STYLE;
        const last = index === entries.length - 1;
        return (
          <li key={entry.id} className="flex gap-2.5">
            {/* Rail: the dot for this entry, and the line down to the next */}
            <div className="flex flex-col items-center shrink-0">
              <span
                className={`w-6 h-6 rounded-full ring-1 flex items-center justify-center ${
                  TONE_CLASS[style.tone] || TONE_CLASS.slate
                }`}
              >
                <Icon icon={style.icon} className="text-[11px]" />
              </span>
              {!last && (
                <span className="w-px flex-1 min-h-[12px] bg-slate-200 dark:bg-slate-800" />
              )}
            </div>

            <div className={`min-w-0 ${last ? "pb-0" : "pb-3"}`}>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {entry.summary || entry.action_label}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {entry.actor_label} · {formatWhen(entry.created_at)}
              </p>

              {Array.isArray(entry.changes) && entry.changes.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 text-[11px]">
                  {entry.changes.map((change, i) => (
                    <ChangeRow key={`${entry.id}-${i}`} change={change} />
                  ))}
                </ul>
              )}

              {entry.metadata?.error && (
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 break-words">
                  {entry.metadata.error}
                </p>
              )}
              {entry.metadata?.tally_message && (
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 break-words">
                  {entry.metadata.tally_message}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default ActivityTimeline;
