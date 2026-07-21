import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetTallyVendorBills,
  useUpdateTallyVendorBill,
  useDeleteTallyVendorBill,
  useUploadTallyVendorBills,
  useAnalyzeTallyVendorBill,
  useSyncTallyVendorBill,
  useMoveTallyVendorBills,
  useDownloadTallyVendorReport,

} from "@/services/tally/tallyVendorBillService";

const TallyVendorBill = () => {
  return (
    <BillsList
      variant="vendor"
      module="tally"
      copy={{
        title: "Purchase Vouchers",
        subtitle: "Upload, analyse and post purchase vouchers directly to Tally.",
        billLabel: "purchase voucher",
        moveTargetLabel: "Journal Entry",
        detailRoute: "/tally/vendor-bill",
        uploadTitle: "Upload purchase vouchers",
      }}
      useGetBills={useGetTallyVendorBills}
      useUpdateBill={useUpdateTallyVendorBill}
      useDeleteBill={useDeleteTallyVendorBill}
      useUploadBills={useUploadTallyVendorBills}
      useAnalyzeBill={useAnalyzeTallyVendorBill}
      useSyncBill={useSyncTallyVendorBill}
      useMoveBills={useMoveTallyVendorBills}
      useDownloadReport={useDownloadTallyVendorReport}
      moveFrom="vendor"
      moveTo="expense"
    />
  );
};

export default TallyVendorBill;
