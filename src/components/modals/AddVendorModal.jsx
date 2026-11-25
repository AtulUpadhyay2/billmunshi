import React, { useState, useEffect, useId } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import {
  useQuickCreateCustomer,
  useQuickCreateVendor,
} from "@/services/tally/tallyQuickCreateService";
import { useGetParentLedgers } from "@/services/tally/tallyApiService";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { BTN_PRIMARY, BTN_SECONDARY, CONTROL, CONTROL_VALIDATED } from "@/constants/ui";
import { gstinNameInitial, nameMatchesGstin } from "@/utils/gstin";

/**
 * AddVendorModal — creates a Tally party ledger in one shot.
 *
 * Serves both sides. ``party`` picks which: a vendor files under Sundry
 * Creditors, a customer under Sundry Debtors, and each hits its own
 * quick-create endpoint. Everything else — the GSTIN check, the parent
 * datalist, the sync notice — is the same question asked of the same
 * kind of record, so it is one modal rather than two that drift.
 *
 * Fields:
 *   - Name (required)
 *   - GSTIN (optional; validated as 15-char alphanumeric if provided)
 *   - Parent Ledger (dropdown from existing parents, defaulting to the
 *     party's usual group; freetext fallback so a new parent can be
 *     created)
 *
 * On success invokes ``onCreated(ledger)`` with the fresh row so the
 * caller can push it into a dropdown as the selected value.
 */
const PARTY = {
  vendor: {
    noun: "Vendor",
    defaultParent: "Sundry Creditors",
    cacheKey: "tallyVendorLedgers",
  },
  customer: {
    noun: "Customer",
    defaultParent: "Sundry Debtors",
    cacheKey: "tallyCustomerLedgers",
  },
};

/**
 * Field label in a dialog body — the same wide-tracked small caps the
 * record pages set over a field, so a dialog reads as part of the same
 * product rather than as a form bolted onto it.
 */
const LABEL =
  "block mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] " +
  "text-slate-500 dark:text-slate-400";

/** The red asterisk that marks a field as required. */
const Required = () => (
  <>
    <span aria-hidden="true" className="ml-0.5 text-rose-500 dark:text-rose-400">
      *
    </span>
    <span className="sr-only"> (required)</span>
  </>
);

const AddVendorModal = ({
  isOpen,
  onClose,
  onCreated,
  defaultName = "",
  defaultGstIn = "",
  party = "vendor",
}) => {
  const partyConfig = PARTY[party] || PARTY.vendor;
  const { selectedOrganization } = useSelector((state) => state.auth);
  const orgId = selectedOrganization?.id;

  const [name, setName] = useState(defaultName || "");
  const [gstIn, setGstIn] = useState((defaultGstIn || "").toUpperCase());
  const [parentName, setParentName] = useState("Sundry Creditors");
  const [submitting, setSubmitting] = useState(false);

  // The submit button lives in the dialog footer, outside the <form>, so it
  // reaches the form by id. Generated rather than hard-coded because the
  // vendor and customer copies of this modal can be mounted at once.
  const formId = useId();

  const { data: parentsData } = useGetParentLedgers(orgId, { enabled: isOpen });
  const parents = parentsData?.results || parentsData || [];
  const parentOptions = Array.from(
    new Set([
      "Sundry Creditors",
      ...(Array.isArray(parents) ? parents.map((p) => p.parent).filter(Boolean) : []),
    ]),
  );

  // Both hooks run every render so the hook order never changes with
  // the ``party`` prop; only the chosen one is called.
  const createVendor = useQuickCreateVendor();
  const createCustomer = useQuickCreateCustomer();
  const create = party === "customer" ? createCustomer : createVendor;
  const queryClient = useQueryClient();

  // On open, seed from the OCR-derived defaults (bill vendor name + GST).
  // On close, reset — including clearing the seeds so the next open with
  // different defaults doesn't inherit the stale ones.
  useEffect(() => {
    if (isOpen) {
      setName(defaultName || "");
      setGstIn((defaultGstIn || "").toUpperCase());
    } else {
      setName("");
      setGstIn("");
      setParentName(partyConfig.defaultParent);
      setSubmitting(false);
    }
  }, [isOpen, defaultName, defaultGstIn]);

  const gstInValid =
    !gstIn || /^[0-9]{2}[A-Z0-9]{10}[A-Z0-9]{3}$/i.test(gstIn.trim());
  // Advisory: OCR sometimes pairs the supplier's GSTIN with another party's
  // name (the customer, or the software that generated the invoice).
  const nameGstMismatch = nameMatchesGstin(name, gstIn) === false;

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
      toast.success(`${partyConfig.noun} created — awaiting Tally sync`);
      onCreated?.(ledger);
      onClose?.();
    } catch (err) {
      // Correction 50: the vendor is already there — select it instead of
      // leaving the user stuck on "already exists".
      const existing = err?.data?.existing_ledger;
      if (err?.data?.error === "DUPLICATE_LEDGER" && existing?.id) {
        toast.info(`"${existing.name}" already exists — using the existing ledger`);
        queryClient.invalidateQueries({ queryKey: [partyConfig.cacheKey, orgId] });
        onCreated?.(existing);
        onClose?.();
        return;
      }
      toast.error(
        err?.data?.message || err?.message ||
          `Failed to create ${partyConfig.noun.toLowerCase()}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Add New ${partyConfig.noun}`}
      activeModal={isOpen}
      // Never pass undefined — HeadlessUI Dialog requires a function
      // or it throws mid-render and blanks the screen. No-op during
      // submit blocks backdrop/ESC close without crashing.
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
            disabled={!name.trim() || !gstInValid || submitting}
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
                Create {partyConfig.noun}
              </>
            )}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className={LABEL} htmlFor={`${formId}-name`}>
            {partyConfig.noun} Name
            <Required />
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ABC Enterprises"
            className={CONTROL}
            autoFocus
          />
          {nameGstMismatch && (
            <p className="mt-1 text-[11px] leading-snug text-amber-600 dark:text-amber-400">
              This GSTIN belongs to a business whose name starts with
              "{gstinNameInitial(gstIn)}". Check the party name on the bill —
              OCR may have picked the customer or the invoice software's name.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor={`${formId}-gstin`}>
              {partyConfig.noun} GSTIN
            </label>
            <input
              id={`${formId}-gstin`}
              type="text"
              value={gstIn}
              onChange={(e) => setGstIn(e.target.value.toUpperCase())}
              placeholder="15-char (optional)"
              // `CONTROL_VALIDATED` deliberately carries no border colour, so
              // both branches have to name one — appending a rose border to a
              // token that already had `border-slate-200` would be decided by
              // stylesheet order, not by which class comes last here.
              className={`${CONTROL_VALIDATED} ${
                gstInValid
                  ? "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20"
                  : "border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
              }`}
              maxLength={15}
            />
            {!gstInValid && (
              <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                Should be 15 chars — 2 digits, then 13 alphanumerics.
              </p>
            )}
          </div>

          <div>
            <label className={LABEL} htmlFor={`${formId}-parent`}>
              Parent Ledger
            </label>
            <input
              id={`${formId}-parent`}
              type="text"
              list="vendor-parent-options"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder={partyConfig.defaultParent}
              className={CONTROL}
            />
            <datalist id="vendor-parent-options">
              {parentOptions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Pick an existing parent, or type a new one.
            </p>
          </div>
        </div>

        {/* The sync notice reads as a footnote rather than a tinted panel:
            it is the same sentence on every open and should not compete
            with the fields above it. */}
        <p className="flex items-start gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <Icon
            icon="heroicons:information-circle"
            className="mt-px shrink-0 text-sm text-slate-400 dark:text-slate-500"
          />
          <span>
            The {partyConfig.noun.toLowerCase()} is created in Bill Munshi immediately and
            queued for Tally sync. Tally's TCP will import it in the next poll
            cycle, usually within ~30 seconds.
          </span>
        </p>
      </form>
    </Modal>
  );
};

export default AddVendorModal;
