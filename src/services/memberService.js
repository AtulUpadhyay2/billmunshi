import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

// Fetch organization members
export const useGetMembers = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["organizationMembers", organizationId],
    queryFn: () => apiFetch(`org/${organizationId}/members/`),
    enabled: !!organizationId,
    ...options,
  });
};

// Invite a member to the organization
export const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, ...memberData }) => 
      apiFetch(`org/${organizationId}/members/add/`, {
        method: "POST",
        body: memberData,
      }),
    onSuccess: (data, variables) => {
      // Invalidate and refetch members query
      queryClient.invalidateQueries({
        queryKey: ["organizationMembers", variables.organizationId],
      });
    },
  });
};

/**
 * The organisation's role catalogue: what each role is for and which
 * actions it allows.
 *
 * Served from ``apps/common/roles.py``, the same matrix ``HasOrgPermission``
 * enforces. The Members page used to carry its own hardcoded list of the
 * four role codes, which meant the screen could promise something the
 * permission check would then refuse — and nothing would notice until a
 * user hit a 403. Readable by any member: knowing what a Consultant may do
 * is not privileged.
 *
 * Cached for the session; the matrix only changes when the backend ships.
 */
export const useGetOrgRoles = (organizationId, options = {}) => {
  return useQuery({
    queryKey: ["organizationRoles", organizationId],
    queryFn: () => apiFetch(`org/${organizationId}/roles/`),
    enabled: !!organizationId,
    staleTime: Infinity,
    ...options,
  });
};
