import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import Switch from "@/components/ui/Switch";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import {
  useGetTallyVendorBillDetails,
  useUpdateTallyVendorBill,
  useVerifyTallyVendorBill,
  useSyncTallyVendorBill,
} from "@/services/tally/tallyVendorBillService";
import {
  useGetTallyLedgers,
  useGetTallyVendorLedgers,
  useGetTallyTaxLedgers,
  useGetTallyCgstLedgers,
  useGetTallySgstLedgers,
  useGetTallyIgstLedgers,
  useGetTallyMasters,
  useGetTallyConfig,
  useGetTallyPurchaseLedgers,
  useGetTallyExpenseChartOfAccountsLedgers,
  useGetGstRateLedgerMappings,
} from "@/services/tally/tallyApiService";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";
import { QuickAddGroup } from "@/components/tally/QuickAddMaster";
import { tallySyncWithMastersGuard } from "@/utils/tallySyncGuard";
import { toast } from "sonner";

/**
 * Number input that lets the user type freely.
 *
 * The naive ``value={Number(value).toFixed(2)}`` pattern is hostile to
 * typing — every keystroke re-renders, snaps the displayed value back
 * to a 2-dp formatted string, and resets the caret. Intermediate states
 * like ``2.``, ``2.5`` or an empty cell during clear+retype become
 * impossible to land on.
 *
 * This wrapper keeps a local ``draft`` string while focused so the user
 * sees exactly what they typed. ``onCommit`` fires on blur (or Enter),
 * passing the parsed numeric string to the parent. While unfocused,
 * the input reflects the parent ``value`` formatted to 2 decimals.
 *
 * Geometry (``px-2 py-1.5 text-xs``) is deliberately identical to the
 * native selects and the ``size="sm"`` ledger dropdowns it sits beside in
 * the tax tables, so every control in a row is the same height.
 */
const EditableTaxAmount = ({ value, disabled, onCommit }) => {
  const formatted = Number(value || 0).toFixed(2);
  const [draft, setDraft] = useState(formatted);
  const [focused, setFocused] = useState(false);

  // When the parent-driven value changes (e.g. another cell triggered a
  // redistribution), sync the draft — but ONLY if the user isn't
  // currently typing into this input.
  useEffect(() => {
    if (!focused) setDraft(formatted);
  }, [formatted, focused]);

  const commit = () => {
    setFocused(false);
    const trimmed = draft.trim();
    if (trimmed === "") {
      onCommit("0");
      setDraft("0.00");
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      // Revert to last known good value.
      setDraft(formatted);
      return;
    }
    onCommit(String(parsed));
    setDraft(parsed.toFixed(2));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      disabled={disabled}
      onFocus={(e) => {
        setFocused(true);
        e.target.select();
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          setDraft(formatted);
          e.currentTarget.blur();
        }
      }}
      className="w-full px-2 py-1.5 text-xs font-mono text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
};

const TallyVendorBillDetail = () => {
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [collapsed, setMenuCollapsed] = useSidebar();
  const navigate = useNavigate();
  const { id: billId } = useParams();
  const { selectedOrganization } = useSelector((state) => state.auth);

  // Refs to track if initial matching has been done
  const vendorMatchedRef = useRef(false);
  const stockItemsMatchedRef = useRef(false);
  const taxLedgersMatchedRef = useRef(false);
  const productTaxMatchedRef = useRef(false);
  const stockItemsInitialMatchedRef = useRef(false);

  // Tracks which adjustment ledgers the user has explicitly CLEARED in
  // this session (via the dropdown's × button). Without this, the
  // auto-match effect would immediately re-fill the field from
  // ``tallyAnalysedData`` because its condition is
  // ``backendValue && !currentValue`` — clearing sets current to null
  // and the effect re-applies the backend value, defeating the X click.
  const userClearedLedgersRef = useRef(new Set());

  // Form state for vendor information
  const [vendorForm, setVendorForm] = useState({
    vendorName: "",
    invoiceNumber: "",
    vendorGST: "",
    dateIssued: "",
    dueDate: "",
    selectedVendor: null,
    is_tax: "TDS", // Default to TDS
  });

  // State for managing item quantities
  const [itemQuantities, setItemQuantities] = useState([]);

  // State for managing products from tally_bill
  const [products, setProducts] = useState([]);

  // State for consolidate toggle
  const [isConsolidated, setIsConsolidated] = useState(false);

  // State for TDS/TCS selection
  const [selectedTdsTcs, setSelectedTdsTcs] = useState(null);

  // Form state for bill summary
  const [billSummaryForm, setBillSummaryForm] = useState({
    subtotal: "",
    cgst: "",
    sgst: "",
    igst: "",
    total: "",
    cgstLedgerId: null,
    sgstLedgerId: null,
    igstLedgerId: null,
    discount: "",
    discountLedgerId: null,
    cess: "",
    cessLedgerId: null,
    freight: "",
    freightLedgerId: null,
    round_off: "",
    roundOffLedgerId: null,
  });

  // State for notes
  const [notes, setNotes] = useState("");

  // State for date validation errors
  const [dateErrors, setDateErrors] = useState({
    dateIssued: "",
    dueDate: "",
  });

  // State for image zoom and viewing
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State for verification loading
  const [isVerifying, setIsVerifying] = useState(false);

  // State for verification
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', or null
  const [verificationMessage, setVerificationMessage] = useState("");

  // State to track if user manually cleared vendor selection
  const [vendorManuallyCleared, setVendorManuallyCleared] = useState(false);

  // State for sync operation
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch vendor bill details
  const {
    data: vendorBillData,
    error,
    isLoading,
    // `isLoading` is `isPending && isFetching` in react-query v5, so it
    // is false once the bill has loaded once. `isFetching` is the flag
    // that stays true for a manual refetch — the Refresh spinner needs
    // that one, not `isLoading`.
    isFetching,
    refetch,
  } = useGetTallyVendorBillDetails(
    { organizationId: selectedOrganization?.id, billId },
    { enabled: !!selectedOrganization?.id && !!billId },
  );

  // Fetch Tally config to get product sync setting
  const { data: configResponse } = useGetTallyConfig(selectedOrganization?.id, {
    enabled: !!selectedOrganization?.id,
  });

  // Fetch ledgers for dropdown (available for Tally)
  const { data: ledgersData, isLoading: ledgersLoading } = useGetTallyLedgers(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization?.id },
  );

  // Fetch vendor ledgers for vendor selection dropdown
  const { data: vendorLedgersData, isLoading: vendorLedgersLoading } =
    useGetTallyVendorLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch tax ledgers for product tax selection dropdown
  const { data: taxLedgersData, isLoading: taxLedgersLoading } =
    useGetTallyTaxLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch CGST ledgers for CGST dropdown
  const { data: cgstLedgersData, isLoading: cgstLedgersLoading } =
    useGetTallyCgstLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch SGST ledgers for SGST dropdown
  const { data: sgstLedgersData, isLoading: sgstLedgersLoading } =
    useGetTallySgstLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch IGST ledgers for IGST dropdown
  const { data: igstLedgersData, isLoading: igstLedgersLoading } =
    useGetTallyIgstLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch Purchase ledgers for discount dropdown
  const { data: purchaseLedgersData, isLoading: purchaseLedgersLoading } =
    useGetTallyPurchaseLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch Expense ledgers for discount dropdown
  const { data: expenseLedgersData, isLoading: expenseLedgersLoading } =
    useGetTallyExpenseChartOfAccountsLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch masters data for item name dropdown
  const { data: mastersData, isLoading: mastersLoading } = useGetTallyMasters(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization?.id },
  );

  // GST rate → CGST/SGST/IGST ledger mapping (used for line-item tax ledger auto-fill)
  const { data: gstRateMappingsResponse } = useGetGstRateLedgerMappings(
    selectedOrganization?.id,
    { enabled: !!selectedOrganization?.id },
  );
  const rateLedgerMap = useMemo(() => {
    const list = gstRateMappingsResponse?.data || [];
    const m = {};
    list.forEach((entry) => {
      const rateKey = String(Number(entry.rate));
      m[rateKey] = {
        cgst_ledger: entry.cgst_ledger || null,
        cgst_ledger_name: entry.cgst_ledger_name || "",
        sgst_ledger: entry.sgst_ledger || null,
        sgst_ledger_name: entry.sgst_ledger_name || "",
        igst_ledger: entry.igst_ledger || null,
        igst_ledger_name: entry.igst_ledger_name || "",
      };
    });
    return m;
  }, [gstRateMappingsResponse]);

  // Parse "18%" / "5%" / "Exempted" / "" → numeric rate ("18", "5", "0").
  const parseGstRate = (gst) => {
    if (!gst) return null;
    const match = String(gst).match(/([\d.]+)/);
    if (!match) return "0";
    return String(Number(match[1]));
  };

  // Resolve the per-line tax ledgers for a given GST rate, using mapping + bill GST type.
  // Returns { cgst_ledger, sgst_ledger, igst_ledger } where each is the ledger UUID or null.
  const resolveLineTaxLedgers = (gstRateText) => {
    const rateKey = parseGstRate(gstRateText);
    if (!rateKey) return { cgst_ledger: null, sgst_ledger: null, igst_ledger: null };
    const mapping = rateLedgerMap[rateKey];
    if (!mapping) return { cgst_ledger: null, sgst_ledger: null, igst_ledger: null };
    return {
      cgst_ledger: mapping.cgst_ledger,
      sgst_ledger: mapping.sgst_ledger,
      igst_ledger: mapping.igst_ledger,
    };
  };

  // Bill-level CGST / SGST / IGST derived from per-line values. The backend
  // verify endpoint reconciles line totals against bill-level totals (±₹1),
  // so we keep them in sync as the user edits line items.
  const lineTaxTotals = useMemo(() => {
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    (products || []).forEach((p) => {
      cgst += parseFloat(p.cgst) || 0;
      sgst += parseFloat(p.sgst) || 0;
      igst += parseFloat(p.igst) || 0;
    });
    return {
      cgst: Number(cgst.toFixed(2)),
      sgst: Number(sgst.toFixed(2)),
      igst: Number(igst.toFixed(2)),
    };
  }, [products]);

  useEffect(() => {
    setBillSummaryForm((prev) => ({
      ...prev,
      cgst: String(lineTaxTotals.cgst || 0),
      sgst: String(lineTaxTotals.sgst || 0),
      igst: String(lineTaxTotals.igst || 0),
    }));
  }, [lineTaxTotals.cgst, lineTaxTotals.sgst, lineTaxTotals.igst]);

  // Group line items by GST rate for the read-only Tax-by-rate rollup table.
  // The bucket also carries the currently-effective CGST/SGST/IGST ledger so
  // the inline dropdowns can show a real "selected" value. When the products
  // in the bucket disagree on a ledger (rare, manual edit on a single line),
  // we surface that with a special ``mixed`` marker so the user notices.
  const taxRateRollup = useMemo(() => {
    const buckets = {};
    (products || []).forEach((p) => {
      const rateKey = parseGstRate(p.gst);
      if (rateKey === null) return;
      if (!buckets[rateKey]) {
        buckets[rateKey] = {
          rate: rateKey,
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          // Default-fall-back to the org's rate→ledger mapping until any
          // product in the bucket picks a custom ledger.
          cgst_ledger_id: rateLedgerMap[rateKey]?.cgst_ledger || null,
          sgst_ledger_id: rateLedgerMap[rateKey]?.sgst_ledger || null,
          igst_ledger_id: rateLedgerMap[rateKey]?.igst_ledger || null,
          cgst_ledger_name: rateLedgerMap[rateKey]?.cgst_ledger_name || "",
          sgst_ledger_name: rateLedgerMap[rateKey]?.sgst_ledger_name || "",
          igst_ledger_name: rateLedgerMap[rateKey]?.igst_ledger_name || "",
          _cgst_ledger_ids: new Set(),
          _sgst_ledger_ids: new Set(),
          _igst_ledger_ids: new Set(),
        };
      }
      buckets[rateKey].taxable += parseFloat(p.amount) || 0;
      buckets[rateKey].cgst += parseFloat(p.cgst) || 0;
      buckets[rateKey].sgst += parseFloat(p.sgst) || 0;
      buckets[rateKey].igst += parseFloat(p.igst) || 0;
      if (p.cgst_ledger) buckets[rateKey]._cgst_ledger_ids.add(p.cgst_ledger);
      if (p.sgst_ledger) buckets[rateKey]._sgst_ledger_ids.add(p.sgst_ledger);
      if (p.igst_ledger) buckets[rateKey]._igst_ledger_ids.add(p.igst_ledger);
    });
    return Object.values(buckets)
      .map((b) => {
        // If every product in the bucket agrees on the per-line ledger, use
        // that as the selected value; otherwise stay on the rate-map default.
        ["cgst", "sgst", "igst"].forEach((t) => {
          const ids = b[`_${t}_ledger_ids`];
          if (ids.size === 1) {
            b[`${t}_ledger_id`] = Array.from(ids)[0];
          } else if (ids.size > 1) {
            b[`${t}_ledger_mixed`] = true;
          }
          delete b[`_${t}_ledger_ids`];
        });
        return b;
      })
      .sort((a, b) => Number(a.rate) - Number(b.rate));
  }, [products, rateLedgerMap]);

  // Update mutation
  const { mutateAsync: updateVendorBill } = useUpdateTallyVendorBill();

  // Verify mutation
  const { mutateAsync: verifyVendorBill } = useVerifyTallyVendorBill();

  // Sync mutation
  const { mutateAsync: syncVendorBill } = useSyncTallyVendorBill();

  // Extract data from the API response - Memoized to prevent recreating objects on every render
  const billInfo = useMemo(
    () => vendorBillData?.bill || vendorBillData || {},
    [vendorBillData],
  );
  const analysedData = useMemo(
    () => vendorBillData?.analysed_data || billInfo?.analysed_data || {},
    [vendorBillData, billInfo],
  );
  const tallyAnalysedData = useMemo(
    () => vendorBillData?.analyzed_bill || {},
    [vendorBillData],
  );

  // Bill-image vs line-items reconciliation. ``analysed_data`` carries
  // the raw CGST/SGST/IGST values extracted from the original bill image
  // before any user edits. The user can re-pick GST rates per line, which
  // silently shifts line tax totals. We compare the two sides so the
  // operator gets an explicit warning when the verified bill no longer
  // matches what was printed on the invoice.
  const billTaxMatch = useMemo(() => {
    const TOL = 1; // ±₹1 — same tolerance as the backend verify check
    const billValues = {
      cgst: parseFloat(analysedData?.cgst) || 0,
      sgst: parseFloat(analysedData?.sgst) || 0,
      igst: parseFloat(analysedData?.igst) || 0,
    };
    const haveBillValues =
      billValues.cgst > 0 || billValues.sgst > 0 || billValues.igst > 0;
    if (!haveBillValues) {
      return { hasBillValues: false };
    }
    const diffs = {
      cgst: Number((lineTaxTotals.cgst - billValues.cgst).toFixed(2)),
      sgst: Number((lineTaxTotals.sgst - billValues.sgst).toFixed(2)),
      igst: Number((lineTaxTotals.igst - billValues.igst).toFixed(2)),
    };
    const mismatches = ["cgst", "sgst", "igst"].filter(
      (k) => Math.abs(diffs[k]) > TOL,
    );
    return {
      hasBillValues: true,
      billValues,
      diffs,
      mismatches,
      isMatch: mismatches.length === 0,
    };
  }, [analysedData, lineTaxTotals]);

  // Invoice-total reconciliation. Compares the OCR-extracted invoice
  // total against the auto-computed total (subtotal + taxes + adjustments).
  // Like ``billTaxMatch``, this is informational only — it never blocks
  // verification, just surfaces drift so the operator can sanity-check.
  const billTotalMatch = useMemo(() => {
    const TOL = 1; // ±₹1 — same as the tax tolerance
    const billTotal = parseFloat(analysedData?.total);
    const computedTotal = parseFloat(billSummaryForm.total);
    if (!billTotal || Number.isNaN(billTotal)) {
      return { hasBillValue: false };
    }
    if (Number.isNaN(computedTotal)) {
      return { hasBillValue: false };
    }
    const diff = Number((computedTotal - billTotal).toFixed(2));
    return {
      hasBillValue: true,
      billTotal,
      computedTotal,
      diff,
      isMatch: Math.abs(diff) <= TOL,
    };
  }, [analysedData?.total, billSummaryForm.total]);

  const productSync = useMemo(
    () => configResponse?.data?.tally_product_allow_sync || false,
    [configResponse],
  );

  // Disable inputs only when bill is fully posted to Tally (tally_synced is true)
  const isVerified = billInfo?.tally_synced === true;

  // Validation helper functions
  const isVendorRequired = !vendorForm.selectedVendor;
  const getProductsWithoutItemName = () =>
    productSync ? products.filter((product) => !product.item_id) : [];
  const getProductsWithoutTaxLedger = () =>
    products.filter((product) => !product.tax_ledger_id);
  const getProductsWithoutGST = () =>
    products.filter((product) => !product.gst);
  // Ledger that will actually carry a line's CGST/SGST/IGST, in the same
  // order the sync XML resolves it: the explicit per-line pick, then the
  // org's rate→ledger mapping default (what the Tax-by-rate dropdown shows
  // when no line has an explicit pick), then the bill-level ledger the XML
  // builder falls back to.
  const effectiveLineTaxLedger = (product, taxType) =>
    product?.[`${taxType}_ledger`] ||
    rateLedgerMap[parseGstRate(product?.gst)]?.[`${taxType}_ledger`] ||
    billSummaryForm[`${taxType}LedgerId`] ||
    null;

  // Lines carrying a non-zero tax amount with no ledger to post it to.
  //
  // This is validated per line — NOT against ``billSummaryForm.*LedgerId``.
  // The bill-level CGST/SGST/IGST dropdowns were removed when tax ledgers
  // moved into the per-rate table, so the old bill-level check could only
  // ever be satisfied by backend auto-match: picking a ledger in the UI
  // left the warning banner stuck on screen with nothing left to fix.
  const getLinesWithoutTaxLedger = (taxType) =>
    (products || []).filter(
      (p) =>
        (parseFloat(p[taxType]) || 0) > 0 && !effectiveLineTaxLedger(p, taxType),
    );
  const isCgstLedgerRequired = () => getLinesWithoutTaxLedger("cgst").length > 0;
  const isSgstLedgerRequired = () => getLinesWithoutTaxLedger("sgst").length > 0;
  const isIgstLedgerRequired = () => getLinesWithoutTaxLedger("igst").length > 0;

  // "Select a CGST ledger for the 5%, 18% rates in the Tax by rate table"
  const missingTaxLedgerMessage = (taxType) => {
    const rates = Array.from(
      new Set(
        getLinesWithoutTaxLedger(taxType)
          .map((p) => parseGstRate(p.gst))
          .filter((r) => r && Number(r) > 0),
      ),
    );
    const where = rates.length
      ? ` for the ${rates.map((r) => `${r}%`).join(", ")} rate${rates.length > 1 ? "s" : ""}`
      : "";
    return `Select a ${taxType.toUpperCase()} ledger${where} in the Tax by rate table`;
  };
  const isDiscountLedgerRequired = () =>
    parseFloat(billSummaryForm.discount || 0) > 0 &&
    !billSummaryForm.discountLedgerId;
  const isCessLedgerRequired = () =>
    parseFloat(billSummaryForm.cess || 0) > 0 && !billSummaryForm.cessLedgerId;
  const isFreightLedgerRequired = () =>
    parseFloat(billSummaryForm.freight || 0) > 0 &&
    !billSummaryForm.freightLedgerId;
  // Round-off ledger required whenever round_off is non-zero (can be
  // negative — abs check via !== 0).
  const isRoundOffLedgerRequired = () =>
    parseFloat(billSummaryForm.round_off || 0) !== 0 &&
    !billSummaryForm.roundOffLedgerId;
  const isSubtotalGreaterThanTotal = () => {
    const subtotal = parseFloat(billSummaryForm.subtotal || 0);
    const total = parseFloat(billSummaryForm.total || 0);
    return subtotal > total && total > 0;
  };
  const hasValidationErrors = () =>
    isVendorRequired ||
    (productSync && getProductsWithoutItemName().length > 0) ||
    getProductsWithoutTaxLedger().length > 0 ||
    getProductsWithoutGST().length > 0 ||
    isCgstLedgerRequired() ||
    isSgstLedgerRequired() ||
    isIgstLedgerRequired() ||
    isDiscountLedgerRequired() ||
    isCessLedgerRequired() ||
    isFreightLedgerRequired() ||
    isRoundOffLedgerRequired() ||
    isSubtotalGreaterThanTotal();

  // Get specific validation error messages
  const getValidationErrorMessages = () => {
    const errors = [];
    if (isVendorRequired) errors.push("Please select a vendor");
    if (productSync && getProductsWithoutItemName().length > 0) {
      errors.push(
        `${getProductsWithoutItemName().length} product(s) are missing item names`,
      );
    }
    if (getProductsWithoutTaxLedger().length > 0) {
      errors.push(
        `${getProductsWithoutTaxLedger().length} product(s) are missing purchase ledgers`,
      );
    }
    if (getProductsWithoutGST().length > 0) {
      errors.push(
        `${getProductsWithoutGST().length} product(s) are missing GST rates`,
      );
    }
    if (isCgstLedgerRequired()) errors.push(missingTaxLedgerMessage("cgst"));
    if (isSgstLedgerRequired()) errors.push(missingTaxLedgerMessage("sgst"));
    if (isIgstLedgerRequired()) errors.push(missingTaxLedgerMessage("igst"));
    if (isDiscountLedgerRequired())
      errors.push("Discount ledger is required when discount amount > 0");
    if (isCessLedgerRequired())
      errors.push("Cess ledger is required when cess amount > 0");
    if (isFreightLedgerRequired())
      errors.push("Freight ledger is required when freight amount > 0");
    if (isRoundOffLedgerRequired())
      errors.push("Round-off ledger is required when round-off amount is set");
    if (isSubtotalGreaterThanTotal()) {
      errors.push(
        `Subtotal (₹${billSummaryForm.subtotal}) cannot be greater than total amount (₹${billSummaryForm.total})`,
      );
    }
    return errors;
  };

  // Date validation helper function
  const validateDateInput = (dateString) => {
    if (!dateString) return true; // Allow empty dates

    // Check if the date string is in valid format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const [year, month, day] = dateString.split("-").map(Number);

    // Validate year (between 1900 and 2100)
    if (year < 1900 || year > 2100) return false;

    // Validate month (1-12)
    if (month < 1 || month > 12) return false;

    // Validate day based on month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;

    return true;
  };

  // Handle date input changes.
  //
  // CRITICAL: always commit the typed value to state, even mid-typing.
  // Native ``<input type="date">`` fires onChange for every intermediate
  // year segment (e.g. ``0002-06-17`` → ``0020-…`` → ``0202-…`` →
  // ``2026-…``). Previously we rejected those intermediates and returned
  // early, so the first three keystrokes of the year were silently
  // dropped — the user had to "type the year three times" before it
  // stuck. The validation is now non-blocking: state always updates,
  // and any error is shown inline. Toast spam on every keystroke is
  // also gone.
  const handleDateChange = (name, value) => {
    // Always update the value first so typing feels responsive.
    handleFormChange(name, value);

    // Then surface a non-blocking inline error if it's invalid. Empty
    // values clear the error. Errors only appear on a fully-formed but
    // out-of-range value — partial dates (e.g. ``002-06-17``) won't
    // match the regex and silently clear, so the user isn't yelled at
    // mid-typing.
    if (!value) {
      setDateErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    if (validateDateInput(value)) {
      setDateErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    // Only emit an error if it parses as a full YYYY-MM-DD — that means
    // the user finished typing and the result is genuinely out-of-range
    // (year < 1900 or > 2100, or a calendar-invalid date).
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      setDateErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    const [year] = value.split("-").map(Number);
    const errorMessage =
      year < 1900 || year > 2100
        ? "Year must be between 1900 and 2100"
        : "Invalid date";
    setDateErrors((prev) => ({ ...prev, [name]: errorMessage }));
  };

  // Process vendor ledgers data for dropdown - Memoized
  const vendorOptions = useMemo(() => {
    if (!vendorLedgersData?.grouped_ledgers) return [];

    const vendors = [];
    Object.values(vendorLedgersData.grouped_ledgers).forEach((group) => {
      if (group.ledgers && Array.isArray(group.ledgers)) {
        group.ledgers.forEach((ledger) => {
          vendors.push({
            id: ledger.id,
            name: ledger.name,
            gst_in: ledger.gst_in,
            master_id: ledger.master_id,
            alter_id: ledger.alter_id,
            opening_balance: ledger.opening_balance,
            company: ledger.company,
            parent_name: group.parent_name,
          });
        });
      }
    });
    return vendors;
  }, [vendorLedgersData]);

  // Process tax ledgers data for dropdown - Memoized
  const taxLedgerOptions = useMemo(() => {
    if (!taxLedgersData?.grouped_ledgers) return [];

    const taxLedgers = [];
    Object.values(taxLedgersData.grouped_ledgers).forEach((group) => {
      if (group.ledgers && Array.isArray(group.ledgers)) {
        group.ledgers.forEach((ledger) => {
          taxLedgers.push({
            id: ledger.id,
            name: ledger.name,
            master_id: ledger.master_id,
            alter_id: ledger.alter_id,
            opening_balance: ledger.opening_balance,
            company: ledger.company,
            parent_name: group.parent_name,
          });
        });
      }
    });
    return taxLedgers;
  }, [taxLedgersData]);

  // Process CGST ledgers data for dropdown - Memoized
  const cgstLedgerOptions = useMemo(() => {
    if (!cgstLedgersData?.grouped_ledgers) return [];

    const cgstLedgers = [];
    Object.values(cgstLedgersData.grouped_ledgers).forEach((group) => {
      if (group.ledgers && Array.isArray(group.ledgers)) {
        group.ledgers.forEach((ledger) => {
          cgstLedgers.push({
            id: ledger.id,
            name: ledger.name,
            master_id: ledger.master_id,
            alter_id: ledger.alter_id,
            opening_balance: ledger.opening_balance,
            company: ledger.company,
            parent_name: group.parent_name,
          });
        });
      }
    });
    return cgstLedgers;
  }, [cgstLedgersData]);

  // Process SGST ledgers data for dropdown - Memoized
  const sgstLedgerOptions = useMemo(() => {
    if (!sgstLedgersData?.grouped_ledgers) return [];

    const sgstLedgers = [];
    Object.values(sgstLedgersData.grouped_ledgers).forEach((group) => {
      if (group.ledgers && Array.isArray(group.ledgers)) {
        group.ledgers.forEach((ledger) => {
          sgstLedgers.push({
            id: ledger.id,
            name: ledger.name,
            master_id: ledger.master_id,
            alter_id: ledger.alter_id,
            opening_balance: ledger.opening_balance,
            company: ledger.company,
            parent_name: group.parent_name,
          });
        });
      }
    });
    return sgstLedgers;
  }, [sgstLedgersData]);

  // Process IGST ledgers data for dropdown - Memoized
  const igstLedgerOptions = useMemo(() => {
    if (!igstLedgersData?.grouped_ledgers) return [];

    const igstLedgers = [];
    Object.values(igstLedgersData.grouped_ledgers).forEach((group) => {
      if (group.ledgers && Array.isArray(group.ledgers)) {
        group.ledgers.forEach((ledger) => {
          igstLedgers.push({
            id: ledger.id,
            name: ledger.name,
            master_id: ledger.master_id,
            alter_id: ledger.alter_id,
            opening_balance: ledger.opening_balance,
            company: ledger.company,
            parent_name: group.parent_name,
          });
        });
      }
    });
    return igstLedgers;
  }, [igstLedgersData]);

  // Process Purchase and Expense ledgers data for discount dropdown - Memoized
  const discountLedgerOptions = useMemo(() => {
    const options = [];
    const seenIds = new Set();

    // Add Purchase ledgers
    if (purchaseLedgersData?.grouped_ledgers) {
      Object.values(purchaseLedgersData.grouped_ledgers).forEach((group) => {
        if (group.ledgers && Array.isArray(group.ledgers)) {
          group.ledgers.forEach((ledger) => {
            // Skip duplicates to avoid key conflicts
            if (seenIds.has(ledger.id)) {
              return;
            }
            seenIds.add(ledger.id);

            options.push({
              id: ledger.id,
              name: ledger.name,
              master_id: ledger.master_id,
              alter_id: ledger.alter_id,
              opening_balance: ledger.opening_balance,
              company: ledger.company,
              parent_name: group.parent_name,
              type: "Purchase",
            });
          });
        }
      });
    }

    // Add Expense ledgers
    if (expenseLedgersData?.grouped_ledgers) {
      Object.values(expenseLedgersData.grouped_ledgers).forEach((group) => {
        if (group.ledgers && Array.isArray(group.ledgers)) {
          group.ledgers.forEach((ledger) => {
            // Skip duplicates to avoid key conflicts
            if (seenIds.has(ledger.id)) {
              return;
            }
            seenIds.add(ledger.id);

            options.push({
              id: ledger.id,
              name: ledger.name,
              master_id: ledger.master_id,
              alter_id: ledger.alter_id,
              opening_balance: ledger.opening_balance,
              company: ledger.company,
              parent_name: group.parent_name,
              type: "Expense",
            });
          });
        }
      });
    }

    return options;
  }, [purchaseLedgersData, expenseLedgersData]);

  // Process masters data for item name dropdown - Memoized
  const stockItemOptions = useMemo(() => {
    if (!mastersData?.stock_items) return [];

    return mastersData.stock_items.map((item) => ({
      id: item.id,
      name: item.name,
      alias: item.alias,
      unit: item.unit,
      category: item.category,
      parent: item.parent,
      gst_applicable: item.gst_applicable,
    }));
  }, [mastersData]);

  // Update form when data is loaded
  useEffect(() => {
    if (vendorBillData) {
      // Reset all matching refs when new data is loaded
      vendorMatchedRef.current = false;
      stockItemsMatchedRef.current = false;
      taxLedgersMatchedRef.current = false;
      productTaxMatchedRef.current = false;
      stockItemsInitialMatchedRef.current = false;

      const data = analysedData;
      const tally = tallyAnalysedData;

      setVendorForm({
        vendorName: tally?.vendor?.name || data.from?.name || "",
        invoiceNumber: data.invoiceNumber || tally?.bill_no || "",
        vendorGST: tally?.vendor?.gst_in || "",
        dateIssued:
          tally?.bill_date ||
          (data.dateIssued
            ? new Date(data.dateIssued).toISOString().split("T")[0]
            : ""),
        dueDate:
          tally?.due_date ||
          (data.dueDate
            ? new Date(data.dueDate).toISOString().split("T")[0]
            : tally?.bill_date ||
              (data.dateIssued
                ? new Date(data.dateIssued).toISOString().split("T")[0]
                : "")),
        selectedVendor: null, // Will be set in the next useEffect
        is_tax: "TDS", // Default to TDS
      });

      // Initialize Bill Summary Form - use analyzed_bill as primary source for total
      const cgstAmount = data.cgst || tally?.cgst || "";
      const sgstAmount = data.sgst || tally?.sgst || "";
      const igstAmount = data.igst || tally?.igst || "";
      const totalAmount = tally?.total || data.total || "";
      const discountAmount = tally?.discount || "";
      const cessAmount = tally?.cess || "";
      const freightAmount = tally?.freight || "";
      const roundOffAmount = tally?.round_off || "";

      setBillSummaryForm({
        subtotal: (
          data.items?.reduce(
            (sum, item) => sum + (item.price * item.quantity || 0),
            0,
          ) || ""
        ).toString(),
        cgst: cgstAmount.toString(),
        sgst: sgstAmount.toString(),
        igst: igstAmount.toString(),
        total: totalAmount.toString(),
        cgstLedgerId: tally?.cgst_taxes || null,
        sgstLedgerId: tally?.sgst_taxes || null,
        igstLedgerId: tally?.igst_taxes || null,
        discount: discountAmount.toString(),
        discountLedgerId: null,
        cess: cessAmount.toString(),
        cessLedgerId: null,
        freight: freightAmount.toString(),
        freightLedgerId: null,
        round_off: roundOffAmount.toString(),
        roundOffLedgerId: tally?.round_off_taxes || null,
      });

      // Seed notes from backend so re-opening a bill shows what the
      // user entered on last verify (was hardcoded to "").
      setNotes(tally?.note || "");

      // Initialize consolidate status from analyzed_bill
      const consolidateStatus = tally?.consolidate || false;
      setIsConsolidated(consolidateStatus);

      // Initialize products based on consolidate status
      let sourceProducts = [];

      if (consolidateStatus) {
        // Use consolidate_prod if available, fallback to consolidated_product
        if (
          tally?.consolidate_prod &&
          Array.isArray(tally.consolidate_prod) &&
          tally.consolidate_prod.length > 0
        ) {
          sourceProducts = tally.consolidate_prod;
        } else if (tally?.consolidated_product) {
          sourceProducts = [tally.consolidated_product];
        }
      } else {
        // Use individual products
        if (tally?.products && Array.isArray(tally.products)) {
          sourceProducts = tally.products;
        }
      }

      if (sourceProducts.length > 0) {
        setProducts(
          sourceProducts.map((item, index) => ({
            id: item.item_id || item.id || index,
            item_id: item.item_id || item.id || null,
            item_name: item.item_name || null,
            item_details: item.item_details || "",
            // Backend guard treats blank/sentinel names as "no change".
            // Send empty string here so a stale "No Purchase Ledger"
            // never round-trips into a real (bogus) ledger row.
            tax_ledger: item.tax_ledger &&
              !["No Purchase Ledger", "No Tax Ledger"].includes(item.tax_ledger)
              ? item.tax_ledger : "",
            tax_ledger_id: item.tax_ledger_id || item.taxes || null,
            price: item.price || item.rate || "",
            quantity: item.quantity || "",
            amount: item.amount || "",
            gst: item.product_gst || "",
            cgst_ledger: item.cgst_ledger || null,
            sgst_ledger: item.sgst_ledger || null,
            igst_ledger: item.igst_ledger || null,
            igst: item.igst || 0.0,
            cgst: item.cgst || 0.0,
            sgst: item.sgst || 0.0,
          })),
        );
      } else if (data.items && data.items.length > 0) {
        setProducts(
          data.items.map((item, index) => ({
            id: Date.now() + index,
            item_id: null,
            item_name: null,
            item_details: item.description || "",
            tax_ledger: "No Purchase Ledger",
            tax_ledger_id: null,
            price: item.price || "",
            quantity: item.quantity || "",
            amount: item.price * item.quantity || "",
            gst: "",
            igst: 0.0,
            cgst: 0.0,
            sgst: 0.0,
          })),
        );
      } else {
        // Initialize with empty product if no products exist
        setProducts([
          {
            id: Date.now(),
            item_id: null,
            item_name: null,
            item_details: "",
            tax_ledger: "No Purchase Ledger",
            tax_ledger_id: null,
            price: "",
            quantity: "",
            amount: "",
            gst: "",
            igst: 0.0,
            cgst: 0.0,
            sgst: 0.0,
          },
        ]);
      }

      // Initialize item quantities
      if (data.items && data.items.length > 0) {
        setItemQuantities(data.items.map((item) => item.quantity || 0));
      }
    }
  }, [vendorBillData, analysedData, tallyAnalysedData]);

  // Match vendor from API response with vendor options when both are available
  // Only auto-match if user hasn't manually cleared the vendor
  useEffect(() => {
    if (vendorMatchedRef.current) return; // Skip if already matched

    if (
      vendorOptions.length > 0 &&
      tallyAnalysedData &&
      !vendorForm.selectedVendor &&
      !vendorManuallyCleared
    ) {
      // First try to match by vendor_name from analyzed_data
      let matchedVendor = null;

      if (tallyAnalysedData.vendor_name) {
        matchedVendor = vendorOptions.find(
          (vendor) => vendor.name === tallyAnalysedData.vendor_name,
        );
      }

      // If not found by vendor_name, try other matching methods
      if (!matchedVendor && tallyAnalysedData.vendor) {
        matchedVendor = vendorOptions.find(
          (vendor) =>
            vendor.name === tallyAnalysedData.vendor.name ||
            vendor.gst_in === tallyAnalysedData.vendor.gst_in ||
            vendor.id === tallyAnalysedData.vendor.id,
        );
      }

      if (matchedVendor) {
        setVendorForm((prev) => ({
          ...prev,
          selectedVendor: matchedVendor,
          vendorName: matchedVendor.name || prev.vendorName,
          vendorGST: matchedVendor.gst_in || prev.vendorGST,
        }));
        vendorMatchedRef.current = true; // Mark as matched
      }
    }
  }, [
    vendorOptions,
    tallyAnalysedData,
    vendorForm.selectedVendor,
    vendorManuallyCleared,
  ]);

  // Match stock items from API response with stock item options when both are available
  useEffect(() => {
    if (stockItemsMatchedRef.current) return; // Skip if already matched

    if (
      stockItemOptions.length > 0 &&
      tallyAnalysedData?.products &&
      products.length > 0
    ) {
      let hasChanges = false;
      const updatedProducts = products.map((product) => {
        // If product already has item_id and a matching stock item exists, don't override
        if (product.item_id) {
          const existingStockItem = stockItemOptions.find(
            (item) => item.id === product.item_id,
          );
          if (existingStockItem) {
            return product;
          }
        }

        // Find corresponding product in analyzed_data by matching various fields
        let analyzedProduct = tallyAnalysedData.products.find(
          (p) =>
            p.item_details === product.item_details ||
            (p.item_id && p.item_id === product.item_id) ||
            (p.item_name && p.item_name === product.item_name),
        );

        if (analyzedProduct) {
          let matchedStockItem = null;

          // First try to match by item_id if available and valid
          if (analyzedProduct.item_id) {
            matchedStockItem = stockItemOptions.find(
              (stockItem) => stockItem.id === analyzedProduct.item_id,
            );
          }

          // If not found by ID, try to match by item_name with case-insensitive comparison
          if (!matchedStockItem && analyzedProduct.item_name) {
            matchedStockItem = stockItemOptions.find(
              (stockItem) =>
                stockItem.name &&
                stockItem.name.toLowerCase().trim() ===
                  analyzedProduct.item_name.toLowerCase().trim(),
            );
          }

          // Update product if we found a matching stock item
          if (matchedStockItem) {
            const currentItemValid =
              product.item_id &&
              stockItemOptions.find((item) => item.id === product.item_id);

            // Only update if current selection is invalid or different
            if (!currentItemValid || product.item_id !== matchedStockItem.id) {
              hasChanges = true;
              return {
                ...product,
                item_id: matchedStockItem.id,
                item_name: matchedStockItem.name,
              };
            }
          }
        }

        return product;
      });

      // Only update if there are actual changes
      if (hasChanges) {
        setProducts(updatedProducts);
      }
      stockItemsMatchedRef.current = true; // Mark as matched
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockItemOptions, tallyAnalysedData]);

  // Match tax ledgers from API response when both are available
  useEffect(() => {
    // Skip once matched — otherwise clearing a ledger from UI would
    // instantly re-fill from the backend name, silently overriding
    // the user's explicit pick (was issue #4).
    if (taxLedgersMatchedRef.current) return;
    // Check if we have the required data for matching
    if (
      cgstLedgerOptions.length > 0 &&
      sgstLedgerOptions.length > 0 &&
      igstLedgerOptions.length > 0 &&
      tallyAnalysedData?.taxes
    ) {
      const taxes = tallyAnalysedData.taxes;
      const updates = {};

      // Match CGST ledger - Always try to match if ledger name exists and current ID is null
      if (
        taxes.cgst?.ledger &&
        taxes.cgst.ledger !== "No Tax Ledger" &&
        !billSummaryForm.cgstLedgerId
      ) {
        // Try exact match first
        let matchedCgstLedger = cgstLedgerOptions.find(
          (ledger) =>
            ledger.name &&
            ledger.name.toLowerCase().trim() ===
              taxes.cgst.ledger.toLowerCase().trim(),
        );

        // Try partial match if exact match fails
        if (!matchedCgstLedger) {
          const searchTerm = taxes.cgst.ledger.toLowerCase().trim();
          matchedCgstLedger = cgstLedgerOptions.find(
            (ledger) =>
              ledger.name &&
              (ledger.name.toLowerCase().includes(searchTerm) ||
                searchTerm.includes(ledger.name.toLowerCase())),
          );
        }

        if (matchedCgstLedger) {
          updates.cgstLedgerId = matchedCgstLedger.id;
        }
      }

      // Match SGST ledger - Always try to match if ledger name exists and current ID is null
      if (
        taxes.sgst?.ledger &&
        taxes.sgst.ledger !== "No Tax Ledger" &&
        !billSummaryForm.sgstLedgerId
      ) {
        // Try exact match first
        let matchedSgstLedger = sgstLedgerOptions.find(
          (ledger) =>
            ledger.name &&
            ledger.name.toLowerCase().trim() ===
              taxes.sgst.ledger.toLowerCase().trim(),
        );

        // Try partial match if exact match fails
        if (!matchedSgstLedger) {
          const searchTerm = taxes.sgst.ledger.toLowerCase().trim();
          matchedSgstLedger = sgstLedgerOptions.find(
            (ledger) =>
              ledger.name &&
              (ledger.name.toLowerCase().includes(searchTerm) ||
                searchTerm.includes(ledger.name.toLowerCase())),
          );
        }

        if (matchedSgstLedger) {
          updates.sgstLedgerId = matchedSgstLedger.id;
        }
      }

      // Match IGST ledger - Always try to match if ledger name exists and current ID is null
      if (
        taxes.igst?.ledger &&
        taxes.igst.ledger !== "No Tax Ledger" &&
        !billSummaryForm.igstLedgerId
      ) {
        // Try exact match first
        let matchedIgstLedger = igstLedgerOptions.find(
          (ledger) =>
            ledger.name &&
            ledger.name.toLowerCase().trim() ===
              taxes.igst.ledger.toLowerCase().trim(),
        );

        // Try partial match if exact match fails
        if (!matchedIgstLedger) {
          const searchTerm = taxes.igst.ledger.toLowerCase().trim();
          matchedIgstLedger = igstLedgerOptions.find(
            (ledger) =>
              ledger.name &&
              (ledger.name.toLowerCase().includes(searchTerm) ||
                searchTerm.includes(ledger.name.toLowerCase())),
          );
        }

        if (matchedIgstLedger) {
          updates.igstLedgerId = matchedIgstLedger.id;
        }
      }

      // Apply all updates in a single setState call
      if (Object.keys(updates).length > 0) {
        setBillSummaryForm((prev) => ({
          ...prev,
          ...updates,
        }));
        taxLedgersMatchedRef.current = true; // Mark as matched
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    cgstLedgerOptions,
    sgstLedgerOptions,
    igstLedgerOptions,
    tallyAnalysedData,
    billSummaryForm.cgstLedgerId,
    billSummaryForm.sgstLedgerId,
    billSummaryForm.igstLedgerId,
  ]);

  // Handle tax ledger IDs when they are returned as IDs (not names) from backend
  useEffect(() => {
    if (!tallyAnalysedData || taxLedgersMatchedRef.current) return;

    // Check if we have tax ledger IDs directly in the analyzed_bill data
    const { cgst_taxes, sgst_taxes, igst_taxes } = tallyAnalysedData;

    if (
      (cgst_taxes || sgst_taxes || igst_taxes) &&
      (cgstLedgerOptions.length > 0 ||
        sgstLedgerOptions.length > 0 ||
        igstLedgerOptions.length > 0)
    ) {
      const updates = {};

      // Match CGST ledger by ID
      if (cgst_taxes && cgstLedgerOptions.length > 0) {
        const matchedCgstLedger = cgstLedgerOptions.find(
          (ledger) => ledger.id === cgst_taxes,
        );
        if (matchedCgstLedger) {
          updates.cgstLedgerId = matchedCgstLedger.id;
        }
      }

      // Match SGST ledger by ID
      if (sgst_taxes && sgstLedgerOptions.length > 0) {
        const matchedSgstLedger = sgstLedgerOptions.find(
          (ledger) => ledger.id === sgst_taxes,
        );
        if (matchedSgstLedger) {
          updates.sgstLedgerId = matchedSgstLedger.id;
        }
      }

      // Match IGST ledger by ID
      if (igst_taxes && igstLedgerOptions.length > 0) {
        const matchedIgstLedger = igstLedgerOptions.find(
          (ledger) => ledger.id === igst_taxes,
        );
        if (matchedIgstLedger) {
          updates.igstLedgerId = matchedIgstLedger.id;
        }
      }

      // Apply updates if any were found
      if (Object.keys(updates).length > 0) {
        setBillSummaryForm((prev) => ({
          ...prev,
          ...updates,
        }));
        taxLedgersMatchedRef.current = true;
      }
    }
  }, [
    tallyAnalysedData,
    cgstLedgerOptions,
    sgstLedgerOptions,
    igstLedgerOptions,
  ]);

  // Handle discount ledger ID when returned from backend
  useEffect(() => {
    if (!tallyAnalysedData) return;

    const { discount_taxes, cess_taxes, freight_taxes, round_off_taxes } =
      tallyAnalysedData;

    if (discountLedgerOptions.length > 0) {
      const updates = {};
      // ``userClearedLedgersRef`` lets the user actually clear a ledger
      // via the dropdown × — without this guard, the effect would
      // immediately re-fill the field from the backend value.
      const cleared = userClearedLedgersRef.current;

      if (
        discount_taxes &&
        !billSummaryForm.discountLedgerId &&
        !cleared.has("discount")
      ) {
        const matchedDiscountLedger = discountLedgerOptions.find(
          (ledger) => ledger.id === discount_taxes,
        );
        if (matchedDiscountLedger) {
          updates.discountLedgerId = matchedDiscountLedger.id;
        }
      }

      if (
        cess_taxes &&
        !billSummaryForm.cessLedgerId &&
        !cleared.has("cess")
      ) {
        const matchedCessLedger = discountLedgerOptions.find(
          (ledger) => ledger.id === cess_taxes,
        );
        if (matchedCessLedger) {
          updates.cessLedgerId = matchedCessLedger.id;
        }
      }

      if (
        freight_taxes &&
        !billSummaryForm.freightLedgerId &&
        !cleared.has("freight")
      ) {
        const matchedFreightLedger = discountLedgerOptions.find(
          (ledger) => ledger.id === freight_taxes,
        );
        if (matchedFreightLedger) {
          updates.freightLedgerId = matchedFreightLedger.id;
        }
      }

      if (
        round_off_taxes &&
        !billSummaryForm.roundOffLedgerId &&
        !cleared.has("round_off")
      ) {
        const matchedRoundOffLedger = discountLedgerOptions.find(
          (ledger) => ledger.id === round_off_taxes,
        );
        if (matchedRoundOffLedger) {
          updates.roundOffLedgerId = matchedRoundOffLedger.id;
        }
      }

      if (Object.keys(updates).length > 0) {
        setBillSummaryForm((prev) => ({
          ...prev,
          ...updates,
        }));
      }
    }
  }, [
    tallyAnalysedData,
    discountLedgerOptions,
    billSummaryForm.discountLedgerId,
    billSummaryForm.cessLedgerId,
    billSummaryForm.freightLedgerId,
    billSummaryForm.roundOffLedgerId,
  ]);

  // Auto-select freight ledger when discount amount > 0 and no freight
  // ledger selected. Skipped if the user explicitly cleared freight in
  // this session (same guard as the main auto-match effect above).
  useEffect(() => {
    if (
      parseFloat(billSummaryForm.discount || 0) > 0 &&
      !billSummaryForm.freightLedgerId &&
      !userClearedLedgersRef.current.has("freight") &&
      discountLedgerOptions.length > 0
    ) {
      const freightLedger = discountLedgerOptions.find(
        (ledger) =>
          ledger.name?.toLowerCase() === "delivery charges" ||
          ledger.name?.toLowerCase() === "freight inward",
      );
      if (freightLedger) {
        setBillSummaryForm((prev) => ({
          ...prev,
          freightLedgerId: freightLedger.id,
        }));
      }
    }
  }, [
    billSummaryForm.discount,
    billSummaryForm.freightLedgerId,
    discountLedgerOptions,
  ]);

  // Match product tax ledgers from API response
  useEffect(() => {
    // Check if we need to run matching logic
    // Skip if already matched AND taxLedgerOptions and tallyAnalysedData haven't changed
    if (productTaxMatchedRef.current && taxLedgerOptions.length > 0) {
      // Check if any products have invalid or missing tax_ledger_id
      const needsReMatching = products.some(
        (product) =>
          !product.tax_ledger_id ||
          !taxLedgerOptions.find(
            (ledger) => ledger.id === product.tax_ledger_id,
          ),
      );

      if (!needsReMatching) {
        return; // Skip if all products have valid tax_ledger_id
      }
    }

    if (taxLedgerOptions.length > 0 && products.length > 0) {
      let hasChanges = false;

      const updatedProducts = products.map((product, index) => {
        // If product already has a valid tax_ledger_id, don't override
        if (product.tax_ledger_id) {
          const isValidId = taxLedgerOptions.find(
            (ledger) => ledger.id === product.tax_ledger_id,
          );
          if (isValidId) {
            return product;
          }
        }

        // Try to match by the tax_ledger name or ID from the product
        let taxLedgerToMatch = product.tax_ledger;
        let taxLedgerIdToMatch = null;

        // Also check analyzed_data if available
        if (tallyAnalysedData?.products) {
          const analyzedProduct =
            tallyAnalysedData.products[index] ||
            tallyAnalysedData.products.find(
              (p) =>
                p.item_details === product.item_details ||
                p.item_name === product.item_name,
            );

          if (analyzedProduct) {
            // Check for tax ledger name
            if (
              analyzedProduct.tax_ledger &&
              analyzedProduct.tax_ledger !== "No Tax Ledger"
            ) {
              taxLedgerToMatch = analyzedProduct.tax_ledger;
            }
            // Check for tax ledger ID (when backend returns IDs instead of names)
            if (analyzedProduct.taxes) {
              taxLedgerIdToMatch = analyzedProduct.taxes;
            }
          }
        }

        // First try: Match by ID if available
        if (taxLedgerIdToMatch && taxLedgerOptions.length > 0) {
          const matchedTaxLedgerById = taxLedgerOptions.find(
            (taxLedger) => taxLedger.id === taxLedgerIdToMatch,
          );
          if (
            matchedTaxLedgerById &&
            product.tax_ledger_id !== matchedTaxLedgerById.id
          ) {
            hasChanges = true;
            return {
              ...product,
              tax_ledger_id: matchedTaxLedgerById.id,
            };
          }
        } else if (taxLedgerToMatch && taxLedgerToMatch !== "No Tax Ledger") {
          let matchedTaxLedger = null;

          // First try: Exact match (case-insensitive and trimmed)
          matchedTaxLedger = taxLedgerOptions.find(
            (taxLedger) =>
              taxLedger.name &&
              taxLedger.name.toLowerCase().trim() ===
                taxLedgerToMatch.toLowerCase().trim(),
          );

          // Second try: Partial match if exact match fails (for typos like PURCHAGE vs PURCHASE)
          if (!matchedTaxLedger) {
            const searchTerm = taxLedgerToMatch.toLowerCase().trim();
            matchedTaxLedger = taxLedgerOptions.find(
              (taxLedger) =>
                taxLedger.name &&
                (taxLedger.name.toLowerCase().includes(searchTerm) ||
                  searchTerm.includes(taxLedger.name.toLowerCase())),
            );
          }

          if (
            matchedTaxLedger &&
            product.tax_ledger_id !== matchedTaxLedger.id
          ) {
            hasChanges = true;
            return {
              ...product,
              tax_ledger: matchedTaxLedger.name,
              tax_ledger_id: matchedTaxLedger.id,
            };
          }
        }

        return product;
      });

      if (hasChanges) {
        setProducts(updatedProducts);
        productTaxMatchedRef.current = true; // Mark as matched only after successful update
      } else {
        // No changes needed, mark as matched
        productTaxMatchedRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxLedgerOptions, tallyAnalysedData, products]);

  // Specific effect to handle initial stock item selection after products are loaded
  useEffect(() => {
    if (stockItemsInitialMatchedRef.current) return; // Skip if already matched

    if (stockItemOptions.length > 0 && products.length > 0) {
      let needsUpdate = false;
      const updatedProducts = products.map((product) => {
        // Case 1: Product has item_id and it exists in stockItemOptions
        if (product.item_id) {
          const stockItemExists = stockItemOptions.find(
            (item) => item.id === product.item_id,
          );
          if (stockItemExists) {
            // Ensure item_name is also set if it's missing
            if (!product.item_name && stockItemExists.name) {
              needsUpdate = true;
              return {
                ...product,
                item_name: stockItemExists.name,
              };
            }
            return product;
          }
        }

        // Case 2: Product has item_name (even if item_id doesn't match or is invalid)
        if (product.item_name) {
          const stockItemByName = stockItemOptions.find(
            (item) =>
              item.name &&
              item.name.toLowerCase().trim() ===
                product.item_name.toLowerCase().trim(),
          );
          if (stockItemByName) {
            // Update both item_id and item_name to ensure consistency
            if (
              product.item_id !== stockItemByName.id ||
              product.item_name !== stockItemByName.name
            ) {
              needsUpdate = true;
              return {
                ...product,
                item_id: stockItemByName.id,
                item_name: stockItemByName.name,
              };
            }
          }
        }

        // Case 3: Product has item_id but no matching stock item found
        // In this case, clear the item_id since it's invalid
        if (
          product.item_id &&
          !stockItemOptions.find((item) => item.id === product.item_id)
        ) {
          needsUpdate = true;
          return {
            ...product,
            item_id: null,
            item_name: null,
          };
        }

        return product;
      });

      if (needsUpdate) {
        setProducts(updatedProducts);
      }
      stockItemsInitialMatchedRef.current = true; // Mark as matched
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockItemOptions, products]);

  // Recalculate subtotal whenever products change
  useEffect(() => {
    const calculatedSubtotal = products.reduce((sum, product) => {
      const amount = parseFloat(product.amount) || 0;
      return sum + amount;
    }, 0);

    // Only update if different to avoid infinite loop
    if (parseFloat(billSummaryForm.subtotal) !== calculatedSubtotal) {
      setBillSummaryForm((prev) => ({
        ...prev,
        subtotal: calculatedSubtotal.toString(),
      }));
    }
  }, [products, billSummaryForm.subtotal]);

  // Invoice math: total = subtotal + taxes + cess + freight - discount + round_off.
  // ``total`` is derived — recomputed live whenever any input moves.
  // ``round_off`` is user-editable (some invoices print an explicit
  // rounding amount that doesn't come from arithmetic; user should be
  // able to clear it and see the true computed total).
  //
  // If OCR captured a wrong price/qty, user edits line items → total
  // shifts. To re-balance against the printed invoice total, the user
  // clicks the "Auto-fill round-off" button next to the round-off row
  // (see ``handleAutoFillRoundOff``).
  useEffect(() => {
    const subtotal = parseFloat(billSummaryForm.subtotal) || 0;
    const cgst = parseFloat(billSummaryForm.cgst) || 0;
    const sgst = parseFloat(billSummaryForm.sgst) || 0;
    const igst = parseFloat(billSummaryForm.igst) || 0;
    const cess = parseFloat(billSummaryForm.cess) || 0;
    const freight = parseFloat(billSummaryForm.freight) || 0;
    const discount = parseFloat(billSummaryForm.discount) || 0;
    const roundOff = parseFloat(billSummaryForm.round_off) || 0;

    const nextTotal = (
      subtotal + cgst + sgst + igst + cess + freight - discount + roundOff
    ).toFixed(2);

    setBillSummaryForm((prev) =>
      prev.total === nextTotal ? prev : { ...prev, total: nextTotal },
    );
  }, [
    billSummaryForm.subtotal,
    billSummaryForm.cgst,
    billSummaryForm.sgst,
    billSummaryForm.igst,
    billSummaryForm.cess,
    billSummaryForm.freight,
    billSummaryForm.discount,
    billSummaryForm.round_off,
  ]);

  // Handle form input changes
  const handleFormChange = (name, value) => {
    setVendorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle vendor selection
  const handleVendorSelect = (vendorId) => {
    if (vendorId === null || vendorId === "") {
      // If null/empty value is passed via onChange, treat as clear
      handleVendorClear();
      return;
    }

    const vendor = vendorOptions.find((v) => v.id === vendorId);
    if (vendor) {
      setVendorForm((prev) => ({
        ...prev,
        selectedVendor: vendor,
        vendorName: vendor.name || "",
        vendorGST: vendor.gst_in || "",
      }));
      setVendorManuallyCleared(false); // Reset flag when vendor is manually selected
    }
  };

  // Handle vendor deselection
  const handleVendorClear = () => {
    setVendorForm((prev) => ({
      ...prev,
      selectedVendor: null,
      vendorName: analysedData?.from?.name || "",
      vendorGST: "",
    }));
    setVendorManuallyCleared(true); // Flag that user manually cleared vendor
  };

  // Handle tax ledger selection
  const handleTaxLedgerSelect = (productIndex, taxLedgerId) => {
    const taxLedger = taxLedgerOptions.find((tl) => tl.id === taxLedgerId);
    if (taxLedger) {
      setProducts((prev) => {
        const updated = [...prev];
        updated[productIndex] = {
          ...updated[productIndex],
          tax_ledger: taxLedger.name,
          tax_ledger_id: taxLedger.id,
        };
        return updated;
      });
    }
  };

  // Handle tax ledger deselection
  const handleTaxLedgerClear = (productIndex) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[productIndex] = {
        ...updated[productIndex],
        tax_ledger: "No Tax Ledger",
        tax_ledger_id: null,
      };
      return updated;
    });
  };

  // Handle item name selection
  const handleItemNameSelect = (productIndex, itemId) => {
    const stockItem = stockItemOptions.find((item) => item.id === itemId);
    if (stockItem) {
      setProducts((prev) => {
        const updated = [...prev];
        updated[productIndex] = {
          ...updated[productIndex],
          item_name: stockItem.name,
          item_id: stockItem.id,
        };
        return updated;
      });
    }
  };

  // Handle item name deselection
  const handleItemNameClear = (productIndex) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[productIndex] = {
        ...updated[productIndex],
        item_name: null,
        item_id: null,
      };
      return updated;
    });
  };

  // Handle Bill Summary form changes
  const handleBillSummaryChange = (name, value) => {
    setBillSummaryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle tax ledger selections
  const handleCgstLedgerSelect = (ledgerId) => {
    setBillSummaryForm((prev) => ({
      ...prev,
      cgstLedgerId: ledgerId,
    }));
  };

  const handleSgstLedgerSelect = (ledgerId) => {
    setBillSummaryForm((prev) => ({
      ...prev,
      sgstLedgerId: ledgerId,
    }));
  };

  const handleIgstLedgerSelect = (ledgerId) => {
    setBillSummaryForm((prev) => ({
      ...prev,
      igstLedgerId: ledgerId,
    }));
  };

  const handleCgstLedgerClear = () => {
    setBillSummaryForm((prev) => ({
      ...prev,
      cgstLedgerId: null,
    }));
  };

  const handleSgstLedgerClear = () => {
    setBillSummaryForm((prev) => ({
      ...prev,
      sgstLedgerId: null,
    }));
  };

  const handleIgstLedgerClear = () => {
    setBillSummaryForm((prev) => ({
      ...prev,
      igstLedgerId: null,
    }));
  };

  // Adjustment ledger select / clear handlers. ``userClearedLedgersRef``
  // remembers which fields the user has explicitly cleared in this
  // session so the auto-match useEffect doesn't immediately re-fill
  // them from ``tallyAnalysedData`` (the source of the "X button doesn't
  // work" bug). Selecting any value clears the mark — the user is
  // actively engaging again.
  const handleDiscountLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("discount");
    setBillSummaryForm((prev) => ({
      ...prev,
      discountLedgerId: ledgerId,
    }));
  };

  const handleDiscountLedgerClear = () => {
    userClearedLedgersRef.current.add("discount");
    setBillSummaryForm((prev) => ({
      ...prev,
      discountLedgerId: null,
    }));
  };

  const handleCessLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("cess");
    setBillSummaryForm((prev) => ({
      ...prev,
      cessLedgerId: ledgerId,
    }));
  };

  const handleCessLedgerClear = () => {
    userClearedLedgersRef.current.add("cess");
    setBillSummaryForm((prev) => ({
      ...prev,
      cessLedgerId: null,
    }));
  };

  const handleFreightLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("freight");
    setBillSummaryForm((prev) => ({
      ...prev,
      freightLedgerId: ledgerId,
    }));
  };

  const handleFreightLedgerClear = () => {
    userClearedLedgersRef.current.add("freight");
    setBillSummaryForm((prev) => ({
      ...prev,
      freightLedgerId: null,
    }));
  };

  const handleRoundOffLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("round_off");
    setBillSummaryForm((prev) => ({
      ...prev,
      roundOffLedgerId: ledgerId,
    }));
  };

  const handleRoundOffLedgerClear = () => {
    userClearedLedgersRef.current.add("round_off");
    setBillSummaryForm((prev) => ({
      ...prev,
      roundOffLedgerId: null,
    }));
  };

  // Auto-fill round-off: set round_off so the computed total matches
  // the OCR-extracted bill total. One-click balance when the operator
  // has corrected line items and needs the ledger to match the invoice.
  const handleAutoFillRoundOff = () => {
    const billTotal = parseFloat(analysedData?.total);
    if (!billTotal || Number.isNaN(billTotal)) {
      globalToast.error(
        "No bill total available from OCR — enter round-off manually.",
      );
      return;
    }
    const subtotal = parseFloat(billSummaryForm.subtotal) || 0;
    const cgst = parseFloat(billSummaryForm.cgst) || 0;
    const sgst = parseFloat(billSummaryForm.sgst) || 0;
    const igst = parseFloat(billSummaryForm.igst) || 0;
    const cess = parseFloat(billSummaryForm.cess) || 0;
    const freight = parseFloat(billSummaryForm.freight) || 0;
    const discount = parseFloat(billSummaryForm.discount) || 0;
    const derived = billTotal - (subtotal + cgst + sgst + igst + cess + freight - discount);
    const rounded = Math.abs(derived) < 0.005 ? 0 : Number(derived.toFixed(2));
    setBillSummaryForm((prev) => ({
      ...prev,
      round_off: rounded.toString(),
    }));
    if (rounded === 0) {
      globalToast.success("Already balanced — no round-off needed.");
    } else {
      globalToast.success(
        `Round-off set to ₹${rounded.toFixed(2)} to match bill total ₹${billTotal.toFixed(2)}.`,
      );
    }
  };

  // Handle consolidate toggle
  const handleConsolidateToggle = () => {
    const newConsolidateStatus = !isConsolidated;
    setIsConsolidated(newConsolidateStatus);

    const tally = tallyAnalysedData;

    // When toggling to consolidated, use consolidate_prod if available, fallback to consolidated_product
    if (newConsolidateStatus) {
      if (
        tally?.consolidate_prod &&
        Array.isArray(tally.consolidate_prod) &&
        tally.consolidate_prod.length > 0
      ) {
        setProducts(
          tally.consolidate_prod.map((item) => ({
            id: item.id,
            item_id: item.id,
            item_name: item.item_name || null,
            item_details: item.item_details || "",
            tax_ledger: "No Tax Ledger",
            tax_ledger_id: item.taxes || null,
            price: item.price || item.rate || "",
            quantity: item.quantity || "",
            amount: item.amount || "",
            gst: item.product_gst || "",
            cgst_ledger: item.cgst_ledger || null,
            sgst_ledger: item.sgst_ledger || null,
            igst_ledger: item.igst_ledger || null,
            igst: item.igst || 0.0,
            cgst: item.cgst || 0.0,
            sgst: item.sgst || 0.0,
          })),
        );
      } else if (tally?.consolidated_product) {
        setProducts([
          {
            id: tally.consolidated_product.id,
            item_id: null,
            item_name: tally.consolidated_product.item_name || null,
            item_details: tally.consolidated_product.item_details || "",
            tax_ledger: "No Tax Ledger",
            tax_ledger_id: null,
            price: tally.consolidated_product.price || "",
            quantity: tally.consolidated_product.quantity || "",
            amount: tally.consolidated_product.amount || "",
            gst: tally.consolidated_product.product_gst || "",
            cgst_ledger: tally.consolidated_product.cgst_ledger || null,
            sgst_ledger: tally.consolidated_product.sgst_ledger || null,
            igst_ledger: tally.consolidated_product.igst_ledger || null,
            igst: tally.consolidated_product.igst || 0.0,
            cgst: tally.consolidated_product.cgst || 0.0,
            sgst: tally.consolidated_product.sgst || 0.0,
          },
        ]);
      }
    } else {
      // When toggling to non-consolidated, use products if available
      if (tally?.products && tally.products.length > 0) {
        setProducts(
          tally.products.map((item, index) => ({
            id: item.item_id || index,
            item_id: item.item_id || null,
            item_name: item.item_name || null,
            item_details: item.item_details || "",
            tax_ledger: item.tax_ledger || "No Tax Ledger",
            tax_ledger_id: item.tax_ledger_id || null,
            price: item.price || "",
            quantity: item.quantity || "",
            amount: item.amount || "",
            gst: item.product_gst || "",
            cgst_ledger: item.cgst_ledger || null,
            sgst_ledger: item.sgst_ledger || null,
            igst_ledger: item.igst_ledger || null,
            igst: item.igst || 0.0,
            cgst: item.cgst || 0.0,
            sgst: item.sgst || 0.0,
          })),
        );
      }
    }
  };

  // Handle quantity updates
  const updateQuantity = (index, newQuantity) => {
    if (newQuantity >= 0) {
      setItemQuantities((prev) => {
        const updated = [...prev];
        updated[index] = newQuantity;
        return updated;
      });
    }
  };

  // Product manipulation functions
  const handleProductChange = (index, field, value) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calculate amount when price or quantity changes
      if (field === "price" || field === "quantity") {
        const price =
          field === "price"
            ? parseFloat(value) || 0
            : parseFloat(updated[index].price) || 0;
        const quantity =
          field === "quantity"
            ? parseFloat(value) || 0
            : parseFloat(updated[index].quantity) || 0;
        updated[index].amount = (price * quantity).toString();
      }

      // When the GST rate changes, auto-fill the per-line CGST/SGST/IGST ledger
      // from the org's rate→ledger mapping (only if the user hasn't picked a
      // custom one explicitly).
      if (field === "gst") {
        const ledgers = resolveLineTaxLedgers(value);
        if (!updated[index].cgst_ledger_id_user_set) {
          updated[index].cgst_ledger = ledgers.cgst_ledger;
        }
        if (!updated[index].sgst_ledger_id_user_set) {
          updated[index].sgst_ledger = ledgers.sgst_ledger;
        }
        if (!updated[index].igst_ledger_id_user_set) {
          updated[index].igst_ledger = ledgers.igst_ledger;
        }
      }

      // Re-derive per-line CGST/SGST/IGST from (amount × rate) whenever the
      // *amount* could have shifted — that means price, quantity, the amount
      // field itself, or the GST rate. Previously this only ran on rate
      // changes, so a user editing the line amount (e.g. correcting an OCR
      // miss) left the tax totals at their stale values.
      if (
        field === "price" ||
        field === "quantity" ||
        field === "amount" ||
        field === "gst"
      ) {
        const rateNum =
          parseFloat(parseGstRate(updated[index].gst)) || 0;
        const amount = parseFloat(updated[index].amount) || 0;
        const totalTax = (amount * rateNum) / 100;
        const isInterState =
          tallyAnalysedData?.gst_type === "IGST" ||
          (parseFloat(billSummaryForm.igst) || 0) > 0;
        if (rateNum === 0 || amount === 0) {
          updated[index].igst = "0.00";
          updated[index].cgst = "0.00";
          updated[index].sgst = "0.00";
        } else if (isInterState) {
          updated[index].igst = totalTax.toFixed(2);
          updated[index].cgst = "0.00";
          updated[index].sgst = "0.00";
        } else {
          updated[index].cgst = (totalTax / 2).toFixed(2);
          updated[index].sgst = (totalTax / 2).toFixed(2);
          updated[index].igst = "0.00";
        }
      }

      return updated;
    });
  };

  // ------------------------------------------------------------------
  // Tax Summary by Rate — editable amount + ledger
  // ------------------------------------------------------------------
  // When the user overrides the CGST/SGST/IGST amount for a single GST
  // rate bucket, distribute the new total back to the underlying line
  // items in that bucket *proportionally* by line amount. This lets the
  // user nudge a single sub-tax (e.g. OCR captured an off-by-one) without
  // having to edit every line individually.
  const handleSummaryTaxAmountChange = (rateKey, taxType, rawValue) => {
    const newTotal = parseFloat(rawValue);
    if (Number.isNaN(newTotal)) return;

    setProducts((prev) => {
      const bucketIndexes = [];
      let bucketAmountSum = 0;
      prev.forEach((p, i) => {
        if (parseGstRate(p.gst) !== rateKey) return;
        bucketIndexes.push(i);
        bucketAmountSum += parseFloat(p.amount) || 0;
      });
      if (bucketIndexes.length === 0) return prev;

      const next = [...prev];
      let allocated = 0;
      bucketIndexes.forEach((idx, k) => {
        const lineAmount = parseFloat(prev[idx].amount) || 0;
        let share;
        if (k === bucketIndexes.length - 1) {
          // Last bucket entry absorbs the rounding residual so the
          // group total matches the edited value exactly.
          share = newTotal - allocated;
        } else if (bucketAmountSum > 0) {
          share = (newTotal * lineAmount) / bucketAmountSum;
        } else {
          share = newTotal / bucketIndexes.length;
        }
        share = Math.round(share * 100) / 100;
        allocated = Math.round((allocated + share) * 100) / 100;
        next[idx] = { ...next[idx], [taxType]: share.toFixed(2) };
      });
      return next;
    });
  };

  // Pick a CGST/SGST/IGST ledger for an entire rate bucket. The selection
  // is applied to every product in that bucket and the per-line ledger is
  // marked as user-set so future GST-rate edits don't overwrite it.
  const handleSummaryTaxLedgerChange = (rateKey, taxType, ledgerId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (parseGstRate(p.gst) !== rateKey) return p;
        return {
          ...p,
          [`${taxType}_ledger`]: ledgerId,
          [`${taxType}_ledger_id_user_set`]: true,
        };
      }),
    );
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        item_id: null,
        item_name: null,
        item_details: "",
        tax_ledger: "No Tax Ledger",
        tax_ledger_id: null,
        price: "",
        quantity: "",
        amount: "",
        gst: "",
        igst: 0.0,
        cgst: 0.0,
        sgst: 0.0,
      },
    ]);
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Handle verification similar to Zoho
  const handleVerification = async () => {
    if (hasValidationErrors()) {
      const errorMessages = getValidationErrorMessages();
      const errorText =
        errorMessages.length > 1
          ? `Please fix the following issues:\n${errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join("\n")}`
          : errorMessages[0];
      toast.error(errorText);
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationStatus(null);
      setVerificationMessage("");

      // Get tax ledger information for summary.
      //
      // The bill-level CGST/SGST/IGST ledger is no longer picked directly —
      // the user picks per rate in the Tax-by-rate table. Derive it from the
      // lines (ledger carrying the largest tax amount wins when rates
      // disagree) and only fall back to the auto-matched bill-level value.
      // This matters for consolidated bills: consolidated products carry no
      // per-line GST ledger, so the sync XML uses the bill-level ledger.
      const dominantLineTaxLedgerId = (taxType) => {
        const byLedger = {};
        (products || []).forEach((p) => {
          const amount = parseFloat(p[taxType]) || 0;
          if (amount <= 0) return;
          const ledgerId = effectiveLineTaxLedger(p, taxType);
          if (!ledgerId) return;
          byLedger[ledgerId] = (byLedger[ledgerId] || 0) + amount;
        });
        const ranked = Object.entries(byLedger).sort((a, b) => b[1] - a[1]);
        return ranked.length > 0 ? ranked[0][0] : null;
      };
      const findLedger = (options, taxType, fallbackId) =>
        options.find((ledger) => ledger.id === dominantLineTaxLedgerId(taxType)) ||
        options.find((ledger) => ledger.id === fallbackId);

      const cgstLedger = findLedger(
        cgstLedgerOptions,
        "cgst",
        billSummaryForm.cgstLedgerId,
      );
      const sgstLedger = findLedger(
        sgstLedgerOptions,
        "sgst",
        billSummaryForm.sgstLedgerId,
      );
      const igstLedger = findLedger(
        igstLedgerOptions,
        "igst",
        billSummaryForm.igstLedgerId,
      );
      const discountLedger = discountLedgerOptions.find(
        (ledger) => ledger.id === billSummaryForm.discountLedgerId,
      );
      const cessLedger = discountLedgerOptions.find(
        (ledger) => ledger.id === billSummaryForm.cessLedgerId,
      );
      const freightLedger = discountLedgerOptions.find(
        (ledger) => ledger.id === billSummaryForm.freightLedgerId,
      );
      const roundOffLedger = discountLedgerOptions.find(
        (ledger) => ledger.id === billSummaryForm.roundOffLedgerId,
      );

      // Backend prefers ledger_id UUID over name (issue #4 audit) —
      // send both so a name collision across parent groups doesn't
      // pick the wrong ledger. Sending ledger_id: null for zero-
      // amount rows lets the backend drop the FK cleanly.
      const _ledgerBlock = (amount, ledger) => ({
        amount: parseFloat(amount) || 0.0,
        ledger: ledger?.name || "No Tax Ledger",
        ledger_id: ledger?.id || null,
      });

      const verificationPayload = {
        bill_id: billId,
        analyzed_data: {
          vendor: {
            vendor_name: vendorForm.vendorName || "Unknown Vendor",
            // Explicit UUID — backend fuzzy-match on name silently
            // picked wrong vendor when multiple ledgers shared name.
            vendor_id: vendorForm.selectedVendor?.id || null,
          },
          bill_no: vendorForm.invoiceNumber || "",
          bill_date: vendorForm.dateIssued
            ? new Date(vendorForm.dateIssued)
                .toLocaleDateString("en-GB")
                .split("/")
                .reverse()
                .join("-")
            : "",
          due_date: vendorForm.dueDate
            ? new Date(vendorForm.dueDate)
                .toLocaleDateString("en-GB")
                .split("/")
                .reverse()
                .join("-")
            : "",
          total_amount: parseFloat(billSummaryForm.total) || 0,
          consolidate: isConsolidated,
          // Notes were silently dropped before — backend reads
          // ``analyzed_data.note`` but frontend never included it.
          note: notes || "",
          taxes: {
            igst:      _ledgerBlock(billSummaryForm.igst, igstLedger),
            cgst:      _ledgerBlock(billSummaryForm.cgst, cgstLedger),
            sgst:      _ledgerBlock(billSummaryForm.sgst, sgstLedger),
            discount:  _ledgerBlock(billSummaryForm.discount, discountLedger),
            cess:      _ledgerBlock(billSummaryForm.cess, cessLedger),
            freight:   _ledgerBlock(billSummaryForm.freight, freightLedger),
            round_off: _ledgerBlock(billSummaryForm.round_off, roundOffLedger),
          },

          // Send products to the appropriate key based on consolidate status
          ...(isConsolidated
            ? {
                consolidate_prod: products.map((product) => {
                  const taxLedger = taxLedgerOptions.find(
                    (ledger) => ledger.id === product.tax_ledger_id,
                  );
                  return {
                    item_id: product.id || null,
                    item_name: product.item_name || null,
                    item_details: product.item_details || "",
                    tax_ledger: taxLedger?.name || "No Tax Ledger",
                    price: parseFloat(product.price) || 0,
                    rate: parseFloat(product.price) || 0,
                    quantity: parseFloat(product.quantity) || 0,
                    amount: parseFloat(product.amount) || 0,
                    product_gst: product.gst || null,
                    igst: parseFloat(product.igst) || 0.0,
                    cgst: parseFloat(product.cgst) || 0.0,
                    sgst: parseFloat(product.sgst) || 0.0,
                    // Send the *effective* ledger (explicit pick → rate-map
                    // default → bill-level), not just the explicit pick — a
                    // rate-map default was previously shown as selected in the
                    // UI but sent as null.
                    cgst_ledger: effectiveLineTaxLedger(product, "cgst"),
                    sgst_ledger: effectiveLineTaxLedger(product, "sgst"),
                    igst_ledger: effectiveLineTaxLedger(product, "igst"),
                    original_items_count: products.length,
                  };
                }),
              }
            : {
                products: products.map((product) => {
                  const taxLedger = taxLedgerOptions.find(
                    (ledger) => ledger.id === product.tax_ledger_id,
                  );
                  return {
                    item_id: product.id || null,
                    item_name: product.item_name || null,
                    item_details: product.item_details || "",
                    tax_ledger: taxLedger?.name || "No Tax Ledger",
                    price: parseFloat(product.price) || 0,
                    quantity: parseFloat(product.quantity) || 0,
                    amount: parseFloat(product.amount) || 0,
                    product_gst: product.gst || null,
                    igst: parseFloat(product.igst) || 0.0,
                    cgst: parseFloat(product.cgst) || 0.0,
                    sgst: parseFloat(product.sgst) || 0.0,
                    cgst_ledger: effectiveLineTaxLedger(product, "cgst"),
                    sgst_ledger: effectiveLineTaxLedger(product, "sgst"),
                    igst_ledger: effectiveLineTaxLedger(product, "igst"),
                  };
                }),
              }),
        },
      };

      const response = await verifyVendorBill({
        organizationId: selectedOrganization.id,
        ...verificationPayload,
      });

      setVerificationStatus("success");
      setVerificationMessage("Bill verified successfully!");
      toast.success("Bill verified successfully!");

      // Process the response data if available
      if (response?.analyzed_data) {
        const responseData = response.analyzed_data;

        // Update form fields with verified data
        if (responseData.vendor?.vendor_name) {
          setVendorForm((prev) => ({
            ...prev,
            vendorName: responseData.vendor.vendor_name,
          }));
        }

        if (responseData.bill_no) {
          setVendorForm((prev) => ({
            ...prev,
            invoiceNumber: responseData.bill_no,
          }));
        }

        if (responseData.bill_date) {
          setVendorForm((prev) => ({
            ...prev,
            dateIssued: responseData.bill_date,
          }));
        }

        if (responseData.due_date) {
          setVendorForm((prev) => ({
            ...prev,
            dueDate: responseData.due_date,
          }));
        }

        // Update bill summary with tax amounts and ledger IDs
        if (responseData.taxes) {
          // Find tax ledger IDs from names (case-insensitive and trimmed)
          const cgstLedger = cgstLedgerOptions.find(
            (ledger) =>
              ledger.name?.toLowerCase().trim() ===
              responseData.taxes.cgst?.ledger?.toLowerCase().trim(),
          );
          const sgstLedger = sgstLedgerOptions.find(
            (ledger) =>
              ledger.name?.toLowerCase().trim() ===
              responseData.taxes.sgst?.ledger?.toLowerCase().trim(),
          );
          const igstLedger = igstLedgerOptions.find(
            (ledger) =>
              ledger.name?.toLowerCase().trim() ===
              responseData.taxes.igst?.ledger?.toLowerCase().trim(),
          );

          setBillSummaryForm((prev) => ({
            ...prev,
            cgst: responseData.taxes.cgst?.amount?.toString() || prev.cgst,
            sgst: responseData.taxes.sgst?.amount?.toString() || prev.sgst,
            igst: responseData.taxes.igst?.amount?.toString() || prev.igst,
            total: responseData.total_amount?.toString() || prev.total,
            cgstLedgerId: cgstLedger?.id || prev.cgstLedgerId,
            sgstLedgerId: sgstLedger?.id || prev.sgstLedgerId,
            igstLedgerId: igstLedger?.id || prev.igstLedgerId,
          }));

          // If ledgers weren't found, try again after a short delay when options are loaded
          if (!cgstLedger || !sgstLedger || !igstLedger) {
            setTimeout(() => {
              const retryFindLedgers = () => {
                const retryCgstLedger = cgstLedgerOptions.find(
                  (ledger) =>
                    ledger.name?.toLowerCase().trim() ===
                    responseData.taxes.cgst?.ledger?.toLowerCase().trim(),
                );
                const retrySgstLedger = sgstLedgerOptions.find(
                  (ledger) =>
                    ledger.name?.toLowerCase().trim() ===
                    responseData.taxes.sgst?.ledger?.toLowerCase().trim(),
                );
                const retryIgstLedger = igstLedgerOptions.find(
                  (ledger) =>
                    ledger.name?.toLowerCase().trim() ===
                    responseData.taxes.igst?.ledger?.toLowerCase().trim(),
                );

                setBillSummaryForm((prev) => ({
                  ...prev,
                  cgstLedgerId: retryCgstLedger?.id || prev.cgstLedgerId,
                  sgstLedgerId: retrySgstLedger?.id || prev.sgstLedgerId,
                  igstLedgerId: retryIgstLedger?.id || prev.igstLedgerId,
                }));
              };
              retryFindLedgers();
            }, 1000);
          }
        }

        // Update products based on consolidate status
        if (
          responseData.consolidate &&
          responseData.consolidate_prod &&
          Array.isArray(responseData.consolidate_prod)
        ) {
          // Handle consolidated products
          const updatedConsolidatedProducts = responseData.consolidate_prod.map(
            (product) => {
              // Prefer explicit UUID from backend (``tax_ledger_id``),
              // fall back to name-only match for older responses.
              // Was silently losing tax ledger on reload because the
              // backend returns ``tax_ledger`` name — not ``taxes`` UUID.
              const productTaxLedger = taxLedgerOptions.find(
                (ledger) =>
                  (product.tax_ledger_id && ledger.id === product.tax_ledger_id) ||
                  ledger.name === product.tax_ledger ||
                  ledger.id === product.taxes,
              );

              return {
                id: product.id,
                item_id: product.id,
                item_name: product.item_name,
                item_details: product.item_details,
                tax_ledger_id: productTaxLedger?.id || null,
                price:
                  product.price?.toString() || product.rate?.toString() || "0",
                quantity: product.quantity?.toString() || "1",
                amount: product.amount?.toString() || "0",
                gst: product.product_gst,
                igst: product.igst?.toString() || "0",
                cgst: product.cgst?.toString() || "0",
                sgst: product.sgst?.toString() || "0",
              };
            },
          );
          setProducts(updatedConsolidatedProducts);
        } else if (
          responseData.products &&
          Array.isArray(responseData.products)
        ) {
          // Handle individual products
          const updatedProducts = responseData.products.map((product) => {
            // Find tax ledger ID from name
            const productTaxLedger = taxLedgerOptions.find(
              (ledger) => ledger.name === product.tax_ledger,
            );

            return {
              id: product.item_id,
              item_id: product.item_id,
              item_name: product.item_name,
              item_details: product.item_details,
              tax_ledger_id: productTaxLedger?.id || null,
              price: product.price?.toString() || "0",
              quantity: product.quantity?.toString() || "1",
              amount: product.amount?.toString() || "0",
              gst: product.product_gst,
              igst: product.igst?.toString() || "0",
              cgst: product.cgst?.toString() || "0",
              sgst: product.sgst?.toString() || "0",
            };
          });
          setProducts(updatedProducts);
        }
      }

      // Refetch the bill data to get updated status
      await refetch();
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationStatus("error");
      setVerificationMessage(error.message || "Verification failed");
      toast.error(error.message || "Failed to verify bill. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Save function - now calls verification
  const handleSave = async () => {
    await handleVerification();
  };

  // Sync function
  const handleSync = async () => {
    try {
      setIsSyncing(true);

      // Wrap the sync in the masters-guard helper: if backend returns
      // 409 WAITING_FOR_MASTERS, poll the same call every 15s (up to
      // 3 min) until Tally imports the pending records, then proceed.
      // Zero XML change — see docs/tally-master-sync.md for the flow.
      const outcome = await tallySyncWithMastersGuard(
        () =>
          syncVendorBill({
            organizationId: selectedOrganization?.id,
            billId,
          }),
        {
          retryFn: async () => true, // keep polling until timeout
        },
      );

      if (outcome.status === "success") {
        globalToast.success("Bill synced to Tally successfully");
        refetch();
      } else if (outcome.status === "timeout") {
        // Toast already shown by the helper — just make sure state is fresh.
        refetch();
      }
      // "waiting" without retry never fires because retryFn returns true.
    } catch (error) {
      console.error("Failed to sync vendor bill:", error);
      globalToast.error(
        error?.data?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to sync purchase voucher",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Zoom and viewing functions
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Check if file is PDF
  const isPDF = (fileUrl) => {
    return (
      fileUrl &&
      (fileUrl.toLowerCase().includes(".pdf") ||
        fileUrl.toLowerCase().includes("pdf"))
    );
  };

  // Handle verification success/error
  useEffect(() => {
    if (verificationStatus === "success") {
      // Auto-clear success message after 3 seconds
      const timer = setTimeout(() => setVerificationStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus]);

  // Keyboard shortcuts for zoom and fullscreen
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!billInfo?.file || isPDF(billInfo.file)) {
        // For PDF, only handle Escape key for fullscreen
        if (e.key === "Escape" && isFullscreen) {
          e.preventDefault();
          setIsFullscreen(false);
        }
        return;
      }

      switch (e.key) {
        case "f":
        case "F":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case "=":
        case "+":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleResetZoom();
          }
          break;
        case "Escape":
          if (isFullscreen) {
            e.preventDefault();
            setIsFullscreen(false);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [billInfo?.file, isFullscreen, zoomLevel]);

  // Auto-close sidebar when component mounts
  useEffect(() => {
    // Close mobile menu if it's open
    if (mobileMenu) {
      setMobileMenu(false);
    }
    // Always collapse sidebar when entering detail page for better viewing experience
    if (!collapsed) {
      setMenuCollapsed(true);
    }
  }, []); // Empty dependency array to run only on mount

  // Handle back button click
  const handleBackClick = () => {
    // Open sidebar if it's collapsed
    if (collapsed) {
      setMenuCollapsed(false);
    }
    // Navigate back to vendor bill list
    navigate("/tally/vendor-bill");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
          <Icon icon="heroicons:exclamation-triangle" className="text-2xl" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Failed to load purchase voucher
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error?.data?.message ||
            error?.message ||
            "An error occurred while fetching purchase voucher details."}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Icon icon="heroicons:arrow-left" className="text-base" />
            Go back
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className="text-base" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show message if no organization selected
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
          Please select a client to view purchase voucher details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBackClick}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Back to purchase vouchers"
          >
            <Icon icon="heroicons:arrow-left" className="text-base" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              {billInfo?.bill_munshi_name || "Vendor bill"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {billInfo?.status ? `Status: ${billInfo.status}` : "Vendor bill detail"}
              {billInfo?.created_at && ` · Uploaded ${new Date(billInfo.created_at).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick-add masters moved out of this toolbar — each "+" now
              sits on the label / column header of the dropdown it feeds
              (Vendor, Purchase Ledger, Item Name). */}
          <button
            type="button"
            onClick={() => navigate(`/tally/vendor-bill/${vendorBillData?.previous_bill}`)}
            disabled={!vendorBillData?.previous_bill}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={vendorBillData?.previous_bill ? "Go to previous bill" : "No previous bill"}
          >
            <Icon icon="heroicons:arrow-left" className="text-base" />
            Back
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-base ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate(`/tally/vendor-bill/${vendorBillData?.next_bill}`)}
            disabled={!vendorBillData?.next_bill}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={vendorBillData?.next_bill ? "Go to next bill" : "No next bill"}
          >
            Next
            <Icon icon="heroicons:arrow-right" className="text-base" />
          </button>
          <span className="hidden md:inline w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={handleSave}
            disabled={isVerifying || isVerified || hasValidationErrors()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={
              isVerifying
                ? "Verifying…"
                : isVerified
                  ? "Bill already synced"
                  : hasValidationErrors()
                    ? getValidationErrorMessages().join(" · ")
                    : "Verify"
            }
          >
            <Icon icon={isVerifying ? "heroicons:arrow-path" : "heroicons:check-badge"} className={`text-base ${isVerifying ? "animate-spin" : ""}`} />
            {isVerifying ? "Verifying…" : isVerified ? "Verified" : "Verify"}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || isVerified || billInfo?.status !== "Verified"}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
            title={
              isSyncing
                ? "Syncing…"
                : isVerified
                  ? "Bill already synced"
                  : billInfo?.status !== "Verified"
                    ? "Bill must be verified before sync"
                    : "Sync with Tally"
            }
          >
            <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-base ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync to Tally"}
          </button>
        </div>
      </div>

      {/* Sync status banner */}
      {billInfo?.tally_sync_message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl border ${
            billInfo?.tally_synced
              ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/60"
              : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/60"
          }`}
        >
          <Icon
            icon={billInfo?.tally_synced ? "heroicons:check-circle" : "heroicons:x-circle"}
            className={`text-xl shrink-0 mt-0.5 ${
              billInfo?.tally_synced
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          />
          <div className="text-sm">
            <p
              className={`font-semibold ${
                billInfo?.tally_synced
                  ? "text-emerald-800 dark:text-emerald-300"
                  : "text-rose-800 dark:text-rose-300"
              }`}
            >
              {billInfo?.tally_synced
                ? "Successfully synced to Tally"
                : "Tally sync failed"}
            </p>
            <p
              className={`mt-1 text-xs whitespace-pre-wrap ${
                billInfo?.tally_synced
                  ? "text-emerald-700/80 dark:text-emerald-400/80"
                  : "text-rose-700/80 dark:text-rose-400/80"
              }`}
            >
              {billInfo.tally_sync_message}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6">
        {/* Validation summary */}
        {hasValidationErrors() && !isVerified && (
          <div className="mb-5 flex items-start gap-3 p-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60">
            <Icon icon="heroicons:exclamation-triangle" className="text-amber-600 dark:text-amber-400 text-lg shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                Resolve before verifying
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                {getValidationErrorMessages().slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 relative">
          {/* Bill Photo/Image/PDF Section - Fixed/Sticky on Large Screens */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
              {billInfo?.file ? (
                <div className="w-full h-full flex flex-col">
                  {/* Fixed Header - Always Visible */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 dark:border-slate-700 flex-shrink-0 z-10">
                    <h3 className="text-base font-medium text-slate-900 dark:text-white truncate mr-2">
                      {billInfo.bill_munshi_name
                        ? `${billInfo.bill_munshi_name}`
                        : "Document"}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Keyboard Shortcuts Info */}
                      {!isPDF(billInfo.file) && (
                        <div className="relative group">
                          <button className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-gray-200 transition-colors">
                            <svg
                              className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <div className="font-medium mb-1">
                              Keyboard Shortcuts:
                            </div>
                            <div>Ctrl/Cmd + F: Fullscreen</div>
                            <div>Ctrl/Cmd + +: Zoom In</div>
                            <div>Ctrl/Cmd + -: Zoom Out</div>
                            <div>Ctrl/Cmd + 0: Reset Zoom</div>
                            <div>Esc: Exit Fullscreen</div>
                          </div>
                        </div>
                      )}

                      {/* Zoom Controls - only for images */}
                      {!isPDF(billInfo.file) && (
                        <>
                          <button
                            onClick={handleZoomOut}
                            className="p-1 rounded-md bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Zoom Out (Ctrl + -)"
                            disabled={zoomLevel <= 0.25}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                              />
                            </svg>
                          </button>
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 min-w-[38px] text-center bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {Math.round(zoomLevel * 100)}%
                          </span>
                          <button
                            onClick={handleZoomIn}
                            className="p-1 rounded-md bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Zoom In (Ctrl + +)"
                            disabled={zoomLevel >= 3}
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={handleResetZoom}
                            className="p-1 rounded-md bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 transition-colors"
                            title="Reset Zoom (Ctrl + 0)"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Fullscreen Toggle */}
                      <button
                        onClick={toggleFullscreen}
                        className="p-1 rounded-md bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 transition-colors"
                        title="Toggle Fullscreen (Ctrl + F)"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-auto bg-white">
                    {isPDF(billInfo.file) ? (
                      // PDF Viewer
                      <iframe
                        src={billInfo.file}
                        className="w-full h-full border-0"
                        title="Bill PDF Document"
                      />
                    ) : (
                      // Image Viewer with Zoom and Scroll
                      <div
                        className="w-full h-full p-4"
                        style={{
                          cursor: zoomLevel > 1 ? "move" : "default",
                          minHeight: "100%",
                          display: "flex",
                          alignItems: zoomLevel <= 1 ? "center" : "flex-start",
                          justifyContent:
                            zoomLevel <= 1 ? "center" : "flex-start",
                        }}
                      >
                        <img
                          src={billInfo.file}
                          alt="Bill Document"
                          className="rounded-lg shadow-lg transition-transform duration-200 select-none"
                          style={{
                            width:
                              zoomLevel <= 1 ? "100%" : `${zoomLevel * 100}%`,
                            height: "auto",
                            maxWidth: zoomLevel <= 1 ? "100%" : "none",
                            objectFit: "contain",
                          }}
                          draggable="false"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div
                          style={{ display: "none" }}
                          className="flex flex-col items-center justify-center w-full h-full"
                        >
                          <svg
                            className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Unable to load document
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <svg
                    className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                    Bill Document
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">No document available</p>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content Column */}
          <div className="lg:w-2/3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Vendor Information Section */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:building-office-2" className="text-sm" />
                  </span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Bill from
                  </h3>
                </div>

                {/* Simple Form Fields */}
                <div className="space-y-3">
                  {/* First Row: Vendor and Invoice Number */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Vendor Selection Field */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Vendor <span className="text-rose-500">*</span>
                      </label>
                      <QuickAddGroup
                        kind="vendor"
                        disabled={isVerified}
                        title="Vendor not in the list? Create one"
                        className={`mb-2 ${
                          isVendorRequired && !isVerified
                            ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                            : ""
                        }`}
                      >
                        <SearchableDropdown
                          triggerClassName="rounded-r-none"
                          options={vendorOptions}
                          value={vendorForm.selectedVendor?.id || null}
                          onChange={handleVendorSelect}
                          onClear={handleVendorClear}
                          placeholder="Search and select vendor..."
                          searchPlaceholder="Type to search vendors..."
                          optionLabelKey="name"
                          optionValueKey="id"
                          loading={vendorLedgersLoading}
                          disabled={isVerified}
                          renderOption={(vendor) => (
                            <div className="flex flex-col py-1">
                              <div className="font-medium text-slate-900 dark:text-white">
                                {vendor.name}
                              </div>
                              {vendor.gst_in && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  GST: {vendor.gst_in}
                                </div>
                              )}
                              {/* {vendor.parent_name && (
                                                            <div className="text-xs text-blue-600">{vendor.parent_name}</div>
                                                        )} */}
                            </div>
                          )}
                        />
                      </QuickAddGroup>

                      {/* Organization Mismatch Warning */}
                      {/* {vendorForm.selectedVendor &&
                        vendorForm.selectedVendor.organization_id !==
                          selectedOrganization?.id && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700 flex items-start gap-2">
                            <svg
                              className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <span>
                              <strong>Warning:</strong> The selected vendor
                              belongs to a different organization. This may
                              cause issues during sync.
                            </span>
                          </div>
                        )} */}

                      {/* Vendor Not Found Warning */}
                      {analysedData?.from?.name &&
                        !vendorForm.selectedVendor && (
                          <div className="mt-3">
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <svg
                                className="w-3 h-3 mr-1.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              Vendor not found in the list, please add new
                              vendor
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Invoice Number Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice Number
                      </label>
                      <input
                        type="text"
                        name="invoiceNumber"
                        value={vendorForm.invoiceNumber}
                        onChange={(e) =>
                          handleFormChange("invoiceNumber", e.target.value)
                        }
                        placeholder="Enter invoice number"
                        disabled={isVerified}
                        className={`w-full px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                          isVerified
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Second Row: GST, Date Issued, Due Date in 4 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* GST Number Field */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        GST Number
                        {/* {vendorForm.selectedVendor && vendorForm.selectedVendor.gst_in && (
                                                    <span className="ml-1 text-xs text-green-600">(Auto-filled)</span>
                                                )} */}
                      </label>
                      <input
                        type="text"
                        name="vendorGST"
                        value={vendorForm.vendorGST}
                        onChange={(e) =>
                          handleFormChange("vendorGST", e.target.value)
                        }
                        placeholder="Enter GST number"
                        disabled={isVerified}
                        className={`w-full px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                        readOnly={
                          vendorForm.selectedVendor &&
                          vendorForm.selectedVendor.gst_in &&
                          !isVerified
                        }
                      />
                    </div>
                    {/* Date Issued Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Date Issued
                      </label>
                      <input
                        type="date"
                        name="dateIssued"
                        value={vendorForm.dateIssued}
                        onChange={(e) =>
                          handleDateChange("dateIssued", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        disabled={isVerified}
                        className={`w-full px-2.5 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                          dateErrors.dateIssued
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : isVerified
                              ? "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                              : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                      />
                      {dateErrors.dateIssued && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {dateErrors.dateIssued}
                        </p>
                      )}
                    </div>{" "}
                    {/* Due Date Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={vendorForm.dueDate}
                        onChange={(e) =>
                          handleDateChange("dueDate", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        disabled={isVerified}
                        className={`w-full px-2.5 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                          dateErrors.dueDate
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : isVerified
                              ? "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                              : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                      />
                      {dateErrors.dueDate && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {dateErrors.dueDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information Section */}
              <div className="relative p-5 border-b border-slate-200 dark:border-slate-800">
                {/* Products Section */}
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                        <Icon icon="heroicons:list-bullet" className="text-sm" />
                      </span>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                        Line items{" "}
                        {isConsolidated && (
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 text-[10px] font-bold normal-case tracking-normal">
                            Consolidated
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Consolidate Toggle Switch */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Consolidate Items
                        </span>
                        <Switch
                          value={isConsolidated}
                          onChange={handleConsolidateToggle}
                          disabled={isVerified}
                          activeClass="bg-blue-600"
                        />
                      </div>
                      <button
                        onClick={addProduct}
                        disabled={isVerified}
                        className={`inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 ${
                          isVerified
                            ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400"
                            : ""
                        }`}
                        title={
                          isConsolidated
                            ? "Add consolidated product"
                            : "Add product"
                        }
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Products Table - Scrollable */}
                  <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto min-h-[350px]">
                      <table className="w-full min-w-[1000px]">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                          <tr>
                            {productSync && (
                              <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[150px]">
                                Item Name{" "}
                                <span className="text-red-500">*</span>
                              </th>
                            )}
                            <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[200px]">
                              Item Details
                            </th>
                            <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[150px]">
                              Purchase Ledger{" "}
                              <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[100px]">
                              Price
                            </th>
                            <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[80px]">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[100px]">
                              Amount
                            </th>
                            <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[120px]">
                              GST % <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[80px]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {products.map((product, index) => (
                            <tr
                              key={product.id}
                              className="hover:bg-slate-50 dark:bg-slate-900/60 transition-colors duration-150"
                            >
                              {/* Item Name - Only show if productSync is true */}
                              {productSync && (
                                <td className="px-3 py-2">
                                  <QuickAddGroup
                                    kind="item"
                                    disabled={isVerified}
                                    title="Item not in the list? Create one"
                                    className={`relative ${
                                      !product.item_id && !isVerified
                                        ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                        : ""
                                    }`}
                                  >
                                    <SearchableDropdown
                                      triggerClassName="rounded-r-none"
                                      key={`item-${product.id}-${product.item_id}`}
                                      options={stockItemOptions}
                                      value={product.item_id || null}
                                      onChange={(itemId) =>
                                        handleItemNameSelect(index, itemId)
                                      }
                                      onClear={() => handleItemNameClear(index)}
                                      placeholder="Select item name..."
                                      searchPlaceholder="Type to search stock items..."
                                      optionLabelKey="name"
                                      optionValueKey="id"
                                      loading={mastersLoading}
                                      disabled={isVerified}
                                      renderOption={(stockItem) => (
                                        <div className="flex flex-col py-1">
                                          <div className="font-medium text-slate-900 dark:text-white">
                                            {stockItem.name}
                                          </div>
                                          {stockItem.alias !== "0" &&
                                            stockItem.alias && (
                                              <div className="text-xs text-blue-600">
                                                Alias: {stockItem.alias}
                                              </div>
                                            )}
                                        </div>
                                      )}
                                      className="item-name-dropdown"
                                    />
                                  </QuickAddGroup>
                                </td>
                              )}

                              {/* Item Details */}
                              <td className="px-3 py-2">
                                <textarea
                                  value={product.item_details}
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "item_details",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter item details..."
                                  disabled={isVerified}
                                  className={`w-full px-2.5 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 resize-none ${
                                    isVerified
                                      ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                      : ""
                                  }`}
                                  rows={2}
                                />
                              </td>

                              {/* Tax Ledger */}
                              <td className="px-3 py-2">
                                <QuickAddGroup
                                  kind="ledger"
                                  disabled={isVerified}
                                  ledgerDefaultParent="Purchase Accounts"
                                  ledgerTitle="Add New Purchase Ledger"
                                  title="Ledger not in the list? Create one"
                                  className={`relative ${
                                    !product.tax_ledger_id && !isVerified
                                      ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                      : ""
                                  }`}
                                >
                                  <SearchableDropdown
                                    triggerClassName="rounded-r-none"
                                    options={taxLedgerOptions}
                                    value={product.tax_ledger_id || null}
                                    onChange={(taxLedgerId) =>
                                      handleTaxLedgerSelect(index, taxLedgerId)
                                    }
                                    onClear={() => handleTaxLedgerClear(index)}
                                    placeholder="Select purchase ledger..."
                                    searchPlaceholder="Type to search purchase ledgers..."
                                    optionLabelKey="name"
                                    optionValueKey="id"
                                    loading={taxLedgersLoading}
                                    disabled={isVerified}
                                    renderOption={(taxLedger) => (
                                      <div className="flex flex-col py-1">
                                        <div className="font-medium text-slate-900 dark:text-white">
                                          {taxLedger.name}
                                        </div>
                                      </div>
                                    )}
                                    className="tax-ledger-dropdown"
                                  />
                                </QuickAddGroup>
                              </td>

                              {/* Price */}
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={product.price}
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "price",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0.00"
                                  disabled={isVerified}
                                  className={`w-full px-3 py-2 text-sm text-right bg-white border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 hover:border-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    isVerified
                                      ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                      : ""
                                  }`}
                                  min="0"
                                  step="0.01"
                                />
                              </td>

                              {/* Quantity */}
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={product.quantity}
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "quantity",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0"
                                  disabled={isVerified}
                                  className={`w-full px-3 py-2 text-sm text-center bg-white border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 hover:border-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    isVerified
                                      ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                      : ""
                                  }`}
                                  min="0"
                                  step="1"
                                />
                              </td>

                              {/* Amount */}
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={product.amount}
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "amount",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0.00"
                                  disabled={isVerified}
                                  className={`w-full px-3 py-2 text-sm text-right bg-white border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 hover:border-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    isVerified
                                      ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                      : ""
                                  }`}
                                  min="0"
                                  step="0.01"
                                />
                              </td>

                              {/* GST % */}
                              <td className="px-3 py-2">
                                <div
                                  className={`${
                                    !product.gst && !isVerified
                                      ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                      : ""
                                  }`}
                                >
                                  <select
                                    value={product.gst || ""}
                                    onChange={(e) =>
                                      handleProductChange(
                                        index,
                                        "gst",
                                        e.target.value,
                                      )
                                    }
                                    disabled={isVerified}
                                    className={`w-full px-3 py-2 text-sm text-center bg-white border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 hover:border-slate-300 appearance-none cursor-pointer ${
                                      isVerified
                                        ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                        : ""
                                    }`}
                                    style={{
                                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                      backgroundPosition: "right 0.5rem center",
                                      backgroundRepeat: "no-repeat",
                                      backgroundSize: "1.25rem 1.25rem",
                                      paddingRight: "2.5rem",
                                    }}
                                  >
                                    <option value="">Select GST</option>
                                    <option value="0%">0%</option>
                                    <option value="5%">5%</option>
                                    <option value="12%">12%</option>
                                    <option value="18%">18%</option>
                                    <option value="28%">28%</option>
                                    <option value="Exempted">Exempted</option>
                                    <option value="N/A">N/A</option>
                                  </select>
                                </div>
                              </td>

                              {/* Tax ledger column removed — the per-rate
                                  IGST/CGST/SGST breakdown is shown in the
                                  "Tax summary by rate" panel below. */}

                              {/* Actions */}
                              <td className="px-3 py-2 text-center">
                                {products.length > 1 && (
                                  <button
                                    onClick={() => removeProduct(index)}
                                    disabled={isVerified}
                                    className={`inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors ${
                                      isVerified
                                        ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        : ""
                                    }`}
                                    title={
                                      isConsolidated
                                        ? "Remove consolidated product"
                                        : "Remove Product"
                                    }
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                )}
                                {isConsolidated && products.length === 1 && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    Consolidated
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Products Summary */}
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Items: {products.length}{" "}
                          {isConsolidated && (
                            <span className="text-blue-600 font-medium ml-2">
                              (Consolidated)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          Subtotal: ₹
                          {products
                            .reduce(
                              (sum, product) =>
                                sum + parseFloat(product.amount || 0),
                              0,
                            )
                            .toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax summary by rate (derived from line items, read-only) */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:chart-pie" className="text-sm" />
                  </span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Tax summary by rate
                  </h3>

                  {/* Bill-image reconciliation badge — informational only.
                      Flags drift between the values printed on the original
                      invoice and the user-edited line totals. Mismatch
                      shows in AMBER (warning), not red (error) — it does
                      NOT block verification. Hidden when the bill image
                      had no tax values to extract. */}
                  {billTaxMatch.hasBillValues && (
                    <span
                      className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wide ring-1 ${
                        billTaxMatch.isMatch
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-900/60"
                          : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-200 dark:ring-amber-900/60"
                      }`}
                      title={
                        billTaxMatch.isMatch
                          ? "Line item taxes match the values printed on the original bill."
                          : `Heads-up: line totals differ from the bill image (${billTaxMatch.mismatches
                              .map(
                                (k) =>
                                  `${k.toUpperCase()}: line ₹${lineTaxTotals[k].toFixed(2)} vs bill ₹${billTaxMatch.billValues[k].toFixed(2)} (Δ ${billTaxMatch.diffs[k] > 0 ? "+" : ""}₹${billTaxMatch.diffs[k].toFixed(2)})`,
                              )
                              .join(", ")}). This won't block verification — confirm the values are intentional and proceed.`
                      }
                    >
                      <Icon
                        icon={
                          billTaxMatch.isMatch
                            ? "heroicons:check-circle"
                            : "heroicons:information-circle"
                        }
                        className="text-[12px]"
                      />
                      {billTaxMatch.isMatch
                        ? "Matches bill"
                        : `Differs from bill · ${billTaxMatch.mismatches
                            .map((k) => k.toUpperCase())
                            .join(" + ")}`}
                    </span>
                  )}
                </div>

                {/* Detail row on bill mismatch — informational warning,
                    NOT an error. The operator can verify regardless;
                    this just surfaces the gap so they can sanity-check. */}
                {billTaxMatch.hasBillValues && !billTaxMatch.isMatch && (
                  <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <Icon
                        icon="heroicons:information-circle"
                        className="text-amber-600 dark:text-amber-400 text-base mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
                          Heads-up: line totals differ from the bill image
                        </div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mb-1.5">
                          This is informational only — you can still verify
                          and save. Confirm the line values are intentional
                          before proceeding.
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          {["cgst", "sgst", "igst"].map((k) => {
                            const drifted =
                              billTaxMatch.mismatches.includes(k);
                            return (
                              <div
                                key={k}
                                className={`rounded-md px-2 py-1.5 ring-1 ${
                                  drifted
                                    ? "bg-white dark:bg-slate-900 ring-amber-200 dark:ring-amber-900/60"
                                    : "bg-white/40 dark:bg-slate-900/40 ring-slate-200 dark:ring-slate-800"
                                }`}
                              >
                                <div className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                                  {k}
                                </div>
                                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                  Line ₹{lineTaxTotals[k].toFixed(2)} · Bill ₹
                                  {billTaxMatch.billValues[k].toFixed(2)}
                                </div>
                                {drifted && (
                                  <div className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                                    Δ {billTaxMatch.diffs[k] > 0 ? "+" : ""}₹
                                    {billTaxMatch.diffs[k].toFixed(2)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(() => {
                  // Detect any line that has a GST rate but no rate→ledger mapping configured
                  const missingMappingRates = taxRateRollup
                    .filter((b) => Number(b.rate) > 0)
                    .filter((b) => !rateLedgerMap[b.rate])
                    .map((b) => `${Number(b.rate)}%`);

                  if (taxRateRollup.length === 0) {
                    return (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-[12px] text-slate-500 dark:text-slate-400">
                        No line items added yet. Add line items above to see the
                        tax breakdown.
                      </div>
                    );
                  }

                  const isInterState =
                    tallyAnalysedData?.gst_type === "IGST" ||
                    lineTaxTotals.igst > 0;

                  return (
                    <>
                      {missingMappingRates.length > 0 && (
                        <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-2 flex items-start gap-2">
                          <Icon
                            icon="heroicons:exclamation-triangle"
                            className="text-amber-600 dark:text-amber-400 text-base mt-0.5"
                          />
                          <div className="text-[12px] text-amber-800 dark:text-amber-300">
                            <span className="font-semibold">
                              Missing rate-ledger mapping
                            </span>{" "}
                            for {missingMappingRates.join(", ")}. Configure them
                            in <span className="font-semibold">Tally setup → Tax &amp; Adjustments</span> before verifying.
                          </div>
                        </div>
                      )}

                      {(() => {
                        // All 3 tax columns (IGST · CGST · SGST) stay
                        // visible. Inapplicable columns shrink to a 38px
                        // "—" placeholder so the applicable column(s) get
                        // full editable width (input + ledger dropdown)
                        // without pushing the Total column out of the card.
                        const cols = isInterState
                          ? "grid-cols-1 md:grid-cols-[50px_90px_minmax(190px,1fr)_38px_38px_90px]"
                          : "grid-cols-1 md:grid-cols-[50px_90px_38px_minmax(190px,1fr)_minmax(190px,1fr)_90px]";

                        // Editable amount + ledger cell. When the tax type
                        // doesn't apply on this bill (e.g. IGST on an
                        // intrastate bill) we render just a muted dash so
                        // the column still appears in the header for
                        // consistency, while the actual editable widget
                        // stays out of the way.
                        const renderEditableTaxCell = (
                          bucket,
                          taxType,
                          { isApplicable, options, mixed },
                        ) => {
                          if (!isApplicable) {
                            return (
                              <span className="italic text-slate-300 dark:text-slate-600 text-[11px] text-center">
                                —
                              </span>
                            );
                          }
                          const amountVal = bucket[taxType] || 0;
                          const ledgerId = bucket[`${taxType}_ledger_id`];
                          return (
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-stretch gap-1 min-w-0">
                                <div className="w-[70px] shrink-0">
                                  <EditableTaxAmount
                                    value={amountVal}
                                    disabled={isVerified}
                                    onCommit={(v) =>
                                      handleSummaryTaxAmountChange(
                                        bucket.rate,
                                        taxType,
                                        v,
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex-1 min-w-[110px]">
                                  <SearchableDropdown
                                    options={options}
                                    value={ledgerId || null}
                                    onChange={(id) =>
                                      handleSummaryTaxLedgerChange(
                                        bucket.rate,
                                        taxType,
                                        id,
                                      )
                                    }
                                    onClear={() =>
                                      handleSummaryTaxLedgerChange(
                                        bucket.rate,
                                        taxType,
                                        null,
                                      )
                                    }
                                    placeholder={`Select ${taxType.toUpperCase()} ledger…`}
                                    searchPlaceholder={`Search ${taxType.toUpperCase()} ledgers…`}
                                    optionLabelKey="name"
                                    optionValueKey="id"
                                    disabled={isVerified}
                                    size="sm"
                                    className="tax-summary-ledger-dropdown"
                                  />
                                </div>
                              </div>
                              {mixed && (
                                <span className="text-[10px] italic text-amber-600 dark:text-amber-400">
                                  Mixed ledgers across lines
                                </span>
                              )}
                            </div>
                          );
                        };

                        return (
                          // overflow-visible (not -hidden) so the inline
                          // ledger dropdown panel can render outside the
                          // card without getting clipped.
                          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-visible">
                            <div
                              className={`hidden md:grid ${cols} gap-2 px-2 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 rounded-t-lg`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                Rate
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                Taxable (₹)
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                IGST
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                CGST
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                SGST
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 text-right">
                                Total (₹)
                              </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {taxRateRollup.map((b) => {
                                const isZeroRate =
                                  Number(b.rate) === 0 ||
                                  b.rate === "Exempted" ||
                                  b.rate === "N/A";
                                const rowTotal = isZeroRate
                                  ? 0
                                  : isInterState
                                    ? b.igst || 0
                                    : (b.cgst || 0) + (b.sgst || 0);
                                return (
                                  <div
                                    key={b.rate}
                                    className={`grid ${cols} gap-2 px-2 py-2 items-center`}
                                  >
                                    <span className="inline-flex w-fit items-center justify-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 text-[11px] font-bold">
                                      {Number(b.rate)}%
                                    </span>
                                    <span className="text-[12px] font-mono text-slate-900 dark:text-white pt-[2px]">
                                      ₹{b.taxable.toFixed(2)}
                                    </span>
                                    {renderEditableTaxCell(b, "igst", {
                                      isApplicable: !isZeroRate && isInterState,
                                      options: igstLedgerOptions,
                                      mixed: b.igst_ledger_mixed,
                                    })}
                                    {renderEditableTaxCell(b, "cgst", {
                                      isApplicable: !isZeroRate && !isInterState,
                                      options: cgstLedgerOptions,
                                      mixed: b.cgst_ledger_mixed,
                                    })}
                                    {renderEditableTaxCell(b, "sgst", {
                                      isApplicable: !isZeroRate && !isInterState,
                                      options: sgstLedgerOptions,
                                      mixed: b.sgst_ledger_mixed,
                                    })}
                                    <span className="text-[13px] font-mono font-semibold text-slate-900 dark:text-white text-right pt-[2px]">
                                      ₹{rowTotal.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            <div
                              className={`grid ${cols} gap-2 px-2 py-2.5 items-center bg-blue-50/60 dark:bg-blue-950/30 border-t border-blue-100 dark:border-blue-900/60 rounded-b-lg`}
                            >
                              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-400">
                                Total
                              </span>
                              <span className="text-[12px] font-mono text-blue-700 dark:text-blue-400">
                                ₹
                                {taxRateRollup
                                  .reduce((s, b) => s + b.taxable, 0)
                                  .toFixed(2)}
                              </span>
                              <span className="text-[13px] font-mono font-bold text-blue-700 dark:text-blue-400">
                                {isInterState
                                  ? `₹${lineTaxTotals.igst.toFixed(2)}`
                                  : "—"}
                              </span>
                              <span className="text-[13px] font-mono font-bold text-blue-700 dark:text-blue-400">
                                {!isInterState
                                  ? `₹${lineTaxTotals.cgst.toFixed(2)}`
                                  : "—"}
                              </span>
                              <span className="text-[13px] font-mono font-bold text-blue-700 dark:text-blue-400">
                                {!isInterState
                                  ? `₹${lineTaxTotals.sgst.toFixed(2)}`
                                  : "—"}
                              </span>
                              <span className="text-[14px] font-mono font-bold text-blue-700 dark:text-blue-400 text-right">
                                ₹
                                {(isInterState
                                  ? lineTaxTotals.igst
                                  : lineTaxTotals.cgst + lineTaxTotals.sgst
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>

              {/* Bill Summary - Tax and Other Items */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:calculator" className="text-sm" />
                  </span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Adjustments
                  </h3>
                </div>

                {(() => {
                  const amountCls =
                    "w-full px-2 py-1.5 text-left text-[13px] font-mono font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

                  // CGST / SGST / IGST were removed from this panel — they are
                  // now derived per-line item from the GST rate column (read-only
                  // rollup is rendered above this block). Only the bill-level
                  // adjustments (cess, discount, freight, round-off) remain
                  // editable here.
                  const rows = [
                    { key: "cess", label: "Cess", required: parseFloat(billSummaryForm.cess || 0) > 0, missing: isCessLedgerRequired(), options: discountLedgerOptions, ledgerId: billSummaryForm.cessLedgerId, onSelect: handleCessLedgerSelect, onClear: handleCessLedgerClear, loading: purchaseLedgersLoading || expenseLedgersLoading, placeholder: "Cess ledger" },
                    { key: "discount", label: "Discount", required: parseFloat(billSummaryForm.discount || 0) > 0, missing: parseFloat(billSummaryForm.discount || 0) > 0 && !billSummaryForm.discountLedgerId && !isVerified, options: discountLedgerOptions, ledgerId: billSummaryForm.discountLedgerId, onSelect: handleDiscountLedgerSelect, onClear: handleDiscountLedgerClear, loading: purchaseLedgersLoading || expenseLedgersLoading, placeholder: "Discount ledger" },
                    { key: "freight", label: "Freight / Delivery", required: parseFloat(billSummaryForm.freight || 0) > 0, missing: isFreightLedgerRequired(), options: discountLedgerOptions, ledgerId: billSummaryForm.freightLedgerId, onSelect: handleFreightLedgerSelect, onClear: handleFreightLedgerClear, loading: purchaseLedgersLoading || expenseLedgersLoading, placeholder: "Freight ledger" },
                    { key: "round_off", label: "Round off", required: parseFloat(billSummaryForm.round_off || 0) !== 0, missing: parseFloat(billSummaryForm.round_off || 0) !== 0 && !billSummaryForm.roundOffLedgerId && !isVerified, options: discountLedgerOptions, ledgerId: billSummaryForm.roundOffLedgerId, onSelect: handleRoundOffLedgerSelect, onClear: handleRoundOffLedgerClear, loading: purchaseLedgersLoading || expenseLedgersLoading, placeholder: "Round-off ledger" },
                  ];

                  return (
                    // overflow-visible (not -hidden) so the inline ledger
                    // dropdown panels can render outside the card without
                    // getting clipped.
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-visible">
                      {/* Header */}
                      <div className="hidden md:grid grid-cols-[140px_160px_1fr] gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 rounded-t-lg">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Tax type</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Amount (₹)</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Ledger account</span>
                      </div>

                      {/* Rows */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((r) => (
                          <div
                            key={r.key}
                            className="grid grid-cols-[140px_160px_1fr] gap-3 px-3 py-2 items-center"
                          >
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              {r.label}
                              {r.required && <span className="text-rose-500">*</span>}
                              {r.key === "round_off" &&
                                !isVerified &&
                                billTotalMatch.hasBillValue &&
                                !billTotalMatch.isMatch && (
                                  <button
                                    type="button"
                                    onClick={handleAutoFillRoundOff}
                                    title={`Auto-fill so total matches bill (₹${billTotalMatch.billTotal.toFixed(2)})`}
                                    className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200 dark:ring-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-950/60 cursor-pointer"
                                  >
                                    <Icon icon="heroicons:sparkles" className="text-[11px]" />
                                    Auto-fill
                                  </button>
                                )}
                            </label>
                            <input
                              type="number"
                              name={r.key}
                              value={billSummaryForm[r.key]}
                              onChange={(e) => handleBillSummaryChange(r.key, e.target.value)}
                              placeholder="0.00"
                              disabled={isVerified}
                              className={amountCls}
                            />
                            <QuickAddGroup
                              kind="ledger"
                              disabled={isVerified}
                              ledgerDefaultParent={r.quickAddParent || "Indirect Expenses"}
                              ledgerTitle={`Add New ${r.label} Ledger`}
                              title="Ledger not in the list? Create one"
                              onCreated={(ledger) =>
                                ledger?.id && r.onSelect(ledger.id)
                              }
                              className={`relative ${
                                r.missing && !isVerified
                                  ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                  : ""
                              }`}
                            >
                              <SearchableDropdown
                                triggerClassName="rounded-r-none"
                                options={r.options}
                                value={r.ledgerId || null}
                                onChange={r.onSelect}
                                onClear={r.onClear}
                                placeholder={
                                  r.required ? `Select ${r.placeholder}*` : `Select ${r.placeholder}`
                                }
                                searchPlaceholder={`Search ${r.placeholder.toLowerCase()}…`}
                                optionLabelKey="name"
                                optionValueKey="id"
                                loading={r.loading}
                                disabled={isVerified}
                                renderOption={(ledger) => (
                                  <div className="flex flex-col py-1">
                                    <div className="font-medium text-slate-900 dark:text-white text-sm">
                                      {ledger.name}
                                    </div>
                                    {ledger.type && (
                                      <div className="text-[11px] text-blue-600 dark:text-blue-400">
                                        {ledger.type} Ledger
                                      </div>
                                    )}
                                  </div>
                                )}
                                className="text-xs"
                              />
                            </QuickAddGroup>
                          </div>
                        ))}
                      </div>

                      {/* Total row */}
                      <div className="grid grid-cols-[140px_160px_1fr] gap-3 px-3 py-3 items-center bg-blue-50/60 dark:bg-blue-950/30 border-t-2 border-blue-100 dark:border-blue-900/60 rounded-b-lg">
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400">
                          Total amount
                        </span>
                        <input
                          type="number"
                          name="total"
                          value={billSummaryForm.total}
                          readOnly
                          tabIndex={-1}
                          placeholder="0.00"
                          title="Computed automatically from subtotal + taxes + adjustments"
                          className={`w-full px-2 py-1.5 text-left text-base font-bold font-mono text-blue-700 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/30 border rounded-md focus:outline-none cursor-default select-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            billTotalMatch.hasBillValue && !billTotalMatch.isMatch
                              ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-900/60"
                              : "border-blue-200 dark:border-blue-900/60"
                          }`}
                        />
                        {/* Caption — switches to an amber heads-up when
                            the computed total drifts from the OCR-extracted
                            invoice total by more than ±₹1. Informational
                            only; does not block verification. */}
                        {billTotalMatch.hasBillValue &&
                        !billTotalMatch.isMatch ? (
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span
                              className="inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-900/60 text-[10.5px] font-bold uppercase tracking-wide"
                              title={`Computed total ₹${billTotalMatch.computedTotal.toFixed(2)} differs from the invoice total on the bill (₹${billTotalMatch.billTotal.toFixed(2)}) by ${billTotalMatch.diff > 0 ? "+" : ""}₹${billTotalMatch.diff.toFixed(2)}. This won't block verification.`}
                            >
                              <Icon
                                icon="heroicons:information-circle"
                                className="text-[12px]"
                              />
                              Differs from bill total
                            </span>
                            <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 truncate">
                              Bill ₹{billTotalMatch.billTotal.toFixed(2)} · Δ{" "}
                              {billTotalMatch.diff > 0 ? "+" : ""}₹
                              {billTotalMatch.diff.toFixed(2)}
                            </span>
                          </div>
                        ) : billTotalMatch.hasBillValue ? (
                          <span className="inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-900/60 text-[10.5px] font-bold uppercase tracking-wide">
                            <Icon
                              icon="heroicons:check-circle"
                              className="text-[12px]"
                            />
                            Matches bill total
                          </span>
                        ) : (
                          <span className="text-[11px] text-blue-700/80 dark:text-blue-400/80">
                            Auto-calculated · Subtotal + taxes + adjustments
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Notes Section */}
              <div className="p-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                      <Icon icon="heroicons:pencil-square" className="text-sm" />
                    </span>
                    <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                      Notes
                    </label>
                  </div>
                  <textarea
                    value={
                      notes ||
                      `Bill from ${
                        vendorForm.selectedVendor?.name ||
                        analysedData?.from?.name ||
                        tallyAnalysedData?.vendor_name ||
                        "Vendor"
                      } entered via BillMunshi ${
                        window.location.origin
                      }/tally/vendor-bill/${billId}\n\n`
                    }
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isVerified}
                    className={`w-full h-24 px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none ${
                      isVerified
                        ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    placeholder="Add notes or comments..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && billInfo?.file && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={(e) => {
            // Close fullscreen when clicking on the background overlay
            if (e.target === e.currentTarget) {
              toggleFullscreen();
            }
          }}
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Fullscreen Header - Fixed */}
            <div
              className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-70 backdrop-blur-sm flex-shrink-0 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4">
                <h3 className="text-white text-lg font-medium">
                  Bill Document -{" "}
                  {billInfo.bill_munshi_name ||
                    analysedData.invoiceNumber ||
                    "Unknown"}
                </h3>
                {!isPDF(billInfo.file) && (
                  <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <button
                      onClick={handleZoomOut}
                      className="p-1.5 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Zoom Out (Ctrl + -)"
                      disabled={zoomLevel <= 0.25}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                        />
                      </svg>
                    </button>
                    <span className="text-white text-sm font-medium min-w-[45px] text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-1.5 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Zoom In (Ctrl + +)"
                      disabled={zoomLevel >= 3}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-1.5 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                      title="Reset Zoom (Ctrl + 0)"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                title="Close Fullscreen (Esc or click outside)"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>

            {/* Fullscreen Content - Scrollable */}
            <div
              className="flex-1 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {isPDF(billInfo.file) ? (
                <iframe
                  src={billInfo.file}
                  className="w-full h-full border-0"
                  title="Bill PDF Document - Fullscreen"
                />
              ) : (
                <div
                  className="w-full h-full p-8"
                  style={{
                    cursor: zoomLevel > 1 ? "move" : "default",
                    minHeight: "100%",
                    display: "flex",
                    alignItems: zoomLevel <= 1 ? "center" : "flex-start",
                    justifyContent: zoomLevel <= 1 ? "center" : "flex-start",
                  }}
                >
                  <img
                    src={billInfo.file}
                    alt="Bill Document - Fullscreen"
                    className="rounded-lg shadow-2xl transition-transform duration-200 select-none"
                    style={{
                      width: zoomLevel <= 1 ? "auto" : `${zoomLevel * 100}%`,
                      height: zoomLevel <= 1 ? "100%" : "auto",
                      maxWidth: zoomLevel <= 1 ? "100%" : "none",
                      maxHeight: zoomLevel <= 1 ? "100%" : "none",
                      objectFit: "contain",
                    }}
                    draggable="false"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TallyVendorBillDetail;
