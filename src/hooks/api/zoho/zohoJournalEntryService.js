import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../utils/apiClient";
import apiClient from "../../../utils/apiClient";

// ==================== JOURNAL BILLS ====================

// Fetch journal bills list
export const useGetZohoJournalBills = ({ organizationId, status }, options = {}) => {
  return useQuery({
    queryKey: ["zohoJournalBills", organizationId, status],
    queryFn: () => {
      let url = `zoho/org/${organizationId}/journal-bills/`;
      if (status) {
        url += `?status=${status}`;
      }
      return apiFetch(url);
    },
    enabled: !!organizationId,
    ...options,
  });
};

// Fetch single journal bill
export const useGetZohoJournalBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ["zohoJournalBill", organizationId, billId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/journal-bills/${billId}/`),
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// Fetch journal bill details
export const useGetZohoJournalBillDetails = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ["zohoJournalBillDetails", organizationId, billId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/journal-bills/${billId}/details/`),
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// Create journal bill
export const useCreateZohoJournalBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, ...newBill }) =>
      apiFetch(`zoho/org/${organizationId}/journal-bills/`, {
        method: "POST",
        body: newBill,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBills", variables.organizationId],
      });
    },
  });
};

// Upload journal bills
export const useUploadZohoJournalBills = () => {
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
      // IMPORTANT: Set Content-Type to multipart/form-data for file uploads
      const response = await apiClient.post(
        `zoho/org/${organizationId}/journal-bills/upload/`,
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
        queryKey: ["zohoJournalBills", variables.organizationId],
      });
    },
  });
};

// Update journal bill
export const useUpdateZohoJournalBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id, ...patch }) =>
      apiFetch(`zoho/org/${organizationId}/journal-bills/${id}/`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBill", variables.organizationId, variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBillDetails", variables.organizationId, variables.id],
      });
    },
  });
};

// Delete journal bill
export const useDeleteZohoJournalBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id }) =>
      apiFetch(`zoho/org/${organizationId}/journal-bills/${id}/delete/`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBills", variables.organizationId],
      });
    },
  });
};

// Analyze journal bill
export const useAnalyzeZohoJournalBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/journal-bills/${billId}/analyze/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBill", variables.organizationId, variables.billId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBillDetails", variables.organizationId, variables.billId],
      });
    },
  });
};

// Verify journal bill
export const useVerifyZohoJournalBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, bill_id, ...verifyData }) =>
      apiFetch(`zoho/org/${organizationId}/journal-bills/${bill_id}/verify/`, {
        method: "POST",
        body: verifyData,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBill", variables.organizationId, variables.bill_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBillDetails", variables.organizationId, variables.bill_id],
      });
    },
  });
};

// Sync journal bill
export const useSyncZohoJournalBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/journal-bills/${billId}/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBill", variables.organizationId, variables.billId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoJournalBillDetails", variables.organizationId, variables.billId],
      });
    },
  });
};
