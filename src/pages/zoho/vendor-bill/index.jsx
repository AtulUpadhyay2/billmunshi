import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import {
  useGetVendorBills,
  useUpdateVendorBill,
  useDeleteVendorBill,
  useUploadVendorBills,
  useAnalyzeVendorBill,
  useSyncVendorBill,
  useMoveVendorBills,
} from "@/hooks/api/zoho/zohoVendorBillService";
import { globalToast } from "@/utils/toast";
import UploadBillModal from "@/components/modals/UploadBillModal";
import FileViewerModal from "@/components/modals/FileViewerModal";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

const ZohoVendorBill = () => {
  const navigate = useNavigate();
  const { selectedOrganization } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("all");
  const [isTabChanging, setIsTabChanging] = useState(false);

  // Build query parameters based on active tab
  const getQueryParams = () => {
    const params = { organizationId: selectedOrganization?.id };
    if (activeTab !== "all") {
      params.status = activeTab;
    }
    return params;
  };

  const {
    data: vendorBillsData,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetVendorBills(getQueryParams());

  // Fetch counts for all tabs
  const { data: allBillsData } = useGetVendorBills({
    organizationId: selectedOrganization?.id,
  });
  const { data: draftBillsData } = useGetVendorBills({
    organizationId: selectedOrganization?.id,
    status: "draft",
  });
  const { data: analysedBillsData } = useGetVendorBills({
    organizationId: selectedOrganization?.id,
    status: "analysed",
  });
  const { data: syncedBillsData } = useGetVendorBills({
    organizationId: selectedOrganization?.id,
    status: "synced",
  });
  const { mutateAsync: updateVendorBill } = useUpdateVendorBill();
  const { mutateAsync: deleteVendorBill } = useDeleteVendorBill();
  const { mutateAsync: uploadVendorBills } = useUploadVendorBills();
  const { mutateAsync: analyzeVendorBill } = useAnalyzeVendorBill();
  const { mutateAsync: syncVendorBill } = useSyncVendorBill();
  const { mutateAsync: moveVendorBills } = useMoveVendorBills();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isExternalBillModalOpen, setIsExternalBillModalOpen] = useState(false);
  const [selectedDuplicateBill, setSelectedDuplicateBill] = useState(null);
  const [selectedExternalBill, setSelectedExternalBill] = useState(null);
  const [selectedFile, setSelectedFile] = useState({ url: "", name: "" });
  const [analyzingBills, setAnalyzingBills] = useState(new Set());
  const [syncingBills, setSyncingBills] = useState(new Set());
  const [deletingBills, setDeletingBills] = useState(new Set());
  const [selectedBills, setSelectedBills] = useState(new Set());
  const [backgroundProcessingBills, setBackgroundProcessingBills] = useState(
    new Set(),
  );
  const [pollingInterval, setPollingInterval] = useState(null);

  const tabs = [
    { key: "all", label: "All" },
    { key: "draft", label: "Draft" },
    { key: "analysed", label: "Analysed" },
    { key: "synced", label: "Synced" },
  ];

  // Start polling when background processing is detected
  const startPolling = useCallback(() => {
    if (pollingInterval) return; // Already polling

    const interval = setInterval(() => {
      console.log("🔄 Polling for background processing updates...");
      refetch();
    }, 10000); // Poll every 10 seconds

    setPollingInterval(interval);
  }, [pollingInterval, refetch]);

  // Stop polling when no background processing
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      console.log("⏹️ Stopped polling for background processing");
    }
  }, [pollingInterval]);

  // Function to get count for each tab
  const getTabCount = (tabKey) => {
    switch (tabKey) {
      case "all":
        return allBillsData?.count || 0;
      case "draft":
        return draftBillsData?.count || 0;
      case "analysed":
        return analysedBillsData?.count || 0;
      case "synced":
        return syncedBillsData?.count || 0;
      default:
        return 0;
    }
  };

  const handleTabChange = (tabKey) => {
    setIsTabChanging(true);
    setActiveTab(tabKey);
    setSelectedBills(new Set()); // Clear selection when changing tabs
    // Reset the tab changing state after a short delay to ensure smooth transition
    setTimeout(() => setIsTabChanging(false), 300);
  };

  const handleSelectBill = (billId) => {
    setSelectedBills((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(billId)) {
        newSet.delete(billId);
      } else {
        newSet.add(billId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const selectableBills = vendorBills.filter(
      (bill) => bill.status === "Draft" || bill.status === "Analysed",
    );

    if (
      selectedBills.size === selectableBills.length &&
      selectableBills.length > 0
    ) {
      // Deselect all
      setSelectedBills(new Set());
    } else {
      // Select all selectable bills
      setSelectedBills(new Set(selectableBills.map((bill) => bill.id)));
    }
  };

  const handleMoveSelected = () => {
    if (selectedBills.size === 0) return;
    setIsMoveModalOpen(true);
  };

  const handleMoveToJournalEntry = async () => {
    try {
      await moveVendorBills({
        organizationId: selectedOrganization?.id,
        from: "vendor",
        to: "journal",
        bill_ids: Array.from(selectedBills),
      });
      globalToast.success(
        `${selectedBills.size} bill(s) moved to Journal Entry successfully`,
      );
      setIsMoveModalOpen(false);
      setSelectedBills(new Set());
      refetch();
    } catch (error) {
      console.error("Move to Journal Entry failed:", error);
      globalToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to move bills to Journal Entry",
      );
    }
  };

  const handleMoveToExpenseBill = async () => {
    try {
      await moveVendorBills({
        organizationId: selectedOrganization?.id,
        from: "vendor",
        to: "expense",
        bill_ids: Array.from(selectedBills),
      });
      globalToast.success(
        `${selectedBills.size} bill(s) moved to Expense Bill successfully`,
      );
      setIsMoveModalOpen(false);
      setSelectedBills(new Set());
      refetch();
    } catch (error) {
      console.error("Move to Expense Bill failed:", error);
      globalToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to move bills to Expense Bill",
      );
    }
  };

  const handleAction = async (billId, action) => {
    try {
      switch (action) {
        case "analyse":
          // Check if bill is currently in background processing
          if (backgroundProcessingBills.has(billId)) {
            globalToast.info(
              "This bill is currently being processed in the background. Please wait...",
            );
            return;
          }

          // Prevent multiple analysis requests
          if (analyzingBills.has(billId)) {
            globalToast.info("Analysis is already in progress for this bill.");
            return;
          }

          // Set loading state
          setAnalyzingBills((prev) => new Set([...prev, billId]));
          try {
            await analyzeVendorBill({
              organizationId: selectedOrganization?.id,
              billId,
            });
            globalToast.success(
              "Bill analysis started! Please wait while processing...",
            );
            refetch(); // Refresh the list to show updated status
          } finally {
            // Remove loading state
            setAnalyzingBills((prev) => {
              const newSet = new Set(prev);
              newSet.delete(billId);
              return newSet;
            });
          }
          break;
        case "verify":
          await updateVendorBill({
            organizationId: selectedOrganization?.id,
            id: billId,
            status: "Verified",
          });
          globalToast.success("Bill verification completed");
          break;
        case "sync":
          // Set loading state
          setSyncingBills((prev) => new Set([...prev, billId]));
          try {
            await syncVendorBill({
              organizationId: selectedOrganization?.id,
              billId,
            });
            globalToast.success("Bill synced to Zoho successfully");
            refetch(); // Refresh the list to show updated status
          } finally {
            // Remove loading state
            setSyncingBills((prev) => {
              const newSet = new Set(prev);
              newSet.delete(billId);
              return newSet;
            });
          }
          break;
        case "edit":
          // TODO: Implement edit functionality
          globalToast.info("Edit functionality coming soon");
          break;
        case "delete":
          const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
          });

          if (result.isConfirmed) {
            // Set loading state
            setDeletingBills((prev) => new Set([...prev, billId]));
            try {
              await deleteVendorBill({
                organizationId: selectedOrganization?.id,
                id: billId,
              });
              globalToast.success("Bill deleted successfully");
              Swal.fire("Deleted!", "Your bill has been deleted.", "success");
            } finally {
              // Remove loading state
              setDeletingBills((prev) => {
                const newSet = new Set(prev);
                newSet.delete(billId);
                return newSet;
              });
            }
          }
          break;
        default:
          globalToast.error("Unknown action");
      }
    } catch (error) {
      console.error("Action failed:", error);
      globalToast.error(
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${action} bill`,
      );
    }
  };

  const handleViewFile = (fileUrl, fileName) => {
    setSelectedFile({ url: fileUrl, name: fileName });
    setIsFileViewerOpen(true);
  };

  const handleViewDuplicates = (bill) => {
    setSelectedDuplicateBill(bill);
    setIsDuplicateModalOpen(true);
  };

  const handleViewExternalBill = (bill) => {
    setSelectedExternalBill(bill);
    setIsExternalBillModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Draft: "text-yellow-700 bg-yellow-100 border-yellow-200",
      Analysed: "text-blue-700 bg-blue-100 border-blue-200",
      Verified: "text-green-700 bg-green-100 border-green-200",
      Synced: "text-purple-700 bg-purple-100 border-purple-200",
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-full shadow-sm ${statusClasses[status] || statusClasses["Draft"]}`}
      >
        <svg className="w-2 h-2 fill-current" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
        {status}
      </span>
    );
  };

  const handleUpload = async (formData) => {
    try {
      const response = await uploadVendorBills({
        organizationId: selectedOrganization?.id,
        formData,
      });

      globalToast.success(
        "Bills uploaded successfully! Background processing started...",
      );
      refetch(); // Refresh the list
      setIsUploadModalOpen(false); // Close the modal after successful upload

      // Start polling immediately after upload since background processing will start
      setTimeout(() => {
        refetch(); // Refresh to get updated processing status
      }, 1000);
    } catch (error) {
      console.error("Upload failed:", error);
      globalToast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to upload bills",
      );
    }
  };

  const renderActionButtons = (bill) => {
    const { status } = bill;

    if (status === "Synced") {
      return (
        <div className="flex gap-2 flex-wrap items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">Posted</span>
          </div>
        </div>
      );
    }

    if (status === "Draft") {
      const isAnalyzing = analyzingBills.has(bill.id);
      const isBackgroundProcessing = backgroundProcessingBills.has(bill.id);
      
      return (
        <div className="flex gap-2 flex-wrap items-center">
          {isBackgroundProcessing ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
              <svg
                className="w-3.5 h-3.5 animate-spin"
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
              <span className="font-medium">Background Processing...</span>
            </div>
          ) : (
            <button
              onClick={() => handleAction(bill.id, "analyse")}
              disabled={isAnalyzing}
              className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 ${
                isAnalyzing
                  ? "text-purple-400 bg-purple-25 border-purple-100 cursor-not-allowed opacity-75"
                  : "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300 hover:shadow-md focus:ring-purple-500 active:scale-95"
              }`}
              title={isAnalyzing ? "Analysis in progress..." : "Analyse document"}
            >
              {isAnalyzing ? (
                <svg
                  className="w-3.5 h-3.5 animate-spin"
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
                  className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
              )}
              <span className="font-medium">
                {isAnalyzing ? "Analyzing..." : "Analyse"}
              </span>
            </button>
          )}
        </div>
      );
    }

    if (status === "Analysed") {
      return (
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => navigate(`/zoho/vendor-bill/${bill.id}`)}
            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md shadow-sm hover:bg-green-100 hover:border-green-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 active:scale-95"
            title="Verify vendor bill"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
              />
            </svg>
            <span className="font-medium">Verify</span>
          </button>
        </div>
      );
    }

    if (status === "Verified") {
      const isSyncing = syncingBills.has(bill.id);
      return (
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => handleAction(bill.id, "sync")}
            disabled={isSyncing}
            className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 ${
              isSyncing
                ? "text-gray-400 bg-gray-25 border-gray-100 cursor-not-allowed opacity-75"
                : "text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-md focus:ring-gray-500 active:scale-95"
            }`}
            title={isSyncing ? "Syncing in progress..." : "Sync with system"}
          >
            {isSyncing ? (
              <svg
                className="w-3.5 h-3.5 animate-spin"
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
                className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            )}
            <span className="font-medium">
              {isSyncing ? "Syncing..." : "Sync"}
            </span>
          </button>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-slate-400">No actions available</span>
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!selectedOrganization?.id) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-500">No organization selected</div>
        <div className="text-xs text-slate-400 mt-2">
          Please select an organization to view vendor bills
        </div>
      </div>
    );
  }

  const vendorBills = vendorBillsData?.results || [];

  // Check for background processing bills
  const checkBackgroundProcessing = useCallback(() => {
    const processingBills = new Set();
    vendorBills.forEach((bill) => {
      // Check for bills being processed (is_processing flag or draft status with file but no analysis)
      if (
        bill.is_processing ||
        (bill.status === "Draft" && bill.process === true)
      ) {
        processingBills.add(bill.id);
      }
    });
    return processingBills;
  }, [vendorBills]);

  // Effect to update background processing bills
  useEffect(() => {
    const processingBills = checkBackgroundProcessing();
    setBackgroundProcessingBills(processingBills);
  }, [checkBackgroundProcessing]);

  // Effect to manage polling based on background processing
  useEffect(() => {
    const hasBackgroundProcessing = backgroundProcessingBills.size > 0;

    if (hasBackgroundProcessing) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling(); // Cleanup on unmount
  }, [backgroundProcessingBills.size, startPolling, stopPolling]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return (
    <div className="space-y-5">
      <Card
        title={`Vendor Bills`}
        noBorder
        headerSlot={
          <div className="flex items-center gap-2">
            {selectedBills.size > 0 && (
              <button
                onClick={handleMoveSelected}
                className="group relative inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 active:scale-95"
                title="Move selected bills"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
                Move ({selectedBills.size})
              </button>
            )}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh vendor bills"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95"
              title="Upload vendor bills"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 10l-4-4m0 0-4 4m4-4v12"
                />
              </svg>
              Upload Bill
            </button>
          </div>
        }
      >
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const tabCount = getTabCount(tab.key);
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  disabled={isLoading || isFetching || isTabChanging}
                  className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-wait ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                  }`}
                >
                  <span className="font-medium">{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.key
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {tabCount}
                  </span>
                  {activeTab === tab.key &&
                    (isLoading || isFetching || isTabChanging) && (
                      <svg
                        className="w-3.5 h-3.5 animate-spin text-blue-600"
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
                    )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Background Processing Indicator */}
        {backgroundProcessingBills.size > 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="animate-pulse text-yellow-500 text-lg">
                  ⚡
                </span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Background Processing Active
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {backgroundProcessingBills.size} bill
                    {backgroundProcessingBills.size > 1 ? "s are" : " is"} being
                    processed in the background. The page will automatically
                    refresh every 10 seconds until processing is complete.
                  </p>
                </div>
              </div>
              <div className="ml-auto flex-shrink-0">
                <div className="flex items-center text-yellow-600">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden ">
              <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700!">
                <thead className="bg-slate-200 dark:bg-slate-700">
                  <tr>
                    <th scope="col" className="table-th w-12">
                      {vendorBills.some(
                        (bill) =>
                          bill.status === "Draft" || bill.status === "Analysed",
                      ) && (
                        <input
                          type="checkbox"
                          checked={
                            selectedBills.size > 0 &&
                            selectedBills.size ===
                              vendorBills.filter(
                                (bill) =>
                                  bill.status === "Draft" ||
                                  bill.status === "Analysed",
                              ).length
                          }
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                        />
                      )}
                    </th>
                    <th scope="col" className="table-th">
                      Sr. No
                    </th>
                    <th scope="col" className="table-th">
                      Document ID
                    </th>
                    <th scope="col" className="table-th">
                      Status
                    </th>
                    <th scope="col" className="table-th">
                      Created By
                    </th>
                    <th scope="col" className="table-th">
                      Created Date
                    </th>
                    <th scope="col" className="table-th">
                      Actions
                    </th>
                    <th scope="col" className="table-th">
                      Control
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700!">
                  {isLoading || isFetching || isTabChanging ? (
                    <tr>
                      <td colSpan="8" className="table-td text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="text-slate-600">
                            Loading vendor bills...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" className="table-td text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <svg
                            className="w-12 h-12 text-red-500"
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
                          <div className="text-red-600">
                            <p className="text-lg font-medium">
                              Failed to load vendor bills
                            </p>
                            <p className="text-sm text-slate-500 mt-2">
                              {error?.data?.message ||
                                error?.message ||
                                "An error occurred while fetching vendor bills"}
                            </p>
                          </div>
                          <button
                            onClick={refetch}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : !vendorBills.length ? (
                    <tr>
                      <td colSpan="8" className="table-td text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <svg
                            className="w-12 h-12 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <div className="text-slate-500">
                            <p className="text-lg font-medium">
                              No vendor bills found
                            </p>
                            <p className="text-sm mt-2">
                              Upload your first vendor bill to get started
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vendorBills.map((bill, index) => (
                      <tr
                        key={bill.id}
                        className={
                          selectedBills.has(bill.id)
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : ""
                        }
                      >
                        <td className="table-td">
                          {(bill.status === "Draft" ||
                            bill.status === "Analysed") && (
                            <input
                              type="checkbox"
                              checked={selectedBills.has(bill.id)}
                              onChange={() => handleSelectBill(bill.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="table-td">{index + 1}</td>
                        <td className="table-td">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {bill.billmunshiName}
                              </span>
                              {backgroundProcessingBills.has(bill.id) && (
                                <div className="flex items-center">
                                  <span className="animate-pulse text-yellow-500 text-xs">
                                    ⚡
                                  </span>
                                  <span className="text-xs text-yellow-600 ml-1">
                                    Processing...
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {bill.file && (
                                <button
                                  onClick={() =>
                                    handleViewFile(
                                      bill.file,
                                      bill.billmunshiName || "Vendor Bill",
                                    )
                                  }
                                  className="text-xs text-blue-600 hover:underline cursor-pointer"
                                >
                                  View File
                                </button>
                              )}
                              {bill.is_duplicate && (
                                <button
                                  onClick={() => handleViewDuplicates(bill)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 border border-orange-200 rounded-md hover:bg-orange-200 transition-colors duration-200"
                                  title={`Duplicate detected (${bill.duplicate_score}% similarity)`}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-3 h-3"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                                    />
                                  </svg>
                                  Duplicate
                                </button>
                              )}
                              {bill.bill_belong_your_org === false && (
                                <button
                                  onClick={() => handleViewExternalBill(bill)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-200 rounded-md hover:bg-red-200 transition-colors duration-200"
                                  title="This bill was not issued by your organization - Click for details"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-3 h-3"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M3.75 21h16.5M4.5 3h15l2.25 18h-19.5L4.5 3Z"
                                    />
                                  </svg>
                                  External Bill
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="table-td">
                          {getStatusBadge(bill.status)}
                        </td>
                        <td className="table-td">
                          {bill.uploaded_by_name || "N/A"}
                        </td>
                        <td className="table-td">
                          <div className="text-sm">
                            {formatDate(bill.created_at)}
                          </div>
                        </td>
                        <td className="table-td">
                          {renderActionButtons(bill)}
                        </td>
                        <td className="table-td">
                          <div className="flex gap-2 items-center">
                            {[
                              "Analysed",
                              "Verified",
                              "Posted",
                              "Synced",
                            ].includes(bill.status) && (
                              <button
                                onClick={() =>
                                  navigate(`/zoho/vendor-bill/${bill.id}`)
                                }
                                className="group relative inline-flex items-center justify-center w-8 h-8 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm hover:bg-indigo-100 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all duration-200 active:scale-95"
                                title="View vendor bill details"
                              >
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
                                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                  />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleAction(bill.id, "delete")}
                              disabled={deletingBills.has(bill.id)}
                              className={`group relative inline-flex items-center justify-center w-8 h-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 active:scale-95 ${
                                deletingBills.has(bill.id)
                                  ? "text-red-400 bg-red-25 border-red-100 cursor-not-allowed opacity-75"
                                  : "text-red-700 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 focus:ring-red-500"
                              }`}
                              title={
                                deletingBills.has(bill.id)
                                  ? "Deleting..."
                                  : "Delete vendor bill"
                              }
                            >
                              {deletingBills.has(bill.id) ? (
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
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Controls - Only show when we have data and pagination is needed */}
        {vendorBills.length > 0 &&
          (vendorBillsData?.next || vendorBillsData?.previous) && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>
                  Showing {vendorBills.length} of {vendorBillsData?.count || 0}{" "}
                  vendor bills
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // TODO: Implement pagination
                    console.log("Previous page:", vendorBillsData.previous);
                  }}
                  disabled={!vendorBillsData?.previous || isLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>

                <span className="text-sm text-slate-600 dark:text-slate-300">
                  Page
                </span>

                <button
                  onClick={() => {
                    // TODO: Implement pagination
                    console.log("Next page:", vendorBillsData.next);
                  }}
                  disabled={!vendorBillsData?.next || isLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
      </Card>

      {/* Upload Modal */}
      <UploadBillModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      {/* File Viewer Modal */}
      <FileViewerModal
        isOpen={isFileViewerOpen}
        onClose={() => setIsFileViewerOpen(false)}
        fileUrl={selectedFile.url}
        fileName={selectedFile.name}
      />

      {/* Move Modal */}
      <Modal
        activeModal={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title="Move Bills"
        className="max-w-md"
      >
        <div className="space-y-4 p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
              Move {selectedBills.size} Bill{selectedBills.size > 1 ? "s" : ""}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Select where you want to move the selected bills
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 mt-6">
            <button
              onClick={handleMoveToJournalEntry}
              className="group relative flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 active:scale-98"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
              <span className="font-semibold">Journal Entry</span>
            </button>

            <button
              onClick={handleMoveToExpenseBill}
              className="group relative flex items-center justify-center gap-3 px-6 py-4 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 border border-transparent rounded-lg shadow-md hover:from-green-700 hover:to-green-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 active:scale-98"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                />
              </svg>
              <span className="font-semibold">Expense Bill</span>
            </button>
          </div>

          <button
            onClick={() => setIsMoveModalOpen(false)}
            className="w-full mt-4 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Duplicate Detection Modal */}
      <Modal
        activeModal={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title="Duplicate Detected"
        className="max-w-md"
      >
        {selectedDuplicateBill &&
          selectedDuplicateBill.duplicate_matched_bills &&
          selectedDuplicateBill.duplicate_matched_bills.length > 0 && (
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 text-orange-600 dark:text-orange-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    This bill is already processed under Document ID{" "}
                    {selectedDuplicateBill.duplicate_matched_bills.map(
                      (matchedBill, index) => (
                        <span key={index}>
                          {index > 0 &&
                            (index ===
                            selectedDuplicateBill.duplicate_matched_bills
                              .length -
                              1
                              ? " and "
                              : ", ")}
                          <button
                            onClick={() => {
                              if (matchedBill.bill_id) {
                                navigate(
                                  `/zoho/vendor-bill/${matchedBill.bill_id}`,
                                );
                                setIsDuplicateModalOpen(false);
                              }
                            }}
                            className="font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 hover:underline-offset-4 transition-all"
                          >
                            Bill {index + 1}
                          </button>
                        </span>
                      ),
                    )}{" "}
                    created on{" "}
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedDuplicateBill.duplicate_matched_bills[0].date
                        ? formatDate(
                            selectedDuplicateBill.duplicate_matched_bills[0]
                              .date,
                          )
                        : "N/A"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
      </Modal>

      {/* External Bill Details Modal */}
      <Modal
        activeModal={isExternalBillModalOpen}
        onClose={() => setIsExternalBillModalOpen(false)}
        title="External Bill Information"
        className="max-w-lg"
      >
        {selectedExternalBill && (
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15l2.25 18h-19.5L4.5 3Z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Bill Details - {selectedExternalBill.billmunshiName}
                </h4>
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-700">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      {selectedExternalBill.bill_belong_your_org === false ? (
                        <>
                          ❌ Bill NOT issued by your organization.{" "}
                          {selectedExternalBill.description ? (
                            <span className="block mt-1 text-xs text-red-700 dark:text-red-300">
                              {selectedExternalBill.description}
                            </span>
                          ) : (
                            <span className="block mt-1 text-xs text-red-700 dark:text-red-300">
                              External bill detection - please verify the bill
                              belongs to your organization.
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          ✅{" "}
                          {selectedExternalBill.description ||
                            "Bill validation completed successfully."}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsExternalBillModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ZohoVendorBill;
