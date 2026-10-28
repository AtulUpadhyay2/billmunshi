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

// ----- Customer (sales party) -----------------------------------------

export const useQuickCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ organizationId, name, gst_in, parent_ledger_id, parent_ledger_name }) => {
      return apiFetch(`tally/org/${organizationId}/quick-create/customer/`, {
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
      qc.invalidateQueries({ queryKey: ["tallyCustomerLedgers", vars.organizationId] });
      qc.invalidateQueries({ queryKey: ["tallyLedgers", vars.organizationId] });
    },
  });
};

/**
 * Put a freshly created row into the cached list straight away.
 *
 * Invalidating alone is not enough for the screen that created the row:
 * the refetch is a round trip, and until it lands `SearchableDropdown`
 * resolves its label with `options.find(...)`, finds nothing, and falls
 * back to the placeholder. The ledger or item was created, the parent
 * had already selected its id, and the control still looked empty —
 * which is exactly what the client reported.
 *
 * Seeding first and invalidating after means the row is pickable on the
 * next render and the refetch quietly reconciles it. Both quick-create
 * endpoints write to Bill Munshi's own tables before queueing the Tally
 * sync, so the refetch returns the row too and never takes it away.
 */
const seedLedgerCaches = (qc, orgId, ledger, keys) => {
  if (!ledger?.id || !ledger?.name) return;
  keys.forEach((key) => {
    qc.setQueryData([key, orgId], (old) => {
      if (!old?.grouped_ledgers) return old;
      const groupName = ledger.parent_ledger_name || ledger.parent || "Recently added";
      const group = old.grouped_ledgers[groupName] || [];
      if (group.some((l) => l.id === ledger.id)) return old;
      return {
        ...old,
        grouped_ledgers: {
          ...old.grouped_ledgers,
          [groupName]: [...group, ledger],
        },
      };
    });
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
      // Every list a newly-created ledger can show up in. The purchase
      // list was missing, so creating a Purchase Ledger from a vendor
      // bill left the dropdown showing the stale cached options — the
      // ledger existed, but there was no way to pick it without a page
      // reload. Invalidate the list the screen actually reads, not the
      // one that happens to be nearby.
      const keys = [
        "tallyExpenseChartOfAccountsLedgers",
        "tallyPurchaseLedgers",
        "tallySalesLedgers",
        "tallyLedgers",
      ];
      seedLedgerCaches(qc, vars.organizationId, _data, keys);
      keys.forEach((key) =>
        qc.invalidateQueries({ queryKey: [key, vars.organizationId] }),
      );
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
      // The stock-item dropdown reads ['tallyMasters', orgId]. Nothing
      // is registered under 'tallyStockItems', so this invalidation hit
      // no query at all and a freshly created item never appeared.
      if (_data?.id && _data?.name) {
        qc.setQueryData(["tallyMasters", vars.organizationId], (old) => {
          if (!old?.stock_items) return old;
          if (old.stock_items.some((i) => i.id === _data.id)) return old;
          return { ...old, stock_items: [...old.stock_items, _data] };
        });
      }
      qc.invalidateQueries({ queryKey: ["tallyMasters", vars.organizationId] });
    },
  });
};
