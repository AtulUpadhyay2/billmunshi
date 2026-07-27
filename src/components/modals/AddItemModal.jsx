import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useQuickCreateItem } from "@/services/tally/tallyQuickCreateService";
import { useSelector } from "react-redux";

/**
 * AddItemModal — creates a Tally StockItem (inventory) row.
 *
 * Fields:
 *   - Item Name (required)
 *   - Item Unit (freetext, common units suggested)
 *   - GST Rate (dropdown: 0% / 5% / 12% / 18% / 28%)
 *   - HSN Code (optional)
 *   - Parent (Stock Group; freetext with default "Primary")
 */
const inputBase =
  "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const GST_RATES = ["0%", "5%", "12%", "18%", "28%", "Exempted"];
const COMMON_UNITS = ["Nos", "Pcs", "Kgs", "Ltrs", "Mtrs", "Box", "Set", "Pkt"];

const AddItemModal = ({ isOpen, onClose, onCreated }) => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const orgId = selectedOrganization?.id;

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("Nos");
  const [gstRate, setGstRate] = useState("18%");
  const [hsnCode, setHsnCode] = useState("");
  const [parent, setParent] = useState("Primary");
  const [submitting, setSubmitting] = useState(false);

  const create = useQuickCreateItem();

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setUnit("Nos");
      setGstRate("18%");
      setHsnCode("");
      setParent("Primary");
      setSubmitting(false);
    }
  }, [isOpen]);

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
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Item Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cable 10m, Printer Cartridge"
            className={inputBase}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Item Unit
            </label>
            <input
              type="text"
              list="item-unit-options"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Nos"
              className={inputBase}
            />
            <datalist id="item-unit-options">
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GST Rate
            </label>
            <select
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              className={inputBase}
            >
              {GST_RATES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              HSN Code
            </label>
            <input
              type="text"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="e.g. 8544"
              className={inputBase}
              maxLength={12}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stock Group (parent)
            </label>
            <input
              type="text"
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              placeholder="Primary"
              className={inputBase}
            />
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 px-3 py-2.5 text-[12px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <Icon icon="heroicons:information-circle" className="text-lg shrink-0 mt-0.5" />
          <span>
            Tally will use the GST Rate + HSN Code above when it creates
            the stock item on its side. Both are recommended for accurate
            tax classification.
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
            disabled={!name.trim() || submitting}
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
                Create Item
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddItemModal;
