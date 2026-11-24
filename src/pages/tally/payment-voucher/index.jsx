import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetTallyPaymentVouchers,
  useUpdateTallyPaymentVoucher,
  useDeleteTallyPaymentVoucher,
  useUploadTallyPaymentVouchers,
  useAnalyzeTallyPaymentVoucher,
  useSyncTallyPaymentVoucher,
  useMoveTallyPaymentVouchers,
  useDownloadTallyPaymentReport,

} from "@/services/tally/tallyPaymentVoucherService";
import { useTallyUploadTargets } from "@/services/tally/useTallyUploadTargets";

const TallyPaymentVoucher = () => {
  return (
    <BillsList
      variant="expense"
      module="tally"
      useUploadTargets={useTallyUploadTargets}
      uploadTargetValue="payment"
      copy={{
        title: "Payment Vouchers",
        subtitle: "Create payment voucher in Tally by BM automation.",
        billLabel: "payment voucher",
        moveTargetLabel: "Journal Entry",
        detailRoute: "/tally/payment-voucher",
        uploadTitle: "Upload payment vouchers",
      }}
      useGetBills={useGetTallyPaymentVouchers}
      useUpdateBill={useUpdateTallyPaymentVoucher}
      useDeleteBill={useDeleteTallyPaymentVoucher}
      useUploadBills={useUploadTallyPaymentVouchers}
      useAnalyzeBill={useAnalyzeTallyPaymentVoucher}
      useSyncBill={useSyncTallyPaymentVoucher}
      useMoveBills={useMoveTallyPaymentVouchers}
      useDownloadReport={useDownloadTallyPaymentReport}
      // On again: the move endpoint knows about payment vouchers now.
      // It was off because this page sent moveFrom="expense" while
      // listing payments, so the backend looked the ids up in the
      // expense table and found nothing — the menu could only fail.
      moveFrom="payment"
    />
  );
};

export default TallyPaymentVoucher;
