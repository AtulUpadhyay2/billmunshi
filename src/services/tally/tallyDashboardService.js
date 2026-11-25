import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

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

// GST position, the queue needing attention, and who we trade with most.
// Separate from overview because it aggregates the analysed rows rather
// than counting bills, and overview is on a 5-minute cache the operator
// does not want for a work queue.
export const useGetTallyInsights = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["tallyInsights", organizationId],
    queryFn: () => apiFetch(`organizations/${organizationId}/tally/insights/`),
    enabled: !!organizationId,
    staleTime: 60 * 1000,
    ...options,
  });
};
