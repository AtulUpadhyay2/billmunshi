import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetTallyReceiptVouchers,
  useUpdateTallyReceiptVoucher,
  useDeleteTallyReceiptVoucher,
  useUploadTallyReceiptVouchers,
  useAnalyzeTallyReceiptVoucher,
  useSyncTallyReceiptVoucher,
  useDownloadTallyReceiptReport,
} from "@/services/tally/tallyReceiptVoucherService";
import { useTallyUploadTargets } from "@/services/tally/useTallyUploadTargets";

const TallyReceiptVoucher = () => {
  return (
    <BillsList
      variant="expense"
      module="tally"
      useUploadTargets={useTallyUploadTargets}
      uploadTargetValue="receipt"
      copy={{
        title: "Receipt Vouchers",
        subtitle: "Create receipt voucher in Tally by BM automation.",
        billLabel: "receipt voucher",
        detailRoute: "/tally/receipt-voucher",
        uploadTitle: "Upload receipt vouchers",
      }}
      useGetBills={useGetTallyReceiptVouchers}
      useUpdateBill={useUpdateTallyReceiptVoucher}
      useDeleteBill={useDeleteTallyReceiptVoucher}
      useUploadBills={useUploadTallyReceiptVouchers}
      useAnalyzeBill={useAnalyzeTallyReceiptVoucher}
      useSyncBill={useSyncTallyReceiptVoucher}
      useDownloadReport={useDownloadTallyReceiptReport}
      // Every move target is a payables-side voucher; a receipt has
      // nowhere to go.
      allowMove={false}
    />
  );
};

export default TallyReceiptVoucher;
