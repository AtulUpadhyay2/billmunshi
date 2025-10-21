import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';
import apiClient from '@/utils/apiClient';

// ===========================
// TALLY EXPENSE BILLS - QUERIES
// ===========================

/**
 * Get all Tally expense bills for an organization
 * @param {Object} params - Query parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.status - Optional bill status filter
 */
export const useGetTallyExpenseBills = ({ organizationId, status }, options = {}) => {
  return useQuery({
    queryKey: ['tallyExpenseBills', organizationId, status],
    queryFn: async () => {
      let url = `tally/org/${organizationId}/expense-bills/`;
      if (status) {
        url += `?status=${status}`;
      }
      const response = await apiFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
