import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";
import apiClient from "@/utils/apiClient";
import { downloadAuthenticatedFile } from "@/utils/downloadFile";

// ==================== PAYMENT VOUCHERS ====================

// Fetch payment vouchers list
export const useGetZohoPaymentBills = (
  { organizationId, status, page, pageSize, search } = {},
  options = {},
) => {
  return useQuery({
    // page / pageSize / search belong in the key: the server paginates and
    // filters, so each combination is a distinct result set to cache.
    queryKey: [
      "zohoPaymentBills", organizationId, status, page || 1, pageSize || null, search || "",
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (page && page > 1) params.set("page", String(page));
      if (pageSize) params.set("page_size", String(pageSize));

      const query = params.toString();
      return apiFetch(`zoho/org/${organizationId}/payment-bills/${query ? `?${query}` : ""}`);
    },
    enabled: !!organizationId,
    ...options,
  });
};

// Fetch single payment voucher details
export const useGetZohoPaymentBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ["zohoPaymentBill", organizationId, billId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/payment-bills/${billId}/details/`),
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// Upload payment vouchers
export const useUploadZohoPaymentBills = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, formData }) => {
      // The upload modal sends each file under 'file'; the Zoho upload
      // serializer expects a 'files' list.
      const zohoFormData = new FormData();
      for (let [key, value] of formData.entries()) {
        if (key === "file") {
          zohoFormData.append("files", value);
        } else {
          zohoFormData.append(key, value);
        }
      }

      const response = await apiClient.post(
        `zoho/org/${organizationId}/payment-bills/upload/`,
        zohoFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBills", variables.organizationId],
      });
    },
  });
};

// Update payment voucher
export const useUpdateZohoPaymentBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id, ...patch }) =>
      apiFetch(`zoho/org/${organizationId}/payment-bills/${id}/`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBill", variables.organizationId, variables.id],
      });
    },
  });
};

// Delete payment voucher
export const useDeleteZohoPaymentBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id }) =>
      apiFetch(`zoho/org/${organizationId}/payment-bills/${id}/delete/`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables) => {
      // The delete is a move to Trash now, so the Trash screen's
      // merged list is stale the moment this returns.
      queryClient.invalidateQueries({
        queryKey: ["unifiedTrash", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBills", variables.organizationId],
      });
    },
  });
};

// Analyze payment voucher
export const useAnalyzeZohoPaymentBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/payment-bills/${billId}/analyze/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Verify payment voucher
export const useVerifyZohoPaymentBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId, billData }) =>
      apiFetch(`zoho/org/${organizationId}/payment-bills/${billId}/verify/`, {
        method: "POST",
        body: billData,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Sync payment voucher
export const useSyncZohoPaymentBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/payment-bills/${billId}/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoPaymentBill", variables.organizationId, variables.billId],
      });
    },
  });
};

/**
 * Trigger an authenticated download of the XLSX report for the given
 * status filter (Analysed / Verified / Synced — comma-separated string
 * or single value). Falls back to all three when ``status`` is empty.
 */
export const useDownloadZohoPaymentReport = () =>
  useMutation({
    mutationFn: async ({ organizationId, status = "", ids }) => {
      // When the caller passes ids, export exactly those bills. The list
      // goes in a POST body rather than the query string so a large
      // selection can't overflow the request line.
      if (ids?.length) {
        return downloadAuthenticatedFile(
          `zoho/org/${organizationId}/payment-bills/report/`,
          { fallbackName: `zoho-payment-bills.xlsx`, method: "post", data: { ids } },
        );
      }
      const params = status ? { status } : undefined;
      return downloadAuthenticatedFile(
        `zoho/org/${organizationId}/payment-bills/report/`,
        { fallbackName: `zoho-payment-bills.xlsx`, params },
      );
    },
  });
