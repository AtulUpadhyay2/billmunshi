import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetZohoPaymentBills,
  useUpdateZohoPaymentBill,
  useDeleteZohoPaymentBill,
  useUploadZohoPaymentBills,
  useAnalyzeZohoPaymentBill,
  useSyncZohoPaymentBill,
  useDownloadZohoPaymentReport,
  useMovePaymentBills,
} from "@/services/zoho/zohoPaymentVoucherService";
import { useZohoUploadTargets } from "@/services/zoho/useZohoUploadTargets";

const ZohoPaymentVoucher = () => {
  return (
    <BillsList
      variant="expense"
      module="zoho"
      useUploadTargets={useZohoUploadTargets}
      uploadTargetValue="payment"
      copy={{
        title: "Payments",
        subtitle: "Upload, analyse and post vendor payments directly to Zoho Books.",
        billLabel: "payment",
        detailRoute: "/zoho/payment-voucher",
        uploadTitle: "Upload payments",
      }}
      useGetBills={useGetZohoPaymentBills}
      useUpdateBill={useUpdateZohoPaymentBill}
      useDeleteBill={useDeleteZohoPaymentBill}
      useUploadBills={useUploadZohoPaymentBills}
      useAnalyzeBill={useAnalyzeZohoPaymentBill}
      useSyncBill={useSyncZohoPaymentBill}
      useDownloadReport={useDownloadZohoPaymentReport}
      useMoveBills={useMovePaymentBills}
      moveFrom="payment"
    />
  );
};

export default ZohoPaymentVoucher;
