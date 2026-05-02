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
} from "@/services/tally/tallyExpenseBillService";

const TallyExpenseBill = () => {
  return (
    <BillsList
      variant="expense"
      module="tally"
      copy={{
        title: "Expense bills",
        subtitle: "Upload, analyse and post expense bills directly to Tally.",
        billLabel: "expense bill",
        moveTargetLabel: "Vendor Bill",
        detailRoute: "/tally/expense-bill",
        uploadTitle: "Upload expense bills",
      }}
      useGetBills={useGetTallyExpenseBills}
      useUpdateBill={useUpdateTallyExpenseBill}
      useDeleteBill={useDeleteTallyExpenseBill}
      useUploadBills={useUploadTallyExpenseBills}
      useAnalyzeBill={useAnalyzeTallyExpenseBill}
      useSyncBill={useSyncTallyExpenseBill}
      useMoveBills={useMoveTallyExpenseBills}
      moveFrom="expense"
      moveTo="vendor"
    />
  );
};

export default TallyExpenseBill;
