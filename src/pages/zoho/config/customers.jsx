import React from "react";
import ZohoSyncTable from "@/pages/_shared/ZohoSyncTable";
import { useGetCustomers, useSyncCustomers } from "@/services/zoho/zohoApiService";

const monoCell = (value) => (
  <span className="font-mono text-slate-700 dark:text-slate-300">{value || "—"}</span>
);

const Customers = () => {
  return (
    <ZohoSyncTable
      title="Customers"
      subtitle="Customer contacts synced from Zoho Books."
      icon="heroicons:user-group"
      itemLabel="customer"
      useGet={useGetCustomers}
      useSync={useSyncCustomers}
      columns={[
        { key: "contactId", label: "Contact ID", render: (r) => monoCell(r.contactId) },
        { key: "companyName", label: "Company" },
        {
          key: "gstNo",
          label: "GSTIN",
          render: (r) =>
            r.gstNo ? (
              monoCell(r.gstNo)
            ) : (
              <span className="text-xs italic text-slate-400 dark:text-slate-500">Not provided</span>
            ),
        },
        // Zoho picks IGST vs CGST+SGST on an invoice from the customer's
        // place of supply, so it belongs on the master, not just the voucher.
        {
          key: "place_of_supply",
          label: "Place of supply",
          render: (r) =>
            r.place_of_supply ? (
              monoCell(r.place_of_supply)
            ) : (
              <span className="text-xs italic text-slate-400 dark:text-slate-500">Not set</span>
            ),
        },
        { key: "created_at", label: "Created", format: "date" },
      ]}
      searchKeys={["contactId", "companyName", "gstNo", "place_of_supply"]}
    />
  );
};

export default Customers;
