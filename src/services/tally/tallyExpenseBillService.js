import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';
import apiClient from '@/utils/apiClient';
import { downloadAuthenticatedFile } from "@/utils/downloadFile";

// ===========================
// TALLY EXPENSE BILLS - QUERIES
// ===========================

/**
 * Get all Tally expense bills for an organization
 * @param {Object} params - Query parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.status - Optional bill status filter
 */
export const useGetTallyExpenseBills = (
  { organizationId, status, page, pageSize, search } = {},
  options = {},
) => {
  return useQuery({
    // page / pageSize / search belong in the key: the server paginates and
    // filters, so each combination is a distinct result set to cache.
    queryKey: [
      'tallyExpenseBills', organizationId, status, page || 1, pageSize || null, search || '',
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (page && page > 1) params.set('page', String(page));
      if (pageSize) params.set('page_size', String(pageSize));

      const query = params.toString();
      const response = await apiFetch(
        `tally/org/${organizationId}/expense-bills/${query ? `?${query}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response;
    },
    enabled: !!organizationId,
    ...options,
  });
};

/**
 * Get a specific Tally expense bill
 */
export const useGetTallyExpenseBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ['tallyExpenseBill', organizationId, billId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/expense-bills/${billId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

/**
 * Get detailed information for a Tally expense bill
 */
export const useGetTallyExpenseBillDetails = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ['tallyExpenseBillDetails', organizationId, billId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/expense-bills/${billId}/details/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// ===========================
// TALLY EXPENSE BILLS - MUTATIONS
// ===========================

/**
 * Create a new Tally expense bill
 */
export const useCreateTallyExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...newBill }) => {
      const response = await apiFetch(`tally/org/${organizationId}/expense-bills/`, {
        method: 'POST',
        body: JSON.stringify(newBill),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBills', variables.organizationId] });
    },
  });
};

/**
 * Upload Tally expense bills
 */
export const useUploadTallyExpenseBills = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, formData }) => {
      // Create a new FormData to ensure proper field naming for Tally API
      const tallyFormData = new FormData();
      
      // The Tally API expects 'files' field, but the modal sends 'file'
      // So we need to transform the FormData
      for (let [key, value] of formData.entries()) {
        if (key === 'file') {
          // Rename 'file' to 'files' for Tally API
          tallyFormData.append('files', value);
        } else {
          // Keep other fields as is
          tallyFormData.append(key, value);
        }
      }
      
      // Use axios directly for FormData uploads
      // IMPORTANT: Set Content-Type to multipart/form-data for file uploads
      const response = await apiClient.post(
        `tally/org/${organizationId}/expense-bills/upload/`,
        tallyFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBills', variables.organizationId] });
    },
  });
};

/**
 * Update a Tally expense bill
 */
export const useUpdateTallyExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id, ...patch }) => {
      const response = await apiFetch(`tally/org/${organizationId}/expense-bills/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBill', variables.organizationId, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBillDetails', variables.organizationId, variables.id] });
    },
  });
};

/**
 * Delete a Tally expense bill
 */
export const useDeleteTallyExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id }) => {
      const response = await apiFetch(`tally/org/${organizationId}/expense-bills/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBills', variables.organizationId] });
    },
  });
};

/**
 * Analyze a Tally expense bill
 */
export const useAnalyzeTallyExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, billId }) => {
      const formData = new FormData();
      formData.append('bill_id', billId);
      
      const response = await apiClient.post(
        `tally/org/${organizationId}/expense-bills/analyze/`,
        formData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBill', variables.organizationId, variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBillDetails', variables.organizationId, variables.billId] });
    },
  });
};

/**
 * Verify a Tally expense bill
 */
export const useVerifyTallyExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...verifyData }) => {
      const response = await apiFetch(`tally/org/${organizationId}/expense-bills/verify/`, {
        method: 'POST',
        body: JSON.stringify(verifyData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBill', variables.organizationId, variables.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBillDetails', variables.organizationId, variables.bill_id] });
    },
  });
};

/**
 * Sync a Tally expense bill to Tally
 */
export const useSyncTallyExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, billId }) => {
      const response = await apiFetch(`tally/org/${organizationId}/expense-bills/sync/`, {
        method: 'POST',
        body: JSON.stringify({ bill_id: billId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBill', variables.organizationId, variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['tallyExpenseBillDetails', variables.organizationId, variables.billId] });
    },
  });
};

/**
 * Move Tally expense bills to another bill type
 */
export const useMoveTallyExpenseBills = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, from, to, bill_ids }) =>
      apiFetch(`tally/org/${organizationId}/bills/move/`, {
        method: "POST",
        body: { from, to, bill_ids },
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tallyExpenseBills", variables.organizationId],
      });
    },
  });
};

/**
 * Trigger an authenticated download of the XLSX report for the given
 * status filter (Analysed / Verified / Synced — comma-separated string
 * or single value). Falls back to all three when ``status`` is empty.
 */
export const useDownloadTallyExpenseReport = () =>
  useMutation({
    mutationFn: async ({ organizationId, status = "", ids }) => {
      // When the caller passes ids, export exactly those bills. The list
      // goes in a POST body rather than the query string so a large
      // selection can't overflow the request line.
      if (ids?.length) {
        return downloadAuthenticatedFile(
          `tally/org/${organizationId}/expense-bills/report/`,
          { fallbackName: `tally-journal-entries.xlsx`, method: "post", data: { ids } },
        );
      }
      const params = status ? { status } : undefined;
      return downloadAuthenticatedFile(
        `tally/org/${organizationId}/expense-bills/report/`,
        { fallbackName: `tally-journal-entries.xlsx`, params },
      );
    },
  });
