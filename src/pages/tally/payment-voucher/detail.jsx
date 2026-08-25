import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { apiFetch } from "@/utils/apiClient";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import Switch from "@/components/ui/Switch";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import {
  useGetTallyPaymentVoucherDetails,
  useVerifyTallyPaymentVoucher,
  useSyncTallyPaymentVoucher,
} from "@/services/tally/tallyPaymentVoucherService";
import {
  useGetTallyVendorLedgers,
  useGetTallyExpenseChartOfAccountsLedgers,
  useGetTallyCgstLedgers,
  useGetTallySgstLedgers,
  useGetTallyIgstLedgers,
} from "@/services/tally/tallyApiService";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";
import { QuickAddGroup } from "@/components/tally/QuickAddMaster";
import { tallySyncWithMastersGuard } from "@/utils/tallySyncGuard";
import { CONTROL, CONTROL_NUM, CONTROL_SELECT, CONTROL_SELECT_ARROW, CONTROL_TEXTAREA, CONTROL_VALIDATED } from "@/constants/ui";

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
 * passing the parsed numeric string to the parent.
 *
 * Mirrors the helper used in the tally vendor-bill detail page so both
 * pages have identical typing UX.
 */
const EditableTaxAmount = ({ value, disabled, onCommit, className = "" }) => {
  const formatted = Number(value || 0).toFixed(2);
  const [draft, setDraft] = useState(formatted);
  const [focused, setFocused] = useState(false);

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
      className={
        className ||
        "w-full px-2 py-1.5 text-xs font-mono text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      }
    />
  );
};

const TallyPaymentVoucherDetail = () => {
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [collapsed, setMenuCollapsed] = useSidebar();
  const navigate = useNavigate();
  const { id: billId } = useParams();
  const { selectedOrganization } = useSelector((state) => state.auth);

  // Form state for bill information
  const [billForm, setBillForm] = useState({
    billNumber: "",
    billDate: "",
    dueDate: "",
    vendorName: "",
    companyId: "",
    totalAmount: "",
    selectedVendor: null,
    vendorGST: "",
    // Payment Mode — the Bank/Cash ledger the payment is actually made
    // through (Correction 26). Distinct from `selectedVendor` above,
    // which is now a plain vendor identification picker.
    selectedPaymentMode: null,
    paymentModeName: "",
  });

  // State for managing expense items
  const [expenseItems, setExpenseItems] = useState([]);

  // State for consolidate toggle.
  //
  // Correction 28: payment vouchers default to NOT consolidated. This file was
  // copied from the journal-entry page, where the product requirement is the
  // opposite (Correction 6), and the default came along with it.
  const [isConsolidated, setIsConsolidated] = useState(false);

  // Rows as they were before the last "consolidate ON", so switching back OFF
  // restores exactly what the user was looking at. Needed because a payment
  // voucher often has no backend-built ``products`` array to fall back to.
  const preConsolidateRowsRef = useRef(null);

  // Form state for tax summary.
  // No `tds`/`tdsLedgerId`/`tdsDebitCredit` — TDS was removed from payment
  // vouchers, and the verify payload sends a hard zero for it.
  const [taxSummaryForm, setTaxSummaryForm] = useState({
    igst: "",
    cgst: "",
    sgst: "",
    igstLedgerId: null,
    cgstLedgerId: null,
    sgstLedgerId: null,
    igstDebitCredit: "debit",
    cgstDebitCredit: "debit",
    sgstDebitCredit: "debit",
    vendorDebitCredit: "credit",
    vendorAmount: "",
    other_adjustment: "0.00",
    other_adjustment_debit_or_credit: "debit",
    other_adjustment_taxes: null,
    round_off: "0.00",
    round_off_debit_or_credit: "debit",
    round_off_taxes: null,
  });

  // Multi-rate GST entries for Journal voucher. Each item:
  //   { id, rate: "18%", tax_type: "CGST"|"SGST"|"IGST",
  //     amount: "4500.00", ledger_id: <uuid|null>,
  //     debit_or_credit: "debit"|"credit" }
  // Replaces the old single CGST/SGST/IGST rows. Hydrated from
  // ``analyzed_bill.gst_lines`` and sent back in the verify payload.
  const [gstLines, setGstLines] = useState([]);

  // State for notes
  const [notes, setNotes] = useState("");

  // State for date validation errors
  const [dateErrors, setDateErrors] = useState({
    billDate: "",
    dueDate: "",
  });

  // State for image zoom and viewing
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State for verification loading
  const verifyInFlightRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // State for error alert
  const [errorAlert, setErrorAlert] = useState({
    show: false,
    message: "",
    details: "",
  });

  // State to track if user manually cleared vendor selection
  const [vendorManuallyCleared, setVendorManuallyCleared] = useState(false);
  // Same guard for the Payment Mode dropdown (Correction 26) — mirrors
  // the vendor-clear pattern so hydration never fights a manual clear.
  const [paymentModeManuallyCleared, setPaymentModeManuallyCleared] =
    useState(false);

  // State for sync operation
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch payment voucher details
  const {
    data: expenseBillData,
    error,
    isLoading,
    // `isLoading` is `isPending && isFetching` in react-query v5, so it
    // is false once the bill has loaded once. `isFetching` is the flag
    // that stays true for a manual refetch — the Refresh spinner needs
    // that one, not `isLoading`.
    isFetching,
    refetch,
  } = useGetTallyPaymentVoucherDetails(
    { organizationId: selectedOrganization?.id, billId },
    { enabled: !!selectedOrganization?.id && !!billId },
  );

  // Fetch expense chart of accounts ledgers for Chart of Accounts dropdown
  const { data: ledgersData, isLoading: ledgersLoading } =
    useGetTallyExpenseChartOfAccountsLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch vendor ledgers for vendor selection dropdown
  const { data: vendorLedgersData, isLoading: vendorLedgersLoading } =
    useGetTallyVendorLedgers(selectedOrganization?.id, {
      enabled: !!selectedOrganization?.id,
    });

  // Fetch Payment Mode ledgers (Correction 26) — ledgers whose parent is
  // in TallyConfig.payment_parents (Bank Accounts / Cash In Hand). Same
  // generic `configs/ledgers/?parent_type=...` endpoint the other
  // ledger dropdowns on this page use; called directly with apiFetch
  // since a dedicated hook for this parent_type doesn't exist yet in
  // tallyApiService.js.
  const { data: paymentModeLedgersData, isLoading: paymentModeLedgersLoading } =
    useQuery({
      queryKey: ["tallyPaymentModeLedgers", selectedOrganization?.id],
      queryFn: () =>
        apiFetch(
          `tally/org/${selectedOrganization.id}/configs/ledgers/?parent_type=payment_parents`,
          { method: "GET", headers: { "Content-Type": "application/json" } },
        ),
      enabled: !!selectedOrganization?.id,
    });

  // The generic tax-ledger fetch was only ever used to populate the TDS
  // dropdown. TDS is gone, and CGST/SGST/IGST have their own dedicated
  // queries below, so the request is no longer issued.

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

  // Verify mutation
  const { mutateAsync: verifyExpenseBill } = useVerifyTallyPaymentVoucher();

  // Sync mutation
  const { mutateAsync: syncExpenseBill } = useSyncTallyPaymentVoucher();

  // Extract data from the API response
  const billInfo = expenseBillData || {};
  const analysedData = billInfo?.analysed_data || {};
  const tallyAnalysedData = billInfo?.analyzed_bill || {};

  // Disable inputs only when bill is fully posted to Tally (tally_synced is true)
  const isVerified = billInfo?.tally_synced === true;

  // Bill-image vs user-edited tax reconciliation. ``analysed_data``
  // carries the raw CGST/SGST/IGST values extracted from the original
  // bill image before any user edits. The user can edit the Tax & Other
  // Items rows freely, which silently changes the tax totals. We compare
  // the two sides so the operator gets an explicit warning when the
  // verified bill no longer matches what was printed on the invoice.
  // Informational only — never blocks verification (mirrors the badge
  // pattern used on the tally vendor-bill page).
  const billTaxMatch = useMemo(() => {
    const TOL = 1; // ±₹1 — same tolerance the backend treats as a warning
    const billValues = {
      cgst: parseFloat(analysedData?.cgst) || 0,
      sgst: parseFloat(analysedData?.sgst) || 0,
      igst: parseFloat(analysedData?.igst) || 0,
    };
    // Sum the multi-rate gstLines per tax type. CGST = sum of all CGST
    // entries across rates (e.g. 18% + 28%), same for SGST + IGST.
    const sumLines = (taxType) =>
      gstLines
        .filter((l) => l.tax_type === taxType)
        .reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
    const editedValues = {
      cgst: sumLines("CGST"),
      sgst: sumLines("SGST"),
      igst: sumLines("IGST"),
    };
    const haveBillValues =
      billValues.cgst > 0 || billValues.sgst > 0 || billValues.igst > 0;
    if (!haveBillValues) {
      return { hasBillValues: false };
    }
    const diffs = {
      cgst: Number((editedValues.cgst - billValues.cgst).toFixed(2)),
      sgst: Number((editedValues.sgst - billValues.sgst).toFixed(2)),
      igst: Number((editedValues.igst - billValues.igst).toFixed(2)),
    };
    const mismatches = ["cgst", "sgst", "igst"].filter(
      (k) => Math.abs(diffs[k]) > TOL,
    );
    return {
      hasBillValues: true,
      billValues,
      editedValues,
      diffs,
      mismatches,
      isMatch: mismatches.length === 0,
    };
  }, [
    analysedData?.cgst,
    analysedData?.sgst,
    analysedData?.igst,
    gstLines,
  ]);

  // Invoice-total reconciliation for the Payment voucher.
  //
  // Correction 46: what the invoice total is checked against. Note this one
  // DOES block verification — unlike `billTaxMatch`, which stays advisory.
  //
  //   Line item subtotal + GST subtotal + Round off + Other Adjustment
  //     = Total Invoice Amount
  //
  // No TDS term — payment vouchers don't deduct tax at source (Correction 20),
  // which is the one way this differs from the journal-entry formula.
  //
  // This used to compare `billForm.totalAmount` against `analysedData.total`.
  // With the total pinned to the OCR figure that is a value against itself, so
  // it reported "matches bill total" no matter what the rows added up to.
  // The figure the voucher actually settles through the Bank/Cash ledger.
  //
  // This is the balancing amount the double-entry effect below maintains,
  // which for the default sides works out to exactly the formula above:
  // line items + GST + round off + other adjustment. Reading it from there
  // rather than recomputing the sum keeps the Amount Paid row, the invoice
  // check and the `vendor_amount` that gets posted from ever disagreeing —
  // a plain "+" of its own would drift the moment someone flipped a row to
  // the credit side.
  const amountPaidComputed = Number(
    (parseFloat(taxSummaryForm.vendorAmount) || 0).toFixed(2),
  );

  const billTotalMatch = useMemo(() => {
    const TOL = 0.01; // paise-accurate; Round Off (auto) closes the gap
    const billTotal = parseFloat(billForm.totalAmount);
    if (!billTotal || Number.isNaN(billTotal)) {
      return { hasBillValue: false };
    }
    const diff = Number((amountPaidComputed - billTotal).toFixed(2));
    return {
      hasBillValue: true,
      billTotal,
      currentTotal: amountPaidComputed,
      diff,
      isMatch: Math.abs(diff) <= TOL,
    };
  }, [billForm.totalAmount, amountPaidComputed]);

  // Validation helper functions
  const isVendorRequired = !billForm.selectedVendor;
  // Payment Mode (Correction 26) — required alongside Vendor for both
  // verify and sync.
  const isPaymentModeRequired = !billForm.selectedPaymentMode;
  const getItemsWithoutCOA = () =>
    expenseItems.filter((item) => !item.chart_of_accounts_id);

  // Tax ledger validation helpers.
  //
  // Validated against the GST Lines table — NOT ``taxSummaryForm.*LedgerId``.
  // The bill-level CGST/SGST/IGST ledger dropdowns were removed when GST
  // moved to the multi-rate GST Lines table, so the old bill-level check
  // could only be satisfied by backend auto-match: picking a ledger in the
  // UI left the warning banner stuck on screen with nothing left to fix.
  const gstLinesOfTypeWithoutLedger = (taxType) =>
    (gstLines || []).filter(
      (line) =>
        line.tax_type === taxType &&
        parseFloat(line.amount || 0) > 0 &&
        !line.ledger_id &&
        !line.ledger,
    );

  const isCgstLedgerRequired = () =>
    gstLinesOfTypeWithoutLedger("CGST").length > 0;

  const isSgstLedgerRequired = () =>
    gstLinesOfTypeWithoutLedger("SGST").length > 0;

  const isIgstLedgerRequired = () =>
    gstLinesOfTypeWithoutLedger("IGST").length > 0;

  const isOtherAdjustmentLedgerRequired = () => {
    const otherAdjustmentAmount = parseFloat(
      taxSummaryForm.other_adjustment || 0,
    );
    return otherAdjustmentAmount > 0 && !taxSummaryForm.other_adjustment_taxes;
  };

  // Round-off ledger required whenever round_off != 0 (can be negative).
  const isRoundOffLedgerRequired = () => {
    const roundOffAmount = parseFloat(taxSummaryForm.round_off || 0);
    return roundOffAmount !== 0 && !taxSummaryForm.round_off_taxes;
  };

  // Removed: a "subtotal cannot exceed total" guard.
  //
  // `isTotalOutOfBalance` already enforces the exact identity
  // (line items + GST + round off + other adjustment = invoice total), which
  // is strictly stronger. All the inequality added on top was a false positive
  // whenever the adjustments were net negative — a legitimate discount.

  const getGstLinesWithoutLedger = () =>
    (gstLines || []).filter(
      (line) =>
        parseFloat(line.amount || 0) > 0 && !line.ledger_id && !line.ledger,
    );

  const isBalanceOff = () => {
    const debit = expenseItems
      .filter((i) => i.debit_or_credit === "debit")
      .reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const credit = expenseItems
      .filter((i) => i.debit_or_credit === "credit")
      .reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    let tDr = 0, tCr = 0;
    for (const line of gstLines || []) {
      const amt = parseFloat(line.amount || 0);
      if (!amt) continue;
      (line.debit_or_credit === "credit" ? (tCr += amt) : (tDr += amt));
    }
    // Signed, matching the vendor-amount computation — mismatched conventions
    // would raise a phantom "does not balance" on any negative round-off.
    const push = (v, dc) => {
      const a = parseFloat(v || 0) || 0;
      if (!a) return;
      (dc === "credit" ? (tCr += a) : (tDr += a));
    };
    push(taxSummaryForm.other_adjustment, taxSummaryForm.other_adjustment_debit_or_credit);
    push(taxSummaryForm.round_off, taxSummaryForm.round_off_debit_or_credit);
    push(taxSummaryForm.vendorAmount, taxSummaryForm.vendorDebitCredit);
    return Math.abs(debit + tDr - credit - tCr) > 0.01;
  };

  // Correction 46: the invoice total must agree with the parts that make it up.
  const isTotalOutOfBalance = () =>
    billTotalMatch.hasBillValue && !billTotalMatch.isMatch;

  const hasValidationErrors = () =>
    isVendorRequired ||
    isPaymentModeRequired ||
    getItemsWithoutCOA().length > 0 ||
    expenseItems.length === 0 ||
    isCgstLedgerRequired() ||
    isSgstLedgerRequired() ||
    isIgstLedgerRequired() ||
    isOtherAdjustmentLedgerRequired() ||
    isRoundOffLedgerRequired() ||
    getGstLinesWithoutLedger().length > 0 ||
    isBalanceOff() ||
    isTotalOutOfBalance();

  // Get specific validation error messages
  const getValidationErrorMessages = () => {
    const errors = [];
    if (isVendorRequired) errors.push("Please select a Vendor");
    if (isPaymentModeRequired) errors.push("Please select a Payment Mode");
    if (getItemsWithoutCOA().length > 0) {
      errors.push(
        `${getItemsWithoutCOA().length} expense item(s) are missing Expense Ledger`,
      );
    }
    if (expenseItems.length === 0)
      errors.push("At least one expense item is required");
    // "Select a CGST ledger for the 18% GST line" — names the rate so the
    // operator knows which row of the GST Lines table to fix.
    const missingGstLedgerMessage = (taxType) => {
      const rates = Array.from(
        new Set(
          gstLinesOfTypeWithoutLedger(taxType)
            .map((line) => line.rate)
            .filter(Boolean),
        ),
      );
      const where = rates.length
        ? ` for the ${rates.join(", ")} GST line${rates.length > 1 ? "s" : ""}`
        : "";
      return `Select a ${taxType} ledger${where} in the GST Lines table`;
    };
    if (isCgstLedgerRequired()) errors.push(missingGstLedgerMessage("CGST"));
    if (isSgstLedgerRequired()) errors.push(missingGstLedgerMessage("SGST"));
    if (isIgstLedgerRequired()) errors.push(missingGstLedgerMessage("IGST"));
    if (isOtherAdjustmentLedgerRequired())
      errors.push(
        "Other adjustment ledger is required when adjustment amount > 0",
      );
    if (isRoundOffLedgerRequired())
      errors.push("Round-off ledger is required when round-off amount is set");
    // Any remaining ledger-less GST line not already reported by the
    // per-tax-type messages above (e.g. an unexpected tax_type).
    const noLedgerLines = getGstLinesWithoutLedger().filter(
      (line) => !["CGST", "SGST", "IGST"].includes(line.tax_type),
    );
    if (noLedgerLines.length > 0) {
      errors.push(
        `${noLedgerLines.length} GST line(s) with non-zero amount are missing a ledger`,
      );
    }
    if (isBalanceOff())
      errors.push(
        "Total debits and credits do not balance — check line amounts, taxes, adjustments and Bank/Cash amount",
      );
    if (isTotalOutOfBalance())
      errors.push(
        `Invoice total doesn't agree — line items + GST + round off + other ` +
          `adjustment comes to ₹${billTotalMatch.currentTotal.toFixed(2)}, ` +
          `but the invoice total is ₹${billTotalMatch.billTotal.toFixed(2)} ` +
          `(off by ${billTotalMatch.diff > 0 ? "+" : ""}₹${billTotalMatch.diff.toFixed(2)})`,
      );
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

    if (!value) {
      setDateErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    if (validateDateInput(value)) {
      setDateErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    // Only emit an error if it parses as a full YYYY-MM-DD — that means
    // the user finished typing and the result is genuinely out-of-range.
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

  // Process ledgers data for dropdown (Chart of Accounts)
  const processLedgers = () => {
    if (!ledgersData?.grouped_ledgers) return [];

    const ledgers = [];
    Object.values(ledgersData.grouped_ledgers).forEach((group) => {
      if (group.ledgers && Array.isArray(group.ledgers)) {
        group.ledgers.forEach((ledger) => {
          ledgers.push({
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
    return ledgers;
  };

  // Memoised because the ledger-matching effects below take these arrays as
  // dependencies. Rebuilt inline on every render they were a fresh array
  // reference each time, so those effects fired after *every* state change
  // instead of only when the ledger data actually arrived.
  const ledgerOptions = useMemo(() => processLedgers(), [ledgersData]);

  // Process vendor ledgers data for dropdown
  const processVendorLedgers = () => {
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
  };

  const vendorOptions = useMemo(
    () => processVendorLedgers(),
    [vendorLedgersData],
  );

  // Process Payment Mode ledgers into TWO simple options: Bank / Cash.
  // The client asked for a plain-terms 2-option dropdown ("HDFC walle
  // ka sense nahi hai") rather than a long list of specific ledgers.
  // Each option's `id` = the first ledger under the corresponding
  // parent group in this org — that ledger is what's actually posted
  // to Tally. Categorisation is by parent-group name (bank / cash).
  const processPaymentModeLedgers = () => {
    if (!paymentModeLedgersData?.grouped_ledgers) return [];

    const byCategory = { Bank: null, Cash: null };
    Object.values(paymentModeLedgersData.grouped_ledgers).forEach((group) => {
      const parentName = (group?.parent_name || "").toLowerCase();
      let cat = null;
      if (parentName.includes("bank")) cat = "Bank";
      else if (parentName.includes("cash")) cat = "Cash";
      if (!cat) return;
      const firstLedger = (group.ledgers || [])[0];
      if (!firstLedger || byCategory[cat]) return;
      byCategory[cat] = {
        id: firstLedger.id,
        name: cat,
        parent_name: group.parent_name,
        underlying_ledger_name: firstLedger.name,
      };
    });
    return [byCategory.Bank, byCategory.Cash].filter(Boolean);
  };

  const paymentModeOptions = processPaymentModeLedgers();

  // Process CGST ledgers data for dropdown
  const processCgstLedgers = () => {
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
  };

  // Process SGST ledgers data for dropdown
  const processSgstLedgers = () => {
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
  };

  // Process IGST ledgers data for dropdown
  const processIgstLedgers = () => {
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
  };

  const cgstLedgerOptions = useMemo(
    () => processCgstLedgers(),
    [cgstLedgersData],
  );
  const sgstLedgerOptions = useMemo(
    () => processSgstLedgers(),
    [sgstLedgersData],
  );
  const igstLedgerOptions = useMemo(
    () => processIgstLedgers(),
    [igstLedgersData],
  );

  // Update form when data is loaded
  useEffect(() => {
    if (expenseBillData && Object.keys(expenseBillData).length > 0) {
      const data = analysedData;
      const tally = tallyAnalysedData;

      setBillForm({
        billNumber:
          tally?.bill_no || data?.invoiceNumber || data?.billNumber || "",
        // TZ-safe normalizer (see expense/vendor detail for rationale).
        billDate: (() => {
          const raw = tally?.bill_date || data?.dateIssued;
          if (!raw) return "";
          const s = String(raw);
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
          const m = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
          if (m) return `${m[3]}-${m[2]}-${m[1]}`;
          const d = new Date(s);
          if (Number.isNaN(d.getTime())) return "";
          return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        })(),
        dueDate: (() => {
          const raw =
            tally?.due_date ||
            data?.dueDate ||
            tally?.bill_date ||
            data?.dateIssued;
          if (!raw) return "";
          const s = String(raw);
          if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
          const m = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
          if (m) return `${m[3]}-${m[2]}-${m[1]}`;
          const d = new Date(s);
          if (Number.isNaN(d.getTime())) return "";
          return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
        })(),
        vendorName: tally?.vendor_name || data?.from?.name || "",
        companyId: tally?.company_id || "",
        totalAmount: tally?.total || data?.total || "",
        selectedVendor: null, // Will be set in the next useEffect
        vendorGST: "",
        selectedPaymentMode: null, // Will be set in the payment-mode hydration effect
        paymentModeName: tally?.payment_mode_name || tally?.payment_mode?.name || "",
      });

      // Initialize Tax Summary Form
      setTaxSummaryForm({
        igst: tally?.igst || data?.igst || "",
        cgst: tally?.cgst || data?.cgst || "",
        sgst: tally?.sgst || data?.sgst || "",
        // A TDS value on the analysed data is deliberately not loaded —
        // there is no field to review or edit it in, so carrying it would
        // post a line the operator can't see.
        igstLedgerId: tally?.igst_taxes || null,
        cgstLedgerId: tally?.cgst_taxes || null,
        sgstLedgerId: tally?.sgst_taxes || null,
        igstDebitCredit: tally?.igst_debit_or_credit || "debit",
        cgstDebitCredit: tally?.cgst_debit_or_credit || "debit",
        sgstDebitCredit: tally?.sgst_debit_or_credit || "debit",
        vendorDebitCredit: tally?.vendor_debit_or_credit || "credit",
        vendorAmount: tally?.vendor_amount || tally?.total || data?.total || "",
        other_adjustment: tally?.other_adjustment || "0.00",
        other_adjustment_debit_or_credit:
          tally?.other_adjustment_debit_or_credit || "debit",
        other_adjustment_taxes: tally?.other_adjustment_taxes || null,
        round_off: tally?.round_off || "0.00",
        round_off_debit_or_credit:
          tally?.round_off_debit_or_credit || "debit",
        round_off_taxes: tally?.round_off_taxes || null,
      });

      // Initialize multi-rate GST lines from API. Each backend row
      // becomes one ``gstLines`` entry. If the backend hasn't sent
      // anything (very old bills migrated in-flight, or fresh AI bills
      // before verify), we seed from the legacy bill-level CGST/SGST/
      // IGST values so the UI doesn't start empty.
      const apiGstLines = Array.isArray(tally?.gst_lines)
        ? tally.gst_lines
        : [];
      if (apiGstLines.length > 0) {
        setGstLines(
          apiGstLines.map((line) => ({
            id: line.id || `gst-${Date.now()}-${Math.random()}`,
            rate: line.rate || "",
            tax_type: line.tax_type || "CGST",
            amount: line.amount != null ? String(line.amount) : "",
            ledger_id: line.ledger || null,
            debit_or_credit: line.debit_or_credit || "debit",
          })),
        );
      } else {
        // Seed from legacy bill-level fields so the operator sees the
        // OCR-extracted GST instead of an empty table on first open.
        const seeded = [];
        const seedRate = "18%"; // default slab; user re-picks on first edit
        const cgst = parseFloat(tally?.cgst || 0);
        const sgst = parseFloat(tally?.sgst || 0);
        const igst = parseFloat(tally?.igst || 0);
        if (cgst > 0) {
          seeded.push({
            id: `gst-seed-cgst-${Date.now()}`,
            rate: seedRate,
            tax_type: "CGST",
            amount: String(cgst),
            ledger_id: tally?.cgst_taxes || null,
            debit_or_credit: tally?.cgst_debit_or_credit || "debit",
          });
        }
        if (sgst > 0) {
          seeded.push({
            id: `gst-seed-sgst-${Date.now()}`,
            rate: seedRate,
            tax_type: "SGST",
            amount: String(sgst),
            ledger_id: tally?.sgst_taxes || null,
            debit_or_credit: tally?.sgst_debit_or_credit || "debit",
          });
        }
        if (igst > 0) {
          seeded.push({
            id: `gst-seed-igst-${Date.now()}`,
            rate: seedRate,
            tax_type: "IGST",
            amount: String(igst),
            ledger_id: tally?.igst_taxes || null,
            debit_or_credit: tally?.igst_debit_or_credit || "debit",
          });
        }
        setGstLines(seeded);
      }

      // Initialize notes
      setNotes(tally?.note || "");

      // Initialize consolidate status from analyzed data.
      //
      // Correction 28: payment vouchers open UN-consolidated. A bill saved
      // earlier with an explicit ``consolidate`` value still wins; only
      // ``undefined``/``null`` falls through to the off default.
      const consolidateStatus =
        tally?.consolidate === undefined || tally?.consolidate === null
          ? false
          : Boolean(tally.consolidate);
      setIsConsolidated(consolidateStatus);

      // Initialize expense items from consolidate_prod or expense_items based on consolidate status
      let sourceItems = [];

      // Line items straight off the AI payload, whichever key it used.
      // `expenses` is what the prompt emits; the others are older spellings.
      const rawAnalysedItems =
        [data?.expenses, data?.payments, data?.items].find(
          (list) => Array.isArray(list) && list.length > 0,
        ) || [];

      if (consolidateStatus && tally?.consolidate_prod?.length > 0) {
        // Use consolidated data - properly handle chart_of_accounts mapping
        sourceItems = tally.consolidate_prod.map((item, index) => {
          // Check if chart_of_accounts looks like a UUID (for ID) or is a name
          let chartOfAccountsName = "No COA Ledger";
          let chartOfAccountsId = null;

          if (
            item.chart_of_accounts &&
            item.chart_of_accounts !== "No COA Ledger"
          ) {
            // If it's a UUID-like string, it's probably an ID
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(item.chart_of_accounts)) {
              chartOfAccountsId = item.chart_of_accounts;
              // We'll set the name later when ledger options are available
            } else {
              chartOfAccountsName = item.chart_of_accounts;
            }
          }

          return {
            id: item.id || index,
            item_id: item.id || null,
            item_details: item.item_details || "",
            chart_of_accounts: chartOfAccountsName,
            chart_of_accounts_id: chartOfAccountsId,
            amount: item.amount || "",
            debit_or_credit: item.debit_or_credit || "debit",
          };
        });
      } else if (tally?.products && tally.products.length > 0) {
        // Use individual products from analyzed data - properly handle chart_of_accounts mapping
        sourceItems = tally.products.map((item, index) => {
          // Check if chart_of_accounts looks like a UUID (for ID) or is a name
          let chartOfAccountsName =
            item.chart_of_accounts_name || "No COA Ledger";
          let chartOfAccountsId = null;

          if (
            item.chart_of_accounts &&
            item.chart_of_accounts !== "No COA Ledger"
          ) {
            // If it's a UUID-like string, it's probably an ID
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(item.chart_of_accounts)) {
              chartOfAccountsId = item.chart_of_accounts;
              // Use chart_of_accounts_name if available
              if (item.chart_of_accounts_name) {
                chartOfAccountsName = item.chart_of_accounts_name;
              }
            } else {
              chartOfAccountsName = item.chart_of_accounts;
            }
          }

          return {
            id: item.id || index,
            item_id: item.id || null,
            item_details: item.item_details || "",
            chart_of_accounts: chartOfAccountsName,
            chart_of_accounts_id: chartOfAccountsId,
            amount: item.amount || "",
            debit_or_credit: item.debit_or_credit || "debit",
          };
        });
      } else if (rawAnalysedItems.length > 0) {
        // Fallback to the raw AI payload when no product rows exist.
        // Payment vouchers are analysed with the expense prompt, so items
        // arrive as {description, category, amount} under `expenses` — the
        // old code read `data.items` and `price * quantity`, the vendor-bill
        // shape, which is never present here and always yielded "".
        sourceItems = rawAnalysedItems.map((item, index) => ({
          id: Date.now() + index,
          item_id: null,
          item_details: item.description || "",
          chart_of_accounts: "",
          chart_of_accounts_id: null,
          amount:
            item.amount != null
              ? item.amount
              : (item.price || 0) * (item.quantity || 0) || "",
          debit_or_credit: "debit",
        }));
      } else {
        // Initialize with empty expense item if no items exist
        sourceItems = [
          {
            id: Date.now(),
            item_id: null,
            item_details: "",
            chart_of_accounts: "",
            chart_of_accounts_id: null,
            amount: "",
            debit_or_credit: "debit",
          },
        ];
      }

      setExpenseItems(sourceItems);
    }
  }, [expenseBillData, analysedData, tallyAnalysedData]);

  // Payment vouchers: "Vendor" (Correction 26 — formerly labelled
  // "Payable / Paid via (Bank / Cash)") holds a vendor ledger the
  // operator picks explicitly. Auto-matching from analyzed data
  // (vendor name from OCR) would silently fill in the wrong ledger
  // and defeat the whole flow. Only rehydrate an existing saved
  // selection on reload; never guess from analysed data.
  useEffect(() => {
    if (
      vendorOptions.length > 0 &&
      tallyAnalysedData?.vendor &&  // backend-echoed picked ledger UUID
      !billForm.selectedVendor &&
      !vendorManuallyCleared
    ) {
      // Detail endpoint returns vendor as UUID string; verify endpoint
      // returns it as {id, name, ...} — accept both shapes.
      const savedId =
        typeof tallyAnalysedData.vendor === "object"
          ? tallyAnalysedData.vendor?.id
          : tallyAnalysedData.vendor;
      const matchedVendor = vendorOptions.find((v) => v.id === savedId);
      if (matchedVendor) {
        setBillForm((prev) => ({
          ...prev,
          selectedVendor: matchedVendor,
          vendorName: matchedVendor.name || prev.vendorName,
          vendorGST: matchedVendor.gst_in || "",
        }));
      }
    }
  }, [
    vendorOptions,
    tallyAnalysedData,
    billForm.selectedVendor,
    vendorManuallyCleared,
  ]);

  // Payment Mode (Correction 26) — same rehydrate-only pattern as the
  // Vendor effect above: only restore an existing saved selection on
  // reload, never guess from analysed OCR data (there is no OCR source
  // for this field anyway — it's purely a user pick).
  useEffect(() => {
    if (
      paymentModeOptions.length > 0 &&
      tallyAnalysedData?.payment_mode &&
      !billForm.selectedPaymentMode &&
      !paymentModeManuallyCleared
    ) {
      // Detail endpoint returns payment_mode as a UUID string; verify
      // endpoint returns it as {id, name, ...} — accept both shapes.
      const savedId =
        typeof tallyAnalysedData.payment_mode === "object"
          ? tallyAnalysedData.payment_mode?.id
          : tallyAnalysedData.payment_mode;
      const matchedMode = paymentModeOptions.find((m) => m.id === savedId);
      if (matchedMode) {
        setBillForm((prev) => ({
          ...prev,
          selectedPaymentMode: matchedMode,
          paymentModeName: matchedMode.name || prev.paymentModeName,
        }));
      }
    }
  }, [
    paymentModeOptions,
    tallyAnalysedData,
    billForm.selectedPaymentMode,
    paymentModeManuallyCleared,
  ]);

  // Match tax ledgers from API response when both are available
  useEffect(() => {
    if (
      cgstLedgerOptions.length > 0 &&
      sgstLedgerOptions.length > 0 &&
      igstLedgerOptions.length > 0 &&
      tallyAnalysedData
    ) {
      // ``userClearedLedgersRef`` lets the user actually clear a
      // ledger via the dropdown × — without this guard, the effect
      // would immediately re-fill the field from the backend value.
      const cleared = userClearedLedgersRef.current;

      // Match CGST ledger by ID first, then by name
      if (
        tallyAnalysedData.cgst_taxes &&
        !taxSummaryForm.cgstLedgerId &&
        !cleared.has("cgst")
      ) {
        const matchedCgstLedger = cgstLedgerOptions.find(
          (ledger) => ledger.id === tallyAnalysedData.cgst_taxes,
        );
        if (matchedCgstLedger) {
          setTaxSummaryForm((prev) => ({
            ...prev,
            cgstLedgerId: matchedCgstLedger.id,
          }));
        }
      }

      // Match SGST ledger by ID first, then by name
      if (
        tallyAnalysedData.sgst_taxes &&
        !taxSummaryForm.sgstLedgerId &&
        !cleared.has("sgst")
      ) {
        const matchedSgstLedger = sgstLedgerOptions.find(
          (ledger) => ledger.id === tallyAnalysedData.sgst_taxes,
        );
        if (matchedSgstLedger) {
          setTaxSummaryForm((prev) => ({
            ...prev,
            sgstLedgerId: matchedSgstLedger.id,
          }));
        }
      }

      // Match IGST ledger by ID first, then by name
      if (
        tallyAnalysedData.igst_taxes &&
        !taxSummaryForm.igstLedgerId &&
        !cleared.has("igst")
      ) {
        const matchedIgstLedger = igstLedgerOptions.find(
          (ledger) => ledger.id === tallyAnalysedData.igst_taxes,
        );
        if (matchedIgstLedger) {
          setTaxSummaryForm((prev) => ({
            ...prev,
            igstLedgerId: matchedIgstLedger.id,
          }));
        }
      }

      // TDS ledger auto-match REMOVED along with the TDS row — there is
      // no TDS field left for it to populate.

      // Match Other Adjustment ledger by ID
      if (
        tallyAnalysedData.other_adjustment_taxes &&
        !taxSummaryForm.other_adjustment_taxes &&
        !cleared.has("other_adjustment")
      ) {
        const matchedOtherAdjustmentLedger = ledgerOptions.find(
          (ledger) => ledger.id === tallyAnalysedData.other_adjustment_taxes,
        );
        if (matchedOtherAdjustmentLedger) {
          setTaxSummaryForm((prev) => ({
            ...prev,
            other_adjustment_taxes: matchedOtherAdjustmentLedger.id,
          }));
        }
      }

      // Match Round Off ledger by ID
      if (
        tallyAnalysedData.round_off_taxes &&
        !taxSummaryForm.round_off_taxes &&
        !cleared.has("round_off")
      ) {
        const matchedRoundOffLedger = ledgerOptions.find(
          (ledger) => ledger.id === tallyAnalysedData.round_off_taxes,
        );
        if (matchedRoundOffLedger) {
          setTaxSummaryForm((prev) => ({
            ...prev,
            round_off_taxes: matchedRoundOffLedger.id,
          }));
        }
      }
    }
  }, [
    cgstLedgerOptions,
    sgstLedgerOptions,
    igstLedgerOptions,
    ledgerOptions,
    tallyAnalysedData,
    taxSummaryForm.cgstLedgerId,
    taxSummaryForm.sgstLedgerId,
    taxSummaryForm.igstLedgerId,
    taxSummaryForm.other_adjustment_taxes,
    taxSummaryForm.round_off_taxes,
  ]);

  // Match chart of accounts ledgers from API response
  useEffect(() => {
    if (
      ledgerOptions.length > 0 &&
      (tallyAnalysedData?.products || tallyAnalysedData?.consolidate_prod) &&
      expenseItems.length > 0
    ) {
      // Use consolidate_prod if consolidation is enabled, otherwise use products
      const sourceProducts = isConsolidated
        ? tallyAnalysedData?.consolidate_prod
        : tallyAnalysedData?.products;

      const updatedItems = expenseItems.map((item, index) => {
        // Leave rows the user cleared alone.
        if (item.chart_of_accounts_cleared) {
          return item;
        }

        // If item already has chart_of_accounts_id selected and a proper name, don't override
        if (
          item.chart_of_accounts_id &&
          item.chart_of_accounts !== "No COA Ledger"
        ) {
          // But we might need to update the name if it's not set properly
          const matchedLedger = ledgerOptions.find(
            (ledger) => ledger.id === item.chart_of_accounts_id,
          );
          if (matchedLedger && item.chart_of_accounts === "No COA Ledger") {
            return {
              ...item,
              chart_of_accounts: matchedLedger.name,
            };
          }
          return item;
        }

        // Find corresponding item in analyzed_bill
        const analyzedItem =
          sourceProducts?.[index] ||
          sourceProducts?.find((p) => p.item_details === item.item_details);

        if (
          analyzedItem &&
          (analyzedItem.chart_of_accounts_id || analyzedItem.chart_of_accounts)
        ) {
          let matchedLedger = null;

          // Prefer explicit UUID from the backend when available; only fall
          // back to name matching for legacy rows.
          if (analyzedItem.chart_of_accounts_id) {
            matchedLedger = ledgerOptions.find(
              (ledger) => ledger.id === analyzedItem.chart_of_accounts_id,
            );
          }
          if (
            !matchedLedger &&
            analyzedItem.chart_of_accounts &&
            analyzedItem.chart_of_accounts !== "No COA Ledger"
          ) {
            matchedLedger = ledgerOptions.find(
              (ledger) => ledger.id === analyzedItem.chart_of_accounts,
            );
            if (!matchedLedger) {
              matchedLedger = ledgerOptions.find(
                (ledger) => ledger.name === analyzedItem.chart_of_accounts,
              );
            }
          }

          if (matchedLedger) {
            return {
              ...item,
              chart_of_accounts: matchedLedger.name,
              chart_of_accounts_id: matchedLedger.id,
            };
          }
        }

        return item;
      });

      // Only update if there are actual changes
      const hasChanges = updatedItems.some(
        (item, index) =>
          item.chart_of_accounts_id !==
          expenseItems[index].chart_of_accounts_id,
      );

      if (hasChanges) {
        setExpenseItems(updatedItems);
      }
    }
  }, [ledgerOptions, tallyAnalysedData, expenseItems, isConsolidated]);

  // Calculate vendor amount using double-entry accounting principle (Total Debit = Total Credit)
  useEffect(() => {
    // Calculate total debit amount from all expense items
    const totalExpenseDebit = expenseItems
      .filter((item) => item.debit_or_credit === "debit")
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // Calculate total credit amount from all expense items
    const totalExpenseCredit = expenseItems
      .filter((item) => item.debit_or_credit === "credit")
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // Calculate total tax debit amounts
    let totalTaxDebit = 0;
    let totalTaxCredit = 0;

    // Multi-rate GST lines — sum each entry into DR or CR depending on
    // its own ``debit_or_credit`` flag. Replaces the old single
    // CGST/SGST/IGST bill-level fields.
    for (const line of gstLines) {
      const amt = parseFloat(line.amount || 0);
      if (!amt) continue;
      if (line.debit_or_credit === "credit") {
        totalTaxCredit += amt;
      } else {
        totalTaxDebit += amt;
      }
    }

    // TDS no longer participates in the balance — the row is gone and the
    // payload sends a hard zero.

    // Correction 46: signed, not absolute. `Math.abs()` here flipped every
    // negative entry — a round-off of -0.28 on the debit side landed as
    // +0.28, moving the paid amount by twice the figure. The debit/credit
    // selector already carries the direction.
    const signedAdjustment = (value) => parseFloat(value || 0) || 0;

    const otherAmt = signedAdjustment(taxSummaryForm.other_adjustment);
    if (otherAmt) {
      if (taxSummaryForm.other_adjustment_debit_or_credit === "credit") {
        totalTaxCredit += otherAmt;
      } else {
        totalTaxDebit += otherAmt;
      }
    }

    const roundAmt = signedAdjustment(taxSummaryForm.round_off);
    if (roundAmt) {
      if (taxSummaryForm.round_off_debit_or_credit === "credit") {
        totalTaxCredit += roundAmt;
      } else {
        totalTaxDebit += roundAmt;
      }
    }

    // Calculate total debit and credit amounts including taxes
    const grandTotalDebit = totalExpenseDebit + totalTaxDebit;
    const grandTotalCredit = totalExpenseCredit + totalTaxCredit;

    // Calculate vendor amount to balance the equation (Total Debit = Total Credit)
    // In payment vouchers: Expenses (Debit) + Taxes (Debit/Credit) = Vendor Payable (Credit)
    let vendorAmount = 0;

    if (taxSummaryForm.vendorDebitCredit === "credit") {
      // If vendor is credit (typical case for payment vouchers):
      // Total Debit = Total Credit + Vendor Amount
      // Vendor Amount = Total Debit - Total Credit
      vendorAmount = grandTotalDebit - grandTotalCredit;
    } else {
      // If vendor is debit:
      // Total Debit + Vendor Amount = Total Credit
      // Vendor Amount = Total Credit - Total Debit
      vendorAmount = grandTotalCredit - grandTotalDebit;
    }

    // Ensure vendor amount is not negative
    if (vendorAmount < 0) {
      vendorAmount = Math.abs(vendorAmount);
    }

    // Update vendor amount with the calculated value
    setTaxSummaryForm((prev) => ({
      ...prev,
      vendorAmount: vendorAmount.toFixed(2),
    }));
  }, [
    expenseItems,
    gstLines,
    taxSummaryForm.other_adjustment,
    taxSummaryForm.other_adjustment_debit_or_credit,
    taxSummaryForm.round_off,
    taxSummaryForm.round_off_debit_or_credit,
    taxSummaryForm.vendorDebitCredit,
  ]);

  // Correction 46: the total is the invoice's own figure and stays put.
  // An effect here used to drag it toward the auto-balanced vendor amount,
  // which walked it away from the invoice and made a mismatch invisible.

  // Handle form input changes
  const handleFormChange = (name, value) => {
    setBillForm((prev) => ({
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
      setBillForm((prev) => ({
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
    setBillForm((prev) => ({
      ...prev,
      selectedVendor: null,
      vendorName: analysedData?.from?.name || "",
      vendorGST: "",
    }));
    setVendorManuallyCleared(true); // Flag that user manually cleared vendor
  };

  // Handle Payment Mode selection (Correction 26)
  const handlePaymentModeSelect = (paymentModeId) => {
    if (paymentModeId === null || paymentModeId === "") {
      handlePaymentModeClear();
      return;
    }

    const mode = paymentModeOptions.find((m) => m.id === paymentModeId);
    if (mode) {
      setBillForm((prev) => ({
        ...prev,
        selectedPaymentMode: mode,
        paymentModeName: mode.name || "",
      }));
      setPaymentModeManuallyCleared(false);
    }
  };

  // Handle Payment Mode deselection
  const handlePaymentModeClear = () => {
    setBillForm((prev) => ({
      ...prev,
      selectedPaymentMode: null,
      paymentModeName: "",
    }));
    setPaymentModeManuallyCleared(true);
  };

  // Handle Chart of Accounts selection
  const handleChartOfAccountsSelect = (itemIndex, ledgerId) => {
    const ledger = ledgerOptions.find((l) => l.id === ledgerId);
    if (ledger) {
      setExpenseItems((prev) => {
        const updated = [...prev];
        updated[itemIndex] = {
          ...updated[itemIndex],
          chart_of_accounts: ledger.name,
          chart_of_accounts_id: ledger.id,
          // An explicit pick releases the "user cleared this" hold.
          chart_of_accounts_cleared: false,
        };
        return updated;
      });
    }
  };

  // Handle Chart of Accounts deselection
  //
  // ``chart_of_accounts_cleared`` is what makes the clear stick — the
  // auto-match effect reads a null id as "not matched yet" and would re-apply
  // the ledger from the analysed bill. The flag lives on the row itself, not
  // in an index-keyed ref, so it survives adding/removing/reordering rows.
  const handleChartOfAccountsClear = (itemIndex) => {
    setExpenseItems((prev) => {
      const updated = [...prev];
      updated[itemIndex] = {
        ...updated[itemIndex],
        chart_of_accounts: "",
        chart_of_accounts_id: null,
        chart_of_accounts_cleared: true,
      };
      return updated;
    });
  };

  // Handle Tax Summary form changes
  const handleTaxSummaryChange = (name, value) => {
    setTaxSummaryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper function to get calculation summary for display
  const getCalculationSummary = () => {
    // Calculate total debit amount from all expense items
    const totalExpenseDebit = expenseItems
      .filter((item) => item.debit_or_credit === "debit")
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // Calculate total credit amount from all expense items
    const totalExpenseCredit = expenseItems
      .filter((item) => item.debit_or_credit === "credit")
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // Calculate total tax debit amounts
    let totalTaxDebit = 0;
    let totalTaxCredit = 0;

    // CGST calculation
    if (taxSummaryForm.cgst) {
      const cgstAmount = parseFloat(taxSummaryForm.cgst || 0);
      if (taxSummaryForm.cgstDebitCredit === "debit") {
        totalTaxDebit += cgstAmount;
      } else {
        totalTaxCredit += cgstAmount;
      }
    }

    // SGST calculation
    if (taxSummaryForm.sgst) {
      const sgstAmount = parseFloat(taxSummaryForm.sgst || 0);
      if (taxSummaryForm.sgstDebitCredit === "debit") {
        totalTaxDebit += sgstAmount;
      } else {
        totalTaxCredit += sgstAmount;
      }
    }

    // IGST calculation
    if (taxSummaryForm.igst) {
      const igstAmount = parseFloat(taxSummaryForm.igst || 0);
      if (taxSummaryForm.igstDebitCredit === "debit") {
        totalTaxDebit += igstAmount;
      } else {
        totalTaxCredit += igstAmount;
      }
    }

    const grandTotalDebit = totalExpenseDebit + totalTaxDebit;
    const grandTotalCredit = totalExpenseCredit + totalTaxCredit;
    const vendorAmount = parseFloat(taxSummaryForm.vendorAmount || 0);

    return {
      expenseItems: {
        debit: totalExpenseDebit,
        credit: totalExpenseCredit,
      },
      taxItems: {
        debit: totalTaxDebit,
        credit: totalTaxCredit,
      },
      totals: {
        debit: grandTotalDebit,
        credit: grandTotalCredit,
      },
      vendor: {
        amount: vendorAmount,
        type: taxSummaryForm.vendorDebitCredit,
      },
      finalTotals: {
        debit:
          grandTotalDebit +
          (taxSummaryForm.vendorDebitCredit === "debit" ? vendorAmount : 0),
        credit:
          grandTotalCredit +
          (taxSummaryForm.vendorDebitCredit === "credit" ? vendorAmount : 0),
      },
      isBalanced: function () {
        const finalDebit = this.finalTotals.debit;
        const finalCredit = this.finalTotals.credit;
        return Math.abs(finalDebit - finalCredit) < 0.01; // Allow for rounding differences
      },
    };
  };

  // ------------------------------------------------------------------
  // GST Lines (multi-rate Journal voucher GST)
  // ------------------------------------------------------------------
  // Each ``gstLines`` row represents one ``<ledger>`` posting in the
  // Tally Journal voucher: a (rate, tax_type, ledger, amount, DR/CR)
  // tuple. Mixed-rate bills have 2–N rows; a single-rate intrastate
  // has 2 rows (CGST + SGST); interstate has 1 row (IGST).
  const GST_RATE_OPTIONS = ["5%", "12%", "18%", "28%", "Exempted", "N/A"];

  const handleGstLineAdd = () => {
    setGstLines((prev) => [
      ...prev,
      {
        id: `gst-${Date.now()}-${Math.random()}`,
        rate: "18%",
        // Default tax type based on what's already there — if existing
        // rows are CGST/SGST, add an IGST so the user can flip; if
        // existing rows are IGST, add another IGST. Falls back to CGST.
        tax_type: prev.some((l) => l.tax_type === "IGST")
          ? "IGST"
          : prev.some((l) => l.tax_type === "SGST")
            ? "CGST"
            : prev.some((l) => l.tax_type === "CGST")
              ? "SGST"
              : "CGST",
        amount: "0.00",
        ledger_id: null,
        debit_or_credit: "debit",
      },
    ]);
  };

  const handleGstLineRemove = (lineId) => {
    setGstLines((prev) => prev.filter((l) => l.id !== lineId));
  };

  const handleGstLineChange = (lineId, field, value) => {
    setGstLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)),
    );
  };

  // Tracks which adjustment ledgers the user has explicitly CLEARED in
  // this session. Without this, the auto-match useEffect would
  // immediately re-fill the field from ``tallyAnalysedData`` because
  // its condition is ``backendValue && !currentValue`` — clearing sets
  // current to null and the effect re-applies the backend value,
  // defeating the × click.
  const userClearedLedgersRef = useRef(new Set());

  // Handle tax ledger selections. Selecting any value removes the
  // "user cleared" mark so the auto-match doesn't fight the choice;
  // clearing adds it so the auto-match doesn't re-fill from backend.
  const handleCgstLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("cgst");
    setTaxSummaryForm((prev) => ({
      ...prev,
      cgstLedgerId: ledgerId,
    }));
  };

  const handleSgstLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("sgst");
    setTaxSummaryForm((prev) => ({
      ...prev,
      sgstLedgerId: ledgerId,
    }));
  };

  const handleIgstLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("igst");
    setTaxSummaryForm((prev) => ({
      ...prev,
      igstLedgerId: ledgerId,
    }));
  };

  const handleCgstLedgerClear = () => {
    userClearedLedgersRef.current.add("cgst");
    setTaxSummaryForm((prev) => ({
      ...prev,
      cgstLedgerId: null,
    }));
  };

  const handleSgstLedgerClear = () => {
    userClearedLedgersRef.current.add("sgst");
    setTaxSummaryForm((prev) => ({
      ...prev,
      sgstLedgerId: null,
    }));
  };

  const handleIgstLedgerClear = () => {
    userClearedLedgersRef.current.add("igst");
    setTaxSummaryForm((prev) => ({
      ...prev,
      igstLedgerId: null,
    }));
  };

  const handleOtherAdjustmentLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("other_adjustment");
    setTaxSummaryForm((prev) => ({
      ...prev,
      other_adjustment_taxes: ledgerId,
    }));
  };

  const handleOtherAdjustmentLedgerClear = () => {
    userClearedLedgersRef.current.add("other_adjustment");
    setTaxSummaryForm((prev) => ({ ...prev, other_adjustment_taxes: null }));
  };

  const handleRoundOffLedgerSelect = (ledgerId) => {
    userClearedLedgersRef.current.delete("round_off");
    setTaxSummaryForm((prev) => ({
      ...prev,
      round_off_taxes: ledgerId,
    }));
  };

  const handleRoundOffLedgerClear = () => {
    userClearedLedgersRef.current.add("round_off");
    setTaxSummaryForm((prev) => ({ ...prev, round_off_taxes: null }));
  };

  // Expense item manipulation functions
  const handleExpenseItemChange = (index, field, value) => {
    setExpenseItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addExpenseItem = () => {
    setExpenseItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        item_id: null,
        item_details: "",
        chart_of_accounts: "",
        chart_of_accounts_id: null,
        amount: "",
        debit_or_credit: "debit",
      },
    ]);
  };

  const removeExpenseItem = (index) => {
    if (expenseItems.length > 1) {
      setExpenseItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Handle consolidate toggle — preserve prior COA picks so a toggle does
  // not wipe user selections that never came from OCR.
  //
  // Correction 28: the toggle was a dead click whenever the backend hadn't
  // built the dataset it wanted to switch to. The first attempt at a fix made
  // it bail out early, which kept the chip and the rows in sync but still left
  // the user clicking a switch that visibly did nothing — and on payment
  // vouchers ``consolidate_prod`` is frequently absent, so that was the normal
  // case, not the edge case.
  //
  // It now always switches. The backend's arrays are used when present;
  // otherwise the rows on screen are consolidated locally by grouping on
  // (ledger, debit/credit) and summing the amounts. Grouping only ever merges
  // rows that post to the same ledger on the same side, so the debit and
  // credit totals — and therefore the double-entry check below — are
  // unchanged. The pre-consolidation rows are stashed so switching back OFF
  // restores them even with no ``products`` array to rebuild from.
  const consolidateRowsLocally = (rows) => {
    const groups = new Map();
    rows.forEach((row) => {
      const key = `${row.chart_of_accounts_id || "no-ledger"}|${
        row.debit_or_credit || "debit"
      }`;
      const existing = groups.get(key);
      if (existing) {
        existing.amount = (
          (parseFloat(existing.amount) || 0) + (parseFloat(row.amount) || 0)
        ).toFixed(2);
        // Keep the labels distinguishable rather than dropping them silently.
        if (row.item_details && !existing._labels.includes(row.item_details)) {
          existing._labels.push(row.item_details);
        }
      } else {
        groups.set(key, {
          ...row,
          amount: (parseFloat(row.amount) || 0).toFixed(2),
          _labels: row.item_details ? [row.item_details] : [],
        });
      }
    });
    return Array.from(groups.values()).map((row, index) => {
      const { _labels, ...rest } = row;
      const merged = _labels.length > 1;
      return {
        ...rest,
        // `id` doubles as the React key AND as the `item_id` sent at verify, so
        // a merged row gets a synthetic key plus `_synthetic` to stop that key
        // being posted as if it were a real backend row id.
        id: merged ? `consolidated-${index}` : rest.id,
        _synthetic: merged,
        item_details: _labels.join(", ") || rest.item_details || "",
      };
    });
  };

  const handleConsolidateToggle = () => {
    const newConsolidateStatus = !isConsolidated;
    const tally = tallyAnalysedData;

    setIsConsolidated(newConsolidateStatus);

    const prevByKey = new Map();
    expenseItems.forEach((row) => {
      const key = row.item_id || row.item_details;
      if (key) prevByKey.set(key, row);
    });
    const resolveCOA = (item) => {
      const prev = prevByKey.get(item.id || item.item_details);
      return {
        chart_of_accounts:
          prev?.chart_of_accounts || item.chart_of_accounts || "",
        chart_of_accounts_id:
          prev?.chart_of_accounts_id || item.chart_of_accounts_id || null,
      };
    };
    const fromTally = (item, index) => ({
      id: item.id || index,
      item_id: item.id || null,
      item_details: item.item_details || "",
      ...resolveCOA(item),
      amount: item.amount || "",
      debit_or_credit: item.debit_or_credit || "debit",
    });

    if (newConsolidateStatus) {
      preConsolidateRowsRef.current = expenseItems;
      if (tally?.consolidate_prod?.length > 0) {
        setExpenseItems(tally.consolidate_prod.map(fromTally));
      } else {
        setExpenseItems(consolidateRowsLocally(expenseItems));
      }
    } else if (preConsolidateRowsRef.current?.length > 0) {
      setExpenseItems(preConsolidateRowsRef.current);
      preConsolidateRowsRef.current = null;
    } else if (tally?.products?.length > 0) {
      setExpenseItems(tally.products.map(fromTally));
    }
  };

  // Transform form data to API format
  const transformToVerifyFormat = () => {
    // Helper function to ensure proper decimal formatting
    const formatDecimal = (value) => {
      const num = parseFloat(value) || 0;
      return parseFloat(num.toFixed(2)); // Convert to string with 2 decimals then back to number
    };

    // Get vendor ledger information
    const selectedVendor = billForm.selectedVendor;

    // Get tax ledger information for the legacy bill-level ``taxes`` block.
    //
    // ``gst_lines`` is authoritative; this block is kept for older backend
    // readers. Its ledger is derived from the GST Lines table (the line
    // carrying the largest amount wins when rates use different ledgers)
    // because the bill-level dropdowns no longer exist —
    // ``taxSummaryForm.*LedgerId`` is only ever set by backend auto-match.
    const dominantGstLineLedgerId = (taxType) => {
      const byLedger = {};
      (gstLines || []).forEach((line) => {
        if (line.tax_type !== taxType) return;
        const amount = parseFloat(line.amount || 0);
        if (amount <= 0 || !line.ledger_id) return;
        byLedger[line.ledger_id] = (byLedger[line.ledger_id] || 0) + amount;
      });
      const ranked = Object.entries(byLedger).sort((a, b) => b[1] - a[1]);
      return ranked.length > 0 ? ranked[0][0] : null;
    };
    const findTaxLedger = (options, taxType, fallbackId) =>
      options.find((ledger) => ledger.id === dominantGstLineLedgerId(taxType)) ||
      options.find((ledger) => ledger.id === fallbackId);

    const cgstLedger = findTaxLedger(
      cgstLedgerOptions,
      "CGST",
      taxSummaryForm.cgstLedgerId,
    );
    const sgstLedger = findTaxLedger(
      sgstLedgerOptions,
      "SGST",
      taxSummaryForm.sgstLedgerId,
    );
    const igstLedger = findTaxLedger(
      igstLedgerOptions,
      "IGST",
      taxSummaryForm.igstLedgerId,
    );
    const otherAdjustmentLedger = ledgerOptions.find(
      (ledger) => ledger.id === taxSummaryForm.other_adjustment_taxes,
    );
    const roundOffLedger = ledgerOptions.find(
      (ledger) => ledger.id === taxSummaryForm.round_off_taxes,
    );

    const transformedData = {
      bill_id: billId,
      analyzed_bill: expenseBillData?.analyzed_bill?.id || null,
      analyzed_data: {
        name: billForm.vendorName || "Unknown",
        // Explicit vendor ledger UUID — backend prefers this over
        // name lookup (which could pick wrong ledger on collision).
        vendor_id: billForm.selectedVendor?.id || null,
        // Payment Mode (Correction 26) — the Bank/Cash ledger actually
        // used to pay this voucher; required for verify + sync and
        // emitted as the DEBIT entry in the sync XML.
        payment_mode_id: billForm.selectedPaymentMode?.id || null,
        voucher: billForm.billNumber || "",
        bill_no: billForm.billNumber || "",
        bill_date: billForm.billDate || "",
        due_date: billForm.dueDate || "",
        total: formatDecimal(billForm.totalAmount),
        company_id: selectedVendor?.company || billForm.companyId || "Unknown",
        vendor_debit_or_credit: taxSummaryForm.vendorDebitCredit || "credit",
        vendor_amount: formatDecimal(taxSummaryForm.vendorAmount),
        // Multi-rate GST as a flat array — one entry per (rate, ledger)
        // bucket. Backend wipes + recreates ``TallyExpenseGstLine``
        // rows from this list on verify. The legacy ``taxes.cgst/sgst/
        // igst`` block is still sent below (as rollup sums) for old
        // backend readers; the backend prioritises gst_lines when
        // present.
        gst_lines: gstLines.map((line) => ({
          rate: line.rate || "",
          tax_type: line.tax_type,
          amount: formatDecimal(line.amount),
          ledger: line.ledger_id || null,
          debit_or_credit: line.debit_or_credit || "debit",
        })),
        taxes: {
          igst: {
            amount: formatDecimal(
              gstLines
                .filter((l) => l.tax_type === "IGST")
                .reduce((s, l) => s + (parseFloat(l.amount) || 0), 0),
            ),
            ledger: igstLedger?.name || "",
            debit_or_credit: taxSummaryForm.igstDebitCredit || "debit",
          },
          cgst: {
            amount: formatDecimal(
              gstLines
                .filter((l) => l.tax_type === "CGST")
                .reduce((s, l) => s + (parseFloat(l.amount) || 0), 0),
            ),
            ledger: cgstLedger?.name || "",
            debit_or_credit: taxSummaryForm.cgstDebitCredit || "debit",
          },
          sgst: {
            amount: formatDecimal(
              gstLines
                .filter((l) => l.tax_type === "SGST")
                .reduce((s, l) => s + (parseFloat(l.amount) || 0), 0),
            ),
            ledger: sgstLedger?.name || "",
            debit_or_credit: taxSummaryForm.sgstDebitCredit || "debit",
          },
          // TDS is removed from payment vouchers. The key is still sent
          // because the backend serializer expects the full ``taxes``
          // block, but always as zero with no ledger — so no TDS line is
          // ever posted to Tally.
          tds: {
            amount: "0.00",
            ledger: "",
            debit_or_credit: "debit",
          },
          other_adjustment: {
            amount: formatDecimal(taxSummaryForm.other_adjustment),
            ledger: otherAdjustmentLedger?.name || "",
            debit_or_credit:
              taxSummaryForm.other_adjustment_debit_or_credit || "debit",
          },
          round_off: {
            amount: formatDecimal(taxSummaryForm.round_off),
            ledger: roundOffLedger?.name || "",
            debit_or_credit:
              taxSummaryForm.round_off_debit_or_credit || "debit",
          },
        },
        // BE reads `payment_items`, not `expense_items` — the old key
        // caused every individual-mode verify to silently drop line
        // updates on the backend.
        payment_items: expenseItems.map((item) => {
          const coaLedger = ledgerOptions.find(
            (ledger) => ledger.id === item.chart_of_accounts_id,
          );
          return {
            // A locally merged row (consolidate toggled on with no
            // backend-built `consolidate_prod`) has no single source row, so it
            // must not post its synthetic React key as a backend id.
            item_id: item._synthetic ? null : item.id,
            item_details: item.item_details || "",
            // UUID first — backend prefers `chart_of_accounts_id` and only falls back to name.
            chart_of_accounts_id: item.chart_of_accounts_id || null,
            chart_of_accounts: coaLedger?.name || "",
            amount: formatDecimal(item.amount),
            debit_or_credit: item.debit_or_credit || "debit",
          };
        }),
        consolidate: isConsolidated,
        ...(isConsolidated
          ? {
              consolidate_prod: expenseItems.map((item) => {
                const coaLedger = ledgerOptions.find(
                  (ledger) => ledger.id === item.chart_of_accounts_id,
                );
                return {
                  item_details: item.item_details || "",
                  chart_of_accounts_id: item.chart_of_accounts_id || null,
                  chart_of_accounts: coaLedger?.name || "",
                  amount: formatDecimal(item.amount),
                  debit_or_credit: item.debit_or_credit || "debit",
                };
              }),
            }
          : {}),
      },
    };

    return transformedData;
  };

  // Save function
  const handleSave = async () => {
    if (verifyInFlightRef.current) return;
    try {
      // Validation before verification
      if (hasValidationErrors()) {
        const errorMessages = getValidationErrorMessages();
        const errorText =
          errorMessages.length > 1
            ? `Please fix the following issues:\n${errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join("\n")}`
            : errorMessages[0];
        globalToast.error(errorText);
        return;
      }

      verifyInFlightRef.current = true;
      setIsVerifying(true);

      // Transform data to the required API format
      const verifyData = transformToVerifyFormat();

      // Call the verify API
      await verifyExpenseBill({
        organizationId: selectedOrganization?.id,
        ...verifyData,
      });

      globalToast.success("Payment voucher verified successfully");

      // Navigate to payment voucher list after successful verification
      // navigate('/tally/payment-voucher');
    } catch (error) {
      console.error("Failed to verify payment voucher:", error);

      // Handle specific error messages from API response
      let errorMessage = "Failed to verify payment voucher";
      let errorDetails = "";

      // React Query + apiFetch error structure
      if (error?.data) {
        const errorData = error.data;

        // Extract message
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Extract details if available
        if (errorData.details) {
          errorDetails = errorData.details;
        }
      }
      // Fallback to axios error structure (if any direct axios calls)
      else if (error?.response?.data) {
        const responseData = error.response.data;

        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }

        if (responseData.details) {
          errorDetails = responseData.details;
        }
      }
      // Fallback to error message
      else if (error?.message) {
        errorMessage = error.message;
      }

      setErrorAlert({
        show: true,
        message: errorMessage,
        details: errorDetails,
      });
    } finally {
      setIsVerifying(false);
      verifyInFlightRef.current = false;
    }
  };

  // Sync function
  const handleSync = async () => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      setIsSyncing(true);
      const result = await syncExpenseBill({
        organizationId: selectedOrganization?.id,
        billId,
      });
      const data = result?.data || result;
      const state = data?.tally_sync_status || "pending_tally";
      const pendingCount = data?.pending_masters_count || 0;

      if (state === "confirmed") {
        globalToast.success("Payment voucher synced to Tally");
      } else if (pendingCount > 0) {
        globalToast.info(
          `Payment voucher queued. Tally will import ${pendingCount} pending master${pendingCount > 1 ? "s" : ""} on its next poll, then post the voucher.`,
        );
      } else {
        globalToast.info(
          "Payment voucher queued for Tally. Waiting for Tally to confirm.",
        );
      }
      refetch();
    } catch (error) {
      console.error("Failed to sync payment voucher:", error);
      globalToast.error(
        error?.data?.message ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to sync payment voucher to Tally",
      );
    } finally {
      setIsSyncing(false);
      syncInFlightRef.current = false;
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
    // Navigate back to payment voucher list
    navigate("/tally/payment-voucher");
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
          <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Failed to load payment voucher
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error?.data?.message ||
            error?.message ||
            "An error occurred while fetching payment voucher details."}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleBackClick}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Icon icon="heroicons:arrow-left" className="text-sm" />
            Go back
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className="text-sm" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Show message if no organization selected
  if (!selectedOrganization?.id) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
          <Icon icon="heroicons:building-office" className="text-lg" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Please select a client to view payment voucher details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBackClick}
            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Back to journal entries"
          >
            <Icon icon="heroicons:arrow-left" className="text-sm" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {billInfo?.bill_munshi_name || "Payment voucher"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-2 flex-wrap">
              <span>
                {billInfo?.status ? `Status: ${billInfo.status}` : "Payment voucher detail"}
                {billInfo?.created_at && ` · Uploaded ${new Date(billInfo.created_at).toLocaleDateString()}`}
              </span>
              {billInfo?.status === "Synced" && billInfo?.tally_synced === true && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Icon icon="heroicons:check-circle" className="text-xs" />
                  Synced to Tally
                </span>
              )}
              {billInfo?.status === "Synced" && billInfo?.tally_synced === false && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  <Icon icon="heroicons:clock" className="text-xs" />
                  Waiting for Tally
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick-add masters moved out of this toolbar — each "+"
              now sits on the label / column header of the dropdown
              it feeds. */}
          <button
            type="button"
            onClick={() => navigate(`/tally/payment-voucher/${expenseBillData?.previous_bill}`)}
            disabled={!expenseBillData?.previous_bill}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={expenseBillData?.previous_bill ? "Go to previous bill" : "No previous bill"}
          >
            <Icon icon="heroicons:arrow-left" className="text-sm" />
            Back
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-sm ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate(`/tally/payment-voucher/${expenseBillData?.next_bill}`)}
            disabled={!expenseBillData?.next_bill}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={expenseBillData?.next_bill ? "Go to next bill" : "No next bill"}
          >
            Next
            <Icon icon="heroicons:arrow-right" className="text-sm" />
          </button>
          <span className="hidden md:inline w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={handleSave}
            disabled={isVerifying || isVerified || hasValidationErrors()}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={
              isVerifying
                ? "Verifying…"
                : isVerified
                  ? "Bill already synced"
                  : hasValidationErrors()
                    ? "Resolve validation issues before verifying"
                    : "Verify"
            }
          >
            <Icon icon={isVerifying ? "heroicons:arrow-path" : "heroicons:check-badge"} className={`text-sm ${isVerifying ? "animate-spin" : ""}`} />
            {isVerifying ? "Verifying…" : isVerified ? "Verified" : "Verify"}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || isVerified || billInfo?.status !== "Verified"}
            className="group inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
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
            <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-sm ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync to Tally"}
          </button>
        </div>
      </div>

      {/* Verification error alert */}
      {errorAlert.show && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60">
          <Icon icon="heroicons:exclamation-triangle" className="text-rose-600 dark:text-rose-400 text-base shrink-0 mt-0.5" />
          <div className="flex-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <p className="font-semibold text-rose-800 dark:text-rose-300">Verification error</p>
            <p className="mt-1 text-xs">{errorAlert.message}</p>
            {errorAlert.details && (
              <div className="mt-2 p-2 rounded-md bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/60 text-xs text-rose-700/80 dark:text-rose-400/80">
                {errorAlert.details}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setErrorAlert({ show: false, message: "", details: "" })}
            className="shrink-0 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
            aria-label="Dismiss alert"
          >
            <Icon icon="heroicons:x-mark" className="text-lg" />
          </button>
        </div>
      )}

      {/* Sync status banner */}
      {billInfo?.tally_sync_message && (
        <div
          className={`flex items-start gap-2.5 p-3 rounded-xl border ${
            billInfo?.tally_synced
              ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/60"
              : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/60"
          }`}
        >
          <Icon
            icon={billInfo?.tally_synced ? "heroicons:check-circle" : "heroicons:x-circle"}
            className={`text-base shrink-0 mt-0.5 ${
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 md:p-4">

        <div className="flex flex-col lg:flex-row gap-4 relative">
          {/* Bill Photo/Image/PDF Section - Fixed/Sticky on Large Screens */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[400px] lg:h-[calc(100vh-10.5rem)] flex flex-col">
              {billInfo?.file ? (
                <div className="w-full h-full flex flex-col">
                  {/* Fixed Header - Always Visible */}
                  <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 dark:border-slate-700 flex-shrink-0 z-10">
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
                      <div className="w-full h-full">
                        <iframe
                          src={billInfo.file}
                          className="w-full h-full border-0"
                          title="Bill PDF Document"
                        />
                      </div>
                    ) : (
                      // Image Viewer with Zoom
                      <div
                        className={`w-full min-h-full flex ${
                          zoomLevel === 1
                            ? "items-center justify-center"
                            : "items-start justify-start"
                        } p-4`}
                        style={{ cursor: zoomLevel > 1 ? "move" : "default" }}
                      >
                        <img
                          src={billInfo.file}
                          alt="Bill Document"
                          className="h-auto"
                          style={{ width: `${zoomLevel * 100}%` }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div
                          style={{ display: "none" }}
                          className="flex flex-col items-center"
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-visible">
              {/* Bill Information Section */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:document-text" className="text-sm" />
                  </span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Bill Information
                  </h3>
                </div>

                {/* OCR sanity banner — leading-digit miss on large amounts. */}
                {analysedData?._ocr_sanity && analysedData._ocr_sanity.ok === false && (
                  <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                    <Icon icon="heroicons:exclamation-circle" className="text-rose-600 dark:text-rose-400 text-base shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 mb-1">
                        OCR check — verify large amounts
                      </p>
                      <p className="text-[11px] text-rose-700/90 dark:text-rose-400/90">
                        {analysedData._ocr_sanity.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Validation Summary */}
                {!isVerified && hasValidationErrors() && (
                  <div className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60">
                    <Icon icon="heroicons:exclamation-triangle" className="text-amber-600 dark:text-amber-400 text-base shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                        Resolve before verifying
                      </p>
                      <ul className="text-[11px] text-amber-700/90 dark:text-amber-400/90 space-y-0.5 list-disc pl-4">
                        {isVendorRequired && <li>Select a vendor</li>}
                        {isPaymentModeRequired && (
                          <li>Select a Payment Mode</li>
                        )}
                        {expenseItems.length === 0 && (
                          <li>Add at least one expense item</li>
                        )}
                        {getItemsWithoutCOA().length > 0 && (
                          <li>
                            Select expense ledger for{" "}
                            {getItemsWithoutCOA().length} expense item
                            {getItemsWithoutCOA().length > 1 ? "s" : ""}
                          </li>
                        )}
                        {isCgstLedgerRequired() && <li>Select CGST ledger</li>}
                        {isSgstLedgerRequired() && <li>Select SGST ledger</li>}
                        {isIgstLedgerRequired() && <li>Select IGST ledger</li>}
                        {isOtherAdjustmentLedgerRequired() && (
                          <li>Select other-adjustment ledger</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Bill Form Fields */}
                <div className="space-y-3">
                  {/* First Row: Vendor, Payment Mode and Bill Number */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Vendor — plain vendor-ledger identification picker
                        (Correction 26 renamed this from "Payable / Paid
                        via (Bank / Cash)"). Its name/GST is never sent to
                        Tally in the sync XML; the actual Bank/Cash
                        posting ledger is the separate Payment Mode field
                        below. User picks this manually, no auto-fill
                        from analysed vendor OCR. */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Vendor <span className="text-rose-500">*</span>
                      </label>
                      <QuickAddGroup
                        kind="vendor"
                        disabled={isVerified}
                        title="Vendor ledger not in the list? Create one"
                        // Correction 30: seed from the bill's OCR data, not
                        // from `billForm.vendorName` — that holds the matched
                        // Tally vendor once one is selected.
                        vendorDefaultName={analysedData?.from?.name || ""}
                        vendorDefaultGstIn={
                          analysedData?.from?.gst_number || ""
                        }
                        className={`mb-2 ${
                          isVendorRequired && !isVerified
                            ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                            : ""
                        }`}
                      >
                        <SearchableDropdown
                          triggerClassName="rounded-r-none"
                          options={vendorOptions}
                          value={billForm.selectedVendor?.id || null}
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
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
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
                      {/* {billForm.selectedVendor &&
                        billForm.selectedVendor.organization_id !==
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
                      {analysedData?.from?.name && !billForm.selectedVendor && (
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
                            Vendor not found in the list, please add new vendor
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Payment Mode — the actual Bank/Cash ledger this
                        payment is made through (Correction 26). Options
                        are scoped to TallyConfig.payment_parents. This
                        is the ledger emitted as the DEBIT entry in the
                        sync XML — required for verify + sync. */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Payment Mode <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={
                          isPaymentModeRequired && !isVerified
                            ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                            : ""
                        }
                      >
                        <SearchableDropdown
                          options={paymentModeOptions}
                          value={billForm.selectedPaymentMode?.id || null}
                          onChange={handlePaymentModeSelect}
                          onClear={handlePaymentModeClear}
                          placeholder="Search and select payment mode..."
                          searchPlaceholder="Type to search payment mode ledgers..."
                          optionLabelKey="name"
                          optionValueKey="id"
                          loading={paymentModeLedgersLoading}
                          disabled={isVerified}
                          renderOption={(mode) => (
                            <div className="flex flex-col py-1">
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {mode.name}
                              </div>
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    {/* Bill Number Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bill Number
                      </label>
                      <input
                        type="text"
                        name="billNumber"
                        value={billForm.billNumber}
                        onChange={(e) =>
                          handleFormChange("billNumber", e.target.value)
                        }
                        placeholder="Enter bill number"
                        disabled={isVerified}
                        className={`${CONTROL} ${
                          isVerified
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Second Row: Vendor GST, Bill Date, Due Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* GST Number Field */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        GST Number
                      </label>
                      <input
                        type="text"
                        name="vendorGST"
                        value={billForm.vendorGST}
                        onChange={(e) =>
                          handleFormChange("vendorGST", e.target.value)
                        }
                        placeholder="Enter GST number"
                        disabled={isVerified}
                        className={`${CONTROL} `}
                        readOnly={
                          billForm.selectedVendor &&
                          billForm.selectedVendor.gst_in &&
                          !isVerified
                        }
                      />
                    </div>

                    {/* Bill Date Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bill Date
                      </label>
                      <input
                        type="date"
                        name="billDate"
                        value={billForm.billDate}
                        onChange={(e) =>
                          handleDateChange("billDate", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        placeholder="DD-MM-YYYY"
                        disabled={isVerified}
                        className={`${CONTROL_VALIDATED} ${
                          dateErrors.billDate
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : isVerified
                              ? "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                              : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                      />
                      {dateErrors.billDate && (
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
                          {dateErrors.billDate}
                        </p>
                      )}
                    </div>

                    {/* Due Date Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={billForm.dueDate}
                        onChange={(e) =>
                          handleDateChange("dueDate", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        placeholder="DD-MM-YYYY"
                        disabled={isVerified}
                        className={`${CONTROL_VALIDATED} ${
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

              {/* Expense Items Section */}
              <div className="relative p-5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                        <Icon icon="heroicons:list-bullet" className="text-sm" />
                      </span>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                        Credit / Debit items
                        {isConsolidated && (
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 text-[10px] font-bold normal-case tracking-normal">
                            Consolidated
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Consolidate Toggle Switch */}
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 dark:bg-slate-900/60 rounded-md border border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Consolidate items
                        </span>
                        <Switch
                          value={isConsolidated}
                          onChange={handleConsolidateToggle}
                          disabled={isVerified}
                          activeClass="bg-blue-600"
                        />
                      </div>
                      <button
                        onClick={addExpenseItem}
                        disabled={isVerified}
                        className={`inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 ${
                          isVerified
                            ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400"
                            : ""
                        }`}
                        title={
                          isConsolidated ? "Add consolidated item" : "Add item"
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

                  {/* Enhanced Expense Items Table - Scrollable */}
                  <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                    <div className="overflow-x-auto">
                      <div className="max-h-[600px] overflow-y-auto min-h-[350px]">
                        <table className="w-full min-w-[800px]">
                          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[300px]">
                                Item Details
                              </th>
                              <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[200px]">
                                Expense Ledger{" "}
                                <span className="text-red-500">*</span>
                              </th>
                              <th className="px-3 py-2 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[120px]">
                                Amount
                              </th>
                              <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[120px]">
                                Type
                              </th>
                              <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[80px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {expenseItems.map((item, index) => (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-50 dark:bg-slate-900/60 transition-colors duration-150"
                              >
                                {/* Item Details */}
                                <td className="px-3 py-2">
                                  {/* Correction 41: item details are
                                      optional — no required ring. */}
                                  <div>
                                    <textarea
                                      value={item.item_details}
                                      onChange={(e) =>
                                        handleExpenseItemChange(
                                          index,
                                          "item_details",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Enter item details..."
                                      disabled={isVerified}
                                      className={`${CONTROL_TEXTAREA} ${
                                        isVerified
                                          ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                          : ""
                                      }`}
                                      rows={3}
                                    />
                                  </div>
                                </td>

                                <td className="px-3 py-2">
                                  <QuickAddGroup
                                    kind="ledger"
                                    disabled={isVerified}
                                    // Line-item column = Expense Ledger. Was
                                    // wired to Bank / Cash by mistake so the
                                    // + icon opened the wrong modal.
                                    ledgerDefaultParent="Indirect Expenses"
                                    ledgerTitle="Add New Expense Ledger"
                                    title="Ledger not in the list? Create one"
                                    className={`${
                                      !item.chart_of_accounts_id && !isVerified
                                        ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                        : ""
                                    }`}
                                  >
                                    <SearchableDropdown
                                      triggerClassName="rounded-r-none"
                                      options={ledgerOptions}
                                      value={item.chart_of_accounts_id || null}
                                      onChange={(ledgerId) =>
                                        handleChartOfAccountsSelect(
                                          index,
                                          ledgerId,
                                        )
                                      }
                                      onClear={() =>
                                        handleChartOfAccountsClear(index)
                                      }
                                      placeholder="Select expense ledger..."
                                      searchPlaceholder="Type to search expense ledgers..."
                                      optionLabelKey="name"
                                      optionValueKey="id"
                                      loading={ledgersLoading}
                                      disabled={isVerified}
                                      renderOption={(ledger) => (
                                        <div className="flex flex-col py-1">
                                          <div className="font-medium text-slate-900 dark:text-white text-sm">
                                            {ledger.name}
                                          </div>
                                        </div>
                                      )}
                                    />
                                  </QuickAddGroup>
                                </td>

                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={item.amount}
                                    onChange={(e) =>
                                      handleExpenseItemChange(
                                        index,
                                        "amount",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0.00"
                                    disabled={isVerified}
                                    className={`${CONTROL_NUM} ${
                                      isVerified
                                        ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                        : ""
                                    }`}
                                    min="0"
                                    step="0.01"
                                  />
                                </td>

                                {/* Debit/Credit Type */}
                                <td className="px-3 py-2">
                                  <select
                                    value={item.debit_or_credit}
                                    onChange={(e) =>
                                      handleExpenseItemChange(
                                        index,
                                        "debit_or_credit",
                                        e.target.value,
                                      )
                                    }
                                    disabled={isVerified}
                                    className={`${CONTROL_SELECT} text-center ${
                                      isVerified
                                        ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                        : ""
                                    }`}
                                    style={CONTROL_SELECT_ARROW}
                                  >
                                    <option value="debit">Debit</option>
                                    <option value="credit">Credit</option>
                                  </select>
                                </td>

                                {/* Actions */}
                                <td className="px-3 py-2 text-center">
                                  {expenseItems.length > 1 && (
                                    <button
                                      onClick={() => removeExpenseItem(index)}
                                      disabled={isVerified}
                                      className={`inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors ${
                                        isVerified
                                          ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          : ""
                                      }`}
                                      title="Remove Item"
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
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Expense Items Summary */}
                      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400">
                            Total Items: {expenseItems.length}{" "}
                            {isConsolidated && (
                              <span className="text-blue-600 font-medium ml-2">
                                (Consolidated)
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Subtotal: ₹
                            {expenseItems
                              .reduce(
                                (sum, item) =>
                                  sum + parseFloat(item.amount || 0),
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
              </div>

              {/* Bill Summary - Tax and Other Items */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:calculator" className="text-sm" />
                  </span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Tax and Other Items
                  </h3>

                  {/* Bill-image reconciliation badge — informational only.
                      Flags drift between the values printed on the original
                      invoice and the user-edited tax values. Mismatch
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
                          ? "Tax values match those printed on the original bill."
                          : `Heads-up: edited tax values differ from the bill image (${billTaxMatch.mismatches
                              .map(
                                (k) =>
                                  `${k.toUpperCase()}: edited ₹${billTaxMatch.editedValues[k].toFixed(2)} vs bill ₹${billTaxMatch.billValues[k].toFixed(2)} (Δ ${billTaxMatch.diffs[k] > 0 ? "+" : ""}₹${billTaxMatch.diffs[k].toFixed(2)})`,
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
                    this surfaces the gap so they can sanity-check. */}
                {billTaxMatch.hasBillValues && !billTaxMatch.isMatch && (
                  <div className="mb-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <Icon
                        icon="heroicons:information-circle"
                        className="text-amber-600 dark:text-amber-400 text-base mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
                          Heads-up: GST line totals doesn't match with Bill. Please
                          verify before proceeding further.
                        </div>
                        {/* Correction 45: only the tax types that actually differ.
                            A row like "IGST Line ₹0.00 · Bill ₹0.00" is
                            not a discrepancy and reading it as one
                            sent people hunting for a problem that
                            was never there. */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
                          {billTaxMatch.mismatches.map((k) => {
                            return (
                              <div
                                key={k}
                                className="rounded-md px-2 py-1.5 ring-1 bg-white dark:bg-slate-900 ring-amber-200 dark:ring-amber-900/60"
                              >
                                <div className="font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                                  {k}
                                </div>
                                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                  Edited ₹{billTaxMatch.editedValues[k].toFixed(2)} · Bill ₹
                                  {billTaxMatch.billValues[k].toFixed(2)}
                                </div>
                                <div className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                                  Δ {billTaxMatch.diffs[k] > 0 ? "+" : ""}₹
                                  {billTaxMatch.diffs[k].toFixed(2)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ──────────────────────────────────────────────────
                    GST Lines table — multi-rate Journal voucher GST.
                    Each row maps 1:1 to a <ledger> entry in the sync
                    XML. A single-rate intrastate bill has 2 rows
                    (CGST + SGST); interstate has 1 (IGST); mixed-rate
                    bills can have N rows.
                    ────────────────────────────────────────────────── */}
                {(() => {
                  const gstSelectCls =
                    "w-full px-2 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer";
                  // Per-row ledger pool depends on tax_type.
                  const optionsForType = (taxType) => {
                    if (taxType === "CGST") return cgstLedgerOptions;
                    if (taxType === "SGST") return sgstLedgerOptions;
                    if (taxType === "IGST") return igstLedgerOptions;
                    return [];
                  };
                  const loadingForType = (taxType) => {
                    if (taxType === "CGST") return cgstLedgersLoading;
                    if (taxType === "SGST") return sgstLedgersLoading;
                    if (taxType === "IGST") return igstLedgersLoading;
                    return false;
                  };

                  return (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex w-6 h-6 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                            <Icon icon="heroicons:list-bullet" className="text-[12px]" />
                          </span>
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                            GST Items
                          </h4>
                          <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                            Verify GST amount and ledgers · one row per (rate, ledger)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleGstLineAdd}
                          disabled={isVerified}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon icon="heroicons:plus" className="text-[12px]" />
                          Add GST line
                        </button>
                      </div>

                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-visible">
                        {/* Header */}
                        <div className="hidden md:grid grid-cols-[80px_80px_110px_minmax(180px,1fr)_100px_40px] gap-2 px-2 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 rounded-t-lg">
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Rate</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Type</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 text-right">Amount (₹)</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Ledger</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">DR/CR</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 text-center">×</span>
                        </div>

                        {gstLines.length === 0 ? (
                          <div className="px-3 py-4 text-center text-[12px] italic text-slate-500 dark:text-slate-400">
                            No GST lines yet — click "Add GST line" if the bill carries GST.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {gstLines.map((line) => {
                              const amountVal = parseFloat(line.amount || 0);
                              const missingLedger =
                                amountVal > 0 && !line.ledger_id && !isVerified;
                              return (
                                <div
                                  key={line.id}
                                  className="grid grid-cols-[80px_80px_110px_minmax(180px,1fr)_100px_40px] gap-2 px-2 py-2 items-center"
                                >
                                  {/* Rate */}
                                  <select
                                    value={line.rate}
                                    onChange={(e) =>
                                      handleGstLineChange(
                                        line.id,
                                        "rate",
                                        e.target.value,
                                      )
                                    }
                                    disabled={isVerified}
                                    className={gstSelectCls}
                                  >
                                    {GST_RATE_OPTIONS.map((r) => (
                                      <option key={r} value={r}>
                                        {r}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Tax type */}
                                  <select
                                    value={line.tax_type}
                                    onChange={(e) => {
                                      // Type change ⇒ clear ledger (the
                                      // dropdown pool is type-specific).
                                      handleGstLineChange(
                                        line.id,
                                        "tax_type",
                                        e.target.value,
                                      );
                                      handleGstLineChange(
                                        line.id,
                                        "ledger_id",
                                        null,
                                      );
                                    }}
                                    disabled={isVerified}
                                    className={gstSelectCls}
                                  >
                                    <option value="CGST">CGST</option>
                                    <option value="SGST">SGST</option>
                                    <option value="IGST">IGST</option>
                                  </select>

                                  {/* Amount — typing-friendly editable */}
                                  <EditableTaxAmount
                                    value={line.amount}
                                    disabled={isVerified}
                                    onCommit={(v) =>
                                      handleGstLineChange(line.id, "amount", v)
                                    }
                                  />

                                  {/* Ledger */}
                                  <div
                                    className={`relative ${
                                      missingLedger
                                        ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                        : ""
                                    }`}
                                  >
                                    <SearchableDropdown
                                      options={optionsForType(line.tax_type)}
                                      value={line.ledger_id || null}
                                      onChange={(id) =>
                                        handleGstLineChange(
                                          line.id,
                                          "ledger_id",
                                          id,
                                        )
                                      }
                                      onClear={() =>
                                        handleGstLineChange(
                                          line.id,
                                          "ledger_id",
                                          null,
                                        )
                                      }
                                      placeholder={`Select ${line.tax_type} ledger…`}
                                      searchPlaceholder={`Search ${line.tax_type} ledgers…`}
                                      optionLabelKey="name"
                                      optionValueKey="id"
                                      loading={loadingForType(line.tax_type)}
                                      disabled={isVerified}
                                      size="sm"
                                    />
                                  </div>

                                  {/* DR/CR */}
                                  <select
                                    value={line.debit_or_credit}
                                    onChange={(e) =>
                                      handleGstLineChange(
                                        line.id,
                                        "debit_or_credit",
                                        e.target.value,
                                      )
                                    }
                                    disabled={isVerified}
                                    className={gstSelectCls}
                                  >
                                    <option value="debit">Debit</option>
                                    <option value="credit">Credit</option>
                                  </select>

                                  {/* Delete */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGstLineRemove(line.id)
                                    }
                                    disabled={isVerified}
                                    title="Remove this GST line"
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <Icon
                                      icon="heroicons:trash"
                                      className="text-[14px]"
                                    />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const amountCls =
                    "w-full px-2 py-1.5 text-left text-[13px] font-mono font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

                  const selectCls =
                    "w-full px-2 py-1.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer";

                  // CGST/SGST/IGST rows REMOVED — multi-rate GST is now
                  // managed via the dedicated GST Lines table rendered
                  // above this Adjustments block.
                  //
                  // TDS row REMOVED — payment vouchers don't deduct tax at
                  // source, so the field only ever added a way to unbalance
                  // the voucher. Nothing posts a TDS line any more (the
                  // verify payload sends a hard zero).
                  //
                  // Only Other Adjustment and Round Off remain as
                  // bill-level singletons.
                  const rows = [
                    {
                      key: "other_adjustment",
                      label: "Other Adjustment",
                      amountField: "other_adjustment",
                      typeField: "other_adjustment_debit_or_credit",
                      defaultType: "debit",
                      missing: isOtherAdjustmentLedgerRequired(),
                      required: parseFloat(taxSummaryForm.other_adjustment || 0) > 0,
                      options: ledgerOptions,
                      ledgerId: taxSummaryForm.other_adjustment_taxes,
                      onSelect: handleOtherAdjustmentLedgerSelect,
                      onClear: handleOtherAdjustmentLedgerClear,
                      loading: ledgersLoading,
                      placeholder: "Expense ledger",
                    },
                    {
                      key: "round_off",
                      label: "Round Off",
                      hint: "auto",
                      hintTitle:
                        "Auto-computed at verify when |DR \u2212 CR| < \u20B91; side is set automatically to balance the journal.",
                      amountField: "round_off",
                      typeField: "round_off_debit_or_credit",
                      defaultType: "debit",
                      missing: false,
                      required: false,
                      options: ledgerOptions,
                      ledgerId: taxSummaryForm.round_off_taxes,
                      onSelect: handleRoundOffLedgerSelect,
                      onClear: handleRoundOffLedgerClear,
                      loading: ledgersLoading,
                      placeholder: "Round-off ledger",
                    },
                    {
                      // Correction 46 — the Bank/Cash side of the voucher.
                      // Amount is derived, never typed:
                      //   line items + GST + round off + other adjustment
                      key: "amount_paid",
                      label: "Amount Paid",
                      hint: "auto",
                      hintTitle:
                        "Line item subtotal + GST subtotal + Round off + Other Adjustment.",
                      readOnlyAmount: amountPaidComputed.toFixed(2),
                      // The real posting side, not a field of its own — a
                      // separate one would render a control that changed
                      // nothing. Already defaults to credit: money leaves the
                      // bank or cash ledger.
                      typeField: "vendorDebitCredit",
                      defaultType: "credit",
                      missing: isPaymentModeRequired,
                      required: true,
                      options: paymentModeOptions,
                      // Same ledger as the Payment Mode picker at the top of
                      // the form — one bank/cash line, shown where the money
                      // actually leaves.
                      ledgerId: billForm.selectedPaymentMode?.id || null,
                      onSelect: handlePaymentModeSelect,
                      onClear: handlePaymentModeClear,
                      loading: paymentModeLedgersLoading,
                      placeholder: "Bank / Cash ledger",
                      // No "+" here. `paymentModeOptions` is a fixed two-entry
                      // Bank/Cash roster, so a freshly created ledger could
                      // never appear in it — the button would look live and
                      // do nothing. The Payment Mode picker at the top has no
                      // quick-add for the same reason.
                      noQuickAdd: true,
                    },
                  ];

                  return (
                    // overflow-visible (not -hidden) so the inline ledger
                    // dropdown panels can render outside the card without
                    // getting clipped.
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-visible">
                      {/* Header */}
                      <div className="hidden md:grid grid-cols-[140px_140px_1fr_120px] gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 rounded-t-lg">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Other items</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Amount (₹)</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Ledger account</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Type</span>
                      </div>

                      {/* Tax / adjustment rows */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((r) => (
                          <div
                            key={r.key}
                            className="grid grid-cols-[140px_140px_1fr_120px] gap-3 px-3 py-2 items-center"
                          >
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              {r.label}
                              {r.required && <span className="text-rose-500">*</span>}
                              {r.hint && (
                                <span
                                  className="text-[10px] text-slate-500 dark:text-slate-400"
                                  title={r.hintTitle}
                                >
                                  ({r.hint})
                                </span>
                              )}
                            </label>
                            {r.readOnlyAmount !== undefined ? (
                              <span
                                className={`${amountCls} inline-flex items-center bg-slate-50 dark:bg-slate-900/60 cursor-default`}
                                title={r.hintTitle}
                              >
                                {r.readOnlyAmount}
                              </span>
                            ) : (
                              <EditableTaxAmount
                                value={taxSummaryForm[r.amountField]}
                                disabled={isVerified}
                                onCommit={(v) =>
                                  handleTaxSummaryChange(r.amountField, v)
                                }
                                className={amountCls}
                              />
                            )}
                            {(() => {
                              const picker = (
                              <SearchableDropdown
                                triggerClassName={
                                  r.noQuickAdd ? "" : "rounded-r-none"
                                }
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
                                  </div>
                                )}
                                size="sm"
                              />
                              );
                              const ringed =
                                r.missing && !isVerified
                                  ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                  : "";
                              return r.noQuickAdd ? (
                                <div className={ringed}>{picker}</div>
                              ) : (
                                <QuickAddGroup
                                  kind="ledger"
                                  disabled={isVerified}
                                  ledgerDefaultParent={
                                    r.quickAddParent || "Indirect Expenses"
                                  }
                                  ledgerTitle={`Add New ${r.label} Ledger`}
                                  title="Ledger not in the list? Create one"
                                  onCreated={(ledger) =>
                                    ledger?.id && r.onSelect(ledger.id)
                                  }
                                  className={`relative ${ringed}`}
                                >
                                  {picker}
                                </QuickAddGroup>
                              );
                            })()}
                            <select
                              value={taxSummaryForm[r.typeField] || r.defaultType}
                              onChange={(e) =>
                                handleTaxSummaryChange(r.typeField, e.target.value)
                              }
                              disabled={isVerified}
                              className={selectCls}
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                backgroundPosition: "right 0.4rem center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "1rem 1rem",
                                paddingRight: "1.75rem",
                              }}
                            >
                              <option value="debit">Debit</option>
                              <option value="credit">Credit</option>
                            </select>
                          </div>
                        ))}

                        {/* Payable / Paid row REMOVED.
                            Its ledger dropdown duplicated the "Payable /
                            Paid via (Bank / Cash)" field at the top of the
                            form, and its amount was never user-editable —
                            an effect recomputes it on every change so
                            debits equal credits. That balancing still runs;
                            the figure is simply shown once, as Total
                            amount, instead of twice. */}
                      </div>

                      {/* Total row */}
                      <div className="grid grid-cols-[140px_140px_1fr_120px] gap-3 px-3 py-3 items-center bg-blue-50/60 dark:bg-blue-950/30 border-t-2 border-blue-100 dark:border-blue-900/60 rounded-b-lg">
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400">
                          Total amount
                        </span>
                        <input
                          type="text"
                          name="totalAmount"
                          value={billForm.totalAmount}
                          readOnly
                          tabIndex={-1}
                          title="The invoice total as read from the bill — not directly editable."
                          placeholder="0.00"
                          className={`${CONTROL_NUM} text-left font-bold text-blue-700 dark:text-blue-400 cursor-default select-text ${
                            billTotalMatch.hasBillValue && !billTotalMatch.isMatch
                              ? "border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-900/60"
                              : "border-blue-200 dark:border-blue-900/60"
                          }`}
                        />
                        {/* Correction 46 — amber when the rows don't add up to
                            the invoice total. Unlike before, this does block
                            verification: the figures have to agree. */}
                        {billTotalMatch.hasBillValue &&
                        !billTotalMatch.isMatch ? (
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span
                              className="inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-900/60 text-[10.5px] font-bold uppercase tracking-wide"
                              title={`Line items + GST + round off + other adjustment comes to ₹${billTotalMatch.currentTotal.toFixed(2)}, but the invoice total is ₹${billTotalMatch.billTotal.toFixed(2)} — off by ${billTotalMatch.diff > 0 ? "+" : ""}₹${billTotalMatch.diff.toFixed(2)}. Adjust Round Off or Other Adjustment so the two agree.`}
                            >
                              <Icon
                                icon="heroicons:information-circle"
                                className="text-[12px]"
                              />
                              Invoice total doesn't agree
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
                            Agrees with invoice total
                          </span>
                        ) : (
                          <span className="text-[11px] text-blue-700/80 dark:text-blue-400/80">
                            Including all taxes &amp; adjustments
                          </span>
                        )}
                        <span />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Notes Section */}
              <div className="p-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={
                      notes ||
                      `Bill from ${
                        billForm.selectedVendor?.name ||
                        analysedData?.from?.name ||
                        tallyAnalysedData?.vendor_name ||
                        "Vendor"
                      } entered via BillMunshi ${
                        window.location.origin
                      }/tally/payment-voucher/${billId}\n\n`
                    }
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isVerified}
                    className={`${CONTROL_TEXTAREA} h-24 ${
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
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            // Close fullscreen when clicking on the background overlay
            if (e.target === e.currentTarget) {
              toggleFullscreen();
            }
          }}
        >
          <div className="relative w-full h-full flex flex-col">
            {/* Fullscreen Header */}
            <div
              className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md border-b border-white/10 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4">
                <h3 className="text-white text-lg font-semibold drop-shadow-lg">
                  Bill Document -{" "}
                  {billInfo.bill_munshi_name ||
                    analysedData.billNumber ||
                    "Unknown"}
                </h3>
                {!isPDF(billInfo.file) && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20">
                    <button
                      onClick={handleZoomOut}
                      className="p-1 rounded text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                      className="p-1 rounded text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                      className="p-1 rounded text-white hover:bg-white/20 transition-all"
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

            {/* Fullscreen Content */}
            <div
              className="flex-1 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {isPDF(billInfo.file) ? (
                <div className="w-full h-full p-4">
                  <iframe
                    src={billInfo.file}
                    className="w-full h-full border-0 rounded-lg shadow-2xl"
                    title="Bill PDF Document - Fullscreen"
                  />
                </div>
              ) : (
                <div
                  className={`w-full min-h-full flex ${
                    zoomLevel === 1
                      ? "items-center justify-center"
                      : "items-start justify-start"
                  } p-6`}
                  style={{ cursor: zoomLevel > 1 ? "move" : "default" }}
                >
                  <img
                    src={billInfo.file}
                    alt="Bill Document - Fullscreen"
                    className="h-auto rounded-lg shadow-2xl"
                    style={{ width: `${zoomLevel * 100}%` }}
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

export default TallyPaymentVoucherDetail;
