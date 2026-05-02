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
} from "@/services/tally/tallyVendorBillService";

const TallyVendorBill = () => {
  return (
    <BillsList
      variant="vendor"
      module="tally"
      copy={{
        title: "Vendor bills",
        subtitle: "Upload, analyse and post vendor bills directly to Tally.",
        billLabel: "vendor bill",
        moveTargetLabel: "Journal Entry",
        detailRoute: "/tally/vendor-bill",
        uploadTitle: "Upload vendor bills",
      }}
      useGetBills={useGetTallyVendorBills}
      useUpdateBill={useUpdateTallyVendorBill}
      useDeleteBill={useDeleteTallyVendorBill}
      useUploadBills={useUploadTallyVendorBills}
      useAnalyzeBill={useAnalyzeTallyVendorBill}
      useSyncBill={useSyncTallyVendorBill}
      useMoveBills={useMoveTallyVendorBills}
      moveFrom="vendor"
      moveTo="expense"
    />
  );
};

export default TallyVendorBill;
