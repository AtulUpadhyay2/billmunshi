import React from "react";
import { useSelector } from "react-redux";
import {
  useGetTallyFunnel,
  useGetTallyOverview,
  useGetTallyUsage,
  useGetTallyInsights,
} from "@/services/tally/tallyDashboardService";
import { useUploadTallyVendorBills } from "@/services/tally/tallyVendorBillService";
import { useUploadTallyExpenseBills } from "@/services/tally/tallyExpenseBillService";
import { useUploadTallyPaymentVouchers } from "@/services/tally/tallyPaymentVoucherService";
import { useUploadTallySalesBills } from "@/services/tally/tallySalesBillService";
import { useUploadTallyReceiptVouchers } from "@/services/tally/tallyReceiptVoucherService";
import { globalToast } from "@/utils/toast";
import { notifyUploadResult, notifyUploadError } from "@/utils/uploadFeedback";
import DashboardLayout from "./_shared/DashboardLayout";

const TallyDashboard = () => {
  const selectedOrganization = useSelector(
    (state) => state.auth.selectedOrganization,
  );

  const {
    data: funnelData,
    isLoading: isFunnelLoading,
    isError: isFunnelError,
    error: funnelError,
    refetch: refetchFunnel,
  } = useGetTallyFunnel(selectedOrganization?.id, { refetchOnMount: true });

  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useGetTallyOverview(selectedOrganization?.id, { refetchOnMount: true });

  const {
    data: usageData,
    isLoading: isUsageLoading,
    isError: isUsageError,
    error: usageError,
    refetch: refetchUsage,
  } = useGetTallyUsage(selectedOrganization?.id, { refetchOnMount: true });

  const {
    data: insightsData,
    isLoading: isInsightsLoading,
    refetch: refetchInsights,
  } = useGetTallyInsights(selectedOrganization?.id, { refetchOnMount: true });

  const { mutateAsync: uploadVendorBills } = useUploadTallyVendorBills();
  const { mutateAsync: uploadExpenseBills } = useUploadTallyExpenseBills();
  const { mutateAsync: uploadPaymentVouchers } = useUploadTallyPaymentVouchers();
  const { mutateAsync: uploadSalesBills } = useUploadTallySalesBills();
  const { mutateAsync: uploadReceiptVouchers } = useUploadTallyReceiptVouchers();

  const refetchAll = () => {
    refetchFunnel();
    refetchOverview();
    refetchUsage();
    refetchInsights();
  };

  const handleVendorUpload = async (formData) => {
    try {
      const result = await uploadVendorBills({
        organizationId: selectedOrganization?.id,
        formData,
      });
      notifyUploadResult(result, "Purchase vouchers uploaded successfully");
      refetchAll();
    } catch (error) {
      notifyUploadError(error, "Failed to upload purchase vouchers");
    }
  };

  const handleExpenseUpload = async (formData) => {
    try {
      const result = await uploadExpenseBills({
        organizationId: selectedOrganization?.id,
        formData,
      });
      notifyUploadResult(result, "Journal vouchers uploaded successfully");
      refetchAll();
    } catch (error) {
      notifyUploadError(error, "Failed to upload journal vouchers");
    }
  };

  const handlePaymentUpload = async (formData) => {
    try {
      const result = await uploadPaymentVouchers({
        organizationId: selectedOrganization?.id,
        formData,
      });
      notifyUploadResult(result, "Payment vouchers uploaded successfully");
      refetchAll();
    } catch (error) {
      notifyUploadError(error, "Failed to upload payment vouchers");
    }
  };

  const handleSalesUpload = async (formData) => {
    try {
      const result = await uploadSalesBills({
        organizationId: selectedOrganization?.id,
        formData,
      });
      notifyUploadResult(result, "Sales vouchers uploaded successfully");
      refetchAll();
    } catch (error) {
      notifyUploadError(error, "Failed to upload sales vouchers");
    }
  };

  const handleReceiptUpload = async (formData) => {
    try {
      const result = await uploadReceiptVouchers({
        organizationId: selectedOrganization?.id,
        formData,
      });
      notifyUploadResult(result, "Receipt vouchers uploaded successfully");
      refetchAll();
    } catch (error) {
      notifyUploadError(error, "Failed to upload receipt vouchers");
    }
  };

  return (
    <DashboardLayout
      module="tally"
      selectedOrganization={selectedOrganization}
      funnelData={funnelData}
      overviewData={overviewData}
      usageData={usageData}
      isLoading={isFunnelLoading || isOverviewLoading || isUsageLoading}
      isError={isFunnelError || isOverviewError || isUsageError}
      error={funnelError || overviewError || usageError}
      refetchAll={refetchAll}
      onVendorUpload={handleVendorUpload}
      onExpenseUpload={handleExpenseUpload}
      onPaymentUpload={handlePaymentUpload}
      onSalesUpload={handleSalesUpload}
      onReceiptUpload={handleReceiptUpload}
      insightsData={insightsData}
      isInsightsLoading={isInsightsLoading}
    />
  );
};

export default TallyDashboard;
