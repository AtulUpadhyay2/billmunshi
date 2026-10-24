import React, { useEffect, useMemo, useState } from "react";
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
 * Four things here are deliberate and worth not undoing:
 *
 *   * **The rate is frozen on save, not looked up on read.** What this
 *     control writes is the number the voucher will be posted at
 *     forever. Re-deriving it later would silently restate a bill that
 *     has already gone to Tally.
 *
 *   * **Two kinds of rate are offered, and neither wins silently.** The
 *     CBIC notified rate is the statutory figure — section 14 of the
 *     Customs Act, and therefore the assessable value GST on imports is
 *     charged on. The market mid-rate is indicative: right for
 *     management reporting, wrong in a return. They differ by several
 *     percent. Both are shown with that difference spelled out, and the
 *     operator chooses; the box never quietly applies one.
 *
 *   * **Import and export are different numbers.** CBIC notifies them
 *     separately, around 1.8% apart on USD. A purchase bill is on the
 *     import side and a sales invoice on the export side, so the right
 *     one is preselected — but both stay visible and clickable, because
 *     a preselection is a convenience and not a determination.
 *
 *   * **A failed fetch does not block the operator.** Either source can
 *     be down independently; whichever survives is still offered, and
 *     the field stays editable so a rate can simply be typed off the
 *     notification. The one thing this box must never do is stop
 *     someone entering a bill.
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
  live: "market rate (indicative)",
  cached: "market rate, last cached (indicative)",
  manual: "entered by hand",
  base: "rupee bill",
  cbic_import: "CBIC notified — imports",
  cbic_export: "CBIC notified — exports",
};

const NOTIFIED_SOURCES = ["cbic_import", "cbic_export"];

/**
 * Which CBIC column this voucher belongs on.
 *
 * Taken from the `voucherSide` prop when a caller passes one. Failing
 * that it is read off the route, which is where the voucher type
 * actually lives in this app — the five detail pages each mount this
 * box at a fixed path and none of them currently pass their type down.
 * Reading the path keeps the preselection working without a prop change
 * in five large files; passing `voucherSide` explicitly overrides it and
 * is the better thing to do when those files are next touched.
 *
 * Sales and receipts are outward, everything else inward. Note that for
 * payments and receipts this is a guess, not a fact — a payment can be
 * a refund to a customer — which is why `sideIsCertain` below exists and
 * why both columns are always rendered.
 */
const inferSide = (voucherSide) => {
  if (voucherSide === "import" || voucherSide === "export") return voucherSide;
  const path = typeof window !== "undefined" ? window.location?.pathname || "" : "";
  if (/sales|receipt/i.test(path)) return "export";
  return "import";
};

const sideIsCertain = () => {
  const path = typeof window !== "undefined" ? window.location?.pathname || "" : "";
  // Purchase, expense and sales are settled by what the voucher is.
  // Payment and receipt are not: the money direction does not tell you
  // which side of a trade it belongs to.
  return !/payment|receipt/i.test(path);
};

const fmtRate = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(4) : null;
};

const CurrencyBox = ({
  organizationId,
  billId,
  currency = "INR",
  exchangeRate = "1",
  exchangeRateSource = "base",
  exchangeRateReference = "",
  exchangeRateAt = null,
  // "import" | "export". Optional; inferred from the route when absent.
  voucherSide,
  disabled = false,
  onChanged,
}) => {
  const { data: ratesData, isLoading: ratesLoading } = useForexRates(organizationId);
  const [code, setCode] = useState(currency || "INR");
  const [manualRate, setManualRate] = useState("");
  const [choice, setChoice] = useState(null);
  const [saved, setSaved] = useState(null);

  const side = inferSide(voucherSide);
  const certain = voucherSide ? true : sideIsCertain();

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
  const marketRate = ratesData?.rates?.[code];
  const marketStale = Boolean(ratesData?.stale);

  const cbic = ratesData?.cbic;
  const cbicEntry = cbic?.available ? cbic?.rates?.[code] : null;
  const cbicImport = cbicEntry?.import ?? null;
  const cbicExport = cbicEntry?.export ?? null;
  const hasNotified = Boolean(cbicImport || cbicExport);

  /**
   * The options, in the order they should be read: the statutory one
   * for this voucher's side first, then the other column, then the
   * indicative market figure. Ordering is the only nudge given — none
   * of them is applied without a click.
   */
  const options = useMemo(() => {
    const out = [];
    const notified = [
      { key: "cbic_import", rate: cbicImport, label: "CBIC notified — imports" },
      { key: "cbic_export", rate: cbicExport, label: "CBIC notified — exports" },
    ].filter((o) => o.rate);

    const preferred = side === "export" ? "cbic_export" : "cbic_import";
    notified.sort((a, b) => (a.key === preferred ? -1 : b.key === preferred ? 1 : 0));
    out.push(...notified.map((o) => ({ ...o, statutory: true })));

    if (marketRate) {
      out.push({
        key: "market",
        rate: marketRate,
        label: marketStale ? "Market rate — last cached" : "Market rate",
        statutory: false,
      });
    }
    return out;
  }, [cbicImport, cbicExport, marketRate, marketStale, side]);

  // Default to the statutory column for this side when there is one.
  // Recomputed rather than stored so it follows a currency change.
  const selected =
    choice && (options.some((o) => o.key === choice) || choice === "manual")
      ? choice
      : options[0]?.key || "manual";

  const effective = saved || {
    currency,
    exchange_rate: exchangeRate,
    exchange_rate_source: exchangeRateSource,
    exchange_rate_reference: exchangeRateReference,
    exchange_rate_at: exchangeRateAt,
  };
  const isForeign = (effective.currency || "INR") !== "INR";
  const pendingForeign = code !== "INR";
  const error = setCurrency.error;
  const storedIsNotified = NOTIFIED_SOURCES.includes(effective.exchange_rate_source);

  const apply = (nextCode) => {
    if (nextCode === "INR") {
      setCurrency.mutate({ currency: nextCode });
      return;
    }
    if (selected === "manual") {
      setCurrency.mutate({ currency: nextCode, exchangeRate: manualRate.trim() });
      return;
    }
    if (selected === "market") {
      setCurrency.mutate({ currency: nextCode, rateSource: "market" });
      return;
    }
    // An explicit side, never bare "cbic": the operator saw both
    // columns, so the stored source records their choice rather than a
    // server-side inference about the voucher type.
    setCurrency.mutate({ currency: nextCode, rateSource: selected });
  };

  const canApply =
    selected !== "manual" || manualRate.trim().length > 0;

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
            setChoice(null);
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
          <button
            type="button"
            disabled={disabled || setCurrency.isPending || !canApply}
            onClick={() => apply(code)}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer ml-auto"
            title="Freeze the selected rate onto this bill"
          >
            <Icon
              icon={setCurrency.isPending ? "heroicons:arrow-path" : "heroicons:lock-closed"}
              className={`text-sm ${setCurrency.isPending ? "animate-spin" : ""}`}
            />
            {setCurrency.isPending ? "Saving…" : "Freeze rate"}
          </button>
        )}
      </div>

      {/* The choice. Rendered as radios rather than a dropdown on
          purpose: an auditor-relevant decision between two numbers that
          differ should be visible without opening anything. */}
      {pendingForeign && (
        <div className="mt-3 space-y-1.5">
          {options.map((opt) => (
            <label
              key={opt.key}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                selected === opt.key
                  ? "border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <input
                type="radio"
                name={`rate-choice-${billId}`}
                checked={selected === opt.key}
                disabled={disabled || setCurrency.isPending}
                onChange={() => setChoice(opt.key)}
                className="accent-blue-600"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                1 {code} = {fmtRate(opt.rate)} INR
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {opt.label}
              </span>
              {opt.statutory ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900/60">
                  Notified
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700">
                  Indicative
                </span>
              )}
            </label>
          ))}

          <label
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              selected === "manual"
                ? "border-blue-300 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30"
                : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            }`}
          >
            <input
              type="radio"
              name={`rate-choice-${billId}`}
              checked={selected === "manual"}
              disabled={disabled || setCurrency.isPending}
              onChange={() => setChoice("manual")}
              className="accent-blue-600"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              1 {code} =
            </span>
            <input
              type="text"
              inputMode="decimal"
              disabled={disabled || setCurrency.isPending}
              value={manualRate}
              placeholder="your rate"
              onChange={(e) => {
                setManualRate(e.target.value);
                setChoice("manual");
              }}
              className="h-7 w-28 px-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
            />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              INR — entered by hand
            </span>
          </label>
        </div>
      )}

      {/* Where the notified figures came from. Without the notification
          number "the CBIC rate" is not a citation. */}
      {pendingForeign && hasNotified && (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          <Icon icon="heroicons:document-check" className="inline text-xs mr-1" />
          Notified rates from{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {cbic?.notification ? `CBIC ${cbic.notification}` : "CBIC"}
          </span>
          {cbic?.effective_from ? `, in force from ${cbic.effective_from}` : ""}. CBIC
          publishes imports and exports at different rates;{" "}
          {certain
            ? `this voucher is on the ${side} side.`
            : `the ${side} column is preselected for this voucher type, but a payment or receipt can sit on either side — check it.`}
        </p>
      )}

      {pendingForeign && !hasNotified && (
        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
          <Icon icon="heroicons:exclamation-triangle" className="inline text-xs mr-1" />
          CBIC notified rates are unavailable
          {cbic?.detail ? "" : " for this currency"}. The market rate below is
          indicative only — for a customs or GST-on-imports figure, read the rate
          off the notification and type it in.
        </p>
      )}

      {pendingForeign && marketStale && (
        <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400">
          <Icon icon="heroicons:exclamation-triangle" className="inline text-xs mr-1" />
          Market rates unreachable. Showing the last fetched one
          {fmtWhen(ratesData?.fetched_at) ? ` from ${fmtWhen(ratesData.fetched_at)}` : ""}.
        </p>
      )}

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
          {effective.exchange_rate_reference && (
            <> · <span className="font-semibold">{effective.exchange_rate_reference}</span></>
          )}
          {fmtWhen(effective.exchange_rate_at) && <> · set {fmtWhen(effective.exchange_rate_at)}</>}
          {!storedIsNotified && (
            <span className="text-amber-700 dark:text-amber-400">
              {" "}· not a notified rate
            </span>
          )}
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
