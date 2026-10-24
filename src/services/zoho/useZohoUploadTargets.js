import { useMemo } from "react";
import { useUploadVendorBills } from "./zohoVendorBillService";
import { useUploadZohoExpenseBills } from "./zohoExpenseBillService";
import { useUploadZohoJournalBills } from "./zohoJournalEntryService";
import { useUploadZohoSalesBills } from "./zohoSalesBillService";
import { useUploadZohoReceiptBills } from "./zohoReceiptVoucherService";
import { useUploadZohoPaymentBills } from "./zohoPaymentVoucherService";

/**
 * Every voucher type a Zoho bill can be uploaded into, so one upload
 * button can reach all of them instead of one button per page.
 *
 * `group` mirrors the sidebar: Vendor Bill, Payment and Expense Bill sit
 * under "Purchase" (all three are payables — bills, vendor payments and
 * expenses), Sales and Receipt under "Sales" (receivables), Journal Entry
 * stands on its own — journals arise on both sides.
 *
 * Every mutation hook is called unconditionally on every render — the
 * list is a fixed module-level shape, so hook order never changes.
 */

export const ZOHO_UPLOAD_TARGETS = [
  { value: "vendor", label: "Vendor Bill", group: "Purchase" },
  { value: "payment", label: "Payment", group: "Purchase" },
  { value: "expense", label: "Expense Bill", group: "Purchase" },
  { value: "sales", label: "Sales", group: "Sales" },
  { value: "receipt", label: "Receipt", group: "Sales" },
  { value: "journal", label: "Journal Entry", group: "Journal" },
];

export const useZohoUploadTargets = () => {
  const vendor = useUploadVendorBills();
  const payment = useUploadZohoPaymentBills();
  const expense = useUploadZohoExpenseBills();
  const sales = useUploadZohoSalesBills();
  const receipt = useUploadZohoReceiptBills();
  const journal = useUploadZohoJournalBills();

  return useMemo(
    () => [
      { ...ZOHO_UPLOAD_TARGETS[0], upload: vendor.mutateAsync },
      { ...ZOHO_UPLOAD_TARGETS[1], upload: payment.mutateAsync },
      { ...ZOHO_UPLOAD_TARGETS[2], upload: expense.mutateAsync },
      { ...ZOHO_UPLOAD_TARGETS[3], upload: sales.mutateAsync },
      { ...ZOHO_UPLOAD_TARGETS[4], upload: receipt.mutateAsync },
      { ...ZOHO_UPLOAD_TARGETS[5], upload: journal.mutateAsync },
    ],
    [
      vendor.mutateAsync,
      payment.mutateAsync,
      expense.mutateAsync,
      sales.mutateAsync,
      receipt.mutateAsync,
      journal.mutateAsync,
    ],
  );
};

export default useZohoUploadTargets;
