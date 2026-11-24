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
import { useMoveTallyReceiptVouchers } from "@/services/tally/tallyReceiptVoucherService";

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
      useMoveBills={useMoveTallyReceiptVouchers}
      moveFrom="receipt"
    />
  );
};

export default TallyReceiptVoucher;
