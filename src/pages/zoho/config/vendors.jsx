import React from "react";
import ZohoSyncTable from "@/pages/_shared/ZohoSyncTable";
import { useGetVendors, useSyncVendors } from "@/services/zoho/zohoApiService";

const monoCell = (value) => (
  <span className="font-mono text-slate-700 dark:text-slate-300">{value || "—"}</span>
);

const Vendors = () => {
  return (
    <ZohoSyncTable
      title="Vendors"
      subtitle="Vendor contacts synced from Zoho Books."
      icon="heroicons:building-storefront"
      itemLabel="vendor"
      useGet={useGetVendors}
      useSync={useSyncVendors}
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
        { key: "created_at", label: "Created", format: "date" },
      ]}
      searchKeys={["contactId", "companyName", "gstNo"]}
    />
  );
};

export default Vendors;
