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
  useMoveSalesBills,
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
      useMoveBills={useMoveSalesBills}
      moveFrom="sales"
    />
  );
};

export default ZohoSalesBill;
