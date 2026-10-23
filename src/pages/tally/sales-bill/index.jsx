import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetTallySalesBills,
  useUpdateTallySalesBill,
  useDeleteTallySalesBill,
  useUploadTallySalesBills,
  useAnalyzeTallySalesBill,
  useSyncTallySalesBill,
  useDownloadTallySalesReport,
} from "@/services/tally/tallySalesBillService";
import { useTallyUploadTargets } from "@/services/tally/useTallyUploadTargets";

const TallySalesBill = () => {
  return (
    <BillsList
      variant="vendor"
      module="tally"
      useUploadTargets={useTallyUploadTargets}
      uploadTargetValue="sales"
      copy={{
        title: "Sales Vouchers",
        subtitle: "Create sales voucher in Tally by BM automation.",
        billLabel: "sales voucher",
        detailRoute: "/tally/sales-bill",
        uploadTitle: "Upload sales vouchers",
      }}
      useGetBills={useGetTallySalesBills}
      useUpdateBill={useUpdateTallySalesBill}
      useDeleteBill={useDeleteTallySalesBill}
      useUploadBills={useUploadTallySalesBills}
      useAnalyzeBill={useAnalyzeTallySalesBill}
      useSyncBill={useSyncTallySalesBill}
      useDownloadReport={useDownloadTallySalesReport}
      // A sales invoice has a customer and revenue ledgers; the move
      // targets are all payables-side vouchers, so there is nowhere for
      // it to go.
      allowMove={false}
    />
  );
};

export default TallySalesBill;
