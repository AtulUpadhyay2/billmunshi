import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

/**
 * Quick-create service — used by the "+ Add New" modals in the Tally
 * bill detail view and standalone Ledgers / Items pages.
 *
 * Each mutation returns the newly-created row so the caller can push
 * it straight into a dropdown as the selected value.
 *
 * ``onSuccess`` *returns* the invalidation promise, so ``mutateAsync``
 * only resolves once the affected dropdown lists have refetched. That is
 * what lets the modal hand the new row to ``onCreated`` and have the
 * picker beside it show it as selected immediately, rather than holding
 * an id with no matching option until the next page load.
 */

// Every ledger picker on the voucher pages reads its own
// ``configs/ledgers/?parent_type=…`` query (vendor, purchase, expense, tax,
// CGST/SGST/IGST, payment mode …), and a new ledger can belong to any of
// them depending on the parent it was created under. Refresh the whole
// family instead of a hand-picked subset — the old subset missed the
// purchase / tax / GST lists, so a ledger created from those pickers never
// appeared in them. ``parentLedgers`` too: the modal creates a missing
// parent on the fly.
const LEDGER_LIST_KEY = /^tally\w*Ledgers$/;

const refreshLedgerLists = (qc, organizationId) =>
  qc.invalidateQueries({
    predicate: ({ queryKey: [key, orgId] }) =>
      orgId === organizationId &&
      (key === "parentLedgers" ||
        (typeof key === "string" && LEDGER_LIST_KEY.test(key))),
  });

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
    // Vendors are ledgers — same backing store as every other picker.
    onSuccess: (_data, vars) => refreshLedgerLists(qc, vars.organizationId),
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
    onSuccess: (_data, vars) => refreshLedgerLists(qc, vars.organizationId),
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
    onSuccess: (_data, vars) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["tallyStockItems", vars.organizationId] }),
        // The vendor-bill item picker reads stock items off the masters payload.
        qc.invalidateQueries({ queryKey: ["tallyMasters", vars.organizationId] }),
      ]),
  });
};
