import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

/**
 * Quick-create service — used by the "+ Add New" modals in the Tally
 * bill detail view and standalone Ledgers / Items pages.
 *
 * Each mutation returns the newly-created row so the caller can push
 * it straight into a dropdown as the selected value. React Query
 * caches for the corresponding list endpoint are invalidated so the
 * next dropdown open shows the fresh entry.
 */

// ----- Vendor ---------------------------------------------------------

export const useQuickCreateVendor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ organizationId, name, gst_in, parent_ledger_id, parent_ledger_name }) => {
      return apiFetch(`tally/org/${organizationId}/quick-create/vendor/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gst_in: gst_in || "",
          parent_ledger_id: parent_ledger_id || undefined,
          parent_ledger_name: parent_ledger_name || undefined,
        }),
      });
    },
    onSuccess: (_data, vars) => {
      // Ledger + vendor dropdowns share the same backing store.
      qc.invalidateQueries({ queryKey: ["tallyVendorLedgers", vars.organizationId] });
      qc.invalidateQueries({ queryKey: ["tallyLedgers", vars.organizationId] });
    },
  });
};

// ----- Ledger (Purchase / Expense) ------------------------------------

export const useQuickCreateLedger = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ organizationId, name, parent_ledger_id, parent_ledger_name }) => {
      return apiFetch(`tally/org/${organizationId}/quick-create/ledger/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parent_ledger_id: parent_ledger_id || undefined,
          parent_ledger_name: parent_ledger_name || undefined,
        }),
      });
    },
    onSuccess: (_data, vars) => {
      // Purchase / Expense COA dropdowns hit these two query keys.
      qc.invalidateQueries({
        queryKey: ["tallyExpenseChartOfAccountsLedgers", vars.organizationId],
      });
      qc.invalidateQueries({ queryKey: ["tallyLedgers", vars.organizationId] });
    },
  });
};

// ----- Stock Item (Inventory) -----------------------------------------

export const useQuickCreateItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId, name, unit, gst_rate, hsn_code, parent, alias, item_code,
    }) => {
      return apiFetch(`tally/org/${organizationId}/quick-create/item/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit: unit || "",
          gst_rate: gst_rate || "",
          hsn_code: hsn_code || "",
          parent: parent || "Primary",
          alias: alias || "",
          item_code: item_code || "",
        }),
      });
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tallyStockItems", vars.organizationId] });
    },
  });
};
