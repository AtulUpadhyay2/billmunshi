import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useQuickCreateLedger } from "@/services/tally/tallyQuickCreateService";
import { useGetParentLedgers } from "@/services/tally/tallyApiService";
import { useSelector } from "react-redux";

/**
 * AddLedgerModal — creates a Purchase / Expense ledger (i.e., anything
 * that's not a vendor). Same shape as ``AddVendorModal`` without the
 * GSTIN field and with an Expense-friendly default parent.
 *
 * ``defaultParent`` prop lets the caller override the placeholder
 * (e.g. "Purchase Accounts" from a Purchase Voucher context).
 */
const inputBase =
  "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const AddLedgerModal = ({
  isOpen,
  onClose,
  onCreated,
  defaultParent = "Indirect Expenses",
  title = "Add New Ledger",
}) => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const orgId = selectedOrganization?.id;

  const [name, setName] = useState("");
  const [parentName, setParentName] = useState(defaultParent);
  const [submitting, setSubmitting] = useState(false);

  const { data: parentsData } = useGetParentLedgers(orgId, { enabled: isOpen });
  const parents = parentsData?.results || parentsData || [];
  const parentOptions = Array.from(
    new Set([
      defaultParent,
      ...(Array.isArray(parents) ? parents.map((p) => p.parent).filter(Boolean) : []),
    ]),
  );

  const create = useQuickCreateLedger();

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setParentName(defaultParent);
      setSubmitting(false);
    }
  }, [isOpen, defaultParent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const ledger = await create.mutateAsync({
        organizationId: orgId,
        name: name.trim(),
        parent_ledger_name: parentName.trim(),
      });
      toast.success("Ledger created — awaiting Tally sync");
      onCreated?.(ledger);
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to create ledger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={title}
      activeModal={isOpen}
      onClose={submitting ? () => {} : onClose}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Ledger Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Freight Charges, Office Rent"
            className={inputBase}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Parent Ledger
          </label>
          <input
            type="text"
            list="ledger-parent-options"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            placeholder={defaultParent}
            className={inputBase}
          />
          <datalist id="ledger-parent-options">
            {parentOptions.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Tip: pick an existing parent, or type a new one — it will be created on the fly.
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 px-3 py-2.5 text-[12px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <Icon icon="heroicons:information-circle" className="text-lg shrink-0 mt-0.5" />
          <span>
            The ledger will be created in Bill Munshi immediately and queued
            for Tally sync. You can select it in bill forms right away — Tally
            will import it before the next bill sync fires.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex items-center h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20"
          >
            {submitting ? (
              <>
                <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Icon icon="heroicons:plus" className="text-sm" />
                Create Ledger
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddLedgerModal;
