import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import ReactSelect from "react-select";
import Modal from "@/components/ui/Modal";
import Tooltip from "@/components/ui/Tooltip";
import {
  useGetTallyConfig,
  useCreateOrUpdateTallyConfig,
  useGetParentLedgers,
  useGetGstRateLedgerMappings,
  useUpsertGstRateLedgerMappings,
  useGetTallyCgstLedgers,
  useGetTallySgstLedgers,
  useGetTallyIgstLedgers,
} from "@/services/tally/tallyApiService";
import { globalToast } from "@/utils/toast";

const GST_RATES = ["0.00", "5.00", "12.00", "18.00", "28.00"];

/* ------------------------------------------------------------------ */
/*  Calm react-select styling that matches the rest of the design     */
/* ------------------------------------------------------------------ */
const reactSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "42px",
    border: state.isFocused ? "1px solid rgb(59 130 246)" : "1px solid rgb(226 232 240)",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.15)" : "none",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    "&:hover": {
      border: state.isFocused ? "1px solid rgb(59 130 246)" : "1px solid rgb(203 213 225)",
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid rgb(226 232 240)",
    boxShadow: "0 8px 24px -8px rgba(15, 23, 42, 0.10)",
    overflow: "hidden",
    zIndex: 60,
  }),
  menuList: (p) => ({ ...p, padding: "4px" }),
  multiValue: (p) => ({
    ...p,
    backgroundColor: "rgb(239 246 255)",
    borderRadius: "6px",
    border: "1px solid rgb(219 234 254)",
    margin: "2px 3px",
  }),
  multiValueLabel: (p) => ({
    ...p,
    color: "rgb(29 78 216)",
    fontSize: "12.5px",
    fontWeight: 600,
    padding: "3px 6px",
  }),
  multiValueRemove: (p) => ({
    ...p,
    color: "rgb(29 78 216)",
    borderRadius: "4px",
    "&:hover": { backgroundColor: "rgb(254 226 226)", color: "rgb(220 38 38)" },
  }),
  placeholder: (p) => ({ ...p, color: "rgb(148 163 184)", fontSize: "14px" }),
  input: (p) => ({ ...p, color: "rgb(15 23 42)", fontSize: "14px" }),
  indicatorSeparator: (p) => ({ ...p, backgroundColor: "rgb(226 232 240)" }),
  dropdownIndicator: (p, state) => ({
    ...p,
    color: state.isFocused ? "rgb(59 130 246)" : "rgb(148 163 184)",
    "&:hover": { color: "rgb(59 130 246)" },
  }),
  clearIndicator: (p) => ({
    ...p,
    color: "rgb(148 163 184)",
    "&:hover": { color: "rgb(220 38 38)" },
  }),
};

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

// "Additional Adjustments Mapping" table — Cess / Discount / Freight Charges /
// Round Off / TDS parent-ledger mappings, editable inline below the Tax Mapping table.
const ADDITIONAL_ADJUSTMENT_FIELDS = [
  { key: "cess_parents", display: "cess_parent_names", label: "Cess", icon: "heroicons:receipt-percent" },
  { key: "discount_parents", display: "discount_parent_names", label: "Discount", icon: "heroicons:tag" },
  { key: "freight_parents", display: "freight_parent_names", label: "Freight Charges", icon: "heroicons:truck" },
  { key: "round_off_parents", display: "round_off_parent_names", label: "Round Off", icon: "heroicons:calculator" },
  { key: "tds_parents", display: "tds_parent_names", label: "TDS", icon: "heroicons:document-currency-rupee" },
];

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
};

/* ------------------------------------------------------------------ */

const TallySetup = () => {
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
  const [additionalAdjustmentsState, setAdditionalAdjustmentsState] = useState(() =>
    ADDITIONAL_ADJUSTMENT_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: [] }), {})
  );

  useEffect(() => {
    if (config) {
      setAdditionalAdjustmentsState(
        ADDITIONAL_ADJUSTMENT_FIELDS.reduce(
          (acc, f) => ({ ...acc, [f.key]: config[f.key] || [] }),
          {}
        )
      );
    }
  }, [config]);

  const handleAdditionalAdjustmentChange = (fieldKey, values) => {
    setAdditionalAdjustmentsState((prev) => ({ ...prev, [fieldKey]: values }));
  };

  const handleSaveAdditionalAdjustments = async () => {
    try {
      const payload = ADDITIONAL_ADJUSTMENT_FIELDS.reduce(
        (acc, f) => ({ ...acc, [f.key]: additionalAdjustmentsState[f.key] || [] }),
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
      (sum, f) => sum + (config[f.display]?.length || 0),
      0
    );
  }, [config]);

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

  const handleOpenModal = () => {
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

  const renderLedgerList = (names = [], title, icon) => (
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
          styles={reactSelectStyles}
          menuPlacement="auto"
          menuPosition="fixed"
        />
      </div>
    );
  };

  /* ----- Empty / loading / no workspace states ----- */

  if (!selectedOrganization?.id) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
          <Icon icon="heroicons:building-office" className="text-2xl" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Please select a client to configure Tally integration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tally integration
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Map Tally parent ledgers to BillMunshi categories so vouchers post correctly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-base ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleOpenModal}
            disabled={isLoading}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
          >
            <Icon icon={config ? "heroicons:pencil-square" : "heroicons:plus"} className="text-base" />
            {config ? "Edit configuration" : "Create configuration"}
          </button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
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
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 flex items-center gap-3"
          >
            <span className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
              <Icon icon={s.icon} className="text-sm" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {s.label}
              </div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                {isLoading ? "—" : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
            <Icon icon="heroicons:exclamation-triangle" className="text-2xl" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Failed to load configuration</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
            {error?.data?.message || error?.message || "An error occurred while fetching the configuration."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className="text-base" />
            Try again
          </button>
        </div>
      ) : !config ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Icon icon="heroicons:cog-6-tooth" className="text-3xl" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">No configuration yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-md mx-auto">
            Set up Tally ledger mappings so purchase vouchers, journal entries, and taxes post to the right ledgers automatically.
          </p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
          >
            <Icon icon="heroicons:plus" className="text-base" />
            Create configuration
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tax ledgers section */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
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
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {taxConfigured} mapped
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {TAX_FIELDS.map((f) => (
                <React.Fragment key={f.key}>
                  {renderLedgerList(config[f.display] || [], f.label, f.icon)}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* Account ledgers section */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
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
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {accountConfigured} mapped
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {ACCOUNT_FIELDS.map((f) => (
                <React.Fragment key={f.key}>
                  {renderLedgerList(config[f.display] || [], f.label, f.icon)}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* Tax & Adjustments section */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
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
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {rateMappingsConfigured} mapped
                </span>
                <button
                  type="button"
                  onClick={handleSaveRateMappings}
                  disabled={
                    upsertGstRateMappingsMutation.isPending || isLoadingGstRateMappings
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-md shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20 transition-all cursor-pointer"
                >
                  {upsertGstRateMappingsMutation.isPending ? (
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
              <div className="hidden md:grid grid-cols-[100px_1fr_1fr_1fr] gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
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
                    className="grid grid-cols-1 md:grid-cols-[100px_1fr_1fr_1fr] gap-3 px-4 py-3 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-9 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 text-[12px] font-bold">
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
                      styles={reactSelectStyles}
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
                      styles={reactSelectStyles}
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
                      styles={reactSelectStyles}
                      menuPlacement="auto"
                      menuPosition="fixed"
                    />
                  </div>
                ))}
              </div>
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
                  content="Map the parent ledger(s) Tally should use when posting Cess, Discount, Freight Charges, Round Off and TDS adjustments."
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
                  disabled={createOrUpdateConfigMutation.isPending || isLoadingParentLedgers}
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
              <div className="hidden md:grid grid-cols-[220px_1fr] gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Item
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Ledger
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {ADDITIONAL_ADJUSTMENT_FIELDS.map((f) => (
                  <div
                    key={f.key}
                    className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 px-4 py-3 items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Icon icon={f.icon} className="text-blue-600 dark:text-blue-400 text-sm" />
                      <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                        {f.label}
                      </span>
                    </div>
                    {isLoadingParentLedgers ? (
                      <div className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ) : (
                      <ReactSelect
                        isMulti
                        options={parentLedgerOptions}
                        value={parentLedgerOptions.filter((o) =>
                          (additionalAdjustmentsState[f.key] || []).includes(o.value)
                        )}
                        onChange={(selected) => {
                          const vals = Array.isArray(selected) ? selected.map((s) => s.value) : [];
                          handleAdditionalAdjustmentChange(f.key, vals);
                        }}
                        placeholder={`Select parent ledger(s) for ${f.label.toLowerCase()}…`}
                        isSearchable
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                        styles={reactSelectStyles}
                        menuPlacement="auto"
                        menuPosition="fixed"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Configuration Modal */}
      <Modal
        title={`${config ? "Edit" : "Create"} Tally configuration`}
        labelclassName="btn-outline-dark"
        activeModal={isConfigModalOpen}
        onClose={handleCloseModal}
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Inventory toggle */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                <Icon icon="heroicons:cube" className="text-base" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  Inventory accounting
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
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
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-focus:ring-2 peer-focus:ring-blue-500/20" />
            </label>
          </div>

          {/* Tax section */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Icon icon="heroicons:receipt-percent" className="text-blue-600 dark:text-blue-400 text-base" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Tax configuration
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {TAX_FIELDS.map((f) => (
                <React.Fragment key={f.key}>{renderMultiSelect(f)}</React.Fragment>
              ))}
            </div>
          </div>

          {/* Account section */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Icon icon="heroicons:book-open" className="text-blue-600 dark:text-blue-400 text-base" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Account configuration
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {ACCOUNT_FIELDS.map((f) => (
                <React.Fragment key={f.key}>{renderMultiSelect(f)}</React.Fragment>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrUpdateConfigMutation.isPending || isLoadingParentLedgers}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
            >
              {createOrUpdateConfigMutation.isPending ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                  {config ? "Updating…" : "Creating…"}
                </>
              ) : (
                <>
                  <Icon icon={config ? "heroicons:check" : "heroicons:plus"} className="text-base" />
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
