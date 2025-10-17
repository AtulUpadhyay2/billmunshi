import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../../utils/apiClient";

// Fetch Tally Funnel Data
export const useGetTallyFunnel = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["tallyFunnel", organizationId],
    queryFn: () => apiFetch(`organizations/${organizationId}/tally/funnel/`),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Fetch Tally Overview Data
export const useGetTallyOverview = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["tallyOverview", organizationId],
    queryFn: () => apiFetch(`organizations/${organizationId}/tally/overview/`),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Fetch Tally Usage Data
export const useGetTallyUsage = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["tallyUsage", organizationId],
    queryFn: () => apiFetch(`organizations/${organizationId}/tally/usage/`),
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
