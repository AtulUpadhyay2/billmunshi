import React from "react";
import TallyBillsList from "@/pages/tally/_shared/TallyBillsList";
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
    <TallyBillsList
      variant="expense"
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
