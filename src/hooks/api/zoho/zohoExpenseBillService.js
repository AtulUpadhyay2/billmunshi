import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../utils/apiClient";
import apiClient from "../../../utils/apiClient";

// ==================== EXPENSE BILLS ====================

// Fetch expense bills list
export const useGetZohoExpenseBills = ({ organizationId, status }, options = {}) => {
  return useQuery({
    queryKey: ["zohoExpenseBills", organizationId, status],
    queryFn: () => {
      let url = `zoho/org/${organizationId}/expense-bills/`;
      if (status) {
        url += `?status=${status}`;
      }
      return apiFetch(url);
    },
    enabled: !!organizationId,
    ...options,
  });
};

// Fetch single expense bill
export const useGetZohoExpenseBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ["zohoExpenseBill", organizationId, billId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/expense-bills/${billId}/`),
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// Fetch expense bill details
export const useGetZohoExpenseBillDetails = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ["zohoExpenseBillDetails", organizationId, billId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/expense-bills/${billId}/details/`),
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// Create expense bill
export const useCreateZohoExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, ...newBill }) =>
      apiFetch(`zoho/org/${organizationId}/expense-bills/`, {
        method: "POST",
        body: newBill,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBills", variables.organizationId],
      });
    },
  });
};

// Upload expense bills
export const useUploadZohoExpenseBills = () => {
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
        `zoho/org/${organizationId}/expense-bills/upload/`,
        zohoFormData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBills", variables.organizationId],
      });
    },
  });
};

// Update expense bill
export const useUpdateZohoExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id, ...patch }) =>
      apiFetch(`zoho/org/${organizationId}/expense-bills/${id}/`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBill", variables.organizationId, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBillDetails", variables.organizationId, variables.id],
      });
    },
  });
};

// Delete expense bill
export const useDeleteZohoExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id }) =>
      apiFetch(`zoho/org/${organizationId}/expense-bills/${id}/delete/`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBills", variables.organizationId],
      });
    },
  });
};

// Analyze expense bill
export const useAnalyzeZohoExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/expense-bills/${billId}/analyze/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBill", variables.organizationId, variables.billId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBillDetails", variables.organizationId, variables.billId],
      });
    },
  });
};

// Verify expense bill
export const useVerifyZohoExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, bill_id, ...verifyData }) =>
      apiFetch(`zoho/org/${organizationId}/expense-bills/${bill_id}/verify/`, {
        method: "POST",
        body: verifyData,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBill", variables.organizationId, variables.bill_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBillDetails", variables.organizationId, variables.bill_id],
      });
    },
  });
};

// Sync expense bill
export const useSyncZohoExpenseBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/expense-bills/${billId}/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBill", variables.organizationId, variables.billId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoExpenseBillDetails", variables.organizationId, variables.billId],
      });
    },
  });
};
