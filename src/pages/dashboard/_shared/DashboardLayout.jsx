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

const SectionHeader = ({ icon, title, hint, right }) => (
  <div className="flex items-center justify-between mb-3 px-1">
    <div className="flex items-center gap-2 min-w-0">
      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
        <Icon icon={icon} className="text-sm" />
      </span>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
        {title}
      </h2>
      {hint && (
        <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      )}
    </div>
    {right}
  </div>
);

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
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Module summary card (one per module: Vendor / Expense)            */
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
  const dotMap = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
  };
  const barMap = {
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    violet: "bg-violet-500",
    amber: "bg-amber-500",
  };
  const ringMap = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60",
    violet:
      "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/60",
    amber:
      "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/60",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex w-7 h-7 items-center justify-center rounded-md ring-1 ${ringMap[accent]}`}
        >
          <Icon icon={icon} className="text-sm" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
            {title}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            {formatNumber(total)} total
          </div>
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          {formatNumber(total)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 flex items-center justify-between"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {r.label}
            </span>
            <span className="text-[12px] font-bold text-slate-900 dark:text-white">
              {formatNumber(r.value)}
            </span>
          </div>
        ))}
      </div>

      {typeof progress === "number" && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Sync rate
            </span>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white">
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`${barMap[accent]} h-full rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-md shadow-sm shadow-orange-500/20 ring-1 ring-orange-600/20 transition-all cursor-pointer"
          >
            <Icon icon={primaryAction.icon || "heroicons:arrow-up-tray"} className="text-sm" />
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
          >
            {secondaryAction.label}
            <Icon icon="heroicons:arrow-up-right" className="text-sm" />
          </button>
        )}
        <div className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">
          <span className={`w-1.5 h-1.5 rounded-full ${dotMap[accent]}`} />
          Live
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Funnel card                                                       */
/* ------------------------------------------------------------------ */

const FunnelCard = ({ title, data, accent = "blue" }) => {
  if (!data) return null;
  const {
    total_uploaded = 0,
    analysed = 0,
    verified = 0,
    synced = 0,
    conversion_rates = {},
  } = data;

  const completion =
    total_uploaded > 0 ? (synced / total_uploaded) * 100 : 0;

  const stages = [
    { key: "uploaded", label: "Uploaded", value: total_uploaded, icon: "heroicons:cloud-arrow-up" },
    { key: "analysed", label: "Analysed", value: analysed, icon: "heroicons:sparkles" },
    { key: "verified", label: "Verified", value: verified, icon: "heroicons:shield-check" },
    { key: "synced", label: "Synced", value: synced, icon: "heroicons:check-badge" },
  ];

  const rates = [
    {
      label: "Analysis",
      value: conversion_rates.analysis_rate || 0,
      color: "bg-blue-500",
    },
    {
      label: "Verification",
      value: conversion_rates.verification_rate || 0,
      color: "bg-amber-500",
    },
    {
      label: "Sync",
      value: conversion_rates.sync_rate || 0,
      color: "bg-emerald-500",
    },
  ];

  const accentRing = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60",
    violet:
      "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/60",
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex w-7 h-7 items-center justify-center rounded-md ring-1 ${accentRing[accent]}`}
          >
            <Icon icon="heroicons:funnel" className="text-sm" />
          </span>
          <h3 className="text-[12px] font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 rounded-md px-2 py-0.5">
          <Icon icon="heroicons:chart-bar" className="text-xs" />
          {completion.toFixed(1)}% complete
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {stages.map((s) => (
          <div
            key={s.key}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Icon icon={s.icon} className="text-xs" />
              {s.label}
            </div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
              {formatNumber(s.value)}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {rates.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                {r.label}
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {Number(r.value).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`${r.color} h-full rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(Number(r.value), 100)}%` }}
              />
            </div>
          </div>
        ))}
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

const TrendsChart = ({ data, vendorLabel = "Vendor", expenseLabel = "Expense" }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 lg:col-span-2">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
          <Icon icon="heroicons:chart-bar-square" className="text-sm" />
        </span>
        <h3 className="text-[12px] font-bold text-slate-900 dark:text-white tracking-tight">
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
          <Bar dataKey="vendor" name={vendorLabel} fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name={expenseLabel} fill="#7c3aed" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="analysed" name="Analysed" fill="#0891b2" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="synced" name="Synced" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const FileDistribution = ({ pieData, vendorCount, expenseCount }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
        <Icon icon="heroicons:document-duplicate" className="text-sm" />
      </span>
      <h3 className="text-[12px] font-bold text-slate-900 dark:text-white tracking-tight">
        File distribution
      </h3>
    </div>
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={68}
            paddingAngle={2}
            dataKey="value"
            stroke="white"
            strokeWidth={2}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="grid grid-cols-2 gap-2 mt-2">
      <div className="rounded-md bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Vendor
        </div>
        <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
          {formatNumber(vendorCount)}
        </div>
      </div>
      <div className="rounded-md bg-violet-50 dark:bg-violet-950/40 ring-1 ring-violet-100 dark:ring-violet-900/60 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
          Expense
        </div>
        <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
          {formatNumber(expenseCount)}
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main layout                                                       */
/* ------------------------------------------------------------------ */

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
}) => {
  const navigate = useNavigate();
  const [isVendorOpen, setIsVendorOpen] = React.useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = React.useState(false);

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
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
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

  const vendorPct =
    vBills.total_count > 0 ? (vBills.synced_count / vBills.total_count) * 100 : 0;
  const expensePct =
    eBills.total_count > 0 ? (eBills.synced_count / eBills.total_count) * 100 : 0;

  const trendData = usageData?.usage_by_period
    ? [
        {
          name: "Today",
          vendor: usageData.usage_by_period.today.vendor_bills_uploaded,
          expense: usageData.usage_by_period.today.expense_bills_uploaded,
          analysed: usageData.usage_by_period.today.bills_analysed,
          synced: usageData.usage_by_period.today.bills_synced,
        },
        {
          name: "Week",
          vendor: usageData.usage_by_period.week.vendor_bills_uploaded,
          expense: usageData.usage_by_period.week.expense_bills_uploaded,
          analysed: usageData.usage_by_period.week.bills_analysed,
          synced: usageData.usage_by_period.week.bills_synced,
        },
        {
          name: "Month",
          vendor: usageData.usage_by_period.month.vendor_bills_uploaded,
          expense: usageData.usage_by_period.month.expense_bills_uploaded,
          analysed: usageData.usage_by_period.month.bills_analysed,
          synced: usageData.usage_by_period.month.bills_synced,
        },
        {
          name: "Quarter",
          vendor: usageData.usage_by_period.quarter.vendor_bills_uploaded,
          expense: usageData.usage_by_period.quarter.expense_bills_uploaded,
          analysed: usageData.usage_by_period.quarter.bills_analysed,
          synced: usageData.usage_by_period.quarter.bills_synced,
        },
      ]
    : [];

  const vendorFiles = usageData?.file_statistics?.total_vendor_files || 0;
  const expenseFiles = usageData?.file_statistics?.total_expense_files || 0;
  const pieData = [
    { name: "Vendor", value: vendorFiles, color: "#2563eb" },
    { name: "Expense", value: expenseFiles, color: "#7c3aed" },
  ];

  const expenseLabel = module === "tally" ? "Journal entry" : "Expense";
  const vendorLabel = module === "tally" ? "Purchase voucher" : "Vendor bill";

  // ---------------- handlers ------------------------------------------

  const handleVendorUpload = async (formData) => {
    if (!onVendorUpload) return;
    await onVendorUpload(formData);
  };
  const handleExpenseUpload = async (formData) => {
    if (!onExpenseUpload) return;
    await onExpenseUpload(formData);
  };

  return (
    <div className="space-y-3">
      {/* Top stat tiles */}
      <SectionHeader
        icon="heroicons:rectangle-group"
        title="Snapshot"
        right={
          refetchAll && (
            <button
              type="button"
              onClick={refetchAll}
              className="inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
            >
              <Icon icon="heroicons:arrow-path" className="text-sm" />
              Refresh
            </button>
          )
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Total amount"
          value={formatCurrency(fin.combined_amount)}
          sublabel={`Vendor ${formatCurrency(fin.total_vendor_amount)} · ${expenseLabel} ${formatCurrency(
            fin.total_expense_amount,
          )}`}
          icon="heroicons:banknotes"
          accent="emerald"
        />
        <StatTile
          label="Vendor bills"
          value={formatNumber(vBills.total_count)}
          sublabel={`Analysed ${formatNumber(vBills.analysed_count)} · Synced ${formatNumber(vBills.synced_count)}`}
          icon="heroicons:document-text"
          accent="blue"
        />
        <StatTile
          label={expenseLabel}
          value={formatNumber(eBills.total_count)}
          sublabel={`Draft ${formatNumber(eBills.draft_count)} · Synced ${formatNumber(eBills.synced_count)}`}
          icon="heroicons:document-currency-rupee"
          accent="violet"
        />
        <StatTile
          label="Vendors"
          value={formatNumber(vendorCount)}
          sublabel={`Last 7d · V ${formatNumber(
            recent.vendor_bills_last_7_days,
          )} · E ${formatNumber(recent.expense_bills_last_7_days)}`}
          icon="heroicons:building-storefront"
          accent="amber"
        />
      </div>

      {/* Module summaries — vendor + expense */}
      <SectionHeader
        icon="heroicons:square-3-stack-3d"
        title="Modules"
        hint="Open lists or upload bills directly"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ModuleSummaryCard
          title="Vendor bills"
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
            label: "View bills",
            onClick: () => navigate(`${baseRoute}/vendor-bill`),
          }}
        />
        <ModuleSummaryCard
          title={expenseLabel}
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
      </div>

      {/* Usage trends + file distribution */}
      <SectionHeader
        icon="heroicons:chart-bar-square"
        title="Analytics"
        hint="Volume and conversion across periods"
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <TrendsChart
          data={trendData}
          vendorLabel="Vendor"
          expenseLabel={expenseLabel}
        />
        <FileDistribution
          pieData={pieData}
          vendorCount={vendorFiles}
          expenseCount={expenseFiles}
        />
      </div>

      {/* Funnels */}
      {funnelData && (
        <>
          <SectionHeader
            icon="heroicons:funnel"
            title="Pipeline"
            hint="Upload → Analysed → Verified → Synced"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <FunnelCard
              title="Vendor bills funnel"
              data={funnelData.vendor_bills_funnel}
              accent="blue"
            />
            <FunnelCard
              title={`${expenseLabel} funnel`}
              data={funnelData.expense_bills_funnel}
              accent="violet"
            />
          </div>
        </>
      )}

      {/* Upload modals — `module` decides which backend tree (/tally or /zoho)
          the scanner endpoint hits. Both are wired to the same OpenCV helper. */}
      <UploadBillModal
        isOpen={isVendorOpen}
        onClose={() => setIsVendorOpen(false)}
        onUpload={handleVendorUpload}
        title={`Upload ${vendorLabel.toLowerCase()}s`}
        module={module}
      />
      <UploadBillModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        onUpload={handleExpenseUpload}
        title={`Upload ${expenseLabel.toLowerCase()}`}
        module={module}
      />
    </div>
  );
};

export default DashboardLayout;
