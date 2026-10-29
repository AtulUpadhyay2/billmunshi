import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Modal from "@/components/ui/Modal";
import { globalToast } from "@/utils/toast";
import { useCreateZohoContact } from "@/services/zoho/zohoContactService";

/**
 * Create a vendor or customer in the client's Zoho Books, from the bill
 * that needs it.
 *
 * Without this the operator had to leave the app, create the contact in
 * Zoho, come back and press Sync before they could pick it — on the most
 * common kind of bill there is.
 *
 * It is a dialog rather than a one-click action on purpose. A vendor
 * master is shared and permanent: the client's accountant reads GST
 * returns, TDS and ageing off it. The fields are shown first because
 * they come from OCR, and a mis-read name or GSTIN becomes a permanent
 * duplicate that splits the ledger without anyone noticing.
 *
 * The server does the duplicate search and answers 409 with what it
 * found. Those candidates are shown here, selectable, because picking
 * the existing contact is almost always the right outcome and should be
 * the easier one.
 */

const INPUT =
  "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white " +
  "dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white " +
  "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

const LABEL =
  "block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1";

const GST_TREATMENTS = [
  { value: "business_gst", label: "Registered business (has GSTIN)" },
  { value: "business_none", label: "Unregistered business" },
  { value: "consumer", label: "Consumer" },
  { value: "overseas", label: "Overseas" },
];

const CreateZohoContactDialog = ({
  open,
  onClose,
  organizationId,
  contactType = "vendor",
  /** Prefill, normally read off the bill the operator is looking at. */
  initialName = "",
  initialGstNo = "",
  initialPlaceOfSupply = "",
  /** For the audit entry: which bill this was done from. */
  billModule,
  billId,
  /** Called with the created (or chosen existing) contact. */
  onCreated,
}) => {
  const isCustomer = contactType === "customer";
  const noun = isCustomer ? "customer" : "vendor";

  const [name, setName] = useState(initialName);
  const [gstNo, setGstNo] = useState(initialGstNo);
  const [placeOfSupply, setPlaceOfSupply] = useState(initialPlaceOfSupply);
  const [treatment, setTreatment] = useState("");
  const [candidates, setCandidates] = useState(null);

  const { mutateAsync: createContact, isPending } = useCreateZohoContact();

  // Re-read the prefill when the dialog is opened against a different
  // bill; without this it keeps whatever was typed the first time.
  useEffect(() => {
    if (!open) return;
    setName(initialName || "");
    setGstNo(initialGstNo || "");
    setPlaceOfSupply(initialPlaceOfSupply || "");
    setTreatment("");
    setCandidates(null);
  }, [open, initialName, initialGstNo, initialPlaceOfSupply]);

  const effectiveTreatment =
    treatment || (gstNo.trim() ? "business_gst" : "business_none");

  const submit = async (force) => {
    if (!name.trim()) {
      globalToast.error(`Enter the ${noun}'s name.`);
      return;
    }
    try {
      const created = await createContact({
        organizationId,
        contact_type: contactType,
        contact_name: name.trim(),
        company_name: name.trim(),
        gst_no: gstNo.trim(),
        gst_treatment: effectiveTreatment,
        place_of_contact: placeOfSupply.trim(),
        ...(billModule && billId
          ? { bill_module: billModule, bill_id: billId }
          : {}),
        ...(force ? { force: true } : {}),
      });
      globalToast.success(created.detail || `${noun} created in Zoho Books.`);
      // Reported but not fatal: the contact exists either way, and the
      // operator should know the duplicate check did not run.
      if (created.search_warning) globalToast.warning(created.search_warning);
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      // apiFetch puts the response body on `err.data` and the code on
      // `err.status`. A 409 is the duplicate search reporting what it
      // found, not a failure — show the candidates instead of an error.
      const body = err?.data;
      if (err?.status === 409) {
        setCandidates(body || {});
        return;
      }
      globalToast.error(
        body?.detail || err?.message || `Could not create the ${noun}.`,
      );
    }
  };

  const localMatches = candidates?.existing_local || [];
  const zohoMatches = candidates?.existing_in_zoho || [];

  return (
    <Modal
      activeModal={open}
      onClose={onClose}
      title={`Create ${noun} in Zoho Books`}
      className="max-w-lg"
    >
      <div className="space-y-3 p-1">
        {!candidates && (
          <>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60">
              <Icon
                icon="heroicons:information-circle"
                className="text-blue-600 dark:text-blue-400 text-base shrink-0 mt-0.5"
              />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                This creates the {noun} in the client's Zoho Books, where it
                stays. Check the name and GSTIN against the bill — they were
                read from the document.
              </div>
            </div>

            <div>
              <label className={LABEL}>
                {isCustomer ? "Customer" : "Vendor"} name
                <span className="text-rose-600"> *</span>
              </label>
              <input
                className={INPUT}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As it should appear in Zoho Books"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL}>GSTIN</label>
                <input
                  className={`${INPUT} font-mono uppercase`}
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  placeholder="27AAAAA0000A1Z5"
                  maxLength={20}
                />
              </div>
              <div>
                <label className={LABEL}>
                  {isCustomer ? "Place of supply" : "State code"}
                </label>
                <input
                  className={`${INPUT} uppercase`}
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  placeholder="MH"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className={LABEL}>GST treatment</label>
              <select
                className={INPUT}
                value={effectiveTreatment}
                onChange={(e) => setTreatment(e.target.value)}
              >
                {GST_TREATMENTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {candidates && (
          <>
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="text-amber-600 dark:text-amber-500 text-base shrink-0 mt-0.5"
              />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {candidates.detail}
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {localMatches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => {
                    onCreated?.({
                      id: match.id,
                      contact_id: match.contact_id,
                      company_name: match.company_name,
                      gst_no: match.gst_no,
                      contact_type: contactType,
                    });
                    onClose?.();
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {match.company_name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {match.gst_no ? `GST: ${match.gst_no} · ` : ""}
                    matched on {match.matched_on} · click to use this one
                  </div>
                </button>
              ))}

              {/* In Zoho but not synced here, so there is no local row to
                  select yet. Running the sync is what makes it pickable. */}
              {zohoMatches.map((match) => (
                <div
                  key={match.contact_id}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {match.company_name}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {match.gst_no ? `GST: ${match.gst_no} · ` : ""}
                    already in Zoho but not synced here — run the{" "}
                    {noun}s sync to pick it
                  </div>
                </div>
              ))}
            </div>

            {candidates.search_warning && (
              <div className="text-[11px] text-amber-700 dark:text-amber-500">
                {candidates.search_warning}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          {candidates ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(true)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-60"
            >
              <Icon icon="heroicons:plus" className="text-sm" />
              It's a different {noun} — create it
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(false)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-60"
            >
              {isPending ? (
                <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
              ) : (
                <Icon icon="heroicons:plus" className="text-sm" />
              )}
              Create in Zoho
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CreateZohoContactDialog;
