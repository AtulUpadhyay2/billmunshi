import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../utils/apiClient";

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
