import React from "react";
import BillsList from "@/pages/_shared/BillsList";
import {
  useGetZohoJournalBills,
  useUpdateZohoJournalBill,
  useDeleteZohoJournalBill,
  useUploadZohoJournalBills,
  useAnalyzeZohoJournalBill,
  useSyncZohoJournalBill,
  useMoveJournalBills,
} from "@/services/zoho/zohoJournalEntryService";

const ZohoJournalEntry = () => {
  return (
    <BillsList
      variant="journal"
      copy={{
        title: "Journal entries",
        subtitle: "Upload, analyse and post journal entries directly to Zoho Books.",
        billLabel: "journal entry",
        moveTargetLabel: "Vendor Bill",
        detailRoute: "/zoho/journal-entry",
        uploadTitle: "Upload journal entries",
      }}
      useGetBills={useGetZohoJournalBills}
      useUpdateBill={useUpdateZohoJournalBill}
      useDeleteBill={useDeleteZohoJournalBill}
      useUploadBills={useUploadZohoJournalBills}
      useAnalyzeBill={useAnalyzeZohoJournalBill}
      useSyncBill={useSyncZohoJournalBill}
      useMoveBills={useMoveJournalBills}
      moveFrom="journal"
      moveTo="vendor"
    />
  );
};

export default ZohoJournalEntry;
