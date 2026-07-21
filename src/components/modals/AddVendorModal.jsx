import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useQuickCreateVendor } from "@/services/tally/tallyQuickCreateService";
import { useGetParentLedgers } from "@/services/tally/tallyApiService";
import { useSelector } from "react-redux";

/**
 * AddVendorModal — creates a Tally vendor ledger in one shot.
 *
 * Fields:
 *   - Vendor Name (required)
 *   - Vendor GSTIN (optional; validated as 15-char alphanumeric if provided)
 *   - Parent Ledger (dropdown from existing parents, default "Sundry Creditors";
 *     freetext fallback so a new parent can be created)
 *
 * On success invokes ``onCreated(ledger)`` with the fresh row so the
 * caller can push it into a dropdown as the selected value.
 */
const inputBase =
  "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const AddVendorModal = ({ isOpen, onClose, onCreated }) => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const orgId = selectedOrganization?.id;

  const [name, setName] = useState("");
  const [gstIn, setGstIn] = useState("");
  const [parentName, setParentName] = useState("Sundry Creditors");
  const [submitting, setSubmitting] = useState(false);

  const { data: parentsData } = useGetParentLedgers(orgId, { enabled: isOpen });
  const parents = parentsData?.results || parentsData || [];
  const parentOptions = Array.from(
    new Set([
      "Sundry Creditors",
      ...(Array.isArray(parents) ? parents.map((p) => p.parent).filter(Boolean) : []),
    ]),
  );

  const create = useQuickCreateVendor();

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setGstIn("");
      setParentName("Sundry Creditors");
      setSubmitting(false);
    }
  }, [isOpen]);

  const gstInValid =
    !gstIn || /^[0-9]{2}[A-Z0-9]{10}[A-Z0-9]{3}$/i.test(gstIn.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !gstInValid || submitting) return;
    setSubmitting(true);
    try {
      const ledger = await create.mutateAsync({
        organizationId: orgId,
        name: name.trim(),
        gst_in: gstIn.trim(),
        parent_ledger_name: parentName.trim(),
      });
      toast.success("Vendor created — awaiting Tally sync");
      onCreated?.(ledger);
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to create vendor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add New Vendor"
      activeModal={isOpen}
      onClose={submitting ? undefined : onClose}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Vendor Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ABC Enterprises"
            className={inputBase}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Vendor GSTIN
          </label>
          <input
            type="text"
            value={gstIn}
            onChange={(e) => setGstIn(e.target.value.toUpperCase())}
            placeholder="15-char GSTIN (optional)"
            className={`${inputBase} ${!gstInValid ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : ""}`}
            maxLength={15}
          />
          {!gstInValid && (
            <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              GSTIN should be 15 chars (2 digits + 10 alphanumerics + 3 alphanumerics).
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Parent Ledger
          </label>
          <input
            type="text"
            list="vendor-parent-options"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            placeholder="Sundry Creditors"
            className={inputBase}
          />
          <datalist id="vendor-parent-options">
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
            The vendor will be created in Bill Munshi immediately and queued
            for Tally sync. Tally's TCP will import it in the next poll cycle
            (usually within ~30 seconds).
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || !gstInValid || submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20"
          >
            {submitting ? (
              <>
                <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Icon icon="heroicons:plus" className="text-base" />
                Create Vendor
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddVendorModal;
