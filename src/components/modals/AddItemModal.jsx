import React, { useState, useEffect, useId } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useQuickCreateItem } from "@/services/tally/tallyQuickCreateService";
import { useSelector } from "react-redux";
import { BTN_PRIMARY, BTN_SECONDARY, CONTROL, CONTROL_SELECT, CONTROL_SELECT_ARROW } from "@/constants/ui";
import { GST_RATE_PERCENTS } from "@/constants/gstRates";

/**
 * AddItemModal — creates a Tally StockItem (inventory) row.
 *
 * Fields:
 *   - Item Name (required)
 *   - Item Unit (freetext, common units suggested)
 *   - GST Rate (dropdown: 0% / 5% / 18% / 40% / Exempted)
 *   - HSN Code (optional)
 *   - Parent (Stock Group; freetext with default "Primary")
 *
 * A new master gets a current GST slab: a line still read at an old
 * 12% / 28% rate opens on the 18% default for the user to confirm.
 */
const GST_RATES = [...GST_RATE_PERCENTS.map((r) => `${r}%`), "Exempted"];
const COMMON_UNITS = ["Nos", "Pcs", "Kgs", "Ltrs", "Mtrs", "Box", "Set", "Pkt"];

/** Field label in a dialog body — see the note in `AddVendorModal`. */
const LABEL =
  "block mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] " +
  "text-slate-500 dark:text-slate-400";

const AddItemModal = ({
  isOpen,
  onClose,
  onCreated,
  // OCR-derived defaults so the modal opens with the line item's parsed
  // fields pre-filled — matches the AddVendorModal auto-fill pattern.
  defaultName = "",
  defaultUnit = "",
  defaultGstRate = "",
  defaultHsnCode = "",
}) => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const orgId = selectedOrganization?.id;

  const _initialGst = (defaultGstRate || "18%").toString();
  const _normalizedGst = GST_RATES.includes(_initialGst)
    ? _initialGst
    : "18%";

  const [name, setName] = useState(defaultName || "");
  const [unit, setUnit] = useState(defaultUnit || "Nos");
  const [gstRate, setGstRate] = useState(_normalizedGst);
  const [hsnCode, setHsnCode] = useState(defaultHsnCode || "");
  const [parent, setParent] = useState("Primary");
  const [submitting, setSubmitting] = useState(false);

  // The submit button sits in the dialog footer, outside the <form>, and
  // reaches it by id.
  const formId = useId();

  const create = useQuickCreateItem();

  useEffect(() => {
    if (isOpen) {
      setName(defaultName || "");
      setUnit(defaultUnit || "Nos");
      const seeded = (defaultGstRate || "18%").toString();
      setGstRate(GST_RATES.includes(seeded) ? seeded : "18%");
      setHsnCode(defaultHsnCode || "");
    } else {
      setName("");
      setUnit("Nos");
      setGstRate("18%");
      setHsnCode("");
      setParent("Primary");
      setSubmitting(false);
    }
  }, [isOpen, defaultName, defaultUnit, defaultGstRate, defaultHsnCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      const item = await create.mutateAsync({
        organizationId: orgId,
        name: name.trim(),
        unit: unit.trim(),
        gst_rate: gstRate,
        hsn_code: hsnCode.trim(),
        parent: parent.trim() || "Primary",
      });
      toast.success("Item created — awaiting Tally sync");
      onCreated?.(item);
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add New Item (Inventory)"
      activeModal={isOpen}
      onClose={submitting ? () => {} : onClose}
      className="max-w-lg"
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
                Create Item
              </>
            )}
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className={LABEL} htmlFor={`${formId}-name`}>
            Item Name
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
            placeholder="e.g. Cable 10m, Printer Cartridge"
            className={CONTROL}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor={`${formId}-unit`}>
              Item Unit
            </label>
            <input
              id={`${formId}-unit`}
              type="text"
              list="item-unit-options"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Nos"
              className={CONTROL}
            />
            <datalist id="item-unit-options">
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={LABEL} htmlFor={`${formId}-gst`}>
              GST Rate
            </label>
            <select
              id={`${formId}-gst`}
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              className={CONTROL_SELECT}
              style={CONTROL_SELECT_ARROW}
            >
              {GST_RATES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL} htmlFor={`${formId}-hsn`}>
              HSN Code
            </label>
            <input
              id={`${formId}-hsn`}
              type="text"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="e.g. 8544"
              className={CONTROL}
              maxLength={12}
            />
          </div>

          <div>
            <label className={LABEL} htmlFor={`${formId}-parent`}>
              Stock Group
            </label>
            <input
              id={`${formId}-parent`}
              type="text"
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              placeholder="Primary"
              className={CONTROL}
            />
          </div>
        </div>

        {/* A footnote, not a tinted panel — it says why the two tax fields
            above are worth filling in, and is read once. */}
        <p className="flex items-start gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <Icon
            icon="heroicons:information-circle"
            className="mt-px shrink-0 text-sm text-slate-400 dark:text-slate-500"
          />
          <span>
            Tally uses the GST Rate and HSN Code above when it creates the
            stock item on its side. Both are recommended for accurate tax
            classification.
          </span>
        </p>
      </form>
    </Modal>
  );
};

export default AddItemModal;
