import React, { useState } from "react";
import { Icon } from "@iconify/react";
import AddVendorModal from "@/components/modals/AddVendorModal";
import AddLedgerModal from "@/components/modals/AddLedgerModal";
import AddItemModal from "@/components/modals/AddItemModal";

/**
 * QuickAddMaster — a "+" addon that creates one Tally master (vendor
 * ledger / purchase-expense ledger / stock item) and opens its modal.
 *
 * Rendered as the trailing half of an input group: it stretches to the
 * height of the control it sits beside and shares that control's border,
 * so "this list is missing an entry" and "add an entry" are literally
 * adjacent. Use ``QuickAddGroup`` below rather than placing this by hand
 * — it wires up the flex row and the shared edge.
 *
 * On success the modals refresh the react-query caches for ledgers /
 * stock items, wait for that refetch, then call ``onCreated(record)``.
 * Wire it on every picker so the row the user just created is selected
 * straight away. The callback runs from a closure captured before the
 * refetch, so a handler that looks the id up in its options list should
 * fall back to ``record`` when the lookup misses.
 */

const KIND_TITLES = {
  vendor: "Create a new vendor ledger",
  ledger: "Create a new ledger",
  item: "Create a new inventory / stock item",
};

const QuickAddMaster = ({
  kind,
  onCreated,
  ledgerDefaultParent,
  ledgerTitle,
  title,
  disabled = false,
  className = "",
  // Vendor-only: seed the AddVendorModal with OCR-derived defaults
  // (vendor name + GSTIN from the bill) so the user doesn't retype.
  vendorDefaultName = "",
  vendorDefaultGstIn = "",
  // Item-only: seed the AddItemModal with OCR-derived defaults from
  // the line row (item name, unit, GST rate, HSN).
  itemDefaultName = "",
  itemDefaultUnit = "",
  itemDefaultGstRate = "",
  itemDefaultHsnCode = "",
}) => {
  const [open, setOpen] = useState(false);
  const label = title || KIND_TITLES[kind] || "Create new";

  const close = () => setOpen(false);
  const handleCreated = (record) => onCreated?.(record);

  return (
    <>
      {/* -ml-px collapses the doubled border where the two controls meet,
          so the group reads as one field rather than two abutting boxes. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={label}
        aria-label={label}
        className={`inline-flex shrink-0 items-center justify-center self-stretch -ml-px w-9 rounded-r-lg rounded-l-none border border-blue-300 dark:border-blue-900/70 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/70 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:z-10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors ${className}`}
      >
        <Icon icon="heroicons:plus" className="text-sm" />
      </button>

      {kind === "vendor" && (
        <AddVendorModal
          isOpen={open}
          onClose={close}
          onCreated={handleCreated}
          defaultName={vendorDefaultName}
          defaultGstIn={vendorDefaultGstIn}
        />
      )}
      {kind === "ledger" && (
        <AddLedgerModal
          isOpen={open}
          onClose={close}
          onCreated={handleCreated}
          defaultParent={ledgerDefaultParent}
          title={ledgerTitle || "Add New Ledger"}
        />
      )}
      {kind === "item" && (
        <AddItemModal
          isOpen={open}
          onClose={close}
          onCreated={handleCreated}
          defaultName={itemDefaultName}
          defaultUnit={itemDefaultUnit}
          defaultGstRate={itemDefaultGstRate}
          defaultHsnCode={itemDefaultHsnCode}
        />
      )}
    </>
  );
};

/**
 * QuickAddGroup — pairs a picker with its "+" addon as one input group.
 *
 *   <QuickAddGroup kind="ledger" disabled={isVerified}>
 *     <SearchableDropdown … triggerClassName="rounded-r-none" />
 *   </QuickAddGroup>
 *
 * ``items-stretch`` is what makes the button match the control's height
 * whatever size that control is, so this works for both the full-size
 * vendor picker and the compact in-row ones. Pass
 * ``triggerClassName="rounded-r-none"`` on the child so the shared edge
 * is flat — the wrapper can't reach inside to do it.
 */
export const QuickAddGroup = ({ children, className = "", ...addonProps }) => (
  <div className={`flex items-stretch min-w-0 ${className}`}>
    <div className="flex-1 min-w-0">{children}</div>
    <QuickAddMaster {...addonProps} />
  </div>
);

export default QuickAddMaster;
