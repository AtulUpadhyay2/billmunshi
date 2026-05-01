import React from "react";
import TallyBillsList from "@/pages/tally/_shared/TallyBillsList";
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
    <TallyBillsList
      variant="vendor"
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
