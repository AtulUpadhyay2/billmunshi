import React, { useState } from "react";
import { Icon } from "@iconify/react";
import AddVendorModal from "@/components/modals/AddVendorModal";
import AddLedgerModal from "@/components/modals/AddLedgerModal";
import AddItemModal from "@/components/modals/AddItemModal";

/**
 * QuickAddMastersBar — three "+ New" buttons shown at the top of a
 * Tally bill detail page. Clicking any opens its create-modal; on
 * success the react-query caches for ledgers / stock items are
 * invalidated so the corresponding dropdowns in the detail form
 * pick up the fresh row on next render.
 *
 * Optional per-callback props let the parent auto-select the newly
 * created row into its form state — otherwise the row just becomes
 * available in the dropdown for the user to pick manually.
 *
 * Compact variant (``compact`` prop) renders text-less icon buttons
 * for tight toolbars.
 */
const QuickAddMastersBar = ({
  onVendorCreated,
  onLedgerCreated,
  onItemCreated,
  ledgerDefaultParent,
  ledgerTitle,
  showVendor = true,
  showLedger = true,
  showItem = true,
  compact = false,
  className = "",
}) => {
  const [openVendor, setOpenVendor] = useState(false);
  const [openLedger, setOpenLedger] = useState(false);
  const [openItem, setOpenItem] = useState(false);

  const btn =
    "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border cursor-pointer transition-all";
  const btnStyle =
    "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60";

  return (
    <>
      <div className={`flex items-center flex-wrap gap-2 ${className}`}>
        {showVendor && (
          <button
            type="button"
            onClick={() => setOpenVendor(true)}
            className={`${btn} ${btnStyle}`}
            title="Create a new Tally vendor ledger"
          >
            <Icon icon="heroicons:user-plus" className="text-sm" />
            {!compact && "New Vendor"}
          </button>
        )}
        {showLedger && (
          <button
            type="button"
            onClick={() => setOpenLedger(true)}
            className={`${btn} ${btnStyle}`}
            title="Create a new Purchase / Expense ledger"
          >
            <Icon icon="heroicons:document-plus" className="text-sm" />
            {!compact && "New Ledger"}
          </button>
        )}
        {showItem && (
          <button
            type="button"
            onClick={() => setOpenItem(true)}
            className={`${btn} ${btnStyle}`}
            title="Create a new inventory / stock item"
          >
            <Icon icon="heroicons:cube" className="text-sm" />
            {!compact && "New Item"}
          </button>
        )}
      </div>

      <AddVendorModal
        isOpen={openVendor}
        onClose={() => setOpenVendor(false)}
        onCreated={(ledger) => {
          onVendorCreated?.(ledger);
        }}
      />
      <AddLedgerModal
        isOpen={openLedger}
        onClose={() => setOpenLedger(false)}
        onCreated={(ledger) => {
          onLedgerCreated?.(ledger);
        }}
        defaultParent={ledgerDefaultParent}
        title={ledgerTitle || "Add New Ledger"}
      />
      <AddItemModal
        isOpen={openItem}
        onClose={() => setOpenItem(false)}
        onCreated={(item) => {
          onItemCreated?.(item);
        }}
      />
    </>
  );
};

export default QuickAddMastersBar;
