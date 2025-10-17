import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../utils/apiClient";

// Fetch Zoho Funnel Data
export const useGetZohoFunnel = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["zohoFunnel", organizationId],
    queryFn: () => apiFetch(`organizations/${organizationId}/zoho/funnel/`),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Fetch Zoho Overview Data
export const useGetZohoOverview = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["zohoOverview", organizationId],
    queryFn: () => apiFetch(`organizations/${organizationId}/zoho/overview/`),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Fetch Zoho Usage Data
export const useGetZohoUsage = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["zohoUsage", organizationId],
    queryFn: () => apiFetch(`organizations/${organizationId}/zoho/usage/`),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
