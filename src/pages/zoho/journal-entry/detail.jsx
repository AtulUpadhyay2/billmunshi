import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import Switch from "@/components/ui/Switch";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import {
  useGetZohoJournalBillDetails,
  useVerifyZohoJournalBill,
  useSyncZohoJournalBill,
} from "@/services/zoho/zohoJournalEntryService";
import {
  useGetVendors,
  useGetAllChartOfAccounts,
  useGetAllTaxes,
  useGetAllTdsTcs,
} from "@/services/zoho/zohoApiService";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";

const ZohoJournalEntryDetail = () => {
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [collapsed, setMenuCollapsed] = useSidebar();
  const navigate = useNavigate();
  const { id: journalEntryId } = useParams();
  const { selectedOrganization } = useSelector((state) => state.auth);

  // Form state for journal entry information
  const [journalEntryForm, setJournalEntryForm] = useState({
    referenceNumber: "",
    entryDate: "",
    dueDate: "",
    vendorName: "",
    totalAmount: "",
    selectedVendor: null,
    vendorGST: "",
    taxType: "TDS", // Default to TDS
  });

  // State for managing journal entry line items
  const [journalLineItems, setJournalLineItems] = useState([]);

  // State for consolidate toggle
  const [isConsolidated, setIsConsolidated] = useState(false);

  // State for TDS/TCS selection
  const [selectedTdsTcs, setSelectedTdsTcs] = useState(null);

  // Form state for tax summary
  const [taxSummary, setTaxSummary] = useState({
    igst: "",
    cgst: "",
    sgst: "",
    total: "",
  });

  // State for tax and vendor ledger mappings
  const [taxAndOtherItems, setTaxAndOtherItems] = useState({
    cgstAccountId: null,
    sgstAccountId: null,
    igstAccountId: null,
    vendorAccountId: null,
    cgstDebitCredit: "debit",
    sgstDebitCredit: "debit",
    igstDebitCredit: "debit",
    vendorDebitCredit: "credit",
  });

  // State for notes
  const [notes, setNotes] = useState("");

  // State for date validation errors
  const [dateErrors, setDateErrors] = useState({
    entryDate: "",
    dueDate: "",
  });

  // State for image zoom and viewing
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State for verification loading
  const [isVerifying, setIsVerifying] = useState(false);

  // State for error alert
  const [errorAlert, setErrorAlert] = useState({ show: false, message: "" });

  // State to track if user manually cleared vendor selection
  const [isVendorManuallyCleared, setIsVendorManuallyCleared] = useState(false);

  // State for sync operation
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch journal entry data using the exact endpoint: zoho/org/{org_id}/journal-bills/{bill_id}/details/
  const {
    data: journalEntryData,
    error,
    isLoading,
    // `isLoading` is `isPending && isFetching` in react-query v5, so it
    // is false once the bill has loaded once. `isFetching` is the flag
    // that stays true for a manual refetch — the Refresh spinner needs
    // that one, not `isLoading`.
    isFetching,
    refetch,
  } = useGetZohoJournalBillDetails(
    { organizationId: selectedOrganization?.id, billId: journalEntryId },
    { enabled: !!selectedOrganization?.id && !!journalEntryId },
  );

  // Verify journal entry mutation
  const { mutateAsync: verifyJournalEntry } = useVerifyZohoJournalBill();

  // Sync journal entry mutation
  const { mutateAsync: syncJournalEntry } = useSyncZohoJournalBill();

  // Fetch vendors list for dropdown
  const { data: vendorsData, isLoading: vendorsLoading } = useGetVendors(
    selectedOrganization?.id,
  );

  // Fetch all chart of accounts for dropdown
  const { data: chartOfAccountsData, isLoading: chartOfAccountsLoading } =
    useGetAllChartOfAccounts(selectedOrganization?.id);

  // Fetch all taxes for dropdown
  const { data: taxesData, isLoading: taxesLoading } = useGetAllTaxes(
    selectedOrganization?.id,
  );

  // Fetch all TDS/TCS data based on selected tax type
  const { data: tdsTcsData, isLoading: tdsTcsLoading } = useGetAllTdsTcs(
    {
      organizationId: selectedOrganization?.id,
      tax_type: journalEntryForm.taxType,
    },
    {
      enabled: !!selectedOrganization?.id && !!journalEntryForm.taxType,
    },
  );

  // Extract data from the API response
  const journalInfo = journalEntryData || {};
  const analysedData = journalEntryData?.analysed_data || {};
  const zohoJournalData = journalEntryData?.zoho_bill || {};

  // Check if journal entry is synced or posted (disable inputs only for synced/posted, not verified)
  const isSynced =
    journalInfo?.status === "Synced" || journalInfo?.status === "Posted";

  // Allow editing for verified bills (user can verify multiple times)
  const isVerified = isSynced; // Only truly locked after sync

  // Validation helper functions
  const isVendorRequired = !journalEntryForm.selectedVendor;
  const getLineItemsWithoutCOA = () =>
    journalLineItems.filter((item) => !item.chart_of_accounts_id);
  const hasValidationErrors = () =>
    isVendorRequired ||
    getLineItemsWithoutCOA().length > 0 ||
    journalLineItems.length === 0;

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

  // Handle date input changes with validation
  const handleDateChange = (name, value) => {
    // Clear error for this field first
    setDateErrors((prev) => ({ ...prev, [name]: "" }));

    // For date inputs, validate before setting
    if (value && !validateDateInput(value)) {
      // Set inline error message
      const [year] = value.split("-").map(Number);
      let errorMessage = "Invalid date";

      if (year < 1900 || year > 2100) {
        errorMessage = "Year must be between 1900 and 2100";
      }

      setDateErrors((prev) => ({ ...prev, [name]: errorMessage }));

      // Still show toast for user awareness
      globalToast("error", errorMessage);
      return; // Don't update the state with invalid date
    }
    handleFormChange(name, value);
  };

  // Utility function to check if file is PDF
  const isPDF = (url) => url && url.toLowerCase().includes(".pdf");

  // Handle form changes
  const handleFormChange = (field, value) => {
    setJournalEntryForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle vendor selection
  const handleVendorSelect = (vendorId) => {
    if (vendorId === null || vendorId === "") {
      // If null/empty value is passed via onChange, treat as clear
      handleVendorClear();
      return;
    }

    const vendor = vendorsData?.results?.find((v) => v.id === vendorId);
    setJournalEntryForm((prev) => ({
      ...prev,
      selectedVendor: vendor,
      vendorName: vendor?.companyName || "",
      vendorGST: vendor?.gstNo || "",
    }));
    setIsVendorManuallyCleared(false); // Reset flag when vendor is manually selected
  };

  // Handle vendor clear
  const handleVendorClear = () => {
    setJournalEntryForm((prev) => ({
      ...prev,
      selectedVendor: null,
      vendorName: "",
      vendorGST: "",
    }));
    setIsVendorManuallyCleared(true); // Flag that user manually cleared vendor
  };

  // Handle back click
  const handleBackClick = () => {
    // Open sidebar if it's collapsed
    if (collapsed) {
      setMenuCollapsed(false);
    }
    // Navigate back to journal entry list
    navigate("/zoho/journal-entry");
  };

  // Handle zoom functions
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () =>
    setZoomLevel((prev) => Math.max(0.25, prev - 0.25));
  const handleResetZoom = () => setZoomLevel(1);

  // Handle fullscreen toggle
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "f":
            e.preventDefault();
            toggleFullscreen();
            break;
          case "+":
          case "=":
            e.preventDefault();
            handleZoomIn();
            break;
          case "-":
            e.preventDefault();
            handleZoomOut();
            break;
          case "0":
            e.preventDefault();
            handleResetZoom();
            break;
        }
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

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

  // Add journal entry line item
  const addJournalLineItem = () => {
    setJournalLineItems((prev) => [
      ...prev,
      {
        id: Date.now(), // Add unique ID
        item_id: null,
        zohoBill: zohoJournalData?.id || null,
        item_name: "",
        item_details: "",
        vendor_id: null,
        chart_of_accounts_id: null,
        taxes: null,
        amount: "",
        debit_or_credit: "debit",
        created_at: null,
      },
    ]);
  };

  // Remove journal entry line item
  const removeJournalLineItem = (index) => {
    setJournalLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle consolidate toggle
  const handleConsolidateToggle = () => {
    const newConsolidateStatus = !isConsolidated;
    setIsConsolidated(newConsolidateStatus);

    const zoho = zohoJournalData;

    // When toggling to consolidated, use consolidate_prod if available
    if (newConsolidateStatus) {
      if (zoho?.consolidate_prod && zoho.consolidate_prod.length > 0) {
        setJournalLineItems(
          zoho.consolidate_prod.map((item, index) => ({
            id: item.id || index,
            item_id: item.id || null,
            zohoBill: item.zohoBill || null,
            item_details: item.item_details || "",
            vendor_id: item.vendor || null,
            chart_of_accounts: item.chart_of_accounts
              ? "Selected"
              : "No COA Selected",
            chart_of_accounts_id: item.chart_of_accounts || null,
            taxes: item.taxes || null,
            amount: item.amount || "",
            debit_or_credit: item.debit_or_credit || "debit",
            created_at: item.created_at || null,
          })),
        );
      }
    } else {
      // When toggling to non-consolidated, use products if available
      if (zoho?.products && zoho.products.length > 0) {
        setJournalLineItems(
          zoho.products.map((item, index) => ({
            id: item.id || index,
            item_id: item.id || null,
            zohoBill: item.zohoBill || null,
            item_details: item.item_details || "",
            vendor_id: item.vendor || null,
            chart_of_accounts: item.chart_of_accounts
              ? "Selected"
              : "No COA Selected",
            chart_of_accounts_id: item.chart_of_accounts || null,
            taxes: item.taxes || null,
            amount: item.amount || "",
            debit_or_credit: item.debit_or_credit || "debit",
            created_at: item.created_at || null,
          })),
        );
      }
    }
  };

  // Handle tax summary changes
  const handleTaxSummaryChange = (field, value) => {
    setTaxSummary((prev) => ({ ...prev, [field]: value }));
  };

  // Handle tax and other items changes
  const handleTaxAndOtherItemsChange = (field, value) => {
    setTaxAndOtherItems((prev) => ({ ...prev, [field]: value }));
  };

  // Handle chart of accounts selection for taxes
  const handleCgstAccountSelect = (accountId) => {
    setTaxAndOtherItems((prev) => ({ ...prev, cgstAccountId: accountId }));
  };

  const handleSgstAccountSelect = (accountId) => {
    setTaxAndOtherItems((prev) => ({ ...prev, sgstAccountId: accountId }));
  };

  const handleIgstAccountSelect = (accountId) => {
    setTaxAndOtherItems((prev) => ({ ...prev, igstAccountId: accountId }));
  };

  const handleVendorAccountSelect = (accountId) => {
    setTaxAndOtherItems((prev) => ({ ...prev, vendorAccountId: accountId }));
  };

  // Handle clear functions
  const handleCgstAccountClear = () => {
    setTaxAndOtherItems((prev) => ({ ...prev, cgstAccountId: null }));
  };

  const handleSgstAccountClear = () => {
    setTaxAndOtherItems((prev) => ({ ...prev, sgstAccountId: null }));
  };

  const handleIgstAccountClear = () => {
    setTaxAndOtherItems((prev) => ({ ...prev, igstAccountId: null }));
  };

  const handleVendorAccountClear = () => {
    setTaxAndOtherItems((prev) => ({ ...prev, vendorAccountId: null }));
  };

  // Update form data when journal entry data is loaded
  useEffect(() => {
    if (journalEntryData) {
      const data = analysedData;
      const zoho = zohoJournalData;

      // Helper function to parse date - handles both DD-MM-YYYY and YYYY-MM-DD formats
      // Always returns YYYY-MM-DD format or empty string
      const parseDate = (dateStr) => {
        if (!dateStr) return "";

        // Check if date is already in ISO format (YYYY-MM-DD)
        const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (isoDateRegex.test(dateStr)) {
          // Already in ISO format, just validate it
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? "" : dateStr;
        }

        // Try DD-MM-YYYY format
        const parts = dateStr.split("-");
        if (parts.length === 3) {
          const [day, month, year] = parts;
          // Convert to YYYY-MM-DD
          const isoDate = `${year}-${month}-${day}`;
          const date = new Date(isoDate);
          return isNaN(date.getTime()) ? "" : isoDate;
        }

        return "";
      };

      // Update journal entry form with data from API response
      setJournalEntryForm((prev) => ({
        ...prev,
        referenceNumber: zoho?.bill_no || data?.invoiceNumber || "",
        entryDate: parseDate(zoho?.bill_date),
        dueDate:
          parseDate(zoho?.due_date) ||
          parseDate(zoho?.bill_date) ||
          parseDate(data?.dateIssued),
        vendorName: data?.from?.name || "",
        totalAmount: zoho?.total || data?.total || "",
        selectedVendor: null, // Will be set when vendors are loaded
        vendorGST: "",
        taxType: "TDS",
      }));

      // Update tax summary
      setTaxSummary((prev) => ({
        ...prev,
        igst: zoho?.igst || data?.igst || "",
        cgst: zoho?.cgst || data?.cgst || "",
        sgst: zoho?.sgst || data?.sgst || "",
        total: zoho?.total || data?.total || "",
      }));

      // Update tax and other items (COA mappings) from zoho_bill
      setTaxAndOtherItems((prev) => ({
        ...prev,
        cgstAccountId: zoho?.cgst_coa || null,
        sgstAccountId: zoho?.sgst_coa || null,
        igstAccountId: zoho?.igst_coa || null,
        vendorAccountId: zoho?.vendor_coa || null,
        cgstDebitCredit: zoho?.cgst_debit_or_credit || "debit",
        sgstDebitCredit: zoho?.sgst_debit_or_credit || "debit",
        igstDebitCredit: zoho?.igst_debit_or_credit || "debit",
        vendorDebitCredit: zoho?.vendor_debit_or_credit || "credit",
      }));

      // Update notes
      setNotes(zoho?.note || "");

      // Initialize consolidate status from zoho_bill
      const consolidateStatus = zoho?.consolidate || false;
      setIsConsolidated(consolidateStatus);

      // Initialize journal entry line items from zoho_bill.products or consolidate_prod based on consolidate status
      const sourceProducts =
        consolidateStatus && zoho?.consolidate_prod?.length > 0
          ? zoho.consolidate_prod
          : zoho?.products || [];

      if (sourceProducts.length > 0) {
        setJournalLineItems(
          sourceProducts.map((item, index) => ({
            id: item.id || index,
            item_id: item.id || null,
            zohoBill: item.zohoBill || null,
            item_details: item.item_details || "",
            vendor_id: item.vendor || null,
            chart_of_accounts: item.chart_of_accounts
              ? "Selected"
              : "No COA Selected",
            chart_of_accounts_id: item.chart_of_accounts || null,
            taxes: item.taxes || null,
            amount: item.amount || "",
            debit_or_credit: item.debit_or_credit || "debit",
            created_at: item.created_at || null,
          })),
        );
      } else if (data?.items && data.items.length > 0) {
        // Fallback to analysed_data items if no zoho products
        setJournalLineItems(
          data.items.map((item, index) => ({
            id: Date.now() + index,
            item_id: null,
            item_details: item.description || "",
            vendor_id: null,
            chart_of_accounts: "No COA Selected",
            chart_of_accounts_id: null,
            taxes: null,
            amount: item.price || "",
            debit_or_credit: "debit",
          })),
        );
      } else {
        // Initialize with empty journal entry line item if no items exist
        setJournalLineItems([
          {
            id: Date.now(),
            item_id: null,
            item_details: "",
            chart_of_accounts: "No COA Selected",
            chart_of_accounts_id: null,
            taxes: null,
            amount: "",
            debit_or_credit: "debit",
          },
        ]);
      }
    }
  }, [journalEntryData, analysedData, zohoJournalData]);

  // Match vendor from API response with vendor options when both are available
  // Only auto-match if user hasn't manually cleared the vendor
  useEffect(() => {
    if (
      vendorsData?.results &&
      vendorsData.results.length > 0 &&
      !journalEntryForm.selectedVendor &&
      !isVendorManuallyCleared
    ) {
      let matchedVendor = null;

      // First priority: Match by zoho_bill.vendor ID if it exists
      if (zohoJournalData?.vendor) {
        matchedVendor = vendorsData.results.find(
          (vendor) => vendor.id === zohoJournalData.vendor,
        );
      }

      // Fallback: Match by vendor name from analysed_data.from.name
      if (!matchedVendor && analysedData?.from?.name) {
        matchedVendor = vendorsData.results.find(
          (vendor) => vendor.companyName === analysedData.from.name,
        );
      }

      if (matchedVendor) {
        setJournalEntryForm((prev) => ({
          ...prev,
          selectedVendor: matchedVendor,
          vendorName: matchedVendor.companyName || prev.vendorName,
          vendorGST: matchedVendor.gstNo || "",
        }));
      }
    }
  }, [
    vendorsData,
    analysedData,
    zohoJournalData,
    journalEntryForm.selectedVendor,
    isVendorManuallyCleared,
  ]);

  // Handle verify journal entry (save function)
  const handleSave = async () => {
    if (!selectedOrganization?.id || !journalEntryId) {
      setErrorAlert({
        show: true,
        message: "Missing organization or journal entry information",
      });
      return;
    }

    // Prepare items for verification
    const validLineItems = journalLineItems.filter(
      (item) =>
        item.chart_of_accounts_id && item.amount && parseFloat(item.amount) > 0,
    );

    if (validLineItems.length === 0) {
      setErrorAlert({
        show: true,
        message:
          "Please ensure all journal entry items have chart of accounts and amounts",
      });
      return;
    }

    if (!journalEntryForm.selectedVendor) {
      setErrorAlert({ show: true, message: "Please select a vendor" });
      return;
    }

    setIsVerifying(true);
    setErrorAlert({ show: false, message: "" });

    try {
      const verificationPayload = {
        bill_id: journalEntryId,
        zoho_bill: {
          id: zohoJournalData?.id || null,
          selectBill: journalEntryId,
          vendor: journalEntryForm.selectedVendor?.id || null,
          bill_no: journalEntryForm.referenceNumber,
          bill_date: journalEntryForm.entryDate,
          due_date: journalEntryForm.dueDate,
          vendor_coa: taxAndOtherItems.vendorAccountId || null,
          vendor_debit_or_credit:
            taxAndOtherItems.vendorDebitCredit || "credit",
          vendor_amount: journalEntryForm.totalAmount || "0.00",
          total: journalEntryForm.totalAmount || "0",
          igst: taxSummary.igst || "0",
          igst_coa: taxAndOtherItems.igstAccountId || null,
          igst_debit_or_credit: taxAndOtherItems.igstDebitCredit || "debit",
          cgst: taxSummary.cgst || "0",
          cgst_coa: taxAndOtherItems.cgstAccountId || null,
          cgst_debit_or_credit: taxAndOtherItems.cgstDebitCredit || "debit",
          sgst: taxSummary.sgst || "0",
          sgst_coa: taxAndOtherItems.sgstAccountId || null,
          sgst_debit_or_credit: taxAndOtherItems.sgstDebitCredit || "debit",
          note:
            notes ||
            `Bill from analysis for ${
              journalEntryForm.selectedVendor?.companyName || "vendor"
            } entered via Billmunshi`,
          consolidate: isConsolidated,
          created_at: zohoJournalData?.created_at || new Date().toISOString(),
          // Send items to the appropriate key based on consolidate status
          ...(isConsolidated
            ? {
                consolidate_prod: validLineItems.map((item, index) => ({
                  id: item.id || item.item_id || null,
                  zohoBill: zohoJournalData?.id || null,
                  item_details: item.item_details || "",
                  chart_of_accounts: item.chart_of_accounts_id || null,
                  amount: item.amount,
                  debit_or_credit: item.debit_or_credit || "debit",
                  created_at: item.created_at || new Date().toISOString(),
                })),
              }
            : {
                products: validLineItems.map((item, index) => ({
                  id: item.id || item.item_id || null,
                  zohoBill: zohoJournalData?.id || null,
                  item_details: item.item_details || "",
                  chart_of_accounts: item.chart_of_accounts_id || null,
                  amount: item.amount,
                  debit_or_credit: item.debit_or_credit || "debit",
                  created_at: item.created_at || new Date().toISOString(),
                })),
              }),
        },
      };

      await verifyJournalEntry({
        organizationId: selectedOrganization?.id,
        bill_id: journalEntryId,
        ...verificationPayload,
      });

      globalToast.success("Journal entry verified successfully!");

      // Redirect to journal entries list after successful verification
      // setTimeout(() => {
      //     navigate('/zoho/journal-entry');
      // }, 1500); // Small delay to show success message
    } catch (error) {
      console.error("Verification failed:", error);

      // Handle different types of error responses
      let errorMessage = "Verification failed";

      if (error?.response?.data) {
        // Check if it's a debit/credit balance error
        if (
          error.response.data.detail &&
          error.response.data.debit_total !== undefined &&
          error.response.data.credit_total !== undefined
        ) {
          errorMessage = error.response.data.detail;

          // Add additional context for debit/credit errors
          if (error.response.data.difference !== undefined) {
            errorMessage += `\n\nBalance Details:\n• Debit Total: ₹${parseFloat(
              error.response.data.debit_total,
            ).toLocaleString()}\n• Credit Total: ₹${parseFloat(
              error.response.data.credit_total,
            ).toLocaleString()}\n• Difference: ₹${parseFloat(
              error.response.data.difference,
            ).toLocaleString()}`;
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setErrorAlert({
        show: true,
        message: errorMessage,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Sync function
  const handleSync = async () => {
    try {
      setIsSyncing(true);

      await syncJournalEntry({
        organizationId: selectedOrganization?.id,
        billId: journalEntryId,
      });

      globalToast.success("Journal entry synced to Zoho successfully");
      refetch(); // Refresh the data to show updated status
    } catch (error) {
      console.error("Failed to sync journal entry:", error);
      globalToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to sync journal entry",
      );
    } finally {
      setIsSyncing(false);
    }
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
          Failed to load journal entry
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error?.data?.message ||
            error?.message ||
            "An error occurred while fetching journal entry details."}
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
          Please select a client to view journal entry details.
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
            title="Back to journal entries"
          >
            <Icon icon="heroicons:arrow-left" className="text-base" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              {journalInfo?.bill_munshi_name || journalInfo?.billmunshiName || "Journal entry"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {journalInfo?.status ? `Status: ${journalInfo.status}` : "Journal entry detail"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/zoho/journal-entry/${journalEntryData?.previous_bill}`)}
            disabled={!journalEntryData?.previous_bill}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={journalEntryData?.previous_bill ? "Go to previous bill" : "No previous bill"}
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
            onClick={() => navigate(`/zoho/journal-entry/${journalEntryData?.next_bill}`)}
            disabled={!journalEntryData?.next_bill}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={journalEntryData?.next_bill ? "Go to next entry" : "No next entry"}
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
                : isSynced
                  ? "Entry already synced"
                  : hasValidationErrors()
                    ? "Resolve validation issues before verifying"
                    : journalInfo?.status === "Verified"
                      ? "Re-verify"
                      : "Verify"
            }
          >
            <Icon icon={isVerifying ? "heroicons:arrow-path" : "heroicons:check-badge"} className={`text-base ${isVerifying ? "animate-spin" : ""}`} />
            {isVerifying ? "Verifying…" : journalInfo?.status === "Verified" ? "Re-verify" : "Verify"}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || isVerified || journalInfo?.status !== "Verified"}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
            title={
              isSyncing
                ? "Syncing…"
                : isVerified
                  ? "Entry already synced"
                  : journalInfo?.status !== "Verified"
                    ? "Entry must be verified before sync"
                    : "Sync with Zoho"
            }
          >
            <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-base ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync to Zoho"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6">
        {/* legacy-block-removed-start */}
        {false && (
          <div className="hidden">
            <button
              onClick={handleBackClick}
              title="Back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <button
              onClick={() =>
                navigate(`/zoho/journal-entry/${journalEntryData?.next_bill}`)
              }
              disabled={!journalEntryData?.next_bill}
              className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                journalEntryData?.next_bill
                  ? "Go to next entry"
                  : "No next entry available"
              }
            >
              Next
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={handleSave}
              disabled={isVerifying || isVerified || hasValidationErrors()}
              className={`group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isVerified
                  ? "bg-gray-400 hover:bg-gray-400"
                  : hasValidationErrors()
                    ? "bg-gray-400 hover:bg-gray-400"
                    : ""
              }`}
              title={
                isVerifying
                  ? "Verifying..."
                  : isSynced
                    ? "Entry already synced/posted - cannot verify again"
                    : hasValidationErrors()
                      ? "Please select vendor and chart of accounts for all items"
                      : journalInfo?.status === "Verified"
                        ? "Re-verify Entry (you can verify multiple times)"
                        : "Verify Entry"
              }
            >
              {isVerifying ? (
                <svg
                  className="w-4 h-4 animate-spin"
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
              ) : isVerified ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {isVerifying
                ? "Verifying..."
                : journalInfo?.status === "Verified"
                  ? "Re-verify"
                  : "Verify"}
            </button>
            {/* Sync Button - Always show but only enable when status is Verified */}
            <button
              onClick={handleSync}
              disabled={
                isSyncing || isVerified || journalInfo?.status !== "Verified"
              }
              className={`group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 active:scale-95 ${
                isSyncing || isVerified || journalInfo?.status !== "Verified"
                  ? "text-slate-400 dark:text-slate-500 bg-gray-25 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-75"
                  : "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:border-slate-700 hover:shadow-md focus:ring-slate-500"
              }`}
              title={
                isSyncing
                  ? "Syncing in progress..."
                  : isVerified
                    ? "Entry already synced/posted"
                    : journalInfo?.status !== "Verified"
                      ? "Entry must be verified before sync"
                      : "Sync with Zoho"
              }
            >
              {isSyncing ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              )}
              {isSyncing ? "Syncing..." : "Sync"}
            </button>
          </div>
        )}
        {/* legacy-block-removed-end */}
        {/* Bootstrap-style Error Alert */}
        {errorAlert.show && (
          <div
            className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg relative"
            role="alert"
          >
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
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
              <div className="flex-1">
                <strong className="font-medium">Verification Error:</strong>
                <div className="mt-1 text-sm">{errorAlert.message}</div>
              </div>
              <button
                onClick={() => setErrorAlert({ show: false, message: "" })}
                className="ml-4 text-red-500 hover:text-red-700 focus:outline-none"
                aria-label="Close alert"
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
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 relative">
          {/* Bill Photo/Image/PDF Section - Fixed/Sticky on Large Screens */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
              {journalInfo?.file ? (
                <div className="w-full h-full flex flex-col">
                  {/* Fixed Header - Always Visible */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 dark:border-slate-700 flex-shrink-0 z-10">
                    <h3 className="text-base font-medium text-slate-900 dark:text-white truncate mr-2">
                      {journalInfo.billmunshiName
                        ? `${journalInfo.billmunshiName}`
                        : "Document"}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Keyboard Shortcuts Info */}
                      {!isPDF(journalInfo.file) && (
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
                      {!isPDF(journalInfo.file) && (
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
                    {isPDF(journalInfo.file) ? (
                      // PDF Viewer
                      <iframe
                        src={journalInfo.file}
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
                          src={journalInfo.file}
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-visible">
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
                        {journalLineItems.length === 0 && (
                          <li>Add at least one journal line item</li>
                        )}
                        {getLineItemsWithoutCOA().length > 0 && (
                          <li>
                            Select chart of accounts for{" "}
                            {getLineItemsWithoutCOA().length} line item
                            {getLineItemsWithoutCOA().length > 1 ? "s" : ""}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Bill Form Fields */}
                <div className="space-y-3">
                  {/* First Row: Vendor and Bill Number */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Vendor Selection Field */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Vendor <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`${
                          isVendorRequired && !isVerified
                            ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                            : ""
                        }`}
                      >
                        <SearchableDropdown
                          options={vendorsData?.results || []}
                          value={journalEntryForm.selectedVendor?.id || null}
                          onChange={handleVendorSelect}
                          onClear={handleVendorClear}
                          placeholder="Search and select vendor..."
                          searchPlaceholder="Type to search vendors..."
                          optionLabelKey="companyName"
                          optionValueKey="id"
                          loading={vendorsLoading}
                          disabled={isVerified}
                          renderOption={(vendor) => (
                            <div className="flex flex-col py-1">
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {vendor.companyName}
                              </div>
                              {vendor.gstNo && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  GST: {vendor.gstNo}
                                </div>
                              )}
                            </div>
                          )}
                          className="mb-2"
                        />
                      </div>

                      {/* Organization Mismatch Warning */}
                      {journalEntryForm.selectedVendor &&
                        journalEntryForm.selectedVendor.organization_id !==
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
                        )}

                      {/* Vendor Not Found Warning */}
                      {analysedData?.from?.name &&
                        !journalEntryForm.selectedVendor && (
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

                    {/* Bill Number Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Bill Number
                      </label>
                      <input
                        type="text"
                        name="referenceNumber"
                        value={journalEntryForm.referenceNumber}
                        onChange={(e) =>
                          handleFormChange("referenceNumber", e.target.value)
                        }
                        placeholder="Enter bill number"
                        disabled={isVerified}
                        className={`w-full px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                          isVerified
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Second Row: GST, Bill Date, Due Date in 4 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* GST Number Field */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        GST Number
                        {/* {journalEntryForm.selectedVendor && (
                                                    <span className="ml-1 text-xs text-green-600">(Auto-filled)</span>
                                                )} */}
                      </label>
                      <input
                        type="text"
                        name="vendorGST"
                        value={journalEntryForm.vendorGST}
                        onChange={(e) =>
                          handleFormChange("vendorGST", e.target.value)
                        }
                        placeholder="Enter GST number"
                        disabled={isVerified}
                        className={`w-full px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                        readOnly={
                          journalEntryForm.selectedVendor &&
                          journalEntryForm.selectedVendor.gstNo
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
                        name="entryDate"
                        value={journalEntryForm.entryDate}
                        onChange={(e) =>
                          handleDateChange("entryDate", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        placeholder="DD-MM-YYYY"
                        disabled={isVerified}
                        className={`w-full px-2.5 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                          dateErrors.entryDate
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : isVerified
                              ? "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                              : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                      />
                      {dateErrors.entryDate && (
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
                          {dateErrors.entryDate}
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
                        value={journalEntryForm.dueDate}
                        onChange={(e) =>
                          handleDateChange("dueDate", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        placeholder="DD-MM-YYYY"
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

              {/* Journal Entry Items Section */}
              <div className="relative p-5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                        <Icon icon="heroicons:document-text" className="text-sm" />
                      </span>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                        Journal Entry Items
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
                        onClick={addJournalLineItem}
                        disabled={isVerified}
                        className={`inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 ${
                          isVerified
                            ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400"
                            : ""
                        }`}
                        title="Add"
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

                  {/* Enhanced Journal Entry Items Table - Scrollable */}
                  <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto min-h-[350px]">
                      <table className="w-full min-w-[1000px]">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[300px]">
                              Item Details
                            </th>
                            <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[200px]">
                              Chart of Accounts{" "}
                              <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[120px]">
                              Amount
                            </th>
                            <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[100px]">
                              Type
                            </th>
                            <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[80px]">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {journalLineItems.map((item, index) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50 dark:bg-slate-900/60 transition-colors duration-150"
                            >
                              {/* Item Details */}
                              <td className="px-3 py-2">
                                <textarea
                                  value={item.item_details}
                                  onChange={(e) => {
                                    const newItems = [...journalLineItems];
                                    newItems[index] = {
                                      ...item,
                                      item_details: e.target.value,
                                    };
                                    setJournalLineItems(newItems);
                                  }}
                                  placeholder="Enter item details..."
                                  disabled={isVerified}
                                  className={`w-full px-2.5 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 resize-none ${
                                    isVerified
                                      ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                      : ""
                                  }`}
                                  rows={3}
                                />
                              </td>

                              <td className="px-3 py-2">
                                <div
                                  className={`${
                                    !item.chart_of_accounts_id && !isVerified
                                      ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                      : ""
                                  }`}
                                >
                                  <SearchableDropdown
                                    options={chartOfAccountsData?.results || []}
                                    value={item.chart_of_accounts_id || null}
                                    onChange={(accountId) => {
                                      const newItems = [...journalLineItems];
                                      newItems[index] = {
                                        ...item,
                                        chart_of_accounts_id: accountId,
                                      };
                                      setJournalLineItems(newItems);
                                    }}
                                    onClear={() => {
                                      const newItems = [...journalLineItems];
                                      newItems[index] = {
                                        ...item,
                                        chart_of_accounts_id: null,
                                      };
                                      setJournalLineItems(newItems);
                                    }}
                                    placeholder="Select chart of accounts..."
                                    searchPlaceholder="Type to search accounts..."
                                    optionLabelKey="accountName"
                                    optionValueKey="id"
                                    loading={chartOfAccountsLoading}
                                    disabled={isVerified}
                                    renderOption={(account) => (
                                      <div className="flex flex-col py-1">
                                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                                          {account.accountName}
                                        </div>
                                      </div>
                                    )}
                                    className="coa-dropdown"
                                  />
                                </div>
                              </td>

                              {/* Amount */}
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) => {
                                    const newItems = [...journalLineItems];
                                    newItems[index] = {
                                      ...item,
                                      amount: e.target.value,
                                    };
                                    setJournalLineItems(newItems);
                                  }}
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

                              {/* Debit/Credit Type */}
                              <td className="px-3 py-2">
                                <select
                                  value={item.debit_or_credit}
                                  onChange={(e) => {
                                    const newItems = [...journalLineItems];
                                    newItems[index] = {
                                      ...item,
                                      debit_or_credit: e.target.value,
                                    };
                                    setJournalLineItems(newItems);
                                  }}
                                  disabled={isVerified}
                                  className={`w-full px-3 py-2 text-sm text-center bg-white border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 hover:border-slate-300 ${
                                    isVerified
                                      ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                      : ""
                                  }`}
                                >
                                  <option value="debit">Debit</option>
                                  <option value="credit">Credit</option>
                                </select>
                              </td>

                              {/* Actions */}
                              <td className="px-3 py-2 text-center">
                                {journalLineItems.length > 1 && (
                                  <button
                                    onClick={() => removeJournalLineItem(index)}
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

                    {/* Journal Entry Items Summary */}
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Items: {journalLineItems.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax and Other Items Section */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:calculator" className="text-sm" />
                  </span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Tax and Other Items
                  </h3>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div className="space-y-3">
                    {/* CGST Row */}
                    <div className="grid grid-cols-12 gap-3 items-center py-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="col-span-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          CGST:
                        </span>
                      </div>
                      <div className="col-span-5">
                        <SearchableDropdown
                          options={chartOfAccountsData?.results || []}
                          value={taxAndOtherItems.cgstAccountId || null}
                          onChange={handleCgstAccountSelect}
                          onClear={handleCgstAccountClear}
                          placeholder="Select chart of accounts..."
                          searchPlaceholder="Type to search accounts..."
                          optionLabelKey="accountName"
                          optionValueKey="id"
                          loading={chartOfAccountsLoading}
                          disabled={isVerified}
                          renderOption={(account) => (
                            <div className="flex flex-col py-1">
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {account.accountName}
                              </div>
                            </div>
                          )}
                          className="text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={taxAndOtherItems.cgstDebitCredit || "debit"}
                          onChange={(e) =>
                            handleTaxAndOtherItemsChange(
                              "cgstDebitCredit",
                              e.target.value,
                            )
                          }
                          disabled={isVerified}
                          className={`w-full px-2 py-1 text-sm text-center bg-white border border-slate-200 dark:border-slate-700 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                            isVerified
                              ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                              : ""
                          }`}
                        >
                          <option value="debit">Debit</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="cgst"
                            value={taxSummary.cgst}
                            onChange={(e) =>
                              handleTaxSummaryChange("cgst", e.target.value)
                            }
                            placeholder="0.00"
                            disabled={isVerified}
                            className={`w-full px-2 py-1 text-right border border-slate-200 dark:border-slate-700 rounded-md bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              isVerified
                                ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                                : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SGST Row */}
                    <div className="grid grid-cols-12 gap-3 items-center py-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="col-span-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          SGST:
                        </span>
                      </div>
                      <div className="col-span-5">
                        <SearchableDropdown
                          options={chartOfAccountsData?.results || []}
                          value={taxAndOtherItems.sgstAccountId || null}
                          onChange={handleSgstAccountSelect}
                          onClear={handleSgstAccountClear}
                          placeholder="Select chart of accounts..."
                          searchPlaceholder="Type to search accounts..."
                          optionLabelKey="accountName"
                          optionValueKey="id"
                          loading={chartOfAccountsLoading}
                          disabled={isVerified}
                          renderOption={(account) => (
                            <div className="flex flex-col py-1">
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {account.accountName}
                              </div>
                            </div>
                          )}
                          className="text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={taxAndOtherItems.sgstDebitCredit || "debit"}
                          onChange={(e) =>
                            handleTaxAndOtherItemsChange(
                              "sgstDebitCredit",
                              e.target.value,
                            )
                          }
                          disabled={isVerified}
                          className={`w-full px-2 py-1 text-sm text-center bg-white border border-slate-200 dark:border-slate-700 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                            isVerified
                              ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                              : ""
                          }`}
                        >
                          <option value="debit">Debit</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="sgst"
                            value={taxSummary.sgst}
                            onChange={(e) =>
                              handleTaxSummaryChange("sgst", e.target.value)
                            }
                            placeholder="0.00"
                            disabled={isVerified}
                            className={`w-full px-2 py-1 text-right border border-slate-200 dark:border-slate-700 rounded-md bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              isVerified
                                ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                                : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* IGST Row */}
                    <div className="grid grid-cols-12 gap-3 items-center py-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="col-span-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          IGST:
                        </span>
                      </div>
                      <div className="col-span-5">
                        <SearchableDropdown
                          options={chartOfAccountsData?.results || []}
                          value={taxAndOtherItems.igstAccountId || null}
                          onChange={handleIgstAccountSelect}
                          onClear={handleIgstAccountClear}
                          placeholder="Select chart of accounts..."
                          searchPlaceholder="Type to search accounts..."
                          optionLabelKey="accountName"
                          optionValueKey="id"
                          loading={chartOfAccountsLoading}
                          disabled={isVerified}
                          renderOption={(account) => (
                            <div className="flex flex-col py-1">
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {account.accountName}
                              </div>
                            </div>
                          )}
                          className="text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={taxAndOtherItems.igstDebitCredit || "debit"}
                          onChange={(e) =>
                            handleTaxAndOtherItemsChange(
                              "igstDebitCredit",
                              e.target.value,
                            )
                          }
                          disabled={isVerified}
                          className={`w-full px-2 py-1 text-sm text-center bg-white border border-slate-200 dark:border-slate-700 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                            isVerified
                              ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                              : ""
                          }`}
                        >
                          <option value="debit">Debit</option>
                          <option value="credit">Credit</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="igst"
                            value={taxSummary.igst}
                            onChange={(e) =>
                              handleTaxSummaryChange("igst", e.target.value)
                            }
                            placeholder="0.00"
                            disabled={isVerified}
                            className={`w-full px-2 py-1 text-right border border-slate-200 dark:border-slate-700 rounded-md bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                              isVerified
                                ? "opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                                : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vendor Summary Section */}
                    <div className="col-span-12 pt-2">
                      <div className="grid grid-cols-12 gap-3 items-center py-2">
                        <div className="col-span-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Payable to Vendor:
                          </span>
                        </div>
                        <div className="col-span-5">
                          <div className="space-y-2">
                            {/* Display Selected Vendor Name */}
                            {/* <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                                                            {journalEntryForm.selectedVendor ? (
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                    </svg>
                                                                    <div className="font-medium text-blue-900">{journalEntryForm.selectedVendor.companyName}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-500 dark:text-slate-400 italic">No vendor selected</span>
                                                            )}
                                                        </div> */}

                            {/* Chart of Accounts Dropdown */}
                            <SearchableDropdown
                              options={chartOfAccountsData?.results || []}
                              value={taxAndOtherItems.vendorAccountId || null}
                              onChange={handleVendorAccountSelect}
                              onClear={handleVendorAccountClear}
                              placeholder="Select chart of accounts..."
                              searchPlaceholder="Type to search accounts..."
                              optionLabelKey="accountName"
                              optionValueKey="id"
                              loading={chartOfAccountsLoading}
                              disabled={isVerified}
                              renderOption={(account) => (
                                <div className="flex flex-col py-1">
                                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                                    {account.accountName}
                                  </div>
                                </div>
                              )}
                              className="text-xs"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <select
                            value={
                              taxAndOtherItems.vendorDebitCredit || "credit"
                            }
                            onChange={(e) =>
                              handleTaxAndOtherItemsChange(
                                "vendorDebitCredit",
                                e.target.value,
                              )
                            }
                            disabled={isVerified}
                            className={`w-full px-2 py-1 text-sm text-center bg-white border border-slate-200 dark:border-slate-700 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                              isVerified
                                ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60"
                                : ""
                            }`}
                          >
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <div className="flex items-center">
                            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">
                              ₹
                            </span>
                            <div className="w-full px-2 py-1 text-right border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900/60 text-sm font-medium">
                              {journalEntryForm.totalAmount
                                ? parseFloat(
                                    journalEntryForm.totalAmount,
                                  ).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })
                                : "0.00"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                      `Journal Entry from ${
                        journalEntryForm.selectedVendor?.companyName ||
                        analysedData?.from?.name ||
                        zohoJournalData?.vendor_name ||
                        "Vendor"
                      } entered via BillMunshi ${
                        window.location.origin
                      }/zoho/journal-entry/${journalEntryId}\n\n`
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
      {isFullscreen && journalInfo?.file && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={(e) => {
            // Close fullscreen when clicking on the background overlay
            if (e.target === e.currentTarget) {
              setIsFullscreen(false);
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
                  Journal Entry Document -{" "}
                  {journalInfo.billmunshiName ||
                    analysedData.invoiceNumber ||
                    "Unknown"}
                </h3>
                {!isPDF(journalInfo.file) && (
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
                onClick={() => setIsFullscreen(false)}
                className="p-3 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
                title="Close Fullscreen (click outside to close)"
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
              {isPDF(journalInfo.file) ? (
                <iframe
                  src={journalInfo.file}
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
                    src={journalInfo.file}
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

export default ZohoJournalEntryDetail;
