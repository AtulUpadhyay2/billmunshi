import { useMemo } from "react";
import { useUploadTallyVendorBills } from "./tallyVendorBillService";
import { useUploadTallyExpenseBills } from "./tallyExpenseBillService";
import { useUploadTallyPaymentVouchers } from "./tallyPaymentVoucherService";

/**
 * Every voucher type a Tally bill can be uploaded into, so one upload
 * button can reach all of them instead of one button per page.
 *
 * `group` mirrors the sidebar: Purchase and Payment sit under "Purchase"
 * (the payables cycle), Journal Entry stands on its own. Sales and Receipt
 * join as a "Sales" group when they ship.
 *
 * All three mutation hooks are called unconditionally on every render —
 * the list is a fixed module-level shape, so hook order never changes.
 */

export const TALLY_UPLOAD_TARGETS = [
  { value: "vendor", label: "Purchase Voucher", group: "Purchase" },
  { value: "payment", label: "Payment Voucher", group: "Purchase" },
  { value: "expense", label: "Journal Entry", group: "Journal" },
];

export const useTallyUploadTargets = () => {
  const vendor = useUploadTallyVendorBills();
  const payment = useUploadTallyPaymentVouchers();
  const expense = useUploadTallyExpenseBills();

  return useMemo(
    () => [
      { ...TALLY_UPLOAD_TARGETS[0], upload: vendor.mutateAsync },
      { ...TALLY_UPLOAD_TARGETS[1], upload: payment.mutateAsync },
      { ...TALLY_UPLOAD_TARGETS[2], upload: expense.mutateAsync },
    ],
    [vendor.mutateAsync, payment.mutateAsync, expense.mutateAsync],
  );
};

export default useTallyUploadTargets;
