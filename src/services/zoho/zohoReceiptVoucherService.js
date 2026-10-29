import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";
import apiClient from "@/utils/apiClient";
import { downloadAuthenticatedFile } from "@/utils/downloadFile";

// ==================== RECEIPT VOUCHERS ====================

// Fetch receipt vouchers list
export const useGetZohoReceiptBills = (
  { organizationId, status, page, pageSize, search } = {},
  options = {},
) => {
  return useQuery({
    // page / pageSize / search belong in the key: the server paginates and
    // filters, so each combination is a distinct result set to cache.
    queryKey: [
      "zohoReceiptBills", organizationId, status, page || 1, pageSize || null, search || "",
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (page && page > 1) params.set("page", String(page));
      if (pageSize) params.set("page_size", String(pageSize));

      const query = params.toString();
      return apiFetch(`zoho/org/${organizationId}/receipt-bills/${query ? `?${query}` : ""}`);
    },
    enabled: !!organizationId,
    ...options,
  });
};

// Fetch single receipt voucher details
export const useGetZohoReceiptBill = ({ organizationId, billId }, options = {}) => {
  return useQuery({
    queryKey: ["zohoReceiptBill", organizationId, billId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/receipt-bills/${billId}/details/`),
    enabled: !!organizationId && !!billId,
    ...options,
  });
};

// Upload receipt vouchers
export const useUploadZohoReceiptBills = () => {
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
        `zoho/org/${organizationId}/receipt-bills/upload/`,
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
        queryKey: ["zohoReceiptBills", variables.organizationId],
      });
    },
  });
};

// Update receipt voucher
export const useUpdateZohoReceiptBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id, ...patch }) =>
      apiFetch(`zoho/org/${organizationId}/receipt-bills/${id}/`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBill", variables.organizationId, variables.id],
      });
    },
  });
};

// Delete receipt voucher
export const useDeleteZohoReceiptBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, id }) =>
      apiFetch(`zoho/org/${organizationId}/receipt-bills/${id}/delete/`, {
        method: "DELETE",
      }),
    onSuccess: (data, variables) => {
      // The delete is a move to Trash now, so the Trash screen's
      // merged list is stale the moment this returns.
      queryClient.invalidateQueries({
        queryKey: ["unifiedTrash", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBills", variables.organizationId],
      });
    },
  });
};

// Analyze receipt voucher
export const useAnalyzeZohoReceiptBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/receipt-bills/${billId}/analyze/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Verify receipt voucher
export const useVerifyZohoReceiptBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId, billData }) =>
      apiFetch(`zoho/org/${organizationId}/receipt-bills/${billId}/verify/`, {
        method: "POST",
        body: billData,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBill", variables.organizationId, variables.billId],
      });
    },
  });
};

// Sync receipt voucher
export const useSyncZohoReceiptBill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, billId }) =>
      apiFetch(`zoho/org/${organizationId}/receipt-bills/${billId}/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBills", variables.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBill", variables.organizationId, variables.billId],
      });
    },
  });
};

/**
 * Trigger an authenticated download of the XLSX report for the given
 * status filter (Analysed / Verified / Synced — comma-separated string
 * or single value). Falls back to all three when ``status`` is empty.
 */
export const useDownloadZohoReceiptReport = () =>
  useMutation({
    mutationFn: async ({ organizationId, status = "", ids }) => {
      // When the caller passes ids, export exactly those bills. The list
      // goes in a POST body rather than the query string so a large
      // selection can't overflow the request line.
      if (ids?.length) {
        return downloadAuthenticatedFile(
          `zoho/org/${organizationId}/receipt-bills/report/`,
          { fallbackName: `zoho-receipt-bills.xlsx`, method: "post", data: { ids } },
        );
      }
      const params = status ? { status } : undefined;
      return downloadAuthenticatedFile(
        `zoho/org/${organizationId}/receipt-bills/report/`,
        { fallbackName: `zoho-receipt-bills.xlsx`, params },
      );
    },
  });

/**
 * Move selected vouchers into another Zoho voucher type.
 *
 * The same endpoint every other bill type uses. This type had no hook
 * at all, so its page passed `allowMove={false}` and a voucher
 * uploaded here by mistake could not be moved out — the operator had to
 * delete it and upload it again, paying for the analysis twice.
 */
export const useMoveReceiptBills = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, from, to, bill_ids }) =>
      apiFetch(`zoho/org/${organizationId}/bills/move/`, {
        method: "POST",
        body: { from, to, bill_ids },
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoReceiptBill", variables.organizationId],
      });
    },
  });
};
