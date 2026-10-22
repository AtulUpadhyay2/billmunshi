import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

/**
 * Bill activity log. One endpoint serves both reads: pass `billId` for a
 * single bill's timeline, leave it out for the organisation-wide feed.
 */

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export const useBillActivity = (organizationId, billId, options = {}) =>
  useQuery({
    queryKey: ["billActivity", organizationId, billId],
    queryFn: () =>
      apiFetch(`org/${organizationId}/activity/${buildQuery({ bill_id: billId, page_size: 100 })}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
    enabled: Boolean(organizationId && billId),
    ...options,
  });

export const useOrgActivity = (organizationId, filters = {}, options = {}) =>
  useQuery({
    queryKey: ["orgActivity", organizationId, filters],
    queryFn: () =>
      apiFetch(`org/${organizationId}/activity/${buildQuery(filters)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
    enabled: Boolean(organizationId),
    ...options,
  });
