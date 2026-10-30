import React, { useState, useEffect } from "react";
import ActivityPanel from "@/components/bills/ActivityPanel";
import BillChecks from "@/components/bills/BillChecks";
import BillRecordLayout from "@/components/bills/BillRecordLayout";
import { currencySymbol } from "@/utils/currency";
import {
  FLAT_FIELD,
  FieldCell,
  FieldGrid,
  PARTY_TITLE_SKIN,
  TotalLine,
  TOTALS_AMOUNT,
  SwitchPill,
} from "@/components/bills/VoucherFields";
import ApprovalPanel from "@/components/bills/ApprovalPanel";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import {
  useGetZohoPaymentBill,
  useVerifyZohoPaymentBill,
  useSyncZohoPaymentBill,
} from "@/services/zoho/zohoPaymentVoucherService";
import {
  useGetVendors,
  useGetAllChartOfAccounts,
} from "@/services/zoho/zohoApiService";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";
import { BADGE, CONTROL, CONTROL_NUM, CONTROL_TEXTAREA, CONTROL_VALIDATED } from "@/constants/ui";

// Mirrors ZOHO_PAYMENT_MODE_CHOICES on the backend. Zoho rejects a mode it
// does not know, so the list is fixed rather than free text.
const PAYMENT_MODES = [
  { value: "Cash", label: "Cash" },
  { value: "Check", label: "Check" },
  { value: "Credit Card", label: "Credit Card" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Bank Remittance", label: "Bank Remittance" },
  { value: "Others", label: "Others" },
];

const ZohoPaymentVoucherDetail = () => {
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [collapsed, setMenuCollapsed] = useSidebar();
  const navigate = useNavigate();
  const { id: billId } = useParams();
  const { selectedOrganization } = useSelector((state) => state.auth);
  // Zoho bills carry no currency of their own, so they are rupees.
  const cur = currencySymbol();

  // A payment is a payment object, not a bill: party, amount, date,
  // mode and the account the money left from. There is no product grid.
  const [paymentForm, setPaymentForm] = useState({
    partyName: "",
    partyGST: "",
    referenceNumber: "",
    billDate: "",
    paymentMode: "Cash",
    amount: "",
    bankCharges: "",
    tds: "",
    selectedParty: null,
    selectedAccount: null,
  });

  // Documents this money settles against. Stored loosely as JSON on the
  // backend precisely so it can be edited here; rows without both an id
  // and an amount are dropped before posting.
  const [appliedDocs, setAppliedDocs] = useState([]);

  const [notes, setNotes] = useState("");

  const [dateErrors, setDateErrors] = useState({ billDate: "" });

  // State for image zoom and viewing
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  // Which tab of the record is showing, and whether the scan pane is
  // open. Both are view state only.
  const [recordTab, setRecordTab] = useState("bill");
  const [scanOpen, setScanOpen] = useState(true);

  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', or null
  const [verificationMessage, setVerificationMessage] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);

  const {
    data: paymentData,
    error,
    isLoading,
    // `isLoading` is false once the bill has loaded once; `isFetching` is
    // the flag a manual refetch keeps true, which is what the Refresh
    // spinner needs.
    isFetching,
    refetch,
  } = useGetZohoPaymentBill({ organizationId: selectedOrganization?.id, billId });

  const {
    mutateAsync: verifyPayment,
    isPending: isVerifying,
    error: verifyError,
    isSuccess: verifySuccess,
  } = useVerifyZohoPaymentBill();

  const { mutateAsync: syncPayment } = useSyncZohoPaymentBill();

  const { data: partiesData, isLoading: partiesLoading } = useGetVendors(
    selectedOrganization?.id,
  );

  const { data: chartOfAccountsData, isLoading: chartOfAccountsLoading } =
    useGetAllChartOfAccounts(selectedOrganization?.id);

  const analysedData = paymentData?.analysed_data || {};
  const zohoData = paymentData?.zoho_bill || {};

  const isSynced =
    paymentData?.status === "Synced" || paymentData?.status === "Posted";

  // Allow editing for verified vouchers (the operator can verify again)
  // Locked, not "verified": a verified bill can be corrected and
  // verified again. What closes the voucher for editing is it having
  // been posted, because after that the figures are history.
  const isLocked = isSynced; // Only truly locked after sync

  // Validation — the same three things the sync payload builder refuses on.
  const isPartyRequired = !paymentForm.selectedParty;
  const isAccountRequired = !paymentForm.selectedAccount;
  const isAmountInvalid =
    !paymentForm.amount || parseFloat(paymentForm.amount) <= 0;

  const hasValidationErrors = () =>
    isPartyRequired || isAccountRequired || isAmountInvalid;

  // The blocking list, spelled out. The banner and the Verify button's
  // tooltip both read it, so the two can never disagree.
  const getValidationErrorMessages = () => {
    const errors = [];
    if (isPartyRequired) errors.push("Select a vendor");
    if (isAccountRequired) errors.push("Select the paid-through account");
    if (isAmountInvalid) errors.push("Enter an amount greater than zero");
    return errors;
  };

  const validateDateInput = (dateString) => {
    if (!dateString) return true; // Allow empty dates

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const [year, month, day] = dateString.split("-").map(Number);

    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;

    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return false;

    return true;
  };

  const handleFormChange = (name, value) => {
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, value) => {
    setDateErrors((prev) => ({ ...prev, [name]: "" }));

    if (value && !validateDateInput(value)) {
      const [year] = value.split("-").map(Number);
      const errorMessage =
        year < 1900 || year > 2100
          ? "Year must be between 1900 and 2100"
          : "Invalid date";

      setDateErrors((prev) => ({ ...prev, [name]: errorMessage }));
      globalToast("error", errorMessage);
      return; // Don't update the state with invalid date
    }
    handleFormChange(name, value);
  };

  // Update form when data is loaded
  useEffect(() => {
    if (paymentData?.analysed_data) {
      const data = paymentData.analysed_data;
      const zoho = paymentData.zoho_bill;

      let selectedPartyObj = null;
      if (zoho?.vendor && partiesData?.results) {
        selectedPartyObj = partiesData.results.find(
          (p) => p.id === zoho.vendor,
        );
      }

      // Handles both DD-MM-YYYY and YYYY-MM-DD; always returns YYYY-MM-DD
      // or the empty string.
      const parseDate = (dateStr) => {
        if (!dateStr) return "";

        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (isoDateRegex.test(dateStr)) {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? "" : dateStr;
        }

        const parts = dateStr.split("-");
        if (parts.length === 3) {
          const [day, month, year] = parts;
          const isoDate = `${year}-${month}-${day}`;
          const date = new Date(isoDate);
          return isNaN(date.getTime()) ? "" : isoDate;
        }

        return "";
      };

      setPaymentForm({
        // A payment advice is issued against a document the vendor sent,
        // so the party is the issuer half.
        partyName: selectedPartyObj?.companyName || data.from?.name || "",
        partyGST: selectedPartyObj?.gstNo || data.from?.gst_number || "",
        referenceNumber: zoho?.bill_no || data.invoiceNumber || "",
        billDate: parseDate(zoho?.bill_date) || parseDate(data.dateIssued),
        paymentMode: zoho?.payment_mode || "Cash",
        amount: zoho?.amount ?? data.total ?? "",
        bankCharges: zoho?.bank_charges ?? "",
        tds: zoho?.tds ?? data.tds ?? "",
        selectedParty: selectedPartyObj || zoho?.vendor || null,
        // Analysis leaves this unset on purpose: which account the money
        // left from is not printed on a payment advice.
        selectedAccount: zoho?.paid_through_account || null,
      });

      setAppliedDocs(
        (zoho?.applied_bills || []).map((row, index) => ({
          key: `${index}-${row?.bill_id || "row"}`,
          document_id: row?.bill_id || row?.id || "",
          amount_applied: row?.amount_applied ?? "",
        })),
      );

      setNotes(zoho?.note || "");
    }
  }, [paymentData, partiesData]);

  const handlePartySelect = (party) => {
    if (party === null) {
      setPaymentForm((prev) => ({
        ...prev,
        selectedParty: null,
        partyName: analysedData?.from?.name || "",
        partyGST: "",
      }));
    } else {
      setPaymentForm((prev) => ({
        ...prev,
        selectedParty: party,
        partyName: party.companyName || "",
        partyGST: party.gstNo || "",
      }));
    }
  };

  const addAppliedDoc = () => {
    setAppliedDocs((prev) => [
      ...prev,
      { key: `new-${Date.now()}`, document_id: "", amount_applied: "" },
    ]);
  };

  const handleAppliedDocChange = (index, field, value) => {
    setAppliedDocs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeAppliedDoc = (index) => {
    setAppliedDocs((prev) => prev.filter((_, i) => i !== index));
  };

  // Zoom and viewing functions
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.25));
  const handleResetZoom = () => setZoomLevel(1);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

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
      if (!paymentData?.file || isPDF(paymentData.file)) {
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
  }, [paymentData?.file, isFullscreen, zoomLevel]);

  // Auto-close sidebar when component mounts
  useEffect(() => {
    if (mobileMenu) {
      setMobileMenu(false);
    }
    if (!collapsed) {
      setMenuCollapsed(true);
    }
  }, []); // Empty dependency array to run only on mount

  useEffect(() => {
    if (verifySuccess) {
      setVerificationStatus("success");
    } else if (verifyError) {
      setVerificationStatus("error");
    }
  }, [verifySuccess, verifyError]);

  const handleBackClick = () => {
    if (collapsed) {
      setMenuCollapsed(false);
    }
    navigate("/zoho/payment-voucher");
  };

  const handleVerification = async () => {
    try {
      setVerificationStatus(null);
      setVerificationMessage("");

      const fail = (message) => {
        globalToast.error(message);
        setVerificationStatus("error");
        setVerificationMessage(message);
      };

      if (!paymentForm.selectedParty) {
        return fail("Please select a vendor");
      }

      if (!paymentForm.selectedAccount) {
        return fail("Please select the paid-through account");
      }

      if (!paymentForm.billDate) {
        return fail("Payment date is required");
      }

      if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
        return fail("Amount must be greater than zero");
      }

      const appliedPayload = appliedDocs
        .filter((row) => row.document_id && row.amount_applied)
        .map((row) => ({
          bill_id: row.document_id,
          amount_applied: row.amount_applied,
        }));

      const verificationData = {
        bill_id: billId,
        zoho_bill: {
          id: zohoData?.id || undefined,
          selectBill: billId,
          vendor:
            typeof paymentForm.selectedParty === "object"
              ? paymentForm.selectedParty.id
              : paymentForm.selectedParty,
          paid_through_account: paymentForm.selectedAccount,
          bill_no: paymentForm.referenceNumber,
          bill_date: paymentForm.billDate,
          payment_mode: paymentForm.paymentMode,
          amount: paymentForm.amount,
          bank_charges: paymentForm.bankCharges || "0",
          tds: paymentForm.tds || "0",
          note: notes,
          applied_bills: appliedPayload,
        },
      };

      await verifyPayment({
        organizationId: selectedOrganization?.id,
        billId,
        billData: verificationData,
      });

      globalToast.success("Payment verified successfully!");
    } catch (error) {
      console.error("Verification failed:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Verification failed. Please try again.";

      globalToast.error(errorMessage);

      setVerificationStatus("error");
      setVerificationMessage(errorMessage);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);

      await syncPayment({
        organizationId: selectedOrganization?.id,
        billId,
      });

      globalToast.success("Payment synced to Zoho successfully");
      refetch(); // Refresh the data to show updated status
    } catch (error) {
      console.error("Failed to sync payment:", error);
      globalToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to sync payment",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
          <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Failed to load payment
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error?.data?.message ||
            error?.message ||
            "An error occurred while fetching payment details."}
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
          Please select a client to view payment details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Verification Status Messages */}
      {verificationStatus === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Icon
              icon="heroicons:exclamation-circle"
              className="w-5 h-5 text-red-600 mr-3"
            />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Verification Failed
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {verificationMessage ||
                  "There was an error verifying the payment. Please check the form data and try again."}
              </p>
            </div>
            <button
              onClick={() => setVerificationStatus(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <Icon icon="heroicons:x-mark" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBackClick}
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Back to payments"
          >
            <Icon icon="heroicons:arrow-left" className="text-sm" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {paymentData?.bill_munshi_name || paymentData?.billmunshiName || "Payment"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {paymentData?.status ? `Status: ${paymentData.status}` : "Payment detail"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/zoho/payment-voucher/${paymentData?.previous_bill}`)}
            disabled={!paymentData?.previous_bill}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={paymentData?.previous_bill ? "Go to previous payment" : "No previous payment"}
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
            onClick={() => navigate(`/zoho/payment-voucher/${paymentData?.next_bill}`)}
            disabled={!paymentData?.next_bill}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={paymentData?.next_bill ? "Go to next payment" : "No next payment"}
          >
            Next
            <Icon icon="heroicons:arrow-right" className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => setIsActivityOpen(true)}
            aria-label="Activity"
            className="inline-flex items-center justify-center h-8 w-8 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Who did what to this payment"
          >
            <Icon icon="heroicons:clock" className="text-sm" />
          </button>
          <span className="hidden md:inline w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <button
            type="button"
            onClick={handleVerification}
            disabled={isVerifying || isSynced || hasValidationErrors()}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={
              isVerifying
                ? "Verifying…"
                : isSynced
                  ? "Payment already synced"
                  : hasValidationErrors()
                    ? getValidationErrorMessages().join(" · ")
                    : paymentData?.status === "Verified"
                      ? "Re-verify"
                      : "Verify"
            }
          >
            <Icon icon={isVerifying ? "heroicons:arrow-path" : "heroicons:check-badge"} className={`text-sm ${isVerifying ? "animate-spin" : ""}`} />
            {isVerifying ? "Verifying…" : paymentData?.status === "Verified" ? "Re-verify" : "Verify"}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || isSynced || paymentData?.status !== "Verified"}
            className="group inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
            title={
              isSyncing
                ? "Syncing…"
                : isSynced
                  ? "Payment already synced"
                  : paymentData?.status !== "Verified"
                    ? "Payment must be verified before sync"
                    : "Sync with Zoho"
            }
          >
            <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-sm ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync to Zoho"}
          </button>
        </div>
      </div>

      <BillRecordLayout
        tab={recordTab}
        onTabChange={setRecordTab}
        organizationId={selectedOrganization?.id}
        billId={billId}
        scanOpen={scanOpen}
        onToggleScan={() => setScanOpen((v) => !v)}
        notice={
                  <BillChecks
                  blockers={getValidationErrorMessages()}
                  isLocked={isLocked}
                />
        }
        scan={
            <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[400px] lg:h-[calc(100vh-10.5rem)] flex flex-col">
              {paymentData?.file ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 dark:border-slate-700 flex-shrink-0 z-10">
                    <h3 className="text-base font-medium text-slate-900 dark:text-white truncate mr-2">
                      {paymentData.billmunshiName || "Document"}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!isPDF(paymentData.file) && (
                        <>
                          <button
                            onClick={handleZoomOut}
                            className="p-1 rounded-md bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Zoom Out (Ctrl + -)"
                            disabled={zoomLevel <= 0.25}
                          >
                            <Icon icon="heroicons:magnifying-glass-minus" className="w-3.5 h-3.5" />
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
                            <Icon icon="heroicons:magnifying-glass-plus" className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleResetZoom}
                            className="p-1 rounded-md bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 transition-colors"
                            title="Reset Zoom (Ctrl + 0)"
                          >
                            <Icon icon="heroicons:arrow-path" className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={toggleFullscreen}
                        className="p-1 rounded-md bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 transition-colors"
                        title="Toggle Fullscreen (Ctrl + F)"
                      >
                        <Icon icon="heroicons:arrows-pointing-out" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto bg-white">
                    {isPDF(paymentData.file) ? (
                      <iframe
                        src={paymentData.file}
                        className="w-full h-full border-0"
                        title="Payment PDF Document"
                      />
                    ) : (
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
                          src={paymentData.file}
                          alt="Payment Document"
                          className="rounded-lg shadow-lg transition-transform duration-200 select-none"
                          style={{
                            width:
                              zoomLevel <= 1 ? "100%" : `${zoomLevel * 100}%`,
                            height: "auto",
                            maxWidth: zoomLevel <= 1 ? "100%" : "none",
                            objectFit: "contain",
                          }}
                          draggable="false"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Icon
                    icon="heroicons:document"
                    className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4"
                  />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                    Payment Document
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">No document available</p>
                </div>
              )}
            </div>
        }
      >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-visible">
              {/* The voucher opens the way the paper does: the party
                  on the left, what it comes to on the right. The name
                  IS the picker. */}
              <div className="px-5 pt-4 pb-3 flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1">
                    Paid to
                  </div>
                  <div className="space-y-2">
                    <div
                      className={`${
                        isPartyRequired && !isLocked
                          ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                          : ""
                      }`}
                    >
                      <SearchableDropdown
                        options={
                          partiesData?.results?.map((party) => ({
                            value: party.id,
                            label: party.companyName,
                            gstNo: party.gstNo,
                          })) || []
                        }
                        value={
                          typeof paymentForm.selectedParty === "object" &&
                          paymentForm.selectedParty !== null
                            ? paymentForm.selectedParty.id
                            : paymentForm.selectedParty || ""
                        }
                        onChange={(value) => {
                          if (value === null || value === "") {
                            handlePartySelect(null);
                          } else {
                            const party = partiesData?.results?.find(
                              (p) => p.id === value,
                            );
                            if (party) handlePartySelect(party);
                          }
                        }}
                        onClear={() => handlePartySelect(null)}
                        placeholder="Select a vendor..."
                        searchPlaceholder="Search vendors..."
                        loading={partiesLoading}
                        loadingMessage="Loading vendors..."
                        disabled={isLocked}
                        noOptionsMessage="No vendors found"
                        renderOption={(option) => (
                          <div>
                            <div className="font-medium">{option.label}</div>
                            {option.gstNo && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                GST: {option.gstNo}
                              </div>
                            )}
                          </div>
                        )}
                      />
                    </div>

                    {partiesData?.results?.length === 0 &&
                      !partiesLoading && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
                          No vendors found. Please sync vendors from
                          Zoho first.
                        </div>
                      )}

                    {analysedData?.from?.name &&
                      !paymentForm.selectedParty && (
                        <div className="mt-2">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            <Icon
                              icon="heroicons:exclamation-triangle"
                              className="w-3 h-3"
                            />
                            Vendor not found in the list, please add new
                            vendor
                          </div>
                        </div>
                      )}
                  </div>
                    </div>

                    {/* Bank / cash account */}
                    <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paid Through Account <span className="text-rose-500">*</span>
                  </label>
                  <div
                    className={`${
                      isAccountRequired && !isLocked
                        ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                        : ""
                    }`}
                  >
                    <SearchableDropdown
                      options={
                        chartOfAccountsData?.results?.map((account) => ({
                          value: account.id,
                          label: account.accountName,
                        })) || []
                      }
                      value={paymentForm.selectedAccount || ""}
                      onChange={(value) =>
                        handleFormChange("selectedAccount", value || null)
                      }
                      onClear={() =>
                        handleFormChange("selectedAccount", null)
                      }
                      placeholder="Select bank or cash account..."
                      searchPlaceholder="Search accounts..."
                      loading={chartOfAccountsLoading}
                      loadingMessage="Loading accounts..."
                      noOptionsMessage="No accounts found"
                      disabled={isLocked}
                    />
                  </div>
                  {/* Analysis never guesses this: the account is not
                      printed on the document. */}
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    The account the money left from.
                  </p>
                    </div>

                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500 mb-1">
                    Payment total
                  </div>
                  <div className="text-2xl font-black tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {cur}
                    {Number(parseFloat(paymentForm.amount) || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* The fields of the voucher. No heading and no icon: the
                  grid below says what it holds. */}
              <div className="px-5 pb-4 border-b border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="mb-3">
                  <ApprovalPanel
                    organizationId={selectedOrganization?.id}
                    billId={billId}
                  />
                </div>

                <FieldGrid>
                  <FieldCell label="Paid through account">
                    <SearchableDropdown
                      options={
                        chartOfAccountsData?.results?.map((account) => ({
                          value: account.id,
                          label: account.accountName,
                        })) || []
                      }
                      value={paymentForm.selectedAccount || ""}
                      onChange={(value) =>
                        handleFormChange("selectedAccount", value || null)
                      }
                      onClear={() => handleFormChange("selectedAccount", null)}
                      placeholder="Select bank or cash account..."
                      searchPlaceholder="Search accounts..."
                      loading={chartOfAccountsLoading}
                      loadingMessage="Loading accounts..."
                      noOptionsMessage="No accounts found"
                      disabled={isLocked}
                    />
                  </FieldCell>

                  <FieldCell label="Reference number">
                    <input
                      type="text"
                      value={paymentForm.referenceNumber}
                      onChange={(e) =>
                        handleFormChange("referenceNumber", e.target.value)
                      }
                      placeholder="not on the bill"
                      disabled={isLocked}
                      className={FLAT_FIELD}
                    />
                  </FieldCell>

                  <FieldCell label="Payment date">
                    <input
                      type="date"
                      value={paymentForm.billDate}
                      onChange={(e) =>
                        handleFormChange("billDate", e.target.value)
                      }
                      min="1900-01-01"
                      max="2100-12-31"
                      disabled={isLocked}
                      className={FLAT_FIELD}
                    />
                  </FieldCell>

                  <FieldCell label="Payment mode">
                    <SearchableDropdown
                      options={PAYMENT_MODES}
                      value={paymentForm.paymentMode || ""}
                      onChange={(value) =>
                        handleFormChange("paymentMode", value || "Cash")
                      }
                      onClear={() => handleFormChange("paymentMode", "Cash")}
                      placeholder="Select payment mode..."
                      searchPlaceholder="Search modes..."
                      disabled={isLocked}
                    />
                  </FieldCell>

                  <FieldCell label="GST number">
                    <input
                      type="text"
                      value={paymentForm.partyGST}
                      onChange={(e) =>
                        handleFormChange("partyGST", e.target.value)
                      }
                      placeholder="not on the bill"
                      disabled={isLocked}
                      className={`${FLAT_FIELD} font-mono`}
                    />
                  </FieldCell>
                </FieldGrid>
              </div>

              {/* Amount section */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Amount Paid
                  </h3>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Bank Charges:
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="bankCharges"
                            value={paymentForm.bankCharges}
                            onChange={(e) =>
                              handleFormChange("bankCharges", e.target.value)
                            }
                            placeholder="0.00"
                            className="w-32 px-2 py-1 text-right border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isLocked}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          TDS:
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="tds"
                            value={paymentForm.tds}
                            onChange={(e) =>
                              handleFormChange("tds", e.target.value)
                            }
                            placeholder="0.00"
                            className="w-32 px-2 py-1 text-right border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isLocked}
                          />
                        </div>
                      </div>
                      {/* Zoho only accepts withheld tax per settled
                          document, so this is kept for reporting. */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        TDS is recorded for reporting; Zoho applies it per
                        settled invoice.
                      </p>
                    </div>

                    <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 p-4 w-full">
                      <div className="text-center">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 mb-1.5">
                          Amount <span className="text-rose-500">*</span>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-700 dark:text-blue-400 mr-1">
                            ₹
                          </span>
                          <input
                            type="number"
                            name="amount"
                            value={paymentForm.amount}
                            onChange={(e) =>
                              handleFormChange("amount", e.target.value)
                            }
                            placeholder="0.00"
                            className="w-32 px-2 py-1 text-center text-base font-bold font-mono text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isLocked}
                          />
                        </div>
                        <div className="text-[10px] text-blue-700/80 dark:text-blue-400/80 mt-1">
                          Total paid
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Applied documents */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                      Applied Bills
                    </h3>
                  </div>
                  <button
                    onClick={addAppliedDoc}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200"
                    title="Add"
                    disabled={isLocked}
                  >
                    <Icon icon="heroicons:plus" className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
                  {appliedDocs.length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nothing applied — the payment posts as an unapplied
                      credit against the vendor.
                    </p>
                  ) : (
                    appliedDocs.map((row, index) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 items-center"
                      >
                        <input
                          type="text"
                          value={row.document_id}
                          onChange={(e) =>
                            handleAppliedDocChange(
                              index,
                              "document_id",
                              e.target.value,
                            )
                          }
                          placeholder="Zoho bill ID"
                          className={CONTROL}
                          disabled={isLocked}
                        />
                        <input
                          type="number"
                          value={row.amount_applied}
                          onChange={(e) =>
                            handleAppliedDocChange(
                              index,
                              "amount_applied",
                              e.target.value,
                            )
                          }
                          placeholder="0.00"
                          className={CONTROL_NUM}
                          min="0"
                          step="0.01"
                          disabled={isLocked}
                        />
                        <button
                          onClick={() => removeAppliedDoc(index)}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                          title="Remove"
                          disabled={isLocked}
                        >
                          <Icon icon="heroicons:trash" className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
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
                      `Payment to ${
                        paymentForm.selectedParty?.companyName ||
                        analysedData?.from?.name ||
                        "Vendor"
                      } entered via BillMunshi ${
                        window.location.origin
                      }/zoho/payment-voucher/${billId}\n\n`
                    }
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${CONTROL_TEXTAREA} h-24`}
                    placeholder="Add notes or comments..."
                    rows={4}
                    disabled={isLocked}
                  />
                </div>
              </div>
      </BillRecordLayout>

      <ActivityPanel
        open={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        organizationId={selectedOrganization?.id}
        billId={billId}
      />

      {/* Fullscreen Modal */}
      {isFullscreen && paymentData?.file && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              toggleFullscreen();
            }
          }}
        >
          <div className="relative w-full h-full flex flex-col">
            <div
              className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-70 backdrop-blur-sm flex-shrink-0 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4">
                <h3 className="text-white text-lg font-medium">
                  Payment Document -{" "}
                  {zohoData.bill_no || analysedData.invoiceNumber || "Unknown"}
                </h3>
                {!isPDF(paymentData.file) && (
                  <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <button
                      onClick={handleZoomOut}
                      className="p-1.5 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Zoom Out (Ctrl + -)"
                      disabled={zoomLevel <= 0.25}
                    >
                      <Icon icon="heroicons:magnifying-glass-minus" className="w-4 h-4" />
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
                      <Icon icon="heroicons:magnifying-glass-plus" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-1.5 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                      title="Reset Zoom (Ctrl + 0)"
                    >
                      <Icon icon="heroicons:arrow-path" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                title="Close Fullscreen (Esc or click outside)"
              >
                <Icon icon="heroicons:x-mark" className="w-5 h-5" />
                <span className="text-sm font-medium">Close</span>
              </button>
            </div>

            <div
              className="flex-1 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {isPDF(paymentData.file) ? (
                <iframe
                  src={paymentData.file}
                  className="w-full h-full border-0"
                  title="Payment PDF Document - Fullscreen"
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
                    src={paymentData.file}
                    alt="Payment Document - Fullscreen"
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

export default ZohoPaymentVoucherDetail;
