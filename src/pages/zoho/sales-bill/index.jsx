import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetZohoSalesBills,
  useUpdateZohoSalesBill,
  useDeleteZohoSalesBill,
  useUploadZohoSalesBills,
  useAnalyzeZohoSalesBill,
  useSyncZohoSalesBill,
  useDownloadZohoSalesReport,
} from "@/services/zoho/zohoSalesBillService";
import { useZohoUploadTargets } from "@/services/zoho/useZohoUploadTargets";

const ZohoSalesBill = () => {
  return (
    <BillsList
      variant="vendor"
      module="zoho"
      useUploadTargets={useZohoUploadTargets}
      uploadTargetValue="sales"
      copy={{
        title: "Sales invoices",
        subtitle: "Upload, analyse and post sales invoices directly to Zoho Books.",
        billLabel: "sales invoice",
        detailRoute: "/zoho/sales-bill",
        uploadTitle: "Upload sales invoices",
      }}
      useGetBills={useGetZohoSalesBills}
      useUpdateBill={useUpdateZohoSalesBill}
      useDeleteBill={useDeleteZohoSalesBill}
      useUploadBills={useUploadZohoSalesBills}
      useAnalyzeBill={useAnalyzeZohoSalesBill}
      useSyncBill={useSyncZohoSalesBill}
      useDownloadReport={useDownloadZohoSalesReport}
      // An invoice carries a customer and revenue ledgers; every move
      // target on the Zoho side is payables, so there is nowhere to go.
      allowMove={false}
    />
  );
};

export default ZohoSalesBill;
