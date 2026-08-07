import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";
import apiClient from "@/utils/apiClient";
import { downloadAuthenticatedFile } from "@/utils/downloadFile";

// ==================== VENDOR BILLS ====================

// Fetch vendor bills list
export const useGetVendorBills = (
  { organizationId, status, page, pageSize, search } = {},
  options = {},
) => {
  return useQuery({
    // page / pageSize / search belong in the key: the server paginates and
    // filters, so each combination is a distinct result set to cache.
    queryKey: [
      "zohoVendorBills", organizationId, status, page || 1, pageSize || null, search || "",
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (page && page > 1) params.set("page", String(page));
      if (pageSize) params.set("page_size", String(pageSize));

      const query = params.toString();
      return apiFetch(`zoho/org/${organizationId}/vendor-bills/${query ? `?${query}` : ""}`);
    },
    enabled: !!organizationId,
    ...options,
  });
};

// Fetch single vendor bill details
export const useGetVendorBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ["zohoVendorBill", organizationId, billId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/vendor-bills/${billId}/details/`),
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// Create vendor bill
export const useCreateVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, ...newBill }) =>
      apiFetch(`zoho/org/${organizationId}/vendor-bills/`, {
        method: "POST",
        body: newBill,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBills", variables.organizationId],
      });
    },
  });
};

// Upload vendor bills
export const useUploadVendorBills = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, formData }) => {
      // Create a new FormData to ensure proper field naming for Zoho API
      const zohoFormData = new FormData();
      
      // The Zoho API expects 'files' field, but the modal sends 'file'
      // So we need to transform the FormData
      for (let [key, value] of formData.entries()) {
        if (key === 'file') {
          // Rename 'file' to 'files' for Zoho API
          zohoFormData.append('files', value);
        } else {
          // Keep other fields as is
          zohoFormData.append(key, value);
        }
      }
      
      // Use axios directly for FormData uploads
      // IMPORTANT: Delete Content-Type header to let browser set multipart/form-data with boundary
      const response = await apiClient.post(
        `zoho/org/${organizationId}/vendor-bills/upload/`,
        zohoFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBills", variables.organizationId],
      });
    },
  });
};

// Update vendor bill
export const useUpdateVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id, ...patch }) =>
      apiFetch(`zoho/org/${organizationId}/vendor-bills/${id}/`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBill", variables.organizationId, variables.id],
      });
    },
  });
};

// Delete vendor bill
export const useDeleteVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id }) =>
      apiFetch(`zoho/org/${organizationId}/vendor-bills/${id}/delete/`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBills", variables.organizationId],
      });
    },
  });
};

// Analyze vendor bill
export const useAnalyzeVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/vendor-bills/${billId}/analyze/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Verify vendor bill
export const useVerifyVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId, billData }) =>
      apiFetch(`zoho/org/${organizationId}/vendor-bills/${billId}/verify/`, {
        method: "POST",
        body: billData,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Sync vendor bill
export const useSyncVendorBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/vendor-bills/${billId}/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Move vendor bills
export const useMoveVendorBills = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, from, to, bill_ids }) =>
      apiFetch(`zoho/org/${organizationId}/bills/move/`, {
        method: "POST",
        body: { from, to, bill_ids },
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorBills", variables.organizationId],
      });
    },
  });
};

/**
 * Trigger an authenticated download of the XLSX report for the given
 * status filter (Analysed / Verified / Synced — comma-separated string
 * or single value). Falls back to all three when ``status`` is empty.
 */
export const useDownloadZohoVendorReport = () =>
  useMutation({
    mutationFn: async ({ organizationId, status = "", ids }) => {
      // When the caller passes ids, export exactly those bills. The list
      // goes in a POST body rather than the query string so a large
      // selection can't overflow the request line.
      if (ids?.length) {
        return downloadAuthenticatedFile(
          `zoho/org/${organizationId}/vendor-bills/report/`,
          { fallbackName: `zoho-vendor-bills.xlsx`, method: "post", data: { ids } },
        );
      }
      const params = status ? { status } : undefined;
      return downloadAuthenticatedFile(
        `zoho/org/${organizationId}/vendor-bills/report/`,
        { fallbackName: `zoho-vendor-bills.xlsx`, params },
      );
    },
  });
