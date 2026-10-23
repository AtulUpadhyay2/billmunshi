import { useMemo } from "react";
import { useUploadTallyVendorBills } from "./tallyVendorBillService";
import { useUploadTallyExpenseBills } from "./tallyExpenseBillService";
import { useUploadTallyPaymentVouchers } from "./tallyPaymentVoucherService";
import { useUploadTallySalesBills } from "./tallySalesBillService";
import { useUploadTallyReceiptVouchers } from "./tallyReceiptVoucherService";

/**
 * Every voucher type a Tally bill can be uploaded into, so one upload
 * button can reach all of them instead of one button per page.
 *
 * `group` mirrors the sidebar: Purchase and Payment sit under "Purchase"
 * (the payables cycle), Sales under "Sales" (receivables), Journal Entry
 * stands on its own — journals arise on both sides.
 *
 * Every mutation hook is called unconditionally on every render — the
 * list is a fixed module-level shape, so hook order never changes.
 */

export const TALLY_UPLOAD_TARGETS = [
  { value: "vendor", label: "Purchase Voucher", group: "Purchase" },
  { value: "payment", label: "Payment Voucher", group: "Purchase" },
  { value: "sales", label: "Sales Voucher", group: "Sales" },
  { value: "receipt", label: "Receipt Voucher", group: "Sales" },
  { value: "expense", label: "Journal Entry", group: "Journal" },
];

export const useTallyUploadTargets = () => {
  const vendor = useUploadTallyVendorBills();
  const payment = useUploadTallyPaymentVouchers();
  const sales = useUploadTallySalesBills();
  const receipt = useUploadTallyReceiptVouchers();
  const expense = useUploadTallyExpenseBills();

  return useMemo(
    () => [
      { ...TALLY_UPLOAD_TARGETS[0], upload: vendor.mutateAsync },
      { ...TALLY_UPLOAD_TARGETS[1], upload: payment.mutateAsync },
      { ...TALLY_UPLOAD_TARGETS[2], upload: sales.mutateAsync },
      { ...TALLY_UPLOAD_TARGETS[3], upload: receipt.mutateAsync },
      { ...TALLY_UPLOAD_TARGETS[4], upload: expense.mutateAsync },
    ],
    [
      vendor.mutateAsync,
      payment.mutateAsync,
      sales.mutateAsync,
      receipt.mutateAsync,
      expense.mutateAsync,
    ],
  );
};

export default useTallyUploadTargets;
