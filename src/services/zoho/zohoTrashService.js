import { useQueryClient, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';

// ===========================
// ZOHO TRASH
// ===========================
// The Zoho twin of tallyTrashService. Deleting a bill from any Zoho list
// moves it here instead of destroying it; it stays restorable for the
// retention window (30 days by default), after which the backend's purge
// command removes it for good.
//
// The Trash *screen* reads both modules through useUnifiedTrash (see
// pages/workspace/trash/useUnifiedTrash.js), which calls fetchZohoTrashPage
// below rather than a query hook of its own — one merged list needs one
// cache entry, not two that paginate independently.

/** URL slugs the Zoho trash API uses for each document type. */
export const ZOHO_TRASH_TYPES = {
  PURCHASE_VOUCHER: 'purchase-voucher',
  JOURNAL_ENTRY: 'journal-entry',
  EXPENSE_BILL: 'expense-bill',
  SALES_VOUCHER: 'sales-voucher',
  RECEIPT_VOUCHER: 'receipt-voucher',
  PAYMENT_VOUCHER: 'payment-voucher',
};

/**
 * The Zoho type tabs the Trash page renders before its first response
 * lands. `types` in the list payload is the source of truth and replaces
 * this as soon as it arrives. Mirrors TRASH_KINDS in
 * apps/module/zoho/trash.py.
 *
 * Note `purchase-voucher` and `journal-entry` are also Tally slugs — the
 * two modules deliberately use the same user-facing names. Anything that
 * keys off a slug must key off `module` too.
 */
export const ZOHO_TRASH_TYPE_TABS = [
  { slug: ZOHO_TRASH_TYPES.PURCHASE_VOUCHER, label: 'Purchase Voucher', list_path: '/zoho/vendor-bill' },
  { slug: ZOHO_TRASH_TYPES.JOURNAL_ENTRY, label: 'Journal Entry', list_path: '/zoho/journal-entry' },
  { slug: ZOHO_TRASH_TYPES.EXPENSE_BILL, label: 'Expense Bill', list_path: '/zoho/expense-bill' },
  { slug: ZOHO_TRASH_TYPES.SALES_VOUCHER, label: 'Sales Voucher', list_path: '/zoho/sales-bill' },
  { slug: ZOHO_TRASH_TYPES.RECEIPT_VOUCHER, label: 'Receipt Voucher', list_path: '/zoho/receipt-voucher' },
  { slug: ZOHO_TRASH_TYPES.PAYMENT_VOUCHER, label: 'Payment Voucher', list_path: '/zoho/payment-voucher' },
];

/**
 * Every Zoho bill-list query key, so a restore or purge refreshes the
 * page the document came from as well as the trash itself.
 */
export const ZOHO_BILL_LIST_KEYS = [
  'zohoVendorBills',
  'zohoExpenseBills',
  'zohoJournalBills',
  'zohoSalesBills',
  'zohoReceiptBills',
  'zohoPaymentBills',
];

/** One page of the Zoho trash list. */
export const fetchZohoTrashPage = ({ organizationId, type, search, page, pageSize }) => {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.set('type', type);
  if (search) params.set('search', search);
  if (page && page > 1) params.set('page', String(page));
  if (pageSize) params.set('page_size', String(pageSize));

  const query = params.toString();
  return apiFetch(
    `zoho/org/${organizationId}/trash/${query ? `?${query}` : ''}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
  );
};

export const restoreZohoTrashItem = ({ organizationId, type, id }) =>
  apiFetch(`zoho/org/${organizationId}/trash/${type}/${id}/restore/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

export const deleteZohoTrashItemForever = ({ organizationId, type, id }) =>
  apiFetch(`zoho/org/${organizationId}/trash/${type}/${id}/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

export const emptyZohoTrash = ({ organizationId, type }) => {
  const query = type && type !== 'all' ? `?type=${type}` : '';
  return apiFetch(`zoho/org/${organizationId}/trash/empty/${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Standalone mutation hooks, for callers that only ever touch Zoho.
 * The Trash screen uses useUnifiedTrash instead, which dispatches on the
 * row's module.
 */
export const useRestoreZohoTrashItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreZohoTrashItem,
    onSuccess: (_d, v) => invalidateZohoTrashAndLists(queryClient, v.organizationId),
  });
};

export const useDeleteZohoTrashItemForever = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteZohoTrashItemForever,
    onSuccess: (_d, v) => invalidateZohoTrashAndLists(queryClient, v.organizationId),
  });
};

export const invalidateZohoTrashAndLists = (queryClient, organizationId) => {
  queryClient.invalidateQueries({ queryKey: ['unifiedTrash', organizationId] });
  ZOHO_BILL_LIST_KEYS.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key, organizationId] });
  });
  // Counts on the dashboard change too once something leaves or re-enters
  // the active set.
  ['zohoOverview', 'zohoFunnel', 'zohoUsage'].forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key, organizationId] });
  });
};
