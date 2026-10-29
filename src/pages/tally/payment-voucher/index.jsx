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
      // Move is off here, not configured. This page was sending
      // moveFrom="expense" while listing payment vouchers, so the
      // backend looked the selected ids up in the expense table and
      // found nothing — the menu could only ever fail. Tally's move
      // endpoint accepts vendor and expense only, so there is no
      // correct value to send for a payment voucher. Turn this back on
      // once that endpoint knows about payment vouchers.
      allowMove={false}
    />
  );
};

export default TallyPaymentVoucher;
