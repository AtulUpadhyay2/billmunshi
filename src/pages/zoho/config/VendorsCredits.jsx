import React from "react";
import ZohoSyncTable from "@/pages/_shared/ZohoSyncTable";
import { useGetVendorCredits, useSyncVendorCredits } from "@/services/zoho/zohoApiService";

const monoCell = (value) => (
  <span className="font-mono text-slate-700 dark:text-slate-300">{value || "—"}</span>
);

const VendorsCredits = () => {
  return (
    <ZohoSyncTable
      title="Vendor credits"
      subtitle="Vendor credit notes synced from Zoho Books."
      icon="heroicons:credit-card"
      itemLabel="vendor credit"
      useGet={useGetVendorCredits}
      useSync={useSyncVendorCredits}
      columns={[
        { key: "vendor_id", label: "Vendor ID", render: (r) => monoCell(r.vendor_id) },
        { key: "vendor_name", label: "Vendor" },
        { key: "vendor_credit_id", label: "Credit ID", render: (r) => monoCell(r.vendor_credit_id) },
        { key: "vendor_credit_number", label: "Credit number", render: (r) => monoCell(r.vendor_credit_number) },
        { key: "created_at", label: "Created", format: "date" },
      ]}
      searchKeys={["vendor_id", "vendor_name", "vendor_credit_id", "vendor_credit_number"]}
    />
  );
};

export default VendorsCredits;
