import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetZohoReceiptBills,
  useUpdateZohoReceiptBill,
  useDeleteZohoReceiptBill,
  useUploadZohoReceiptBills,
  useAnalyzeZohoReceiptBill,
  useSyncZohoReceiptBill,
  useDownloadZohoReceiptReport,
} from "@/services/zoho/zohoReceiptVoucherService";
import { useZohoUploadTargets } from "@/services/zoho/useZohoUploadTargets";

const ZohoReceiptVoucher = () => {
  return (
    <BillsList
      variant="expense"
      module="zoho"
      useUploadTargets={useZohoUploadTargets}
      uploadTargetValue="receipt"
      copy={{
        title: "Receipts",
        subtitle: "Upload, analyse and post customer payments directly to Zoho Books.",
        billLabel: "receipt",
        detailRoute: "/zoho/receipt-voucher",
        uploadTitle: "Upload receipts",
      }}
      useGetBills={useGetZohoReceiptBills}
      useUpdateBill={useUpdateZohoReceiptBill}
      useDeleteBill={useDeleteZohoReceiptBill}
      useUploadBills={useUploadZohoReceiptBills}
      useAnalyzeBill={useAnalyzeZohoReceiptBill}
      useSyncBill={useSyncZohoReceiptBill}
      useDownloadReport={useDownloadZohoReceiptReport}
      // A receipt is a payment object, not a bill: the move endpoint
      // only knows the three bill-shaped types.
      allowMove={false}
    />
  );
};

export default ZohoReceiptVoucher;
