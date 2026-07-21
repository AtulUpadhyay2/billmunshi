import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetZohoExpenseBills,
  useUpdateZohoExpenseBill,
  useDeleteZohoExpenseBill,
  useUploadZohoExpenseBills,
  useAnalyzeZohoExpenseBill,
  useSyncZohoExpenseBill,
  useMoveExpenseBills,
  useDownloadZohoExpenseReport,

} from "@/services/zoho/zohoExpenseBillService";

const ZohoExpenseBill = () => {
  return (
    <BillsList
      variant="expense"
      module="zoho"
      copy={{
        title: "Expense bills",
        subtitle: "Upload, analyse and post expense bills directly to Zoho Books.",
        billLabel: "expense bill",
        moveTargetLabel: "Vendor Bill",
        detailRoute: "/zoho/expense-bill",
        uploadTitle: "Upload expense bills",
      }}
      useGetBills={useGetZohoExpenseBills}
      useUpdateBill={useUpdateZohoExpenseBill}
      useDeleteBill={useDeleteZohoExpenseBill}
      useUploadBills={useUploadZohoExpenseBills}
      useAnalyzeBill={useAnalyzeZohoExpenseBill}
      useSyncBill={useSyncZohoExpenseBill}
      useMoveBills={useMoveExpenseBills}
      useDownloadReport={useDownloadZohoExpenseReport}
      moveFrom="expense"
      moveTo="vendor"
    />
  );
};

export default ZohoExpenseBill;
