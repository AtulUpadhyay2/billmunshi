import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';

// ===========================
// TALLY TRASH
// ===========================
// Deleting a bill from any Tally list moves it here instead of destroying
// it. It stays restorable for the retention window (30 days by default),
// after which the backend's purge job removes it for good.

/** URL slugs the trash API uses for each document type. */
export const TRASH_TYPES = {
  PURCHASE_VOUCHER: 'purchase-voucher',
  JOURNAL_ENTRY: 'journal-entry',
  PAYMENT_VOUCHER: 'payment-voucher',
};

/**
 * Every query key the bill lists use, so a restore or purge refreshes the
 * page the document came from as well as the trash itself.
 */
const BILL_LIST_KEYS = [
  'tallyVendorBills',
  'tallyExpenseBills',
  'tallyPaymentBills',
];

const invalidateTrashAndLists = (queryClient, organizationId) => {
  queryClient.invalidateQueries({ queryKey: ['tallyTrash', organizationId] });
  BILL_LIST_KEYS.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key, organizationId] });
  });
  // Counts on the dashboard change too once something leaves or re-enters
  // the active set.
  queryClient.invalidateQueries({ queryKey: ['tallyDashboard', organizationId] });
};

/**
 * List trashed documents still inside the retention window.
 * @param {string} params.organizationId
 * @param {string} [params.type] - one of TRASH_TYPES, or 'all'
 * @param {string} [params.search] - matches the document name
 * @param {number} [params.page]
 */
export const useGetTallyTrash = (
  { organizationId, type, search, page, pageSize } = {},
  options = {},
) => {
  return useQuery({
    queryKey: [
      'tallyTrash', organizationId, type || 'all', search || '', page || 1, pageSize || 25,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.set('type', type);
      if (search) params.set('search', search);
      if (page && page > 1) params.set('page', String(page));
      if (pageSize) params.set('page_size', String(pageSize));

      const query = params.toString();
      return apiFetch(
        `tally/org/${organizationId}/trash/${query ? `?${query}` : ''}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } },
      );
    },
    enabled: !!organizationId,
    ...options,
  });
};

/** Restore one document out of the trash. Any org member may do this. */
export const useRestoreTallyTrashItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, type, id }) =>
      apiFetch(`tally/org/${organizationId}/trash/${type}/${id}/restore/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: (_data, variables) =>
      invalidateTrashAndLists(queryClient, variables.organizationId),
  });
};

/** Permanently destroy one trashed document. Admin only — 403 otherwise. */
export const useDeleteTallyTrashItemForever = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, type, id }) =>
      apiFetch(`tally/org/${organizationId}/trash/${type}/${id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: (_data, variables) =>
      invalidateTrashAndLists(queryClient, variables.organizationId),
  });
};

/** Permanently destroy everything in the trash. Admin only — 403 otherwise. */
export const useEmptyTallyTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, type }) => {
      const query = type && type !== 'all' ? `?type=${type}` : '';
      return apiFetch(`tally/org/${organizationId}/trash/empty/${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: (_data, variables) =>
      invalidateTrashAndLists(queryClient, variables.organizationId),
  });
};
