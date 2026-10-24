import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useForexRates, useSetBillCurrency } from "@/services/forexService";

/**
 * The currency a voucher was written in, and the rate it posts at.
 *
 * Collapsed to a single line for the overwhelmingly common case — a
 * rupee bill — and only opens into the rate controls once the operator
 * picks something else. A box that always showed an exchange-rate field
 * would put a number nobody needs on top of every bill in the system.
 *
 * Two things here are deliberate and worth not undoing:
 *
 *   * **The rate is frozen on save, not looked up on read.** What this
 *     control writes is the number the voucher will be posted at
 *     forever. Re-deriving it later would silently restate a bill that
 *     has already gone to Tally.
 *
 *   * **A failed fetch does not block the operator.** When the provider
 *     is unreachable the last cached rate is shown with the time it was
 *     captured, and the field stays editable so a rate can simply be
 *     typed. The one thing this box must never do is stop someone
 *     entering a bill.
 */

const fmtWhen = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

const SOURCE_LABELS = {
  live: "live rate",
  cached: "last cached rate",
  manual: "entered by hand",
  base: "rupee bill",
};

const CurrencyBox = ({
  organizationId,
  billId,
  currency = "INR",
  exchangeRate = "1",
  exchangeRateSource = "base",
  exchangeRateAt = null,
  disabled = false,
  onChanged,
}) => {
  const { data: ratesData, isLoading: ratesLoading } = useForexRates(organizationId);
  const [code, setCode] = useState(currency || "INR");
  const [manualRate, setManualRate] = useState("");
  const [saved, setSaved] = useState(null);

  // The bill is fetched after this mounts, so the saved currency arrives
  // late; follow it until the operator touches the control.
  useEffect(() => {
    setCode(currency || "INR");
  }, [currency]);

  const setCurrency = useSetBillCurrency(organizationId, billId, {
    onSuccess: (result) => {
      setSaved(result);
      setManualRate("");
      onChanged?.(result);
    },
  });

  const currencies = ratesData?.currencies || [{ code: "INR", label: "Indian Rupee" }];
  const liveRate = ratesData?.rates?.[code];
  const stale = Boolean(ratesData?.stale);

  const effective = saved || {
    currency,
    exchange_rate: exchangeRate,
    exchange_rate_source: exchangeRateSource,
    exchange_rate_at: exchangeRateAt,
  };
  const isForeign = (effective.currency || "INR") !== "INR";
  const pendingForeign = code !== "INR";
  const error = setCurrency.error;

  const apply = (nextCode, rate) => {
    setCurrency.mutate({ currency: nextCode, exchangeRate: rate || undefined });
  };

  return (
    <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-3">
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
          <Icon icon="heroicons:banknotes" className="text-sm" />
        </span>

        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
            Currency
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isForeign
              ? "Amounts below are in this currency; Tally is posted in INR."
              : "Amounts below are in rupees."}
          </p>
        </div>

        <select
          value={code}
          disabled={disabled || ratesLoading || setCurrency.isPending}
          onChange={(e) => {
            const next = e.target.value;
            setCode(next);
            // Rupees needs no rate and no second step, so save at once;
            // a foreign currency waits for the rate controls below.
            if (next === "INR") apply(next);
          }}
          className="h-8 px-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50 cursor-pointer"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label}
            </option>
          ))}
        </select>

        {pendingForeign && (
          <>
            <span className="text-xs text-slate-400 dark:text-slate-500">1 {code} =</span>
            <input
              type="text"
              inputMode="decimal"
              disabled={disabled || setCurrency.isPending}
              value={manualRate}
              placeholder={liveRate ? Number(liveRate).toFixed(4) : "rate"}
              onChange={(e) => setManualRate(e.target.value)}
              className="h-8 w-28 px-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500">INR</span>
            <button
              type="button"
              disabled={disabled || setCurrency.isPending}
              onClick={() => apply(code, manualRate.trim())}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
              title={
                manualRate.trim()
                  ? "Freeze the rate you typed onto this bill"
                  : "Freeze today's rate onto this bill"
              }
            >
              <Icon
                icon={setCurrency.isPending ? "heroicons:arrow-path" : "heroicons:lock-closed"}
                className={`text-sm ${setCurrency.isPending ? "animate-spin" : ""}`}
              />
              {setCurrency.isPending ? "Saving…" : "Apply rate"}
            </button>
          </>
        )}
      </div>

      {/* What is actually stored on the bill, said plainly — this is the
          figure the voucher will post at, not whatever today's is. */}
      {isForeign && (
        <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
          Posting at{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            1 {effective.currency} = {Number(effective.exchange_rate).toFixed(4)} INR
          </span>
          {effective.exchange_rate_source && (
            <> · {SOURCE_LABELS[effective.exchange_rate_source] || effective.exchange_rate_source}</>
          )}
          {fmtWhen(effective.exchange_rate_at) && <> · set {fmtWhen(effective.exchange_rate_at)}</>}
        </p>
      )}

      {pendingForeign && stale && (
        <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <Icon icon="heroicons:exclamation-triangle" className="inline text-xs mr-1" />
          Live rates unreachable. Showing the last fetched rate
          {fmtWhen(ratesData?.fetched_at) ? ` from ${fmtWhen(ratesData.fetched_at)}` : ""} — check
          it, or type the rate you want.
        </p>
      )}

      {error && (
        <p className="mt-1.5 text-[11px] text-rose-700 dark:text-rose-400">
          {error?.detail || error?.message || "Could not save the currency."}
        </p>
      )}
    </div>
  );
};

export default CurrencyBox;
