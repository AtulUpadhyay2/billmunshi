import React, { useState, useEffect, useId } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useQuickCreateLedger } from "@/services/tally/tallyQuickCreateService";
import { useGetParentLedgers } from "@/services/tally/tallyApiService";
import { useSelector } from "react-redux";
import { BTN_PRIMARY, BTN_SECONDARY, CONTROL } from "@/constants/ui";

/**
 * AddLedgerModal — creates a Purchase / Expense ledger (i.e., anything
 * that's not a vendor). Same shape as ``AddVendorModal`` without the
 * GSTIN field and with an Expense-friendly default parent.
 *
 * ``defaultParent`` prop lets the caller override the placeholder
 * (e.g. "Purchase Accounts" from a Purchase Voucher context).
 */

/** Field label in a dialog body — see the note in `AddVendorModal`. */
const LABEL =
  "block mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] " +
  "text-slate-500 dark:text-slate-400";

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

  // The submit button sits in the dialog footer, outside the <form>, and
  // reaches it by id. Generated so two mounted copies can't collide.
  const formId = useId();

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
      footerContent={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={BTN_SECONDARY}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={!name.trim() || submitting}
            className={BTN_PRIMARY}
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
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor={`${formId}-name`}>
              Ledger Name
              <span aria-hidden="true" className="ml-0.5 text-rose-500 dark:text-rose-400">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </label>
            <input
              id={`${formId}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Freight Charges"
              className={CONTROL}
              autoFocus
            />
          </div>

          <div>
            <label className={LABEL} htmlFor={`${formId}-parent`}>
              Parent Ledger
            </label>
            <input
              id={`${formId}-parent`}
              type="text"
              list="ledger-parent-options"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder={defaultParent}
              className={CONTROL}
            />
            <datalist id="ledger-parent-options">
              {parentOptions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Pick an existing parent, or type a new one.
            </p>
          </div>
        </div>

        {/* A footnote, not a tinted panel: the same sentence on every open
            should not outweigh the two fields above it. */}
        <p className="flex items-start gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <Icon
            icon="heroicons:information-circle"
            className="mt-px shrink-0 text-sm text-slate-400 dark:text-slate-500"
          />
          <span>
            The ledger is created in Bill Munshi immediately and queued for
            Tally sync. You can select it in bill forms right away — Tally will
            import it before the next bill sync fires.
          </span>
        </p>
      </form>
    </Modal>
  );
};

export default AddLedgerModal;
