import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';
import apiClient from '@/utils/apiClient';
import { downloadAuthenticatedFile } from "@/utils/downloadFile";

// ===========================
// TALLY PAYMENT VOUCHERS - QUERIES
// ===========================

/**
 * Get all Tally payment vouchers for an organization
 * @param {Object} params - Query parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.status - Optional bill status filter
 */
export const useGetTallyPaymentVouchers = (
  { organizationId, status, page, pageSize, search } = {},
  options = {},
) => {
  return useQuery({
    // page / pageSize / search belong in the key: the server paginates and
    // filters, so each combination is a distinct result set to cache.
    queryKey: [
      'tallyPaymentVouchers', organizationId, status, page || 1, pageSize || null, search || '',
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (page && page > 1) params.set('page', String(page));
      if (pageSize) params.set('page_size', String(pageSize));

      const query = params.toString();
      const response = await apiFetch(
        `tally/org/${organizationId}/payment-vouchers/${query ? `?${query}` : ''}`,
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
 * Get a specific Tally payment voucher
 */
export const useGetTallyPaymentVoucher = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ['tallyPaymentVoucher', organizationId, billId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/payment-vouchers/${billId}/`, {
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
 * Get detailed information for a Tally payment voucher
 */
export const useGetTallyPaymentVoucherDetails = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ['tallyPaymentVoucherDetails', organizationId, billId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/payment-vouchers/${billId}/details/`, {
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
// TALLY PAYMENT VOUCHERS - MUTATIONS
// ===========================

/**
 * Create a new Tally payment voucher
 */
export const useCreateTallyPaymentVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...newBill }) => {
      const response = await apiFetch(`tally/org/${organizationId}/payment-vouchers/`, {
        method: 'POST',
        body: JSON.stringify(newBill),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVouchers', variables.organizationId] });
    },
  });
};

/**
 * Upload Tally payment vouchers
 */
export const useUploadTallyPaymentVouchers = () => {
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
        `tally/org/${organizationId}/payment-vouchers/upload/`,
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
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVouchers', variables.organizationId] });
    },
  });
};

/**
 * Update a Tally payment voucher
 */
export const useUpdateTallyPaymentVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id, ...patch }) => {
      const response = await apiFetch(`tally/org/${organizationId}/payment-vouchers/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVouchers', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVoucher', variables.organizationId, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVoucherDetails', variables.organizationId, variables.id] });
    },
  });
};

/**
 * Delete a Tally payment voucher
 */
export const useDeleteTallyPaymentVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id }) => {
      const response = await apiFetch(`tally/org/${organizationId}/payment-vouchers/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVouchers', variables.organizationId] });
    },
  });
};

/**
 * Analyze a Tally payment voucher
 */
export const useAnalyzeTallyPaymentVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, billId }) => {
      const formData = new FormData();
      formData.append('bill_id', billId);
      
      const response = await apiClient.post(
        `tally/org/${organizationId}/payment-vouchers/analyze/`,
        formData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVouchers', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVoucher', variables.organizationId, variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVoucherDetails', variables.organizationId, variables.billId] });
    },
  });
};

/**
 * Verify a Tally payment voucher
 */
export const useVerifyTallyPaymentVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...verifyData }) => {
      const response = await apiFetch(`tally/org/${organizationId}/payment-vouchers/verify/`, {
        method: 'POST',
        body: JSON.stringify(verifyData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVouchers', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVoucher', variables.organizationId, variables.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVoucherDetails', variables.organizationId, variables.bill_id] });
    },
  });
};

/**
 * Sync a Tally payment voucher to Tally
 */
export const useSyncTallyPaymentVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, billId }) => {
      const response = await apiFetch(`tally/org/${organizationId}/payment-vouchers/sync/`, {
        method: 'POST',
        body: JSON.stringify({ bill_id: billId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVouchers', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVoucher', variables.organizationId, variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['tallyPaymentVoucherDetails', variables.organizationId, variables.billId] });
    },
  });
};

/**
 * Move Tally payment vouchers to another bill type
 */
export const useMoveTallyPaymentVouchers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, from, to, bill_ids }) =>
      apiFetch(`tally/org/${organizationId}/bills/move/`, {
        method: "POST",
        body: { from, to, bill_ids },
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tallyPaymentVouchers", variables.organizationId],
      });
    },
  });
};

/**
 * Trigger an authenticated download of the XLSX report for the given
 * status filter (Analysed / Verified / Synced — comma-separated string
 * or single value). Falls back to all three when ``status`` is empty.
 */
export const useDownloadTallyPaymentReport = () =>
  useMutation({
    mutationFn: async ({ organizationId, status = "", ids }) => {
      // When the caller passes ids, export exactly those bills. The list
      // goes in a POST body rather than the query string so a large
      // selection can't overflow the request line.
      if (ids?.length) {
        return downloadAuthenticatedFile(
          `tally/org/${organizationId}/payment-vouchers/report/`,
          { fallbackName: `tally-payment-vouchers.xlsx`, method: "post", data: { ids } },
        );
      }
      const params = status ? { status } : undefined;
      return downloadAuthenticatedFile(
        `tally/org/${organizationId}/payment-vouchers/report/`,
        { fallbackName: `tally-payment-vouchers.xlsx`, params },
      );
    },
  });
