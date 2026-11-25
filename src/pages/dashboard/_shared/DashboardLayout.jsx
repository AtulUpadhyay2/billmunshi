import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Loading from "@/components/Loading";
import UploadBillModal from "@/components/modals/UploadBillModal";
import InsightsSection, { StaleUnsyncedCard } from "./InsightsSection";
import { BTN_SECONDARY, CARD_TITLE } from "@/constants/ui";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(value || 0);


/* ------------------------------------------------------------------ */
/*  Stat tile                                                         */
/* ------------------------------------------------------------------ */

const StatTile = ({ label, value, sublabel, icon, accent = "blue" }) => {
  const accentMap = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60",
    violet:
      "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/60",
    amber:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/60",
    rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/60",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 flex items-start gap-2.5">
      <span
        className={`shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md ring-1 ${accentMap[accent]}`}
      >
        <Icon icon={icon} className="text-sm" />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {label}
        </div>
        <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight mt-0.5">
          {value}
        </div>
        {sublabel && (
          // `title` so a sublabel truncated by a narrow tile is still readable on hover.
          <div
            className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate"
            title={sublabel}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Module summary card (one per module: Vendor / Expense / Payment)  */
/* ------------------------------------------------------------------ */

const ModuleSummaryCard = ({
  title,
  icon,
  total,
  rows,
  progress,
  primaryAction,
  secondaryAction,
  accent = "blue",
}) => {
  // Was ~230px tall for four numbers: it printed the total twice (once
  // in the header, once as a display figure), boxed each statistic in
  // its own bordered tile, labelled the sync bar on a line of its own
  // and ended with a "Live" dot that said nothing. Five of these made
  // the Modules block 576px — the largest thing on the page, and the
  // reason it scrolled. Same four numbers, one card, a third the height.
  const barMap = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
    cyan: "bg-cyan-500",
  };
  const ringMap = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60",
    violet:
      "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/60",
    amber:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/60",
    cyan: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 ring-cyan-100 dark:ring-cyan-900/60",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex w-6 h-6 shrink-0 items-center justify-center rounded-md ring-1 ${ringMap[accent]}`}
        >
          <Icon icon={icon} className="text-[13px]" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-900 dark:text-white">
          {title}
        </span>
        <span className="font-mono text-[15px] font-semibold text-slate-900 dark:text-white">
          {formatNumber(total)}
        </span>
      </div>

      {/* One line instead of four bordered tiles. The labels are short
          enough to read at a glance and the figures stay in a mono
          column, which is what makes them comparable card to card. */}
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
        {rows.map((r) => (
          <span key={r.label} className="whitespace-nowrap">
            {r.label}{" "}
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {formatNumber(r.value)}
            </span>
          </span>
        ))}
      </div>

      {typeof progress === "number" && (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`${barMap[accent]} h-full rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {progress.toFixed(0)}% synced
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="inline-flex items-center gap-1 px-2 h-6 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
          >
            <Icon icon={primaryAction.icon || "heroicons:arrow-up-tray"} className="text-[12px]" />
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="inline-flex items-center gap-1 px-2 h-6 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 rounded-md transition-colors cursor-pointer"
          >
            {secondaryAction.label}
            <Icon icon="heroicons:arrow-up-right" className="text-[12px]" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Funnel card                                                       */
/* ------------------------------------------------------------------ */

// `dense`: the card shares its row with two others, so the four stage boxes
// go 2×2 at the widths where four across would squeeze their labels.
const FunnelCard = ({ title, data, accent = "blue", className = "", dense = false }) => {
  if (!data) return null;
  const {
    total_uploaded = 0,
    analysed = 0,
    verified = 0,
    synced = 0,
    conversion_rates = {},
  } = data;

  const completion = total_uploaded > 0 ? (synced / total_uploaded) * 100 : 0;

  // Was four bordered boxes with 18px figures stacked over three
  // separately-labelled progress bars — about 400px of card for four
  // small numbers, five of which filled the page and still left the
  // row ragged. A funnel is a sequence, so it reads as one: the four
  // counts in order with arrows between them, and the three rates as
  // one segmented bar underneath.
  const stages = [
    ["Uploaded", total_uploaded],
    ["Analysed", analysed],
    ["Verified", verified],
    ["Synced", synced],
  ];

  const rates = [
    ["Analysis", conversion_rates.analysis_rate || 0, "bg-blue-500"],
    ["Verification", conversion_rates.verification_rate || 0, "bg-amber-500"],
    ["Sync", conversion_rates.sync_rate || 0, "bg-emerald-500"],
  ];

  const accentRing = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60",
    violet:
      "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/60",
    amber:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/60",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60",
    cyan: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 ring-cyan-100 dark:ring-cyan-900/60",
  };

  return (
    <div
      /* self-start, so a funnel is as tall as a funnel. Stretching it
         to match the tallest card in the row left a band of nothing
         between the stage numbers and the rate bars. */
      className={`self-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col gap-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex w-6 h-6 shrink-0 items-center justify-center rounded-md ring-1 ${
            accentRing[accent] || accentRing.blue
          }`}
        >
          <Icon icon="heroicons:funnel" className="text-[13px]" />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
        <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {completion.toFixed(0)}%
        </span>
      </div>

      <div className="flex items-stretch">
        {stages.map(([label, value], i) => (
          <React.Fragment key={label}>
            {i > 0 && (
              <span className="self-center px-1 text-[10px] text-slate-300 dark:text-slate-700">
                ›
              </span>
            )}
            <div className="min-w-0 flex-1 text-center">
              <div className="font-mono text-[15px] font-semibold leading-none text-slate-900 dark:text-white">
                {formatNumber(value)}
              </div>
              <div className="mt-0.5 truncate text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {label}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Three rates, three segments of one bar. Separate bars with
          their own labels said the same thing in three times the room. */}
      <div className="space-y-1">
        <div className="flex gap-0.5">
          {rates.map(([label, value, color]) => (
            <div
              key={label}
              title={`${label} ${Number(value).toFixed(1)}%`}
              className="h-1 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
            >
              <div
                className={`${color} h-full rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(Number(value), 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 text-[9px] text-slate-400 dark:text-slate-500">
          {rates.map(([label, value]) => (
            <span key={label} className="min-w-0 flex-1 truncate">
              {label} <span className="font-mono">{Number(value).toFixed(0)}%</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Recharts theme                                                    */
/* ------------------------------------------------------------------ */

const tooltipStyle = {
  backgroundColor: "rgb(255 255 255)",
  border: "1px solid rgb(226 232 240)",
  borderRadius: "8px",
  fontSize: "12px",
  boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.10)",
  padding: "6px 10px",
};

/* ------------------------------------------------------------------ */
/*  Charts                                                            */
/* ------------------------------------------------------------------ */

// Series colours, shared by the trend bars, the pie and its legend chips.
const SERIES_COLORS = {
  vendor: "#2563eb",
  expense: "#7c3aed",
  payment: "#d97706",
  sales: "#059669",
  receipt: "#0891b2",
};

const TrendsChart = ({
  data,
  vendorLabel = "Vendor",
  expenseLabel = "Expense",
  // Only the Tally dashboard has payment vouchers; omit to hide the series.
  paymentLabel,
}) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 lg:col-span-2">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
          <Icon icon="heroicons:chart-bar-square" className="text-sm" />
        </span>
        <h3 className={CARD_TITLE}>
          Usage trends
        </h3>
      </div>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">
        Today · Week · Month · Quarter
      </span>
    </div>
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(59,130,246,0.06)" }} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Bar dataKey="vendor" name={vendorLabel} fill={SERIES_COLORS.vendor} radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name={expenseLabel} fill={SERIES_COLORS.expense} radius={[3, 3, 0, 0]} maxBarSize={28} />
          {paymentLabel && (
            <Bar dataKey="payment" name={paymentLabel} fill={SERIES_COLORS.payment} radius={[3, 3, 0, 0]} maxBarSize={28} />
          )}
          <Bar dataKey="analysed" name="Analysed" fill="#0891b2" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="synced" name="Synced" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const FILE_CHIP_TONES = {
  vendor: {
    chip: "bg-blue-50 dark:bg-blue-950/40 ring-blue-100 dark:ring-blue-900/60",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-600",
  },
  expense: {
    chip: "bg-violet-50 dark:bg-violet-950/40 ring-violet-100 dark:ring-violet-900/60",
    text: "text-violet-700 dark:text-violet-400",
    dot: "bg-violet-600",
  },
  payment: {
    chip: "bg-amber-50 dark:bg-amber-950/40 ring-amber-100 dark:ring-amber-900/60",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-600",
  },
  sales: {
    chip: "bg-emerald-50 dark:bg-emerald-950/40 ring-emerald-100 dark:ring-emerald-900/60",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-600",
  },
  receipt: {
    chip: "bg-cyan-50 dark:bg-cyan-950/40 ring-cyan-100 dark:ring-cyan-900/60",
    text: "text-cyan-700 dark:text-cyan-400",
    dot: "bg-cyan-600",
  },
};

/* A slice whose key has no tone must not take the page down with it.
   Adding sales and receipt to the dashboard did exactly that: the pie
   got two new keys, this map did not, and the whole route rendered
   blank on `Cannot read properties of undefined (reading 'chip')`. */
const FILE_CHIP_FALLBACK = {
  chip: "bg-slate-50 dark:bg-slate-900/40 ring-slate-200 dark:ring-slate-800",
  text: "text-slate-700 dark:text-slate-300",
  dot: "bg-slate-500",
};

// ``slices`` — [{ key: one of FILE_CHIP_TONES, name, value }]
const FileDistribution = ({ slices }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
        <Icon icon="heroicons:document-duplicate" className="text-sm" />
      </span>
      <h3 className={CARD_TITLE}>
        File distribution
      </h3>
    </div>
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={68}
            paddingAngle={2}
            dataKey="value"
            stroke="white"
            strokeWidth={2}
          >
            {slices.map((entry) => (
              <Cell key={`cell-${entry.key}`} fill={SERIES_COLORS[entry.key]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className={`grid gap-2 mt-2 ${slices.length > 4 ? "grid-cols-3" : slices.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
      {slices.map((s) => {
        const tone = FILE_CHIP_TONES[s.key] || FILE_CHIP_FALLBACK;
        return (
          <div key={s.key} className={`rounded-md ring-1 px-2.5 py-1.5 min-w-0 ${tone.chip}`}>
            <div
              className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${tone.text}`}
            >
              <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${tone.dot}`} />
              <span className="truncate">{s.name}</span>
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {formatNumber(s.value)}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main layout                                                       */
/* ------------------------------------------------------------------ */

const TREND_PERIODS = [
  ["Today", "today"],
  ["Week", "week"],
  ["Month", "month"],
  ["Quarter", "quarter"],
];

const DashboardLayout = ({
  module = "tally",
  selectedOrganization,
  funnelData,
  overviewData,
  usageData,
  isLoading,
  isError,
  error,
  refetchAll,
  onVendorUpload,
  onExpenseUpload,
  onPaymentUpload,
  onSalesUpload,
  onReceiptUpload,
  insightsData,
  isInsightsLoading,
}) => {
  const navigate = useNavigate();
  const [isVendorOpen, setIsVendorOpen] = React.useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = React.useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [isSalesOpen, setIsSalesOpen] = React.useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);

  if (!selectedOrganization) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <div className="w-10 h-10 mx-auto mb-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
          <Icon icon="heroicons:building-office" className="text-lg" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Select a client to view the {module} dashboard.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-56 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
        <div className="w-10 h-10 mx-auto mb-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Failed to load dashboard
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error?.message || "Something went wrong while fetching dashboard data."}
        </p>
        {refetchAll && (
          <button
            type="button"
            onClick={refetchAll}
            className={BTN_SECONDARY}
          >
            <Icon icon="heroicons:arrow-path" className="text-sm" />
            Try again
          </button>
        )}
      </div>
    );
  }

  const baseRoute = module === "tally" ? "/tally" : "/zoho";
  const expenseRoute = module === "tally" ? "expense-bill" : "journal-entry";

  // ---------------- derive view-models ---------------------------------
  const fin = overviewData?.financial_summary || {};
  const vBills = overviewData?.vendor_bills || {};
  const eBills = overviewData?.expense_bills || {};
  const recent = overviewData?.recent_activity || {};
  const vendorCount = overviewData?.vendor_count || 0;

  // Payment vouchers are Tally-only — the backend adds ``payment_bills``
  // to the Tally overview and leaves it off the Zoho one, so its presence
  // decides whether the payment tile / card / series are rendered.
  const hasPayments = !!overviewData?.payment_bills;
  const pBills = overviewData?.payment_bills || {};

  // Sales and receipt are Tally-only, and were missing from this page
  // entirely: five voucher types could be uploaded, analysed and synced
  // while the dashboard reported three. Same presence test as payment.
  const hasSales = !!overviewData?.sales_bills;
  const sBills = overviewData?.sales_bills || {};
  const hasReceipts = !!overviewData?.receipt_bills;
  const rBills = overviewData?.receipt_bills || {};

  const vendorPct =
    vBills.total_count > 0 ? (vBills.synced_count / vBills.total_count) * 100 : 0;
  const expensePct =
    eBills.total_count > 0 ? (eBills.synced_count / eBills.total_count) * 100 : 0;
  const paymentPct =
    pBills.total_count > 0 ? (pBills.synced_count / pBills.total_count) * 100 : 0;
  const salesPct =
    sBills.total_count > 0 ? (sBills.synced_count / sBills.total_count) * 100 : 0;
  const receiptPct =
    rBills.total_count > 0 ? (rBills.synced_count / rBills.total_count) * 100 : 0;

  const periods = usageData?.usage_by_period;
  const trendData = periods
    ? TREND_PERIODS.map(([name, key]) => ({
        name,
        vendor: periods[key].vendor_bills_uploaded,
        expense: periods[key].expense_bills_uploaded,
        payment: periods[key].payment_bills_uploaded || 0,
        analysed: periods[key].bills_analysed,
        synced: periods[key].bills_synced,
      }))
    : [];

  // Client Correction 52: the Tally dashboard speaks Tally's voucher
  // names — Purchase Voucher / Journal Voucher / Payment Voucher. Zoho keeps
  // its own terms (Vendor bill / Expense).
  const isTally = module === "tally";
  const vendorLabel = isTally ? "Purchase voucher" : "Vendor bill";
  const vendorTitle = isTally ? "Purchase vouchers" : "Vendor bills";
  const expenseLabel = isTally ? "Journal voucher" : "Expense";
  const expenseTitle = isTally ? "Journal vouchers" : "Expense";
  const paymentLabel = "Payment voucher";
  // Short forms for the one-line tile sublabels and the file split.
  const vendorShort = isTally ? "Purchase" : "Vendor";
  const expenseShort = isTally ? "Journal" : "Expense";

  const vendorFiles = usageData?.file_statistics?.total_vendor_files || 0;
  const expenseFiles = usageData?.file_statistics?.total_expense_files || 0;
  const paymentFiles = usageData?.file_statistics?.total_payment_files || 0;
  const salesFiles = usageData?.file_statistics?.total_sales_files || 0;
  const receiptFiles = usageData?.file_statistics?.total_receipt_files || 0;
  const fileSlices = [
    { key: "vendor", name: vendorShort, value: vendorFiles },
    { key: "expense", name: expenseShort, value: expenseFiles },
    ...(hasPayments ? [{ key: "payment", name: "Payment", value: paymentFiles }] : []),
    ...(hasSales ? [{ key: "sales", name: "Sales", value: salesFiles }] : []),
    ...(hasReceipts ? [{ key: "receipt", name: "Receipt", value: receiptFiles }] : []),
  ];

  const amountBreakdown = [
    `${vendorShort} ${formatCurrency(fin.total_vendor_amount)}`,
    `${isTally ? expenseShort : expenseLabel} ${formatCurrency(fin.total_expense_amount)}`,
    ...(hasPayments ? [`Payment ${formatCurrency(fin.total_payment_amount)}`] : []),
    ...(hasSales ? [`Sales ${formatCurrency(fin.total_sales_amount)}`] : []),
    ...(hasReceipts ? [`Receipt ${formatCurrency(fin.total_receipt_amount)}`] : []),
  ].join(" · ");

  // Tally's own voucher abbreviations (Pur / Jrnl / Pymt); Zoho keeps V / E.
  const recentBreakdown = [
    `Last 7d · ${isTally ? "Pur" : "V"} ${formatNumber(recent.vendor_bills_last_7_days)}`,
    `${isTally ? "Jrnl" : "E"} ${formatNumber(recent.expense_bills_last_7_days)}`,
    ...(hasPayments ? [`${isTally ? "Pymt" : "P"} ${formatNumber(recent.payment_bills_last_7_days)}`] : []),
    ...(hasSales ? [`Sales ${formatNumber(recent.sales_bills_last_7_days)}`] : []),
    ...(hasReceipts ? [`Rcpt ${formatNumber(recent.receipt_bills_last_7_days)}`] : []),
  ].join(" · ");

  // ---------------- handlers ------------------------------------------

  const handleVendorUpload = async (formData) => {
    if (!onVendorUpload) return;
    await onVendorUpload(formData);
  };
  const handleExpenseUpload = async (formData) => {
    if (!onExpenseUpload) return;
    await onExpenseUpload(formData);
  };
  const handlePaymentUpload = async (formData) => {
    if (!onPaymentUpload) return;
    await onPaymentUpload(formData);
  };
  const handleSalesUpload = async (formData) => {
    if (!onSalesUpload) return;
    await onSalesUpload(formData);
  };
  const handleReceiptUpload = async (formData) => {
    if (!onReceiptUpload) return;
    await onReceiptUpload(formData);
  };

  return (
    // pb-6: the page sits in an `h-full` wrapper, so the scroller's own
    // bottom padding doesn't apply — without this the Pipeline cards run
    // straight into the footer.
    <div className="space-y-2.5 pb-6">
      {/* The section headers are gone. Each said in a title and a
          subtitle what the cards beneath it already say — "Pipeline /
          Upload → Analysed → Verified → Synced" above five cards that
          print those four words themselves. Five of them cost about
          250px of page to repeat the content. Refresh was the only
          thing in them worth keeping, so it stays, on its own. */}
      <div className="flex justify-end">
        {refetchAll && (
            <button
              type="button"
              onClick={refetchAll}
              className="inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
            >
            <Icon icon="heroicons:arrow-path" className="text-sm" />
            Refresh
          </button>
        )}
      </div>
      <div
        /* Up to seven tiles on Tally now (amount, purchase, journal,
           payment, sales, receipt, counterparties) against four on
           Zoho, so the column count follows the module count rather
           than being hard-coded for one of the two. */
        className={`grid grid-cols-2 md:grid-cols-3 gap-2 ${
          hasSales || hasReceipts
            ? "lg:grid-cols-4 2xl:grid-cols-7"
            : hasPayments
              ? "lg:grid-cols-3 xl:grid-cols-5"
              : "lg:grid-cols-4"
        }`}
      >
        <StatTile
          label="Total amount"
          value={formatCurrency(fin.combined_amount)}
          sublabel={amountBreakdown}
          icon="heroicons:banknotes"
          accent="emerald"
        />
        <StatTile
          label={vendorTitle}
          value={formatNumber(vBills.total_count)}
          sublabel={`Analysed ${formatNumber(vBills.analysed_count)} · Synced ${formatNumber(vBills.synced_count)}`}
          icon="heroicons:document-text"
          accent="blue"
        />
        <StatTile
          label={expenseTitle}
          value={formatNumber(eBills.total_count)}
          sublabel={`Draft ${formatNumber(eBills.draft_count)} · Synced ${formatNumber(eBills.synced_count)}`}
          icon="heroicons:document-currency-rupee"
          accent="violet"
        />
        {hasPayments && (
          <StatTile
            label="Payment vouchers"
            value={formatNumber(pBills.total_count)}
            sublabel={`Analysed ${formatNumber(pBills.analysed_count)} · Synced ${formatNumber(pBills.synced_count)}`}
            icon="heroicons:credit-card"
            accent="amber"
          />
        )}
        {hasSales && (
          <StatTile
            label="Sales vouchers"
            value={formatNumber(sBills.total_count)}
            sublabel={`Analysed ${formatNumber(sBills.analysed_count)} · Synced ${formatNumber(sBills.synced_count)}`}
            icon="heroicons:receipt-percent"
            accent="emerald"
          />
        )}
        {hasReceipts && (
          <StatTile
            label="Receipt vouchers"
            value={formatNumber(rBills.total_count)}
            sublabel={`Analysed ${formatNumber(rBills.analysed_count)} · Synced ${formatNumber(rBills.synced_count)}`}
            icon="heroicons:banknotes"
            accent="blue"
          />
        )}
        <StatTile
          label="Vendors"
          value={formatNumber(vendorCount)}
          sublabel={recentBreakdown}
          icon="heroicons:building-storefront"
          accent="amber"
        />
      </div>

      <div
        /* Five across on a wide screen: the cards are short enough now
           that two rows of them was wasted height, not density. */
        className={`grid grid-cols-2 gap-2 ${
          hasSales || hasReceipts
            ? "md:grid-cols-3 xl:grid-cols-5"
            : hasPayments
              ? "lg:grid-cols-3"
              : "lg:grid-cols-2"
        }`}
      >
        <ModuleSummaryCard
          title={vendorTitle}
          icon="heroicons:document-text"
          accent="blue"
          total={vBills.total_count || 0}
          rows={[
            { label: "Analysed", value: vBills.analysed_count || 0 },
            { label: "Synced", value: vBills.synced_count || 0 },
            { label: "Last 7d", value: recent.vendor_bills_last_7_days || 0 },
            { label: "Files", value: vendorFiles || 0 },
          ]}
          progress={vendorPct}
          primaryAction={{
            label: "Upload",
            icon: "heroicons:cloud-arrow-up",
            onClick: () => setIsVendorOpen(true),
          }}
          secondaryAction={{
            label: isTally ? "View list" : "View bills",
            onClick: () => navigate(`${baseRoute}/vendor-bill`),
          }}
        />
        <ModuleSummaryCard
          title={expenseTitle}
          icon="heroicons:document-currency-rupee"
          accent="violet"
          total={eBills.total_count || 0}
          rows={[
            { label: "Draft", value: eBills.draft_count || 0 },
            { label: "Synced", value: eBills.synced_count || 0 },
            { label: "Last 7d", value: recent.expense_bills_last_7_days || 0 },
            { label: "Files", value: expenseFiles || 0 },
          ]}
          progress={expensePct}
          primaryAction={{
            label: "Upload",
            icon: "heroicons:cloud-arrow-up",
            onClick: () => setIsExpenseOpen(true),
          }}
          secondaryAction={{
            label: "View list",
            onClick: () => navigate(`${baseRoute}/${expenseRoute}`),
          }}
        />
        {hasPayments && (
          <ModuleSummaryCard
            title="Payment vouchers"
            icon="heroicons:credit-card"
            accent="amber"
            total={pBills.total_count || 0}
            rows={[
              { label: "Analysed", value: pBills.analysed_count || 0 },
              { label: "Synced", value: pBills.synced_count || 0 },
              { label: "Last 7d", value: recent.payment_bills_last_7_days || 0 },
              { label: "Files", value: paymentFiles || 0 },
            ]}
            progress={paymentPct}
            primaryAction={{
              label: "Upload",
              icon: "heroicons:cloud-arrow-up",
              onClick: () => setIsPaymentOpen(true),
            }}
            secondaryAction={{
              label: "View list",
              onClick: () => navigate(`${baseRoute}/payment-voucher`),
            }}
          />
        )}
        {hasSales && (
          <ModuleSummaryCard
            title="Sales vouchers"
            icon="heroicons:receipt-percent"
            accent="emerald"
            total={sBills.total_count || 0}
            rows={[
              { label: "Analysed", value: sBills.analysed_count || 0 },
              { label: "Synced", value: sBills.synced_count || 0 },
              { label: "Last 7d", value: recent.sales_bills_last_7_days || 0 },
              { label: "Files", value: salesFiles || 0 },
            ]}
            progress={salesPct}
            primaryAction={{
              label: "Upload",
              icon: "heroicons:cloud-arrow-up",
              onClick: () => setIsSalesOpen(true),
            }}
            secondaryAction={{
              label: "View list",
              onClick: () => navigate(`${baseRoute}/sales-bill`),
            }}
          />
        )}
        {hasReceipts && (
          <ModuleSummaryCard
            title="Receipt vouchers"
            icon="heroicons:banknotes"
            accent="blue"
            total={rBills.total_count || 0}
            rows={[
              { label: "Analysed", value: rBills.analysed_count || 0 },
              { label: "Synced", value: rBills.synced_count || 0 },
              { label: "Last 7d", value: recent.receipt_bills_last_7_days || 0 },
              { label: "Files", value: receiptFiles || 0 },
            ]}
            progress={receiptPct}
            primaryAction={{
              label: "Upload",
              icon: "heroicons:cloud-arrow-up",
              onClick: () => setIsReceiptOpen(true),
            }}
            secondaryAction={{
              label: "View list",
              onClick: () => navigate(`${baseRoute}/receipt-voucher`),
            }}
          />
        )}
      </div>

      {/* The analysis the page was missing — GST position and the work
          queue. Tally only: the endpoint behind it is Tally's. */}
      {isTally && (insightsData || isInsightsLoading) && (
        <>
          <InsightsSection
            data={insightsData}
            isLoading={isInsightsLoading}
            onOpenModule={(mod) => {
              const route = {
                purchase: "vendor-bill",
                journal: expenseRoute,
                payment: "payment-voucher",
                sales: "sales-bill",
                receipt: "receipt-voucher",
              }[mod];
              if (route) navigate(`${baseRoute}/${route}`);
            }}
          />
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <TrendsChart
          data={trendData}
          vendorLabel={isTally ? vendorLabel : "Vendor"}
          expenseLabel={expenseLabel}
          paymentLabel={hasPayments ? paymentLabel : undefined}
        />
        <FileDistribution slices={fileSlices} />
      </div>

      {/* Funnels, with the unsynced queue beside them rather than on a
          full-width strip of its own: both answer "what has not posted
          yet", so they belong on one row. 30/70 — the list is eight
          short lines, the funnels are five cards. */}
      {funnelData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] gap-2 items-stretch">
            {isTally && insightsData ? (
              <StaleUnsyncedCard
                data={insightsData}
                onOpenModule={(mod) => {
                  const route = {
                    purchase: "vendor-bill",
                    journal: expenseRoute,
                    payment: "payment-voucher",
                    sales: "sales-bill",
                    receipt: "receipt-voucher",
                  }[mod];
                  if (route) navigate(`${baseRoute}/${route}`);
                }}
              />
            ) : (
              <span className="hidden lg:block" />
            )}
          {(() => {
            // One per voucher type the module has — Tally now returns
            // five, and sales and receipt were being dropped on the
            // floor here the same way they were missing from the cards
            // above. With more than two, the stage boxes go 2×2 so
            // their labels still fit.
            const funnels = [
              { key: "vendor", title: `${vendorTitle} funnel`, data: funnelData.vendor_bills_funnel, accent: "blue" },
              { key: "expense", title: `${expenseTitle} funnel`, data: funnelData.expense_bills_funnel, accent: "violet" },
              { key: "payment", title: "Payment vouchers funnel", data: funnelData.payment_bills_funnel, accent: "amber" },
              { key: "sales", title: "Sales vouchers funnel", data: funnelData.sales_bills_funnel, accent: "emerald" },
              { key: "receipt", title: "Receipt vouchers funnel", data: funnelData.receipt_bills_funnel, accent: "cyan" },
            ].filter((f) => f.data);
            const dense = funnels.length >= 3;
            return (
              <div
                className={`grid grid-cols-1 gap-2 ${
                  funnels.length >= 4 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"
                }`}
              >
                {funnels.map((f, i) => (
                  <FunnelCard
                    key={f.key}
                    title={f.title}
                    data={f.data}
                    accent={f.accent}
                    dense={dense}
                    /* A trailing card alone on its row leaves a hole
                       beside it, which is what made this block look
                       unfinished. The odd one out widens to fill it. */
                    /* The last row must end flush. With a 3-column
                       grid, a trailing 1 widens to 3 and a trailing 2
                       means the final card takes the spare column —
                       five funnels used to leave a hole on the right,
                       which is what made the block look unfinished. */
                    className={
                      i !== funnels.length - 1
                        ? ""
                        : funnels.length % 3 === 1
                          ? "sm:col-span-2 xl:col-span-3"
                          : funnels.length % 3 === 2
                            ? "xl:col-span-2"
                            : funnels.length % 2 === 1
                              ? "sm:col-span-2 xl:col-span-1"
                              : ""
                    }
                  />
                ))}
              </div>
            );
          })()}
          </div>
        </>
      )}

      {/* Upload modals — `module` decides which backend tree (/tally or /zoho)
          the scanner endpoint hits. Both are wired to the same OpenCV helper. */}
      <UploadBillModal
        isOpen={isVendorOpen}
        onClose={() => setIsVendorOpen(false)}
        onUpload={handleVendorUpload}
        title={`Upload ${vendorTitle.toLowerCase()}`}
        module={module}
      />
      <UploadBillModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onUpload={handleExpenseUpload}
        title={`Upload ${expenseTitle.toLowerCase()}`}
        module={module}
      />
      {hasPayments && (
        <UploadBillModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onUpload={handlePaymentUpload}
          title={`Upload ${paymentLabel.toLowerCase()}s`}
          module={module}
        />
      )}
      {hasSales && (
        <UploadBillModal
          isOpen={isSalesOpen}
          onClose={() => setIsSalesOpen(false)}
          onUpload={handleSalesUpload}
          title="Upload sales vouchers"
          module={module}
        />
      )}
      {hasReceipts && (
        <UploadBillModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          onUpload={handleReceiptUpload}
          title="Upload receipt vouchers"
          module={module}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
