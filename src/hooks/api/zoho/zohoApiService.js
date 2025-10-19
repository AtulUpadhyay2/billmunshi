import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../utils/apiClient";

// ==================== CREDENTIALS ====================

// Fetch Zoho credentials
export const useGetZohoCredentials = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["zohoCredentials", organizationId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/settings/credentials/`),
    enabled: !!organizationId,
    ...options,
  });
};

// Sync Zoho credentials
export const useSyncZohoCredentials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) =>
      apiFetch(`zoho/${organizationId}/credentials/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoCredentials", organizationId],
      });
    },
  });
};

// Generate Zoho token
export const useGenerateZohoToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) =>
      apiFetch(`zoho/org/${organizationId}/settings/generate-token/`, {
        method: "POST",
      }),
    onSuccess: (data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoCredentials", organizationId],
      });
    },
  });
};

// ==================== CHART OF ACCOUNTS ====================

// Fetch Chart of Accounts
export const useGetChartOfAccounts = ({ organizationId, page = 1 }, options = {}) => {
  return useQuery({
    queryKey: ["zohoChartOfAccounts", organizationId, page],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/chart-of-accounts/${page ? `?page=${page}` : ''}`),
    enabled: !!organizationId,
    ...options,
  });
};

// Sync Chart of Accounts
export const useSyncChartOfAccounts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) =>
      apiFetch(`zoho/org/${organizationId}/chart-of-accounts/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoChartOfAccounts", organizationId],
      });
    },
  });
};

// ==================== TAXES ====================

// Fetch Taxes
export const useGetTaxes = ({ organizationId, page = 1 }, options = {}) => {
  return useQuery({
    queryKey: ["zohoTaxes", organizationId, page],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/taxes/${page ? `?page=${page}` : ''}`),
    enabled: !!organizationId,
    ...options,
  });
};

// Sync Taxes
export const useSyncTaxes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) =>
      apiFetch(`zoho/org/${organizationId}/taxes/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoTaxes", organizationId],
      });
    },
  });
};

// ==================== TDS/TCS ====================

// Fetch TDS/TCS
export const useGetTdsTcs = ({ organizationId, page = 1, tax_type }, options = {}) => {
  return useQuery({
    queryKey: ["zohoTdsTcs", organizationId, page, tax_type],
    queryFn: () => {
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (tax_type) params.append('tax_type', tax_type);
      
      return apiFetch(`zoho/org/${organizationId}/tds-tcs/${params.toString() ? `?${params.toString()}` : ''}`);
    },
    enabled: !!organizationId,
    ...options,
  });
};

// Sync TDS/TCS
export const useSyncTdsTcs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) =>
      apiFetch(`zoho/org/${organizationId}/tds-tcs/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoTdsTcs", organizationId],
      });
    },
  });
};

// ==================== VENDORS ====================

// Fetch Vendors
export const useGetVendors = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["zohoVendors", organizationId],
    queryFn: () => apiFetch(`zoho/org/${organizationId}/vendors/`),
    enabled: !!organizationId,
    ...options,
  });
};

// Sync Vendors
export const useSyncVendors = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) =>
      apiFetch(`zoho/org/${organizationId}/vendors/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendors", organizationId],
      });
    },
  });
};

// ==================== VENDOR CREDITS ====================

// Fetch Vendor Credits
export const useGetVendorCredits = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["zohoVendorCredits", organizationId],
    queryFn: () => apiFetch(`zoho/${organizationId}/vendor-credits/`),
    enabled: !!organizationId,
    ...options,
  });
};

// Sync Vendor Credits
export const useSyncVendorCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId) =>
      apiFetch(`zoho/${organizationId}/vendor-credits/sync/`, {
        method: "POST",
      }),
    onSuccess: (data, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ["zohoVendorCredits", organizationId],
      });
    },
  });
};
