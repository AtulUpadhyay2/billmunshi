import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';
import apiClient from '@/utils/apiClient';
import { downloadAuthenticatedFile } from "@/utils/downloadFile";

// ===========================
// TALLY VENDOR BILLS - QUERIES
// ===========================

/**
 * Get all Tally vendor bills for an organization
 * @param {Object} params - Query parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.status - Optional bill status filter
 */
export const useGetTallyVendorBills = (
  { organizationId, status, page, pageSize, search } = {},
  options = {},
) => {
  return useQuery({
    // page / pageSize / search belong in the key: the server paginates and
    // filters, so each combination is a distinct result set to cache.
    queryKey: [
      'tallyVendorBills', organizationId, status, page || 1, pageSize || null, search || '',
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (page && page > 1) params.set('page', String(page));
      if (pageSize) params.set('page_size', String(pageSize));

      const query = params.toString();
      const response = await apiFetch(
        `tally/org/${organizationId}/vendor-bills/${query ? `?${query}` : ''}`,
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
 * Get a specific Tally vendor bill
 */
export const useGetTallyVendorBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ['tallyVendorBill', organizationId, billId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/vendor-bills/${billId}/`, {
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
 * Get detailed information for a Tally vendor bill
 */
export const useGetTallyVendorBillDetails = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ['tallyVendorBillDetails', organizationId, billId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/vendor-bills/${billId}/details/`, {
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
// TALLY VENDOR BILLS - MUTATIONS
// ===========================

/**
 * Create a new Tally vendor bill
 */
export const useCreateTallyVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...newBill }) => {
      const response = await apiFetch(`tally/org/${organizationId}/vendor-bills/`, {
        method: 'POST',
        body: JSON.stringify(newBill),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBills', variables.organizationId] });
    },
  });
};

/**
 * Upload Tally vendor bills
 */
export const useUploadTallyVendorBills = () => {
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
        `tally/org/${organizationId}/vendor-bills/upload/`,
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
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBills', variables.organizationId] });
    },
  });
};

/**
 * Update a Tally vendor bill
 */
export const useUpdateTallyVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id, ...patch }) => {
      const response = await apiFetch(`tally/org/${organizationId}/vendor-bills/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBill', variables.organizationId, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBillDetails', variables.organizationId, variables.id] });
    },
  });
};

/**
 * Delete a Tally vendor bill
 */
export const useDeleteTallyVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id }) => {
      const response = await apiFetch(`tally/org/${organizationId}/vendor-bills/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBills', variables.organizationId] });
    },
  });
};

/**
 * Analyze a Tally vendor bill
 */
export const useAnalyzeTallyVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, billId }) => {
      const formData = new FormData();
      formData.append('bill_id', billId);
      
      const response = await apiClient.post(
        `tally/org/${organizationId}/vendor-bills/analyze/`,
        formData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBill', variables.organizationId, variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBillDetails', variables.organizationId, variables.billId] });
    },
  });
};

/**
 * Verify a Tally vendor bill
 */
export const useVerifyTallyVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...verifyData }) => {
      const response = await apiFetch(`tally/org/${organizationId}/vendor-bills/verify/`, {
        method: 'POST',
        body: JSON.stringify(verifyData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBill', variables.organizationId, variables.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBillDetails', variables.organizationId, variables.bill_id] });
    },
  });
};

/**
 * Sync a Tally vendor bill to Tally
 */
export const useSyncTallyVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, billId }) => {
      const response = await apiFetch(`tally/org/${organizationId}/vendor-bills/sync/`, {
        method: 'POST',
        body: JSON.stringify({ bill_id: billId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBill', variables.organizationId, variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['tallyVendorBillDetails', variables.organizationId, variables.billId] });
    },
  });
};

/**
 * Move Tally vendor bills to another bill type
 */
export const useMoveTallyVendorBills = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, from, to, bill_ids }) =>
      apiFetch(`tally/org/${organizationId}/bills/move/`, {
        method: "POST",
        body: { from, to, bill_ids },
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tallyVendorBills", variables.organizationId],
      });
    },
  });
};

/**
 * Trigger an authenticated download of the XLSX report for the given
 * status filter (Analysed / Verified / Synced — comma-separated string
 * or single value). Falls back to all three when ``status`` is empty.
 */
export const useDownloadTallyVendorReport = () =>
  useMutation({
    mutationFn: async ({ organizationId, status = "" }) => {
      const params = status ? { status } : undefined;
      return downloadAuthenticatedFile(
        `tally/org/${organizationId}/vendor-bills/report/`,
        { fallbackName: `tally-purchase-vouchers.xlsx`, params },
      );
    },
  });
