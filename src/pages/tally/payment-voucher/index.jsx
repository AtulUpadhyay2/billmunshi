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

const TallyPaymentVoucher = () => {
  return (
    <BillsList
      variant="expense"
      module="tally"
      copy={{
        title: "Payment Vouchers",
        subtitle: "Upload, analyse and post payment vouchers directly to Tally.",
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
      moveFrom="expense"
      moveTo="vendor"
    />
  );
};

export default TallyPaymentVoucher;
