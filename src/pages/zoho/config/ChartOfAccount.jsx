import React from "react";
import ZohoSyncTable from "@/pages/_shared/ZohoSyncTable";
import { useGetChartOfAccounts, useSyncChartOfAccounts } from "@/services/zoho/zohoApiService";

const monoCell = (value) => (
  <span className="font-mono text-slate-700 dark:text-slate-300">{value || "—"}</span>
);

const ChartOfAccount = () => {
  return (
    <ZohoSyncTable
      title="Chart of accounts"
      subtitle="Synced ledgers from Zoho Books for the selected workspace."
      icon="heroicons:rectangle-stack"
      itemLabel="account"
      useGet={useGetChartOfAccounts}
      useSync={useSyncChartOfAccounts}
      paginated
      columns={[
        { key: "accountId", label: "Account ID", render: (r) => monoCell(r.accountId) },
        { key: "accountName", label: "Account name" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
      searchKeys={["accountId", "accountName"]}
    />
  );
};

export default ChartOfAccount;
