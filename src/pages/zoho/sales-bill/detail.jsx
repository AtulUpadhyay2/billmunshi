import React, { useState, useEffect } from "react";
import ActivityPanel from "@/components/bills/ActivityPanel";
import BillChecks from "@/components/bills/BillChecks";
import ApprovalPanel from "@/components/bills/ApprovalPanel";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import Switch from "@/components/ui/Switch";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import {
  useGetZohoSalesBill,
  useVerifyZohoSalesBill,
  useSyncZohoSalesBill,
} from "@/services/zoho/zohoSalesBillService";
import {
  useGetAllCustomers,
  useGetAllChartOfAccounts,
  useGetAllTaxes,
} from "@/services/zoho/zohoApiService";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";
import { CONTROL, CONTROL_NUM, CONTROL_READONLY, CONTROL_TEXTAREA, CONTROL_VALIDATED } from "@/constants/ui";

const ZohoSalesBillDetail = () => {
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [collapsed, setMenuCollapsed] = useSidebar();
  const navigate = useNavigate();
  const { id: billId } = useParams();
  const { selectedOrganization } = useSelector((state) => state.auth);

  // Form state for customer information. A sales invoice is the purchase
  // bill read from the other end: the organisation issued it, so the party
  // is the recipient (`to`) rather than the issuer.
  const [customerForm, setCustomerForm] = useState({
    customerName: "",
    invoiceNumber: "",
    customerGST: "",
    dateIssued: "",
    dueDate: "",
    placeOfSupply: "",
    selectedCustomer: null,
  });

  // State for managing products from zoho_bill
  const [products, setProducts] = useState([]);

  // State for consolidate toggle
  const [isConsolidated, setIsConsolidated] = useState(false);

  // State for Discount
  const [discountForm, setDiscountForm] = useState({
    discount_type: "", // No default - user must select
    discount: "",
    discount_amount: "",
    discount_account: null,
  });

  // Form state for bill summary
  const [billSummaryForm, setBillSummaryForm] = useState({
    subtotal: "",
    cgst: "",
    sgst: "",
    igst: "",
    adjustment_amount: "",
    adjustment_description: "",
    total: "",
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
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  // State for verification
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', or null
  const [verificationMessage, setVerificationMessage] = useState("");

  // State for sync operation
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch sales invoice data
  const {
    data: salesBillData,
    error,
    isLoading,
    // `isLoading` is `isPending && isFetching` in react-query v5, so it
    // is false once the bill has loaded once. `isFetching` is the flag
    // that stays true for a manual refetch — the Refresh spinner needs
    // that one, not `isLoading`.
    isFetching,
    refetch,
  } = useGetZohoSalesBill({ organizationId: selectedOrganization?.id, billId });

  // Verify sales invoice mutation
  const {
    mutateAsync: verifySalesBill,
    isPending: isVerifying,
    error: verifyError,
    isSuccess: verifySuccess,
  } = useVerifyZohoSalesBill();

  // Sync sales invoice mutation
  const { mutateAsync: syncSalesBill } = useSyncZohoSalesBill();

  // Fetch customers list for dropdown
  const { data: customersData, isLoading: customersLoading } =
    useGetAllCustomers(selectedOrganization?.id);

  // Fetch all chart of accounts for dropdown
  const { data: chartOfAccountsData, isLoading: chartOfAccountsLoading } =
    useGetAllChartOfAccounts(selectedOrganization?.id);

  // Fetch all taxes for dropdown
  const { data: taxesData, isLoading: taxesLoading } = useGetAllTaxes(
    selectedOrganization?.id,
  );

  // Extract analysed_data from the API response
  const analysedData = salesBillData?.analysed_data || {};
  const zohoData = salesBillData?.zoho_bill || {};

  // Check if bill is synced or posted (disable inputs only for synced/posted, not verified)
  const isSynced =
    salesBillData?.status === "Synced" || salesBillData?.status === "Posted";

  // Allow editing for verified bills (user can verify multiple times)
  const isVerified = isSynced; // Only truly locked after sync

  // Validation helper functions
  const isCustomerRequired = !customerForm.selectedCustomer;
  const getProductsWithoutCOA = () =>
    products.filter((product) => !product.chart_of_accounts);
  const getProductsWithoutTaxes = () =>
    products.filter((product) => !product.taxes);
  const isDiscountAccountRequired = () => {
    // If user has entered a discount value, discount account is required
    return (
      discountForm.discount &&
      parseFloat(discountForm.discount) > 0 &&
      !discountForm.discount_account
    );
  };
  const hasValidationErrors = () =>
    isCustomerRequired ||
    getProductsWithoutCOA().length > 0 ||
    getProductsWithoutTaxes().length > 0 ||
    products.length === 0 ||
    isDiscountAccountRequired();

  // The blocking list, spelled out. The banner and the Verify button's
  // tooltip both read it, so the two can never disagree.
  const getValidationErrorMessages = () => {
    const errors = [];
    if (isCustomerRequired) errors.push("Select a customer");
    if (products.length === 0) errors.push("Add at least one product");
    if (getProductsWithoutCOA().length > 0) {
      errors.push(
        `Select chart of accounts for ${getProductsWithoutCOA().length} product${getProductsWithoutCOA().length > 1 ? "s" : ""}`,
      );
    }
    if (getProductsWithoutTaxes().length > 0) {
      errors.push(
        `Select taxes for ${getProductsWithoutTaxes().length} product${getProductsWithoutTaxes().length > 1 ? "s" : ""}`,
      );
    }
    if (isDiscountAccountRequired()) {
      errors.push(
        "Select discount account (required when discount value is provided)",
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

  // Handle date input changes with validation
  const handleDateChange = (name, value) => {
    // Clear error for this field first
    setDateErrors((prev) => ({ ...prev, [name]: "" }));

    // For date inputs, validate before setting
    if (value && !validateDateInput(value)) {
      const [year] = value.split("-").map(Number);
      let errorMessage = "Invalid date";

      if (year < 1900 || year > 2100) {
        errorMessage = "Year must be between 1900 and 2100";
      }

      setDateErrors((prev) => ({ ...prev, [name]: errorMessage }));

      globalToast("error", errorMessage);
      return; // Don't update the state with invalid date
    }
    handleFormChange(name, value);
  };

  // Calculate total amount automatically
  const calculateTotal = (billSummaryOverride = null) => {
    const currentBillSummary = billSummaryOverride || billSummaryForm;

    // Calculate subtotal from all products
    const subtotal = products.reduce((sum, product) => {
      return sum + (parseFloat(product.amount) || 0);
    }, 0);

    // Get tax amounts
    const cgst = parseFloat(currentBillSummary.cgst) || 0;
    const sgst = parseFloat(currentBillSummary.sgst) || 0;
    const igst = parseFloat(currentBillSummary.igst) || 0;
    const adjustment = parseFloat(currentBillSummary.adjustment_amount) || 0;

    // Calculate total
    const total = subtotal + cgst + sgst + igst + adjustment;

    return {
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2),
    };
  };

  // Handle Bill Summary form changes
  const handleBillSummaryChange = (name, value) => {
    setBillSummaryForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Recalculate total when taxes or adjustment change
      if (["cgst", "sgst", "igst", "adjustment_amount"].includes(name)) {
        const calculated = calculateTotal(updated);
        updated.subtotal = calculated.subtotal;
        updated.total = calculated.total;
      }

      return updated;
    });
  };

  // Update form when data is loaded
  useEffect(() => {
    if (salesBillData?.analysed_data) {
      const data = salesBillData.analysed_data;
      const zoho = salesBillData.zoho_bill;

      // Find the full customer object if a customer ID exists in zoho data
      let selectedCustomerObj = null;
      if (zoho?.customer && customersData?.results) {
        selectedCustomerObj = customersData.results.find(
          (c) => c.id === zoho.customer,
        );
      }

      // Helper function to parse date - handles both DD-MM-YYYY and YYYY-MM-DD formats
      // Always returns YYYY-MM-DD format or empty string
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

      setCustomerForm({
        customerName: selectedCustomerObj?.companyName || data.to?.name || "",
        invoiceNumber: data.invoiceNumber || zoho?.bill_no || "",
        customerGST: selectedCustomerObj?.gstNo || "",
        dateIssued: parseDate(zoho?.bill_date),
        dueDate:
          parseDate(zoho?.due_date) ||
          parseDate(zoho?.bill_date) ||
          parseDate(data.dateIssued),
        // Zoho derives IGST vs CGST+SGST from place of supply; the
        // customer master carries it when the invoice does not.
        placeOfSupply:
          zoho?.place_of_supply || selectedCustomerObj?.place_of_supply || "",
        selectedCustomer: selectedCustomerObj || zoho?.customer || null,
      });

      // Initialize Bill Summary Form - use zoho_bill data first (updated values), then fallback to analysed_data
      setBillSummaryForm({
        subtotal:
          zoho?.subtotal ||
          (
            data.items?.reduce((sum, item) => sum + (item.price || 0), 0) || ""
          ).toString(),
        cgst: zoho?.cgst || data.cgst || "",
        sgst: zoho?.sgst || data.sgst || "",
        igst: zoho?.igst || data.igst || "",
        adjustment_amount: zoho?.adjustment_amount || "",
        adjustment_description: zoho?.adjustment_description || "",
        total: zoho?.total || data.total || "",
      });

      // Initialize notes from zoho_bill.note
      setNotes(zoho?.note || "");

      // Initialize discount form from zoho_bill
      setDiscountForm({
        discount_type: zoho?.discount_type || "",
        discount: zoho?.discount || "",
        discount_amount: zoho?.discount_amount || "",
        discount_account: zoho?.discount_account || null,
      });

      // Initialize consolidate status from zoho_bill
      const consolidateStatus = zoho?.consolidate || false;
      setIsConsolidated(consolidateStatus);

      // Initialize products from zoho_bill.products or consolidate_prod based on consolidate status
      const sourceProducts =
        consolidateStatus && zoho?.consolidate_prod?.length > 0
          ? zoho?.consolidate_prod
          : zoho?.products || [];

      if (sourceProducts.length > 0) {
        setProducts(
          sourceProducts.map((product) => ({
            id: product.id,
            item_details: product.item_details || product.item_name || "",
            chart_of_accounts: product.chart_of_accounts || null,
            taxes: product.taxes || null,
            rate: product.rate || "",
            quantity: product.quantity || "",
            amount: product.amount || "",
          })),
        );
      } else {
        // Initialize with empty product if no products exist
        setProducts([
          {
            id: Date.now(),
            item_details: "",
            chart_of_accounts: null,
            taxes: null,
            rate: "",
            quantity: "",
            amount: "",
          },
        ]);
      }

      // Calculate totals after data is loaded (use setTimeout to ensure state updates are complete)
      setTimeout(() => {
        const calculated = calculateTotal();
        setBillSummaryForm((prev) => ({
          ...prev,
          subtotal: calculated.subtotal,
          total: calculated.total,
        }));
      }, 0);
    }
  }, [salesBillData, customersData]);

  // Handle form input changes
  const handleFormChange = (name, value) => {
    setCustomerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    if (customer === null) {
      setCustomerForm((prev) => ({
        ...prev,
        selectedCustomer: null,
        customerName: analysedData?.to?.name || "",
        customerGST: "",
      }));
    } else {
      setCustomerForm((prev) => ({
        ...prev,
        selectedCustomer: customer,
        customerName: customer.companyName || "",
        customerGST: customer.gstNo || "",
        // Only adopt the master's place of supply when the invoice has
        // not already supplied one — the document wins where it speaks.
        placeOfSupply: prev.placeOfSupply || customer.place_of_supply || "",
      }));
    }
  };

  // Auto-calculate totals when products change (not when taxes change - that's handled in handleBillSummaryChange)
  useEffect(() => {
    if (products.length > 0) {
      const calculated = calculateTotal();
      setBillSummaryForm((prev) => ({
        ...prev,
        subtotal: calculated.subtotal,
        total: calculated.total,
      }));
    }
  }, [products]);

  // Handle Discount form changes
  const handleDiscountChange = (name, value) => {
    setDiscountForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Calculate discount_amount when discount or discount_type changes
      if (name === "discount" || name === "discount_type") {
        const discount = name === "discount" ? value : prev.discount;
        const discountType =
          name === "discount_type" ? value : prev.discount_type;
        const subtotal = parseFloat(billSummaryForm.subtotal) || 0;

        if (discount && subtotal > 0) {
          if (discountType === "INR") {
            updated.discount_amount = parseFloat(discount).toFixed(2);
          } else if (discountType === "Percentage") {
            const discountAmount = (subtotal * parseFloat(discount)) / 100;
            updated.discount_amount = discountAmount.toFixed(2);
          }
        } else {
          updated.discount_amount = "";
        }
      }

      return updated;
    });
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

  // Product manipulation functions
  const handleProductChange = (index, field, value) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calculate amount when rate or quantity changes
      if (field === "rate" || field === "quantity") {
        const rate =
          field === "rate"
            ? parseFloat(value) || 0
            : parseFloat(updated[index].rate) || 0;
        const quantity =
          field === "quantity"
            ? parseFloat(value) || 0
            : parseFloat(updated[index].quantity) || 0;
        updated[index].amount = (rate * quantity).toString();
      }

      return updated;
    });
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        item_details: "",
        chart_of_accounts: null,
        taxes: null,
        rate: "",
        quantity: "",
        amount: "",
      },
    ]);
  };

  const removeProduct = (index) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Handle consolidate toggle
  const handleConsolidateToggle = () => {
    const newConsolidateStatus = !isConsolidated;
    setIsConsolidated(newConsolidateStatus);

    const zoho = salesBillData?.zoho_bill;

    // When toggling to consolidated, use consolidate_prod if available
    if (newConsolidateStatus) {
      if (zoho?.consolidate_prod && zoho?.consolidate_prod?.length > 0) {
        setProducts(
          zoho.consolidate_prod.map((product) => ({
            id: product.id,
            item_details: product.item_details || product.item_name || "",
            chart_of_accounts: product.chart_of_accounts || null,
            taxes: product.taxes || null,
            rate: product.rate || "",
            quantity: product.quantity || "",
            amount: product.amount || "",
          })),
        );
      }
    } else {
      // When toggling to non-consolidated, use products if available
      if (zoho?.products && zoho?.products?.length > 0) {
        setProducts(
          zoho.products.map((product) => ({
            id: product.id,
            item_details: product.item_details || product.item_name || "",
            chart_of_accounts: product.chart_of_accounts || null,
            taxes: product.taxes || null,
            rate: product.rate || "",
            quantity: product.quantity || "",
            amount: product.amount || "",
          })),
        );
      }
    }
  };

  // Keyboard shortcuts for zoom and fullscreen
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!salesBillData?.file || isPDF(salesBillData.file)) {
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
  }, [salesBillData?.file, isFullscreen, zoomLevel]);

  // Auto-close sidebar when component mounts
  useEffect(() => {
    if (mobileMenu) {
      setMobileMenu(false);
    }
    // Always collapse sidebar when entering detail page for better viewing experience
    if (!collapsed) {
      setMenuCollapsed(true);
    }
  }, []); // Empty dependency array to run only on mount

  // Handle verification success/error
  useEffect(() => {
    if (verifySuccess) {
      setVerificationStatus("success");
    } else if (verifyError) {
      setVerificationStatus("error");
    }
  }, [verifySuccess, verifyError]);

  // Handle back button click
  const handleBackClick = () => {
    if (collapsed) {
      setMenuCollapsed(false);
    }
    navigate("/zoho/sales-bill");
  };

  // Handle verification
  const handleVerification = async () => {
    try {
      setVerificationStatus(null);
      setVerificationMessage("");

      const fail = (message) => {
        globalToast.error(message);
        setVerificationStatus("error");
        setVerificationMessage(message);
      };

      if (!customerForm.selectedCustomer) {
        return fail("Please select a customer");
      }

      if (!customerForm.invoiceNumber.trim()) {
        return fail("Invoice number is required");
      }

      if (!customerForm.dateIssued) {
        return fail("Date issued is required");
      }

      if (!billSummaryForm.total || parseFloat(billSummaryForm.total) <= 0) {
        return fail("Valid total amount is required");
      }

      // Check if at least one product exists with valid data
      const validProducts = products.filter(
        (p) => p.item_details.trim() && p.rate && p.quantity,
      );
      if (validProducts.length === 0) {
        return fail(
          "At least one product with valid details, rate, and quantity is required",
        );
      }

      if (validProducts.filter((p) => !p.chart_of_accounts).length > 0) {
        return fail("Please select Chart of Accounts for all products");
      }

      if (validProducts.filter((p) => !p.taxes).length > 0) {
        return fail("Please select Taxes for all products");
      }

      if (
        discountForm.discount &&
        parseFloat(discountForm.discount) > 0 &&
        !discountForm.discount_account
      ) {
        return fail("Please select Discount Account when discount is provided");
      }

      const lineItems = validProducts.map((product) => ({
        id: product.id, // Include product ID for proper backend updates
        item_name: product.item_details.substring(0, 100),
        item_details: product.item_details,
        chart_of_accounts: product.chart_of_accounts,
        taxes: product.taxes,
        rate: product.rate,
        quantity: product.quantity,
        amount: product.amount,
      }));

      const verificationData = {
        bill_id: billId,
        zoho_bill: {
          id: zohoData?.id || undefined,
          selectBill: billId,
          customer: customerForm.selectedCustomer?.id || null,
          bill_no: customerForm.invoiceNumber,
          bill_date: customerForm.dateIssued,
          due_date: customerForm.dueDate || null,
          place_of_supply: customerForm.placeOfSupply || null,
          total: billSummaryForm.total,
          igst: billSummaryForm.igst || "0",
          cgst: billSummaryForm.cgst || "0",
          sgst: billSummaryForm.sgst || "0",
          adjustment_amount: billSummaryForm.adjustment_amount || "0",
          adjustment_description: billSummaryForm.adjustment_description || "",
          discount_type: discountForm.discount_type || null,
          discount: discountForm.discount || "0",
          discount_amount: discountForm.discount_amount || "0",
          discount_account: discountForm.discount_account || null,
          note: notes,
          consolidate: isConsolidated,
          // Send products to the appropriate key based on consolidate status
          ...(isConsolidated
            ? { consolidate_prod: lineItems }
            : { products: lineItems }),
        },
      };

      await verifySalesBill({
        organizationId: selectedOrganization?.id,
        billId,
        billData: verificationData,
      });

      globalToast.success("Sales invoice verified successfully!");
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

  // Sync function
  const handleSync = async () => {
    try {
      setIsSyncing(true);

      await syncSalesBill({
        organizationId: selectedOrganization?.id,
        billId,
      });

      globalToast.success("Invoice synced to Zoho successfully");
      refetch(); // Refresh the data to show updated status
    } catch (error) {
      console.error("Failed to sync sales invoice:", error);
      globalToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to sync sales invoice",
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
          <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Failed to load sales invoice
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error?.data?.message ||
            error?.message ||
            "An error occurred while fetching sales invoice details."}
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
          Please select a client to view sales invoice details.
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
                  "There was an error verifying the sales invoice. Please check the form data and try again."}
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
            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Back to sales invoices"
          >
            <Icon icon="heroicons:arrow-left" className="text-sm" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {salesBillData?.bill_munshi_name || salesBillData?.billmunshiName || "Sales invoice"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {salesBillData?.status ? `Status: ${salesBillData.status}` : "Sales invoice detail"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/zoho/sales-bill/${salesBillData?.previous_bill}`)}
            disabled={!salesBillData?.previous_bill}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={salesBillData?.previous_bill ? "Go to previous bill" : "No previous bill"}
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
            onClick={() => navigate(`/zoho/sales-bill/${salesBillData?.next_bill}`)}
            disabled={!salesBillData?.next_bill}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={salesBillData?.next_bill ? "Go to next bill" : "No next bill"}
          >
            Next
            <Icon icon="heroicons:arrow-right" className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => setIsActivityOpen(true)}
            aria-label="Activity"
            className="inline-flex items-center justify-center h-8 w-8 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Who did what to this bill"
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
                  ? "Invoice already synced"
                  : hasValidationErrors()
                    ? getValidationErrorMessages().join(" · ")
                    : salesBillData?.status === "Verified"
                      ? "Re-verify"
                      : "Verify"
            }
          >
            <Icon icon={isVerifying ? "heroicons:arrow-path" : "heroicons:check-badge"} className={`text-sm ${isVerifying ? "animate-spin" : ""}`} />
            {isVerifying ? "Verifying…" : salesBillData?.status === "Verified" ? "Re-verify" : "Verify"}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || isSynced || salesBillData?.status !== "Verified"}
            className="group inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
            title={
              isSyncing
                ? "Syncing…"
                : isSynced
                  ? "Invoice already synced"
                  : salesBillData?.status !== "Verified"
                    ? "Invoice must be verified before sync"
                    : "Sync with Zoho"
            }
          >
            <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-sm ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync to Zoho"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 md:p-4">
        <div className="flex flex-col lg:flex-row gap-4 relative">
          {/* Bill Photo/Image/PDF Section - Fixed/Sticky on Large Screens */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[400px] lg:h-[calc(100vh-10.5rem)] flex flex-col">
              {salesBillData?.file ? (
                <div className="w-full h-full flex flex-col">
                  {/* Fixed Header - Always Visible */}
                  <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 dark:border-slate-700 flex-shrink-0 z-10">
                    <h3 className="text-base font-medium text-slate-900 dark:text-white truncate mr-2">
                      {salesBillData.billmunshiName
                        ? `${salesBillData.billmunshiName}`
                        : "Document"}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Zoom Controls - only for images */}
                      {!isPDF(salesBillData.file) && (
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

                      {/* Fullscreen Toggle */}
                      <button
                        onClick={toggleFullscreen}
                        className="p-1 rounded-md bg-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 transition-colors"
                        title="Toggle Fullscreen (Ctrl + F)"
                      >
                        <Icon icon="heroicons:arrows-pointing-out" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="flex-1 overflow-auto bg-white">
                    {isPDF(salesBillData.file) ? (
                      <iframe
                        src={salesBillData.file}
                        className="w-full h-full border-0"
                        title="Bill PDF Document"
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
                          src={salesBillData.file}
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
              {/* Customer Information Section */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                {/* What the Verify button is waiting on, and nothing
                    else — the advisory checks are deliberately not shown. */}
                {/* Approval. Renders nothing unless the workspace has
                    require_bill_approval on, so this is invisible by default. */}
                <div className="mb-3">
                  <ApprovalPanel
                    organizationId={selectedOrganization?.id}
                    billId={billId}
                  />
                </div>

                <BillChecks
                  blockers={getValidationErrorMessages()}
                  isVerified={isVerified}
                />

                <div className="space-y-3">
                  {/* First Row: Customer and Invoice Number */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Customer Selection Field */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Customer <span className="text-rose-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <div
                          className={`${
                            isCustomerRequired && !isVerified
                              ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                              : ""
                          }`}
                        >
                          <SearchableDropdown
                            options={
                              customersData?.results?.map((customer) => ({
                                value: customer.id,
                                label: customer.companyName,
                                gstNo: customer.gstNo,
                              })) || []
                            }
                            value={
                              typeof customerForm.selectedCustomer ===
                                "object" &&
                              customerForm.selectedCustomer !== null
                                ? customerForm.selectedCustomer.id
                                : customerForm.selectedCustomer || ""
                            }
                            onChange={(value) => {
                              if (value === null || value === "") {
                                handleCustomerSelect(null);
                              } else {
                                const selectedCustomer =
                                  customersData?.results?.find(
                                    (c) => c.id === value,
                                  );
                                if (selectedCustomer) {
                                  handleCustomerSelect(selectedCustomer);
                                }
                              }
                            }}
                            onClear={() => handleCustomerSelect(null)}
                            placeholder="Select a customer..."
                            searchPlaceholder="Search customers..."
                            loading={customersLoading}
                            loadingMessage="Loading customers..."
                            disabled={isVerified}
                            noOptionsMessage="No customers found"
                            renderOption={(option) => (
                              <div>
                                <div className="font-medium">
                                  {option.label}
                                </div>
                                {option.gstNo && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    GST: {option.gstNo}
                                  </div>
                                )}
                              </div>
                            )}
                          />
                        </div>

                        {/* No customers notification */}
                        {customersData?.results?.length === 0 &&
                          !customersLoading && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
                              No customers found. Please sync customers from
                              Zoho first.
                            </div>
                          )}

                        {/* Customer Not Found Warning */}
                        {analysedData?.to?.name &&
                          !customerForm.selectedCustomer && (
                            <div className="mt-2">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <Icon
                                  icon="heroicons:exclamation-triangle"
                                  className="w-3 h-3"
                                />
                                Customer not found in the list, please add new
                                customer
                              </div>
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Invoice Number Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="invoiceNumber"
                        value={customerForm.invoiceNumber}
                        onChange={(e) =>
                          handleFormChange("invoiceNumber", e.target.value)
                        }
                        placeholder="Enter invoice number"
                        className={CONTROL}
                        disabled={isVerified}
                      />
                    </div>
                  </div>

                  {/* Second Row: GST, Place of supply, Date Issued, Due Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* GST Number Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        GST Number
                      </label>
                      <input
                        type="text"
                        name="customerGST"
                        value={customerForm.customerGST}
                        onChange={(e) =>
                          handleFormChange("customerGST", e.target.value)
                        }
                        placeholder="Enter GST number"
                        className={CONTROL}
                        disabled={isVerified}
                      />
                    </div>

                    {/* Place of Supply Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Place of Supply
                      </label>
                      <input
                        type="text"
                        name="placeOfSupply"
                        value={customerForm.placeOfSupply}
                        onChange={(e) =>
                          handleFormChange(
                            "placeOfSupply",
                            e.target.value.toUpperCase(),
                          )
                        }
                        placeholder="e.g. KA"
                        maxLength={10}
                        className={CONTROL}
                        disabled={isVerified}
                      />
                    </div>

                    {/* Date Issued Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Date Issued <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dateIssued"
                        value={customerForm.dateIssued}
                        onChange={(e) =>
                          handleDateChange("dateIssued", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        className={`${CONTROL_VALIDATED} ${
                          dateErrors.dateIssued
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                        disabled={isVerified}
                      />
                      {dateErrors.dateIssued && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <Icon
                            icon="heroicons:exclamation-circle"
                            className="w-3.5 h-3.5"
                          />
                          {dateErrors.dateIssued}
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
                        value={customerForm.dueDate || ""}
                        onChange={(e) =>
                          handleDateChange("dueDate", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        className={`${CONTROL_VALIDATED} ${
                          dateErrors.dueDate
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                        disabled={isVerified}
                      />
                      {dateErrors.dueDate && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <Icon
                            icon="heroicons:exclamation-circle"
                            className="w-3.5 h-3.5"
                          />
                          {dateErrors.dueDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information Section */}
              <div className="relative p-5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                        <Icon icon="heroicons:list-bullet" className="text-sm" />
                      </span>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                        Line Items
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
                        onClick={addProduct}
                        className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200"
                        title="Add"
                        disabled={isVerified}
                      >
                        <Icon icon="heroicons:plus" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Line Items Table - Scrollable */}
                  <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto min-h-[350px]">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[200px]">
                              Item Details
                            </th>
                            <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[150px]">
                              Chart of Accounts{" "}
                              <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[120px]">
                              Taxes <span className="text-red-500">*</span>
                            </th>
                            <th className="px-3 py-2 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[100px]">
                              Rate
                            </th>
                            <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[80px]">
                              Quantity
                            </th>
                            <th className="px-3 py-2 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[100px]">
                              Amount
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
                                  className={CONTROL_TEXTAREA}
                                  rows={2}
                                  disabled={isVerified}
                                />
                              </td>

                              {/* Chart of Accounts */}
                              <td className="relative px-3 py-2">
                                <div
                                  className={`${
                                    !product.chart_of_accounts && !isVerified
                                      ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                      : ""
                                  }`}
                                >
                                  <SearchableDropdown
                                    options={
                                      chartOfAccountsData?.results?.map(
                                        (account) => ({
                                          value: account.id,
                                          label: account.accountName,
                                        }),
                                      ) || []
                                    }
                                    value={product.chart_of_accounts || ""}
                                    onChange={(value) =>
                                      handleProductChange(
                                        index,
                                        "chart_of_accounts",
                                        value || null,
                                      )
                                    }
                                    onClear={() =>
                                      handleProductChange(
                                        index,
                                        "chart_of_accounts",
                                        null,
                                      )
                                    }
                                    placeholder="Select Account..."
                                    searchPlaceholder="Search accounts..."
                                    loading={chartOfAccountsLoading}
                                    loadingMessage="Loading accounts..."
                                    noOptionsMessage="No accounts found"
                                    disabled={isVerified}
                                  />
                                </div>
                              </td>

                              {/* Taxes */}
                              <td className="relative px-3 py-2">
                                <div
                                  className={`${
                                    !product.taxes && !isVerified
                                      ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                                      : ""
                                  }`}
                                >
                                  <SearchableDropdown
                                    options={
                                      taxesData?.results?.map((tax) => ({
                                        value: tax.id,
                                        label: tax.taxName,
                                      })) || []
                                    }
                                    value={product.taxes || ""}
                                    onChange={(value) =>
                                      handleProductChange(
                                        index,
                                        "taxes",
                                        value || null,
                                      )
                                    }
                                    onClear={() =>
                                      handleProductChange(index, "taxes", null)
                                    }
                                    placeholder="Select Tax..."
                                    searchPlaceholder="Search taxes..."
                                    loading={taxesLoading}
                                    loadingMessage="Loading taxes..."
                                    noOptionsMessage="No taxes found"
                                    disabled={isVerified}
                                  />
                                </div>
                              </td>

                              {/* Rate */}
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  value={product.rate}
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "rate",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0.00"
                                  className={CONTROL_NUM}
                                  min="0"
                                  step="0.01"
                                  disabled={isVerified}
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
                                  className={`${CONTROL_NUM} text-center`}
                                  min="0"
                                  step="1"
                                  disabled={isVerified}
                                />
                              </td>

                              {/* Amount */}
                              <td className="px-3 py-2">
                                <div className="text-sm font-semibold text-slate-900 dark:text-white text-right">
                                  ₹
                                  {parseFloat(
                                    product.amount || 0,
                                  ).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-3 py-2 text-center">
                                {products.length > 1 && !isVerified && (
                                  <button
                                    onClick={() => removeProduct(index)}
                                    className="inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                                    title="Remove Item"
                                    disabled={isVerified}
                                  >
                                    <Icon
                                      icon="heroicons:trash"
                                      className="w-4 h-4"
                                    />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Line Items Summary */}
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Total Items: {products.length}
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

              {/* Discount Section */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:tag" className="text-sm" />
                  </span>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Discount
                  </h3>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Discount Type */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        Discount Type
                      </label>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="discount-inr"
                            name="discount_type"
                            value="INR"
                            checked={discountForm.discount_type === "INR"}
                            onChange={(e) =>
                              handleDiscountChange(
                                "discount_type",
                                e.target.value,
                              )
                            }
                            className="w-4 h-4 text-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:ring-2 transition-colors"
                            disabled={isVerified}
                          />
                          <label
                            htmlFor="discount-inr"
                            className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            <span className="font-semibold text-blue-600">
                              INR
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-1">
                              (Fixed Amount)
                            </span>
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="discount-percentage"
                            name="discount_type"
                            value="Percentage"
                            checked={
                              discountForm.discount_type === "Percentage"
                            }
                            onChange={(e) =>
                              handleDiscountChange(
                                "discount_type",
                                e.target.value,
                              )
                            }
                            className="w-4 h-4 text-green-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-green-500 focus:ring-2 transition-colors"
                            disabled={isVerified}
                          />
                          <label
                            htmlFor="discount-percentage"
                            className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                          >
                            <span className="font-semibold text-green-600">
                              Percentage
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-1">(%)</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Discount Value */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        Discount{" "}
                        {discountForm.discount_type === "Percentage"
                          ? "(%)"
                          : "(₹)"}
                      </label>
                      <input
                        type="number"
                        name="discount"
                        value={discountForm.discount}
                        onChange={(e) =>
                          handleDiscountChange("discount", e.target.value)
                        }
                        placeholder={
                          discountForm.discount_type === "Percentage"
                            ? "Enter percentage"
                            : "Enter amount"
                        }
                        className={CONTROL}
                        disabled={isVerified}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Discount Amount (Calculated) */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        Discount Amount (₹)
                      </label>
                      <input
                        type="text"
                        name="discount_amount"
                        value={discountForm.discount_amount}
                        readOnly
                        placeholder="0.00"
                        className={CONTROL_READONLY}
                        disabled
                      />
                    </div>

                    {/* Discount Account */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        Discount Account
                        {isDiscountAccountRequired() && !isVerified && (
                          <span className="text-red-500 text-xs ml-1">*</span>
                        )}
                      </label>
                      <div
                        className={`${
                          isDiscountAccountRequired() && !isVerified
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
                          value={discountForm.discount_account || ""}
                          onChange={(value) =>
                            handleDiscountChange(
                              "discount_account",
                              value || null,
                            )
                          }
                          onClear={() =>
                            handleDiscountChange("discount_account", null)
                          }
                          placeholder="Select discount account..."
                          searchPlaceholder="Search accounts..."
                          loading={chartOfAccountsLoading}
                          loadingMessage="Loading accounts..."
                          noOptionsMessage="No accounts found"
                          disabled={isVerified}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax and Other Items */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                      <Icon icon="heroicons:calculator" className="text-sm" />
                    </span>
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                      Tax and Other Items
                    </h3>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column - Tax Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          CGST:
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="cgst"
                            value={billSummaryForm.cgst}
                            onChange={(e) =>
                              handleBillSummaryChange("cgst", e.target.value)
                            }
                            placeholder="0"
                            className="w-32 px-2 py-1 text-right border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isVerified}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          SGST:
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="sgst"
                            value={billSummaryForm.sgst}
                            onChange={(e) =>
                              handleBillSummaryChange("sgst", e.target.value)
                            }
                            placeholder="0"
                            className="w-32 px-2 py-1 text-right border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isVerified}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          IGST:
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="igst"
                            value={billSummaryForm.igst}
                            onChange={(e) =>
                              handleBillSummaryChange("igst", e.target.value)
                            }
                            placeholder="0"
                            className="w-32 px-2 py-1 text-right border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isVerified}
                          />
                        </div>
                      </div>

                      {/* Adjustment Section in Left Column */}
                      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 pt-4">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Adjustment:
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1.5">₹</span>
                          <input
                            type="number"
                            name="adjustment_amount"
                            value={billSummaryForm.adjustment_amount}
                            onChange={(e) =>
                              handleBillSummaryChange(
                                "adjustment_amount",
                                e.target.value,
                              )
                            }
                            placeholder="0.00"
                            className="w-32 px-2 py-1 text-right border-0 border-b border-slate-200 dark:border-slate-700 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            disabled={isVerified}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Total and Adjustment Description */}
                    <div className="space-y-3">
                      <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 p-4 w-full">
                        <div className="text-center">
                          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 mb-1.5">
                            Total Amount <span className="text-rose-500">*</span>
                          </div>
                          <div className="flex items-center justify-center">
                            <span className="text-lg font-bold text-blue-700 dark:text-blue-400 mr-1">
                              ₹
                            </span>
                            <input
                              type="number"
                              name="total"
                              value={billSummaryForm.total}
                              onChange={(e) =>
                                handleBillSummaryChange("total", e.target.value)
                              }
                              placeholder="0.00"
                              className="w-32 px-2 py-1 text-center text-base font-bold font-mono text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-md bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              disabled={isVerified}
                            />
                          </div>
                          <div className="text-[10px] text-blue-700/80 dark:text-blue-400/80 mt-1">
                            Including all taxes
                          </div>
                        </div>
                      </div>

                      {/* Adjustment Description */}
                      <textarea
                        name="adjustment_description"
                        value={billSummaryForm.adjustment_description}
                        onChange={(e) =>
                          handleBillSummaryChange(
                            "adjustment_description",
                            e.target.value,
                          )
                        }
                        placeholder="Enter adjustment description..."
                        className={CONTROL_TEXTAREA}
                        rows={3}
                        disabled={isVerified}
                      />
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
                      `Invoice to ${
                        customerForm.selectedCustomer?.companyName ||
                        analysedData?.to?.name ||
                        "Customer"
                      } entered via BillMunshi ${
                        window.location.origin
                      }/zoho/sales-bill/${billId}\n\n`
                    }
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${CONTROL_TEXTAREA} h-24`}
                    placeholder="Add notes or comments..."
                    rows={4}
                    disabled={isVerified}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivityPanel
        open={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        organizationId={selectedOrganization?.id}
        billId={billId}
      />

      {/* Fullscreen Modal */}
      {isFullscreen && salesBillData?.file && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
          onClick={(e) => {
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
                  Invoice Document -{" "}
                  {analysedData.invoiceNumber || zohoData.bill_no || "Unknown"}
                </h3>
                {!isPDF(salesBillData.file) && (
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

            {/* Fullscreen Content - Scrollable */}
            <div
              className="flex-1 overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {isPDF(salesBillData.file) ? (
                <iframe
                  src={salesBillData.file}
                  className="w-full h-full border-0"
                  title="Invoice PDF Document - Fullscreen"
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
                    src={salesBillData.file}
                    alt="Invoice Document - Fullscreen"
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

export default ZohoSalesBillDetail;
