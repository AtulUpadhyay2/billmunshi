import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import ReactSelect from "react-select";
import useDarkMode from "@/hooks/useDarkMode";
import { reactSelectStyles } from "@/constants/ui";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import {
  useGetTallyConfig,
  useCreateOrUpdateTallyConfig,
  useGetParentLedgers,
  useGetTallyLedgers,
  useGetGstRateLedgerMappings,
  useUpsertGstRateLedgerMappings,
  useGetTallyCgstLedgers,
  useGetTallySgstLedgers,
  useGetTallyIgstLedgers,
} from "@/services/tally/tallyApiService";
import { globalToast } from "@/utils/toast";

const GST_RATES = ["0.00", "5.00", "12.00", "18.00", "28.00"];

// Shared app scale — mirrors pages/_shared/BillsList.jsx.
const btnBase =
  "inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50";
const btnNeutral =
  `${btnBase} text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`;
const btnPrimary =
  `${btnBase} text-white bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20`;

/* ------------------------------------------------------------------ */
/*  Field labels & metadata                                           */
/* ------------------------------------------------------------------ */
const TAX_FIELDS = [
  { key: "igst_parents", display: "igst_parent_names", label: "IGST input ledgers", icon: "heroicons:receipt-percent" },
  { key: "cgst_parents", display: "cgst_parent_names", label: "CGST input ledgers", icon: "heroicons:receipt-percent" },
  { key: "sgst_parents", display: "sgst_parent_names", label: "SGST input ledgers", icon: "heroicons:receipt-percent" },
  { key: "tds_parents", display: "tds_parent_names", label: "TDS payable", icon: "heroicons:document-currency-rupee" },
];

const ACCOUNT_FIELDS = [
  { key: "vendor_parents", display: "vendor_parent_names", label: "Vendor ledgers", icon: "heroicons:building-storefront" },
  { key: "chart_of_accounts_parents", display: "coa_parent_names", label: "Purchase parent ledger", icon: "heroicons:shopping-cart" },
  { key: "chart_of_accounts_expense_parents", display: "expense_coa_parent_names", label: "Expense parent ledger", icon: "heroicons:credit-card" },
  { key: "payment_parents", display: "payment_parent_names", label: "Payment ledgers", icon: "heroicons:banknotes" },
];

// "Additional Adjustments Mapping" — Cess / Discount / Freight / Round Off / TDS
// each pick ONE concrete Ledger from the org's Chart of Accounts (not a
// parent). Backend fields: `cess_ledger`, `discount_ledger`, etc.
const ADDITIONAL_ADJUSTMENT_FIELDS = [
  {
    key: "cess_ledger",
    display: "cess_ledger_name",
    label: "Cess",
    hint: "Ledger stamped on lines flagged as Cess.",
    icon: "heroicons:receipt-percent",
    color: "amber",
  },
  {
    key: "discount_ledger",
    display: "discount_ledger_name",
    label: "Discount",
    hint: "Ledger stamped when the bill carries a discount line.",
    icon: "heroicons:tag",
    color: "rose",
  },
  {
    key: "freight_ledger",
    display: "freight_ledger_name",
    label: "Freight Charges",
    hint: "Ledger stamped on freight / delivery / shipping lines.",
    icon: "heroicons:truck",
    color: "blue",
  },
  {
    key: "round_off_ledger",
    display: "round_off_ledger_name",
    label: "Round Off",
    hint: "Ledger used for the paise-adjustment entry that balances the voucher.",
    icon: "heroicons:calculator",
    color: "violet",
  },
  {
    key: "tds_ledger",
    display: "tds_ledger_name",
    label: "TDS",
    hint: "Ledger applied when TDS is deducted at source.",
    icon: "heroicons:document-currency-rupee",
    color: "emerald",
  },
];

// Small colour palette for the per-row icon chip. Keeps the enhanced UI
// readable in both themes without pulling in a full design-system.
const ADJUSTMENT_COLOR_CLASSES = {
  amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/60",
  rose: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/60",
  blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60",
  violet: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/60",
  emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60",
};

const EMPTY_CONFIG = {
  tally_product_allow_sync: false,
  igst_parents: [],
  cgst_parents: [],
  sgst_parents: [],
  tds_parents: [],
  vendor_parents: [],
  chart_of_accounts_parents: [],
  chart_of_accounts_expense_parents: [],
  payment_parents: [],
  round_off_parents: [],
  cess_parents: [],
  discount_parents: [],
  freight_parents: [],
  // Additional Adjustments Mapping — single Ledger FK per adjustment.
  cess_ledger: null,
  discount_ledger: null,
  freight_ledger: null,
  round_off_ledger: null,
  tds_ledger: null,
};

/* ------------------------------------------------------------------ */

const TallySetup = () => {
  // react-select renders its own DOM and ignores Tailwind classes, so its
  // palette has to be handed in explicitly rather than inherited from the
  // `dark` class on <body>. Previously it was hard-coded to the light palette,
  // which left white dropdowns on the dark page.
  const [isDark] = useDarkMode();
  const selectStyles = reactSelectStyles(isDark);
  const { selectedOrganization } = useSelector((state) => state.auth);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configData, setConfigData] = useState(EMPTY_CONFIG);

  const { data: configResponse, isLoading, error, refetch } = useGetTallyConfig(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization?.id }
  );

  const { data: parentLedgersData, isLoading: isLoadingParentLedgers } = useGetParentLedgers(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization?.id }
  );

  const createOrUpdateConfigMutation = useCreateOrUpdateTallyConfig();
  const config = configResponse?.data;

  // ---------- GST rate → ledger mapping ----------
  const {
    data: gstRateMappingsResponse,
    isLoading: isLoadingGstRateMappings,
    refetch: refetchGstRateMappings,
  } = useGetGstRateLedgerMappings(selectedOrganization?.id, {
    enabled: !!selectedOrganization?.id,
  });
  const upsertGstRateMappingsMutation = useUpsertGstRateLedgerMappings();

  const { data: cgstLedgersData } = useGetTallyCgstLedgers(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization?.id }
  );
  const { data: sgstLedgersData } = useGetTallySgstLedgers(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization?.id }
  );
  const { data: igstLedgersData } = useGetTallyIgstLedgers(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization?.id }
  );

  const flattenLedgers = (resp) => {
    const grouped = resp?.grouped_ledgers || {};
    const out = [];
    Object.values(grouped).forEach((g) => {
      (g.ledgers || []).forEach((l) =>
        out.push({ value: l.id, label: l.name })
      );
    });
    return out;
  };
  const cgstLedgerOptions = useMemo(() => flattenLedgers(cgstLedgersData), [cgstLedgersData]);
  const sgstLedgerOptions = useMemo(() => flattenLedgers(sgstLedgersData), [sgstLedgersData]);
  const igstLedgerOptions = useMemo(() => flattenLedgers(igstLedgersData), [igstLedgersData]);

  const [rateMapState, setRateMapState] = useState({});
  useEffect(() => {
    const list = gstRateMappingsResponse?.data || [];
    const map = {};
    GST_RATES.forEach((r) => {
      const existing = list.find((m) => Number(m.rate) === Number(r));
      map[r] = {
        cgst_ledger: existing?.cgst_ledger || null,
        sgst_ledger: existing?.sgst_ledger || null,
        igst_ledger: existing?.igst_ledger || null,
      };
    });
    setRateMapState(map);
  }, [gstRateMappingsResponse]);

  const handleRateLedgerChange = (rate, key, ledgerId) => {
    setRateMapState((prev) => ({
      ...prev,
      [rate]: { ...(prev[rate] || {}), [key]: ledgerId || null },
    }));
  };

  const handleSaveRateMappings = async () => {
    try {
      const mappings = GST_RATES.map((r) => ({
        rate: r,
        cgst_ledger: rateMapState[r]?.cgst_ledger || null,
        sgst_ledger: rateMapState[r]?.sgst_ledger || null,
        igst_ledger: rateMapState[r]?.igst_ledger || null,
      }));
      await upsertGstRateMappingsMutation.mutateAsync({
        organizationId: selectedOrganization.id,
        mappings,
      });
      globalToast.success("Tax & Adjustments saved");
      refetchGstRateMappings();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to save GST rate mappings";
      globalToast.error(errorMessage);
    }
  };

  const rateMappingsConfigured = useMemo(() => {
    return GST_RATES.reduce((count, r) => {
      const m = rateMapState[r];
      if (!m) return count;
      return (
        count +
        (m.cgst_ledger ? 1 : 0) +
        (m.sgst_ledger ? 1 : 0) +
        (m.igst_ledger ? 1 : 0)
      );
    }, 0);
  }, [rateMapState]);

  // ---------- Additional Adjustments Mapping (Cess / Discount / Freight / Round Off / TDS) ----------
  // Every adjustment is a SINGLE Ledger FK (picked from the org's full
  // Chart of Accounts), NOT a set of ParentLedgers.
  const [additionalAdjustmentsState, setAdditionalAdjustmentsState] = useState(() =>
    ADDITIONAL_ADJUSTMENT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: null }), {})
  );

  useEffect(() => {
    if (config) {
      setAdditionalAdjustmentsState(
        ADDITIONAL_ADJUSTMENT_FIELDS.reduce(
          (acc, f) => ({ ...acc, [f.key]: config[f.key] || null }),
          {}
        )
      );
    }
  }, [config]);

  const handleAdditionalAdjustmentChange = (fieldKey, value) => {
    setAdditionalAdjustmentsState((prev) => ({ ...prev, [fieldKey]: value || null }));
  };

  const handleSaveAdditionalAdjustments = async () => {
    try {
      const payload = ADDITIONAL_ADJUSTMENT_FIELDS.reduce(
        (acc, f) => ({ ...acc, [f.key]: additionalAdjustmentsState[f.key] || null }),
        {}
      );
      await createOrUpdateConfigMutation.mutateAsync({
        organizationId: selectedOrganization.id,
        ...payload,
      });
      globalToast.success("Additional Adjustments Mapping saved");
      refetch();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        "Failed to save additional adjustments mapping";
      globalToast.error(errorMessage);
    }
  };

  const additionalAdjustmentsConfigured = useMemo(() => {
    if (!config) return 0;
    return ADDITIONAL_ADJUSTMENT_FIELDS.reduce(
      (sum, f) => sum + (config[f.key] ? 1 : 0),
      0
    );
  }, [config]);

  // Full Chart of Accounts for the Additional Adjustments dropdowns.
  const { data: allLedgersData, isLoading: isLoadingAllLedgers } =
    useGetTallyLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });
  const allLedgerOptions = useMemo(() => {
    // The Tally ledgers endpoint returns a grouped shape:
    //   { grouped_ledgers: { "<parent_id>": { parent_name, ledgers: [...] } } }
    // — used by the Chart of Accounts page. Also handle legacy raw-array
    // / `results` / `data` shapes defensively so any future shape shift
    // doesn't crash the setup page.
    const d = allLedgersData;
    const rows = [];

    if (d?.grouped_ledgers && typeof d.grouped_ledgers === "object") {
      Object.values(d.grouped_ledgers).forEach((group) => {
        const parentName = group?.parent_name || "";
        (group?.ledgers || []).forEach((l) => {
          rows.push({ ...l, parent_name: parentName });
        });
      });
    } else if (Array.isArray(d)) {
      rows.push(...d);
    } else if (Array.isArray(d?.results)) {
      rows.push(...d.results);
    } else if (Array.isArray(d?.data)) {
      rows.push(...d.data);
    } else if (Array.isArray(d?.data?.results)) {
      rows.push(...d.data.results);
    }

    return rows.map((l) => ({
      value: l.id,
      label: l.name || l.ledger_name || "(unnamed)",
      parent:
        l.parent_name ||
        (typeof l.parent === "string" ? l.parent : "") ||
        "",
    }));
  }, [allLedgersData]);

  const parentLedgerOptions = useMemo(
    () =>
      (parentLedgersData?.results || []).map((ledger) => ({
        value: ledger.id,
        label: ledger.parent,
      })),
    [parentLedgersData]
  );

  useEffect(() => {
    if (config) {
      setConfigData({
        tally_product_allow_sync: config.tally_product_allow_sync || false,
        igst_parents: config.igst_parents || [],
        cgst_parents: config.cgst_parents || [],
        sgst_parents: config.sgst_parents || [],
        tds_parents: config.tds_parents || [],
        vendor_parents: config.vendor_parents || [],
        chart_of_accounts_parents: config.chart_of_accounts_parents || [],
        chart_of_accounts_expense_parents: config.chart_of_accounts_expense_parents || [],
        payment_parents: config.payment_parents || [],
        round_off_parents: config.round_off_parents || [],
        cess_parents: config.cess_parents || [],
        discount_parents: config.discount_parents || [],
        freight_parents: config.freight_parents || [],
      });
    }
  }, [config]);

  const totalConfigured = useMemo(() => {
    if (!config) return 0;
    return [...TAX_FIELDS, ...ACCOUNT_FIELDS].reduce(
      (sum, f) => sum + (config[f.display]?.length || 0),
      0
    );
  }, [config]);

  const taxConfigured = useMemo(() => {
    if (!config) return 0;
    return TAX_FIELDS.reduce((sum, f) => sum + (config[f.display]?.length || 0), 0);
  }, [config]);

  const accountConfigured = useMemo(() => {
    if (!config) return 0;
    return ACCOUNT_FIELDS.reduce((sum, f) => sum + (config[f.display]?.length || 0), 0);
  }, [config]);

  // Correction 43: which single card the modal was opened from. `null` means
  // the header's "Edit configuration" button, i.e. show every field.
  const [focusFieldKey, setFocusFieldKey] = useState(null);

  // Correction 43: when the modal is opened from a single card, show only that
  // card's field; the header button leaves `focusFieldKey` null and shows all.
  // Save still submits the whole `configData`, so the untouched fields are
  // written back exactly as they were read.
  const focusedField = focusFieldKey
    ? [...TAX_FIELDS, ...ACCOUNT_FIELDS].find((f) => f.key === focusFieldKey)
    : null;
  const visibleInModal = (field) =>
    !focusFieldKey || field.key === focusFieldKey;
  const showTaxBlock = TAX_FIELDS.some(visibleInModal);
  const showAccountBlock = ACCOUNT_FIELDS.some(visibleInModal);

  const handleOpenModal = (fieldKey = null) => {
    setFocusFieldKey(typeof fieldKey === "string" ? fieldKey : null);
    if (config) {
      setConfigData({
        tally_product_allow_sync: config.tally_product_allow_sync || false,
        igst_parents: config.igst_parents || [],
        cgst_parents: config.cgst_parents || [],
        sgst_parents: config.sgst_parents || [],
        tds_parents: config.tds_parents || [],
        vendor_parents: config.vendor_parents || [],
        chart_of_accounts_parents: config.chart_of_accounts_parents || [],
        chart_of_accounts_expense_parents: config.chart_of_accounts_expense_parents || [],
        payment_parents: config.payment_parents || [],
        round_off_parents: config.round_off_parents || [],
        cess_parents: config.cess_parents || [],
        discount_parents: config.discount_parents || [],
        freight_parents: config.freight_parents || [],
      });
    } else {
      setConfigData(EMPTY_CONFIG);
    }
    setIsConfigModalOpen(true);
  };

  const handleCloseModal = () => {
    setFocusFieldKey(null);
    setIsConfigModalOpen(false);
    setConfigData(EMPTY_CONFIG);
  };

  const handleInputChange = (field, value) => {
    setConfigData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrUpdateConfigMutation.mutateAsync({
        organizationId: selectedOrganization.id,
        ...configData,
      });
      globalToast.success(`Configuration ${config ? "updated" : "created"} successfully!`);
      handleCloseModal();
      refetch();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.errors ||
        "Failed to save configuration";
      globalToast.error(errorMessage);
    }
  };

  /* ----- Renderers ----- */

  const renderLedgerList = (names = [], title, icon, fieldKey = null) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col">
      <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <span className="w-8 h-8 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
          <Icon icon={icon} className="text-sm" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
            {title}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {names.length} {names.length === 1 ? "ledger" : "ledgers"} configured
          </div>
        </div>
        {/* Correction 43: edit this one mapping without going through the
            whole-configuration modal. */}
        {fieldKey && config && (
          <button
            type="button"
            onClick={() => handleOpenModal(fieldKey)}
            title={`Edit ${title}`}
            aria-label={`Edit ${title}`}
            className="shrink-0 inline-flex items-center gap-1 h-7 px-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Icon icon="heroicons:pencil-square" className="text-xs" />
            Edit
          </button>
        )}
      </div>
      {names.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
          <Icon icon="heroicons:minus-circle" className="text-xl text-slate-300 dark:text-slate-600 mb-1" />
          <span className="text-xs italic text-slate-400 dark:text-slate-500">Not configured</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          {names.map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
            >
              <Icon icon="heroicons:check-circle" className="text-emerald-500 text-sm shrink-0" />
              <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">
                {name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMultiSelect = (field) => {
    const value = configData[field.key] || [];
    if (isLoadingParentLedgers) {
      return (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {field.label}
          </label>
          <div className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      );
    }
    if (parentLedgerOptions.length === 0) {
      return (
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            {field.label}
          </label>
          <div className="h-11 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center px-3 text-xs italic text-slate-500 dark:text-slate-400">
            No parent ledgers available — sync from Tally first
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5">
            <Icon icon={field.icon} className="text-blue-600 dark:text-blue-400 text-sm" />
            {field.label}
          </label>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 text-[10px] font-bold">
            {value.length} selected
          </span>
        </div>
        <ReactSelect
          isMulti
          options={parentLedgerOptions}
          value={parentLedgerOptions.filter((o) => value.includes(o.value))}
          onChange={(selected) => {
            const vals = Array.isArray(selected) ? selected.map((s) => s.value) : [];
            handleInputChange(field.key, vals);
          }}
          placeholder={`Select ${field.label.toLowerCase()}…`}
          isSearchable
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          styles={selectStyles}
          menuPlacement="auto"
          menuPosition="fixed"
        />
      </div>
    );
  };

  /* ----- Empty / loading / no workspace states ----- */

  if (!selectedOrganization?.id) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
          <Icon icon="heroicons:building-office" className="text-lg" />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Please select a client to configure Tally integration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Tally integration
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Map Tally parent ledgers to BillMunshi categories so vouchers post correctly.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className={btnNeutral}
          >
            <Icon icon="heroicons:arrow-path" className={`text-sm ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={isLoading}
            className={btnPrimary}
          >
            <Icon icon={config ? "heroicons:pencil-square" : "heroicons:plus"} className="text-sm" />
            {config ? "Edit configuration" : "Create configuration"}
          </button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          {
            label: "Total mapped",
            value: totalConfigured,
            icon: "heroicons:check-badge",
          },
          {
            label: "Tax ledgers",
            value: taxConfigured,
            icon: "heroicons:receipt-percent",
          },
          {
            label: "Account ledgers",
            value: accountConfigured,
            icon: "heroicons:book-open",
          },
          {
            label: "Inventory sync",
            value: config?.tally_product_allow_sync ? "On" : "Off",
            icon: "heroicons:cube",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2"
          >
            <span className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
              <Icon icon={s.icon} className="text-xs" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {s.label}
              </div>
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                {isLoading ? "—" : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2.5">
            <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
          </div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">Failed to load configuration</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
            {error?.data?.message || error?.message || "An error occurred while fetching the configuration."}
          </p>
          <button type="button" onClick={() => refetch()} className={btnNeutral}>
            <Icon icon="heroicons:arrow-path" className="text-sm" />
            Try again
          </button>
        </div>
      ) : !config ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Icon icon="heroicons:cog-6-tooth" className="text-xl" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">No configuration yet</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3.5 max-w-md mx-auto">
            Set up Tally ledger mappings so purchase vouchers, journal entries, and taxes post to the right ledgers automatically.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className={btnPrimary}
          >
            <Icon icon="heroicons:plus" className="text-sm" />
            Create configuration
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Tax ledgers section */}
          <section>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
                  Tax ledgers
                </h2>
                <Tooltip
                  content="Select GST (CGST / SGST / IGST) input ledgers and TDS payable ledgers from Tally."
                  placement="right"
                  arrow
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-help">
                    <Icon icon="heroicons:question-mark-circle" className="text-xs" />
                  </span>
                </Tooltip>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {taxConfigured} mapped
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {TAX_FIELDS.map((f) => (
                <React.Fragment key={f.key}>
                  {renderLedgerList(config[f.display] || [], f.label, f.icon, f.key)}
                </React.Fragment>
              ))}
            </div>

            {/* Correction 43: the rate-to-ledger mapping lives with the tax
                parent-ledger cards above, so both halves of the tax setup are
                configured in one place instead of two sections apart. */}
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
                  Tax Mapping
                </h2>
                <Tooltip
                  content="For mixed-rate bills, map each GST slab (5/12/18/28) to its specific CGST/SGST/IGST ledger. Required for line-item level tax assignment."
                  placement="right"
                  arrow
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-help">
                    <Icon icon="heroicons:question-mark-circle" className="text-xs" />
                  </span>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {rateMappingsConfigured} mapped
                </span>
                <button
                  type="button"
                  onClick={handleSaveRateMappings}
                  disabled={
                    upsertGstRateMappingsMutation.isPending || isLoadingGstRateMappings
                  }
                  className="inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-md shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20 transition-all cursor-pointer"
                >
                  {upsertGstRateMappingsMutation.isPending ? (
                    <>
                      <Icon icon="heroicons:arrow-path" className="text-xs animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Icon icon="heroicons:check" className="text-xs" />
                      Save mappings
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[80px_1fr_1fr_1fr] gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Rate
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  CGST ledger
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  SGST ledger
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  IGST ledger
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {GST_RATES.map((rate) => (
                  <div
                    key={rate}
                    className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr_1fr] gap-2 px-3 py-2 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-9 h-6 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 text-[11px] font-bold">
                        {Number(rate)}%
                      </span>
                    </div>
                    <ReactSelect
                      options={cgstLedgerOptions}
                      value={
                        cgstLedgerOptions.find(
                          (o) => o.value === rateMapState[rate]?.cgst_ledger
                        ) || null
                      }
                      onChange={(opt) =>
                        handleRateLedgerChange(rate, "cgst_ledger", opt?.value || null)
                      }
                      isClearable
                      placeholder="Select CGST ledger…"
                      styles={selectStyles}
                      menuPlacement="auto"
                      menuPosition="fixed"
                    />
                    <ReactSelect
                      options={sgstLedgerOptions}
                      value={
                        sgstLedgerOptions.find(
                          (o) => o.value === rateMapState[rate]?.sgst_ledger
                        ) || null
                      }
                      onChange={(opt) =>
                        handleRateLedgerChange(rate, "sgst_ledger", opt?.value || null)
                      }
                      isClearable
                      placeholder="Select SGST ledger…"
                      styles={selectStyles}
                      menuPlacement="auto"
                      menuPosition="fixed"
                    />
                    <ReactSelect
                      options={igstLedgerOptions}
                      value={
                        igstLedgerOptions.find(
                          (o) => o.value === rateMapState[rate]?.igst_ledger
                        ) || null
                      }
                      onChange={(opt) =>
                        handleRateLedgerChange(rate, "igst_ledger", opt?.value || null)
                      }
                      isClearable
                      placeholder="Select IGST ledger…"
                      styles={selectStyles}
                      menuPlacement="auto"
                      menuPosition="fixed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Account ledgers section */}
          <section>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
                  Account ledgers
                </h2>
                <Tooltip
                  content="Select ledgers for vendors, purchase, expenses and payments."
                  placement="right"
                  arrow
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-help">
                    <Icon icon="heroicons:question-mark-circle" className="text-xs" />
                  </span>
                </Tooltip>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {accountConfigured} mapped
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {ACCOUNT_FIELDS.map((f) => (
                <React.Fragment key={f.key}>
                  {renderLedgerList(config[f.display] || [], f.label, f.icon, f.key)}
                </React.Fragment>
              ))}
            </div>
          </section>


          {/* Additional Adjustments Mapping section */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
                  Additional Adjustments Mapping
                </h2>
                <Tooltip
                  content="Pick the specific Tally ledger to use whenever a bill has a Cess, Discount, Freight, Round Off or TDS adjustment. Options list every ledger in this org's Chart of Accounts."
                  placement="right"
                  arrow
                >
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-help">
                    <Icon icon="heroicons:question-mark-circle" className="text-xs" />
                  </span>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {additionalAdjustmentsConfigured} mapped
                </span>
                <button
                  type="button"
                  onClick={handleSaveAdditionalAdjustments}
                  disabled={createOrUpdateConfigMutation.isPending || isLoadingAllLedgers}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-md shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20 transition-all cursor-pointer"
                >
                  {createOrUpdateConfigMutation.isPending ? (
                    <>
                      <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Icon icon="heroicons:check" className="text-sm" />
                      Save mappings
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[240px_1fr] gap-4 px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Adjustment
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Ledger
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {ADDITIONAL_ADJUSTMENT_FIELDS.map((f) => {
                  const chipCls =
                    ADJUSTMENT_COLOR_CLASSES[f.color] ||
                    ADJUSTMENT_COLOR_CLASSES.blue;
                  const currentId = additionalAdjustmentsState[f.key] || null;
                  const currentOption =
                    allLedgerOptions.find((o) => o.value === currentId) || null;
                  return (
                    <div
                      key={f.key}
                      className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4 px-5 py-4 items-start md:items-center hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`inline-flex w-9 h-9 items-center justify-center rounded-lg ring-1 shrink-0 ${chipCls}`}
                        >
                          <Icon icon={f.icon} className="text-base" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-slate-900 dark:text-white">
                            {f.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {f.hint}
                          </div>
                        </div>
                      </div>
                      {isLoadingAllLedgers ? (
                        <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      ) : (
                        <ReactSelect
                          options={allLedgerOptions}
                          value={currentOption}
                          onChange={(selected) =>
                            handleAdditionalAdjustmentChange(
                              f.key,
                              selected ? selected.value : null,
                            )
                          }
                          placeholder={`Select ledger for ${f.label.toLowerCase()}…`}
                          isClearable
                          isSearchable
                          styles={selectStyles}
                          menuPlacement="auto"
                          menuPosition="fixed"
                          formatOptionLabel={(o) => (
                            <div className="flex flex-col leading-tight">
                              <span className="text-[13px] text-slate-900 dark:text-white">
                                {o.label}
                              </span>
                              {o.parent && (
                                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                  under {o.parent}
                                </span>
                              )}
                            </div>
                          )}
                          noOptionsMessage={() =>
                            "No ledgers in this org yet. Import from Tally or create one under Ledgers."
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Configuration Modal */}
      <Modal
        title={
          focusedField
            ? `Edit ${focusedField.label}`
            : `${config ? "Edit" : "Create"} Tally configuration`
        }
        labelclassName="btn-outline-dark"
        activeModal={isConfigModalOpen}
        onClose={handleCloseModal}
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Inventory toggle */}
          {!focusedField && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                <Icon icon="heroicons:cube" className="text-sm" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                  Inventory accounting
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Capture inventory details when posting to Tally.
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={configData.tally_product_allow_sync}
                onChange={(e) => handleInputChange("tally_product_allow_sync", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-focus:ring-2 peer-focus:ring-blue-500/20" />
            </label>
          </div>
          )}

          {/* Tax section */}
          {showTaxBlock && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Icon icon="heroicons:receipt-percent" className="text-blue-600 dark:text-blue-400 text-sm" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                Tax configuration
              </h3>
            </div>
            <div className="p-3 space-y-3">
              {TAX_FIELDS.filter(visibleInModal).map((f) => (
                <React.Fragment key={f.key}>{renderMultiSelect(f)}</React.Fragment>
              ))}
            </div>
          </div>
          )}

          {/* Account section */}
          {showAccountBlock && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Icon icon="heroicons:book-open" className="text-blue-600 dark:text-blue-400 text-sm" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                Account configuration
              </h3>
            </div>
            <div className="p-3 space-y-3">
              {ACCOUNT_FIELDS.filter(visibleInModal).map((f) => (
                <React.Fragment key={f.key}>{renderMultiSelect(f)}</React.Fragment>
              ))}
            </div>
          </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <button type="button" onClick={handleCloseModal} className={btnNeutral}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrUpdateConfigMutation.isPending || isLoadingParentLedgers}
              className={btnPrimary}
            >
              {createOrUpdateConfigMutation.isPending ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                  {config ? "Updating…" : "Creating…"}
                </>
              ) : (
                <>
                  <Icon icon={config ? "heroicons:check" : "heroicons:plus"} className="text-sm" />
                  {config ? "Update configuration" : "Create configuration"}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TallySetup;
