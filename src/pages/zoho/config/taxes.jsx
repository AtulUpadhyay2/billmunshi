import React from "react";
import ZohoSyncTable from "@/pages/_shared/ZohoSyncTable";
import { useGetTaxes, useSyncTaxes } from "@/services/zoho/zohoApiService";

const monoCell = (value) => (
  <span className="font-mono text-slate-700 dark:text-slate-300">{value || "—"}</span>
);

const Taxes = () => {
  return (
    <ZohoSyncTable
      title="Taxes"
      subtitle="Tax codes synced from Zoho Books."
      icon="heroicons:receipt-percent"
      itemLabel="tax"
      useGet={useGetTaxes}
      useSync={useSyncTaxes}
      paginated
      columns={[
        { key: "taxId", label: "Tax ID", render: (r) => monoCell(r.taxId) },
        { key: "taxName", label: "Tax name" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
      searchKeys={["taxId", "taxName"]}
    />
  );
};

export default Taxes;
