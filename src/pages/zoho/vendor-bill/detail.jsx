import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import Switch from "@/components/ui/Switch";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import {
  useGetVendorBill,
  useVerifyVendorBill,
  useSyncVendorBill,
} from "@/services/zoho/zohoVendorBillService";
import {
  useGetVendors,
  useGetAllChartOfAccounts,
  useGetAllTaxes,
  useGetAllTdsTcs,
} from "@/services/zoho/zohoApiService";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";

const ZohoVendorBillDetail = () => {
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [collapsed, setMenuCollapsed] = useSidebar();
  const navigate = useNavigate();
  const { id: billId } = useParams(); // Fix: The route param is 'id', not 'billId'
  const { selectedOrganization } = useSelector((state) => state.auth);

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

  // State for managing products from zoho_bill
  const [products, setProducts] = useState([]);

  // State for consolidate toggle
  const [isConsolidated, setIsConsolidated] = useState(false);

  // State for TDS/TCS selection
  const [selectedTdsTcs, setSelectedTdsTcs] = useState(null);

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

  // State for verification
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', or null
  const [verificationMessage, setVerificationMessage] = useState("");

  // State for sync operation
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch vendor bill data
  const {
    data: vendorBillData,
    error,
    isLoading,
    refetch,
  } = useGetVendorBill({ organizationId: selectedOrganization?.id, billId });

  // Verify vendor bill mutation
  const {
    mutateAsync: verifyVendorBill,
    isPending: isVerifying,
    error: verifyError,
    isSuccess: verifySuccess,
  } = useVerifyVendorBill();

  // Sync vendor bill mutation
  const { mutateAsync: syncVendorBill } = useSyncVendorBill();

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
      tax_type: vendorForm.is_tax,
    },
    {
      enabled: !!selectedOrganization?.id && !!vendorForm.is_tax,
    },
  );

  // Extract analysed_data from the API response
  const analysedData = vendorBillData?.analysed_data || {};
  const zohoData = vendorBillData?.zoho_bill || {};

  // Check if bill is synced or posted (disable inputs only for synced/posted, not verified)
  const isSynced =
    vendorBillData?.status === "Synced" || vendorBillData?.status === "Posted";

  // Allow editing for verified bills (user can verify multiple times)
  const isVerified = isSynced; // Only truly locked after sync

  // Validation helper functions
  const isVendorRequired = !vendorForm.selectedVendor;
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
    isVendorRequired ||
    getProductsWithoutCOA().length > 0 ||
    getProductsWithoutTaxes().length > 0 ||
    products.length === 0 ||
    isDiscountAccountRequired();

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
    if (vendorBillData?.analysed_data) {
      const data = vendorBillData.analysed_data;
      const zoho = vendorBillData.zoho_bill;

      // Find the full vendor object if vendor ID exists in zoho data
      let selectedVendorObj = null;
      if (zoho?.vendor && vendorsData?.results) {
        selectedVendorObj = vendorsData.results.find(
          (v) => v.id === zoho.vendor,
        );
      }
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

        // If no valid format found, return empty string (don't default to today)
        return "";
      };

      setVendorForm({
        vendorName: selectedVendorObj?.companyName || data.from?.name || "",
        invoiceNumber: data.invoiceNumber || zoho?.bill_no || "",
        vendorGST: selectedVendorObj?.gstNo || "",
        dateIssued: parseDate(zoho?.bill_date),
        dueDate:
          parseDate(zoho?.due_date) ||
          parseDate(zoho?.bill_date) ||
          parseDate(data.dateIssued),
        selectedVendor: selectedVendorObj || zoho?.vendor || null,
        is_tax: zoho?.is_tax || "TDS", // Load from zoho_bill or default to TDS
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
            reverse_charge_tax_id: product.reverse_charge_tax_id || false,
            itc_eligibility: product.itc_eligibility || "eligible",
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
            reverse_charge_tax_id: false,
            itc_eligibility: "eligible",
            rate: "",
            quantity: "",
            amount: "",
          },
        ]);
      }

      // Initialize item quantities
      if (data.items && data.items.length > 0) {
        setItemQuantities(data.items.map((item) => item.quantity || 0));
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
  }, [vendorBillData, vendorsData]);

  // Handle form input changes
  const handleFormChange = (name, value) => {
    setVendorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle vendor selection
  const handleVendorSelect = (vendor) => {
    if (vendor === null) {
      // Clear vendor selection
      setVendorForm((prev) => ({
        ...prev,
        selectedVendor: null,
        vendorName: analysedData?.to?.name || "",
        vendorGST: "",
      }));
    } else {
      // Set selected vendor
      setVendorForm((prev) => ({
        ...prev,
        selectedVendor: vendor,
        vendorName: vendor.companyName || "",
        vendorGST: vendor.gstNo || "",
      }));
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
        reverse_charge_tax_id: false,
        itc_eligibility: "eligible",
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

    const zoho = vendorBillData?.zoho_bill;

    // When toggling to consolidated, use consolidate_prod if available
    if (newConsolidateStatus) {
      if (zoho?.consolidate_prod && zoho?.consolidate_prod?.length > 0) {
        setProducts(
          zoho.consolidate_prod.map((product) => ({
            id: product.id,
            item_details: product.item_details || product.item_name || "",
            chart_of_accounts: product.chart_of_accounts || null,
            taxes: product.taxes || null,
            reverse_charge_tax_id: product.reverse_charge_tax_id || false,
            itc_eligibility: product.itc_eligibility || "eligible",
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
            reverse_charge_tax_id: product.reverse_charge_tax_id || false,
            itc_eligibility: product.itc_eligibility || "eligible",
            rate: product.rate || "",
            quantity: product.quantity || "",
            amount: product.amount || "",
          })),
        );
      }
    }
  };

  // ITC Eligibility options
  const itcEligibilityOptions = [
    { value: "eligible", label: "Eligible" },
    { value: "ineligible_section17", label: "Ineligible Section 17" },
    { value: "ineligible_others", label: "Ineligible Others" },
  ];

  // Keyboard shortcuts for zoom and fullscreen
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!vendorBillData?.file || isPDF(vendorBillData.file)) {
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
  }, [vendorBillData?.file, isFullscreen, zoomLevel]);

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
    // Open sidebar if it's collapsed
    if (collapsed) {
      setMenuCollapsed(false);
    }
    // Navigate back to vendor bill list
    navigate("/zoho/vendor-bill");
  };

  // Handle verification
  const handleVerification = async () => {
    try {
      setVerificationStatus(null);
      setVerificationMessage("");

      // Basic validation
      if (!vendorForm.selectedVendor) {
        globalToast.error("Please select a vendor");
        setVerificationStatus("error");
        setVerificationMessage("Please select a vendor");
        return;
      }

      if (!vendorForm.invoiceNumber.trim()) {
        globalToast.error("Invoice number is required");
        setVerificationStatus("error");
        setVerificationMessage("Invoice number is required");
        return;
      }

      if (!vendorForm.dateIssued) {
        globalToast.error("Date issued is required");
        setVerificationStatus("error");
        setVerificationMessage("Date issued is required");
        return;
      }

      if (!billSummaryForm.total || parseFloat(billSummaryForm.total) <= 0) {
        globalToast.error("Valid total amount is required");
        setVerificationStatus("error");
        setVerificationMessage("Valid total amount is required");
        return;
      }

      // Check if at least one product exists with valid data
      const validProducts = products.filter(
        (p) => p.item_details.trim() && p.rate && p.quantity,
      );
      if (validProducts.length === 0) {
        globalToast.error(
          "At least one product with valid details, rate, and quantity is required",
        );
        setVerificationStatus("error");
        setVerificationMessage(
          "At least one product with valid details, rate, and quantity is required",
        );
        return;
      }

      // Check if all products have chart of accounts
      const productsWithoutCOA = validProducts.filter(
        (p) => !p.chart_of_accounts,
      );
      if (productsWithoutCOA.length > 0) {
        globalToast.error("Please select Chart of Accounts for all products");
        setVerificationStatus("error");
        setVerificationMessage(
          "Please select Chart of Accounts for all products",
        );
        return;
      }

      // Check if all products have taxes
      const productsWithoutTaxes = validProducts.filter((p) => !p.taxes);
      if (productsWithoutTaxes.length > 0) {
        globalToast.error("Please select Taxes for all products");
        setVerificationStatus("error");
        setVerificationMessage("Please select Taxes for all products");
        return;
      }

      // Check if discount account is required but not selected
      if (
        discountForm.discount &&
        parseFloat(discountForm.discount) > 0 &&
        !discountForm.discount_account
      ) {
        globalToast.error(
          "Please select Discount Account when discount is provided",
        );
        setVerificationStatus("error");
        setVerificationMessage(
          "Please select Discount Account when discount is provided",
        );
        return;
      }

      // Prepare the verification data based on the structure you provided
      const verificationData = {
        bill_id: billId,
        zoho_bill: {
          id: zohoData?.id || undefined,
          selectBill: billId,
          vendor: vendorForm.selectedVendor?.id || null,
          bill_no: vendorForm.invoiceNumber,
          bill_date: vendorForm.dateIssued,
          due_date: vendorForm.dueDate || null,
          total: billSummaryForm.total,
          igst: billSummaryForm.igst || "0",
          cgst: billSummaryForm.cgst || "0",
          sgst: billSummaryForm.sgst || "0",
          adjustment_amount: billSummaryForm.adjustment_amount || "0",
          adjustment_description: billSummaryForm.adjustment_description || "",
          tds_tcs_id: selectedTdsTcs,
          is_tax: vendorForm.is_tax,
          discount_type: discountForm.discount_type || null,
          discount: discountForm.discount || "0",
          discount_amount: discountForm.discount_amount || "0",
          discount_account: discountForm.discount_account || null,
          note: notes,
          consolidate: isConsolidated,
          // Send products to the appropriate key based on consolidate status
          ...(isConsolidated
            ? {
                consolidate_prod: validProducts.map((product) => ({
                  id: product.id, // Include product ID for proper backend updates
                  item_name: product.item_details.substring(0, 100),
                  item_details: product.item_details,
                  chart_of_accounts: product.chart_of_accounts,
                  taxes: product.taxes,
                  reverse_charge_tax_id: product.reverse_charge_tax_id,
                  itc_eligibility: product.itc_eligibility,
                  rate: product.rate,
                  quantity: product.quantity,
                  amount: product.amount,
                })),
              }
            : {
                products: validProducts.map((product) => ({
                  id: product.id, // Include product ID for proper backend updates
                  item_name: product.item_details.substring(0, 100),
                  item_details: product.item_details,
                  chart_of_accounts: product.chart_of_accounts,
                  taxes: product.taxes,
                  reverse_charge_tax_id: product.reverse_charge_tax_id,
                  itc_eligibility: product.itc_eligibility,
                  rate: product.rate,
                  quantity: product.quantity,
                  amount: product.amount,
                })),
              }),
        },
      };
      console.log("Verification Data:", verificationData);
      const result = await verifyVendorBill({
        organizationId: selectedOrganization?.id,
        billId,
        billData: verificationData,
      });

      // Show success toast
      globalToast.success("Vendor bill verified successfully!");

      // setVerificationStatus('success');
      // setVerificationMessage('Vendor bill verified successfully');

      // Redirect to vendor bill list after a short delay
      // setTimeout(() => {
      //     navigate('/zoho/vendor-bill');
      // }, 1500);
    } catch (error) {
      console.error("Verification failed:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Verification failed. Please try again.";

      // Show error toast
      globalToast.error(errorMessage);

      setVerificationStatus("error");
      setVerificationMessage(errorMessage);
    }
  };

  // Sync function
  const handleSync = async () => {
    try {
      setIsSyncing(true);

      await syncVendorBill({
        organizationId: selectedOrganization?.id,
        billId,
      });

      globalToast.success("Bill synced to Zoho successfully");
      refetch(); // Refresh the data to show updated status
    } catch (error) {
      console.error("Failed to sync vendor bill:", error);
      globalToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to sync vendor bill",
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
          Failed to load vendor bill
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          {error?.data?.message ||
            error?.message ||
            "An error occurred while fetching vendor bill details."}
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
          Please select a client to view vendor bill details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Verification Status Messages */}
      {verificationStatus === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-3"
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
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Verification Failed
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {verificationMessage ||
                  "There was an error verifying the vendor bill. Please check the form data and try again."}
              </p>
            </div>
            <button
              onClick={() => setVerificationStatus(null)}
              className="ml-auto text-red-600 hover:text-red-800"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBackClick}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Back to vendor bills"
          >
            <Icon icon="heroicons:arrow-left" className="text-base" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              {vendorBillData?.bill_munshi_name || vendorBillData?.billmunshiName || "Vendor bill"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {vendorBillData?.status ? `Status: ${vendorBillData.status}` : "Vendor bill detail"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate(`/zoho/vendor-bill/${vendorBillData?.previous_bill}`)}
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
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-base ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate(`/zoho/vendor-bill/${vendorBillData?.next_bill}`)}
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
            onClick={handleVerification}
            disabled={isVerifying || isSynced || hasValidationErrors()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            title={
              isVerifying
                ? "Verifying…"
                : isSynced
                  ? "Bill already synced"
                  : hasValidationErrors()
                    ? "Resolve validation issues before verifying"
                    : vendorBillData?.status === "Verified"
                      ? "Re-verify"
                      : "Verify"
            }
          >
            <Icon icon={isVerifying ? "heroicons:arrow-path" : "heroicons:check-badge"} className={`text-base ${isVerifying ? "animate-spin" : ""}`} />
            {isVerifying ? "Verifying…" : vendorBillData?.status === "Verified" ? "Re-verify" : "Verify"}
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing || isSynced || vendorBillData?.status !== "Verified"}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
            title={
              isSyncing
                ? "Syncing…"
                : isSynced
                  ? "Bill already synced"
                  : vendorBillData?.status !== "Verified"
                    ? "Bill must be verified before sync"
                    : "Sync with Zoho"
            }
          >
            <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-base ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync to Zoho"}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6">
        <div className="flex flex-col lg:flex-row gap-6 relative">
          {/* Bill Photo/Image/PDF Section - Fixed/Sticky on Large Screens */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
            <div className="bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
              {vendorBillData?.file ? (
                <div className="w-full h-full flex flex-col">
                  {/* Fixed Header - Always Visible */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 dark:border-slate-700 flex-shrink-0 z-10">
                    <h3 className="text-base font-medium text-slate-900 dark:text-white truncate mr-2">
                      {vendorBillData.billmunshiName
                        ? `${vendorBillData.billmunshiName}`
                        : "Document"}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Keyboard Shortcuts Info */}
                      {!isPDF(vendorBillData.file) && (
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
                      {!isPDF(vendorBillData.file) && (
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
                    {isPDF(vendorBillData.file) ? (
                      // PDF Viewer
                      <iframe
                        src={vendorBillData.file}
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
                          src={vendorBillData.file}
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
              {/* Vendor Information Section */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
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
                        {products.length === 0 && (
                          <li>Add at least one product</li>
                        )}
                        {getProductsWithoutCOA().length > 0 && (
                          <li>
                            Select chart of accounts for{" "}
                            {getProductsWithoutCOA().length} product
                            {getProductsWithoutCOA().length > 1 ? "s" : ""}
                          </li>
                        )}
                        {getProductsWithoutTaxes().length > 0 && (
                          <li>
                            Select taxes for{" "}
                            {getProductsWithoutTaxes().length} product
                            {getProductsWithoutTaxes().length > 1 ? "s" : ""}
                          </li>
                        )}
                        {isDiscountAccountRequired() && (
                          <li>
                            Select discount account (required when discount
                            value is provided)
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Simple Form Fields */}
                <div className="space-y-3">
                  {/* First Row: Vendor and Invoice Number */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Vendor Selection Field */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Vendor <span className="text-rose-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <div
                          className={`${
                            isVendorRequired && !isVerified
                              ? "ring-2 ring-rose-300 dark:ring-rose-800 rounded-md"
                              : ""
                          }`}
                        >
                          <SearchableDropdown
                            options={
                              vendorsData?.results?.map((vendor) => ({
                                value: vendor.id,
                                label: vendor.companyName,
                                gstNo: vendor.gstNo,
                              })) || []
                            }
                            value={
                              // If selectedVendor is an object, use its id
                              // If selectedVendor is a string (from zohoData), use it directly
                              typeof vendorForm.selectedVendor === "object" &&
                              vendorForm.selectedVendor !== null
                                ? vendorForm.selectedVendor.id
                                : vendorForm.selectedVendor || ""
                            }
                            onChange={(value) => {
                              if (value === null || value === "") {
                                // Clear vendor selection
                                handleVendorSelect(null);
                              } else {
                                const selectedVendor =
                                  vendorsData?.results?.find(
                                    (v) => v.id === value,
                                  );
                                if (selectedVendor) {
                                  handleVendorSelect(selectedVendor);
                                }
                              }
                            }}
                            onClear={() => {
                              // Explicitly clear vendor selection
                              handleVendorSelect(null);
                            }}
                            placeholder="Select a vendor..."
                            searchPlaceholder="Search vendors..."
                            loading={vendorsLoading}
                            loadingMessage="Loading vendors..."
                            disabled={isVerified}
                            noOptionsMessage="No vendors found"
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

                        {/* No vendors notification */}
                        {vendorsData?.results?.length === 0 &&
                          !vendorsLoading && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
                              No vendors found. Please sync vendors from Zoho
                              first.
                            </div>
                          )}

                        {/* Organization Mismatch Warning */}
                        {vendorForm.selectedVendor &&
                          typeof vendorForm.selectedVendor === "object" &&
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
                          )}

                        {/* Vendor Not Found Warning */}
                        {analysedData?.to?.name &&
                          !vendorForm.selectedVendor && (
                            <div className="mt-2">
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
                    </div>

                    {/* Invoice Number Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Invoice Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="invoiceNumber"
                        value={vendorForm.invoiceNumber}
                        onChange={(e) =>
                          handleFormChange("invoiceNumber", e.target.value)
                        }
                        placeholder="Enter invoice number"
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        disabled={isVerified}
                      />
                    </div>
                  </div>

                  {/* Second Row: GST, Date Issued, Due Date in 4 columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* GST Number Field */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        GST Number
                        {/* {zohoData?.vendor === null && vendorForm.selectedVendor && (
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
                        className={`w-full px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20`}
                        readOnly={
                          zohoData?.vendor === null && vendorForm.selectedVendor
                        }
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
                        value={vendorForm.dateIssued}
                        onChange={(e) =>
                          handleDateChange("dateIssued", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        className={`w-full px-2.5 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                          dateErrors.dateIssued
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                        disabled={isVerified}
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
                    </div>

                    {/* Due Date Field */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        name="dueDate"
                        value={vendorForm.dueDate || ""}
                        onChange={(e) =>
                          handleDateChange("dueDate", e.target.value)
                        }
                        min="1900-01-01"
                        max="2100-12-31"
                        className={`w-full px-2.5 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                          dateErrors.dueDate
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500"
                        }`}
                        disabled={isVerified}
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                        <Icon icon="heroicons:list-bullet" className="text-sm" />
                      </span>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                        Products Details
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
                      <table className="w-full min-w-[1200px]">
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
                            <th className="px-3 py-2 text-center text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[120px]">
                              Reverse Charge
                            </th>
                            <th className="px-3 py-2 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] border-b border-slate-200 dark:border-slate-800 min-w-[140px]">
                              ITC Eligibility
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
                                  className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 resize-none"
                                  rows={2}
                                  disabled={isVerified}
                                />
                              </td>

                              {/* Chart of Accounts - Only show if productSync is true */}
                              <td className="relative px-4 py-3">
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
                              <td className="relative px-4 py-3">
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

                              {/* Reverse Charge Tax */}
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={product.reverse_charge_tax_id}
                                  onChange={(e) =>
                                    handleProductChange(
                                      index,
                                      "reverse_charge_tax_id",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4 text-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded focus:ring-blue-500 focus:ring-2"
                                  disabled={isVerified}
                                />
                              </td>

                              {/* ITC Eligibility */}
                              <td className="relative px-4 py-3">
                                <SearchableDropdown
                                  options={itcEligibilityOptions}
                                  value={product.itc_eligibility}
                                  onChange={(value) =>
                                    handleProductChange(
                                      index,
                                      "itc_eligibility",
                                      value,
                                    )
                                  }
                                  onClear={() =>
                                    handleProductChange(
                                      index,
                                      "itc_eligibility",
                                      null,
                                    )
                                  }
                                  placeholder="Select ITC Eligibility..."
                                  searchPlaceholder="Search eligibility..."
                                  optionLabelKey="label"
                                  optionValueKey="value"
                                  disabled={isVerified}
                                />
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
                                  className="w-full px-3 py-2 text-sm text-right bg-white border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 hover:border-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                  className="w-full px-3 py-2 text-sm text-center bg-white border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 hover:border-slate-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                                    title="Remove Product"
                                    disabled={isVerified}
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

                    {/* Products Summary */}
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

              {/* Tax Deduction/Collection Section */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                      <span className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                        <Icon icon="heroicons:document-text" className="text-sm" />
                      </span>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                        Tax Deduction/Collection
                      </h3>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tax Type Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        Tax Type
                      </label>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="tax-not-applicable"
                            name="is_tax"
                            value="NOT_APPLICABLE"
                            checked={
                              vendorForm.is_tax === "NOT_APPLICABLE" ||
                              !vendorForm.is_tax
                            }
                            onChange={(e) =>
                              handleFormChange("is_tax", e.target.value)
                            }
                            className="w-4 h-4 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-slate-500 focus:ring-2 transition-colors"
                            disabled={isVerified}
                          />
                          <label
                            htmlFor="tax-not-applicable"
                            className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:text-white transition-colors"
                          >
                            <span className="font-semibold text-slate-600 dark:text-slate-400">
                              Not Applicable
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-1">
                              (No tax deduction/collection)
                            </span>
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="tax-tds"
                            name="is_tax"
                            value="TDS"
                            checked={vendorForm.is_tax === "TDS"}
                            onChange={(e) =>
                              handleFormChange("is_tax", e.target.value)
                            }
                            className="w-4 h-4 text-blue-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:ring-2 transition-colors"
                            disabled={isVerified}
                          />
                          <label
                            htmlFor="tax-tds"
                            className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:text-white transition-colors"
                          >
                            <span className="font-semibold text-blue-600">
                              TDS
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-1">
                              (Tax Deducted at Source)
                            </span>
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="tax-tcs"
                            name="is_tax"
                            value="TCS"
                            checked={vendorForm.is_tax === "TCS"}
                            onChange={(e) =>
                              handleFormChange("is_tax", e.target.value)
                            }
                            className="w-4 h-4 text-green-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-green-500 focus:ring-2 transition-colors"
                            disabled={isVerified}
                          />
                          <label
                            htmlFor="tax-tcs"
                            className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:text-white transition-colors"
                          >
                            <span className="font-semibold text-green-600">
                              TCS
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-1">
                              (Tax Collected at Source)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* TDS/TCS Selection Dropdown - Only show when TDS or TCS is selected */}
                    {vendorForm.is_tax &&
                      vendorForm.is_tax !== "NOT_APPLICABLE" && (
                        <div className="relative">
                          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                            Select {vendorForm.is_tax} Rate
                          </label>
                          <SearchableDropdown
                            options={
                              tdsTcsData?.results?.map((item) => ({
                                value: item.id,
                                label: `${item.taxName} - ${item.taxPercentage}%`,
                                taxName: item.taxName,
                                taxPercentage: item.taxPercentage,
                                taxType: item.taxType,
                              })) || []
                            }
                            value={selectedTdsTcs || ""}
                            onChange={(value) =>
                              setSelectedTdsTcs(value || null)
                            }
                            onClear={() => setSelectedTdsTcs(null)}
                            placeholder={`Select ${vendorForm.is_tax} rate...`}
                            searchPlaceholder={`Search ${vendorForm.is_tax} rates...`}
                            loading={tdsTcsLoading}
                            loadingMessage={`Loading ${vendorForm.is_tax} rates...`}
                            noOptionsMessage={`No ${vendorForm.is_tax} rates found`}
                            disabled={isVerified}
                            renderOption={(option) => (
                              <div>
                                <div className="font-medium">
                                  {option.taxName}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {option.taxPercentage}% - {option.taxType}
                                </div>
                              </div>
                            )}
                          />
                          {vendorForm.is_tax &&
                            tdsTcsData?.results?.length === 0 &&
                            !tdsTcsLoading && (
                              <p className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                No {vendorForm.is_tax} rates found. Please sync{" "}
                                {vendorForm.is_tax} data from Zoho first.
                              </p>
                            )}

                        </div>
                      )}
                  </div>

                  {/* Discount section */}
                  <div className="mt-5">
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
                            className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:text-white transition-colors"
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
                            className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:text-white transition-colors"
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
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                        disabled={isVerified}
                        min="0"
                        step={
                          discountForm.discount_type === "Percentage"
                            ? "0.01"
                            : "0.01"
                        }
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
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900/60 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-not-allowed"
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
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm resize-none"
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
                      `Bill from ${
                        vendorForm.selectedVendor?.companyName ||
                        analysedData?.from?.name ||
                        zohoData?.vendor_name ||
                        "Vendor"
                      } entered via BillMunshi ${
                        window.location.origin
                      }/zoho/vendor-bill/${billId}\n\n`
                    }
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-24 px-2.5 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
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

      {/* Fullscreen Modal */}
      {isFullscreen && vendorBillData?.file && (
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
                  {analysedData.invoiceNumber || zohoData.bill_no || "Unknown"}
                </h3>
                {!isPDF(vendorBillData.file) && (
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
              {isPDF(vendorBillData.file) ? (
                <iframe
                  src={vendorBillData.file}
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
                    src={vendorBillData.file}
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

export default ZohoVendorBillDetail;
