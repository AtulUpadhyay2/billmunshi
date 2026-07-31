import React from "react";
import { useSelector } from "react-redux";
import {
  useGetTallyFunnel,
  useGetTallyOverview,
  useGetTallyUsage,
} from "@/services/tally/tallyDashboardService";
import { useUploadTallyVendorBills } from "@/services/tally/tallyVendorBillService";
import { useUploadTallyExpenseBills } from "@/services/tally/tallyExpenseBillService";
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

  const { mutateAsync: uploadVendorBills } = useUploadTallyVendorBills();
  const { mutateAsync: uploadExpenseBills } = useUploadTallyExpenseBills();

  const refetchAll = () => {
    refetchFunnel();
    refetchOverview();
    refetchUsage();
  };

  const handleVendorUpload = async (formData) => {
    try {
      const result = await uploadVendorBills({
        organizationId: selectedOrganization?.id,
        formData,
      });
      notifyUploadResult(result, "Vendor bills uploaded successfully");
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
      notifyUploadResult(result, "Journal entries uploaded successfully");
      refetchAll();
    } catch (error) {
      notifyUploadError(error, "Failed to upload journal entries");
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
    />
  );
};

export default TallyDashboard;
