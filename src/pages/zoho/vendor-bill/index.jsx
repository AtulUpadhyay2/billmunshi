import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetVendorBills,
  useUpdateVendorBill,
  useDeleteVendorBill,
  useUploadVendorBills,
  useAnalyzeVendorBill,
  useSyncVendorBill,
  useMoveVendorBills,
} from "@/services/zoho/zohoVendorBillService";

const ZohoVendorBill = () => {
  return (
    <BillsList
      variant="vendor"
      module="zoho"
      copy={{
        title: "Vendor bills",
        subtitle: "Upload, analyse and post vendor bills directly to Zoho Books.",
        billLabel: "vendor bill",
        moveTargetLabel: "Journal Entry",
        detailRoute: "/zoho/vendor-bill",
        uploadTitle: "Upload vendor bills",
      }}
      useGetBills={useGetVendorBills}
      useUpdateBill={useUpdateVendorBill}
      useDeleteBill={useDeleteVendorBill}
      useUploadBills={useUploadVendorBills}
      useAnalyzeBill={useAnalyzeVendorBill}
      useSyncBill={useSyncVendorBill}
      useMoveBills={useMoveVendorBills}
      moveFrom="vendor"
      moveTo="journal"
    />
  );
};

export default ZohoVendorBill;
