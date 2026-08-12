import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetTallyExpenseBills,
  useUpdateTallyExpenseBill,
  useDeleteTallyExpenseBill,
  useUploadTallyExpenseBills,
  useAnalyzeTallyExpenseBill,
  useSyncTallyExpenseBill,
  useMoveTallyExpenseBills,
  useDownloadTallyExpenseReport,

} from "@/services/tally/tallyExpenseBillService";

const TallyExpenseBill = () => {
  return (
    <BillsList
      variant="expense"
      module="tally"
      copy={{
        title: "Journal Entries",
        subtitle: "Create journal entry in Tally by BM automation.",
        billLabel: "journal entry",
        moveTargetLabel: "Purchase Voucher",
        detailRoute: "/tally/expense-bill",
        uploadTitle: "Upload journal entries",
      }}
      useGetBills={useGetTallyExpenseBills}
      useUpdateBill={useUpdateTallyExpenseBill}
      useDeleteBill={useDeleteTallyExpenseBill}
      useUploadBills={useUploadTallyExpenseBills}
      useAnalyzeBill={useAnalyzeTallyExpenseBill}
      useSyncBill={useSyncTallyExpenseBill}
      useMoveBills={useMoveTallyExpenseBills}
      useDownloadReport={useDownloadTallyExpenseReport}
      moveFrom="expense"
      moveTo="vendor"
    />
  );
};

export default TallyExpenseBill;
