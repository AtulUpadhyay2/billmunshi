import React from "react";
import ZohoSyncTable from "@/pages/_shared/ZohoSyncTable";
import { useGetTdsTcs, useSyncTdsTcs } from "@/services/zoho/zohoApiService";

const monoCell = (value) => (
  <span className="font-mono text-slate-700 dark:text-slate-300">{value || "—"}</span>
);

const TdsTcs = () => {
  return (
    <ZohoSyncTable
      title="TDS / TCS"
      subtitle="Tax-deducted-at-source and tax-collected-at-source codes synced from Zoho Books."
      icon="heroicons:document-currency-rupee"
      itemLabel="tax code"
      useGet={useGetTdsTcs}
      useSync={useSyncTdsTcs}
      paginated
      columns={[
        { key: "taxId", label: "Tax ID", render: (r) => monoCell(r.taxId) },
        { key: "taxName", label: "Tax name" },
        {
          key: "taxPercentage",
          label: "Rate",
          render: (r) => (
            <span className="font-mono font-semibold text-slate-900 dark:text-white">
              {r.taxPercentage != null ? `${r.taxPercentage}%` : "—"}
            </span>
          ),
        },
        {
          key: "type",
          label: "Type",
          render: (r) =>
            r.type ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                {r.type}
              </span>
            ) : (
              "—"
            ),
        },
        { key: "created_at", label: "Created", format: "date" },
      ]}
      searchKeys={["taxId", "taxName", "type"]}
    />
  );
};

export default TdsTcs;
