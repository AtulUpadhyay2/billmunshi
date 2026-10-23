import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/utils/apiClient';
import apiClient from '@/utils/apiClient';
import { downloadAuthenticatedFile } from "@/utils/downloadFile";

// ===========================
// TALLY SALES INVOICES - QUERIES
// ===========================

/**
 * Get all Tally sales invoices for an organization
 * @param {Object} params - Query parameters
 * @param {string} params.organizationId - Organization ID
 * @param {string} params.status - Optional bill status filter
 */
export const useGetTallySalesBills = (
  { organizationId, status, page, pageSize, search } = {},
  options = {},
) => {
  return useQuery({
    // page / pageSize / search belong in the key: the server paginates and
    // filters, so each combination is a distinct result set to cache.
    queryKey: [
      'tallySalesBills', organizationId, status, page || 1, pageSize || null, search || '',
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (page && page > 1) params.set('page', String(page));
      if (pageSize) params.set('page_size', String(pageSize));

      const query = params.toString();
      const response = await apiFetch(
        `tally/org/${organizationId}/sales-bills/${query ? `?${query}` : ''}`,
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
 * Get a specific Tally sales invoice
 */
export const useGetTallySalesBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ['tallySalesBill', organizationId, billId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/sales-bills/${billId}/`, {
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
 * Get detailed information for a Tally sales invoice
 */
export const useGetTallySalesBillDetails = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ['tallySalesBillDetails', organizationId, billId],
    queryFn: async () => {
      const response = await apiFetch(`tally/org/${organizationId}/sales-bills/${billId}/details/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    enabled: !!organizationId && !!billId,
    // The document pane loads the file through a signed URL that the
    // serializer mints per response and that expires after an hour. A
    // detail page left open past that shows "You do not have access to
    // this file" where the bill image was. Refetching when the tab is
    // focused again re-signs it, which is also when somebody is about
    // to look at it.
    refetchOnWindowFocus: true,
    ...options,
  });
};

// ===========================
// TALLY SALES INVOICES - MUTATIONS
// ===========================

/**
 * Create a new Tally sales invoice
 */
export const useCreateTallySalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...newBill }) => {
      const response = await apiFetch(`tally/org/${organizationId}/sales-bills/`, {
        method: 'POST',
        body: JSON.stringify(newBill),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallySalesBills', variables.organizationId] });
    },
  });
};

/**
 * Upload Tally sales invoices
 */
export const useUploadTallySalesBills = () => {
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
        `tally/org/${organizationId}/sales-bills/upload/`,
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
      queryClient.invalidateQueries({ queryKey: ['tallySalesBills', variables.organizationId] });
    },
  });
};

/**
 * Update a Tally sales invoice
 */
export const useUpdateTallySalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id, ...patch }) => {
      const response = await apiFetch(`tally/org/${organizationId}/sales-bills/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallySalesBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallySalesBill', variables.organizationId, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tallySalesBillDetails', variables.organizationId, variables.id] });
    },
  });
};

/**
 * Delete a Tally sales invoice
 */
export const useDeleteTallySalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, id }) => {
      const response = await apiFetch(`tally/org/${organizationId}/sales-bills/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallySalesBills', variables.organizationId] });
    },
  });
};

/**
 * Analyze a Tally sales invoice
 */
export const useAnalyzeTallySalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, billId }) => {
      const formData = new FormData();
      formData.append('bill_id', billId);
      
      const response = await apiClient.post(
        `tally/org/${organizationId}/sales-bills/analyze/`,
        formData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallySalesBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallySalesBill', variables.organizationId, variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['tallySalesBillDetails', variables.organizationId, variables.billId] });
    },
  });
};

/**
 * Verify a Tally sales invoice
 */
export const useVerifyTallySalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, ...verifyData }) => {
      const response = await apiFetch(`tally/org/${organizationId}/sales-bills/verify/`, {
        method: 'POST',
        body: JSON.stringify(verifyData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallySalesBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallySalesBill', variables.organizationId, variables.bill_id] });
      queryClient.invalidateQueries({ queryKey: ['tallySalesBillDetails', variables.organizationId, variables.bill_id] });
    },
  });
};

/**
 * Sync a Tally sales invoice to Tally
 */
export const useSyncTallySalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, billId }) => {
      const response = await apiFetch(`tally/org/${organizationId}/sales-bills/sync/`, {
        method: 'POST',
        body: JSON.stringify({ bill_id: billId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tallySalesBills', variables.organizationId] });
      queryClient.invalidateQueries({ queryKey: ['tallySalesBill', variables.organizationId, variables.billId] });
      queryClient.invalidateQueries({ queryKey: ['tallySalesBillDetails', variables.organizationId, variables.billId] });
    },
  });
};

/**
 * Trigger an authenticated download of the XLSX report for the given
 * status filter (Analysed / Verified / Synced — comma-separated string
 * or single value). Falls back to all three when ``status`` is empty.
 */
export const useDownloadTallySalesReport = () =>
  useMutation({
    mutationFn: async ({ organizationId, status = "", ids }) => {
      // When the caller passes ids, export exactly those bills. The list
      // goes in a POST body rather than the query string so a large
      // selection can't overflow the request line.
      if (ids?.length) {
        return downloadAuthenticatedFile(
          `tally/org/${organizationId}/sales-bills/report/`,
          { fallbackName: `tally-sales-vouchers.xlsx`, method: "post", data: { ids } },
        );
      }
      const params = status ? { status } : undefined;
      return downloadAuthenticatedFile(
        `tally/org/${organizationId}/sales-bills/report/`,
        { fallbackName: `tally-sales-vouchers.xlsx`, params },
      );
    },
  });
