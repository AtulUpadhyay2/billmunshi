import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../utils/apiClient";
import apiClient from "../../../utils/apiClient";

// ==================== VENDOR BILLS ====================

// Fetch vendor bills list
export const useGetVendorBills = ({ organizationId, status }, options = {}) => {
  return useQuery({
    queryKey: ["zohoVendorBills", organizationId, status],
    queryFn: () => {
      let url = `zoho/org/${organizationId}/vendor-bills/`;
      if (status) {
        url += `?status=${status}`;
      }
      return apiFetch(url);
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
      
      // Use axios directly for FormData uploads (apiClient already configured)
      const response = await apiClient.post(
        `zoho/org/${organizationId}/vendor-bills/upload/`,
        zohoFormData
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
