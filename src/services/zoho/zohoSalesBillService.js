import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";
import apiClient from "@/utils/apiClient";
import { downloadAuthenticatedFile } from "@/utils/downloadFile";

// ==================== SALES INVOICES ====================

// Fetch sales invoices list
export const useGetZohoSalesBills = (
  { organizationId, status, page, pageSize, search } = {},
  options = {},
) => {
  return useQuery({
    // page / pageSize / search belong in the key: the server paginates and
    // filters, so each combination is a distinct result set to cache.
    queryKey: [
      "zohoSalesBills", organizationId, status, page || 1, pageSize || null, search || "",
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (page && page > 1) params.set("page", String(page));
      if (pageSize) params.set("page_size", String(pageSize));

      const query = params.toString();
      return apiFetch(`zoho/org/${organizationId}/sales-bills/${query ? `?${query}` : ""}`);
    },
    enabled: !!organizationId,
    ...options,
  });
};

// Fetch single sales invoice details
export const useGetZohoSalesBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ["zohoSalesBill", organizationId, billId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/sales-bills/${billId}/details/`),
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// Upload sales invoices
export const useUploadZohoSalesBills = () => {
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
        `zoho/org/${organizationId}/sales-bills/upload/`,
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
        queryKey: ["zohoSalesBills", variables.organizationId],
      });
    },
  });
};

// Update sales invoice
export const useUpdateZohoSalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id, ...patch }) =>
      apiFetch(`zoho/org/${organizationId}/sales-bills/${id}/`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBill", variables.organizationId, variables.id],
      });
    },
  });
};

// Delete sales invoice
export const useDeleteZohoSalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id }) =>
      apiFetch(`zoho/org/${organizationId}/sales-bills/${id}/delete/`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBills", variables.organizationId],
      });
    },
  });
};

// Analyze sales invoice
export const useAnalyzeZohoSalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/sales-bills/${billId}/analyze/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Verify sales invoice
export const useVerifyZohoSalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId, billData }) =>
      apiFetch(`zoho/org/${organizationId}/sales-bills/${billId}/verify/`, {
        method: "POST",
        body: billData,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Sync sales invoice
export const useSyncZohoSalesBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/sales-bills/${billId}/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoSalesBill", variables.organizationId, variables.billId],
      });
    },
  });
};

/**
 * Trigger an authenticated download of the XLSX report for the given
 * status filter (Analysed / Verified / Synced — comma-separated string
 * or single value). Falls back to all three when ``status`` is empty.
 */
export const useDownloadZohoSalesReport = () =>
  useMutation({
    mutationFn: async ({ organizationId, status = "", ids }) => {
      // When the caller passes ids, export exactly those bills. The list
      // goes in a POST body rather than the query string so a large
      // selection can't overflow the request line.
      if (ids?.length) {
        return downloadAuthenticatedFile(
          `zoho/org/${organizationId}/sales-bills/report/`,
          { fallbackName: `zoho-sales-bills.xlsx`, method: "post", data: { ids } },
        );
      }
      const params = status ? { status } : undefined;
      return downloadAuthenticatedFile(
        `zoho/org/${organizationId}/sales-bills/report/`,
        { fallbackName: `zoho-sales-bills.xlsx`, params },
      );
    },
  });
