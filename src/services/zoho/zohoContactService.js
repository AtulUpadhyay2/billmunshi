import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";

/**
 * Create a vendor or customer in the client's Zoho Books.
 *
 * The endpoint answers 409 with the contacts it found rather than
 * creating a near-duplicate, so the caller has to handle that case —
 * `apiFetch` rejects, and the candidates are on the error body. Resend
 * with `force: true` once the operator has looked at them and said it
 * really is a new supplier.
 *
 * On success the contact is already recorded locally, so the vendor and
 * customer lists are invalidated and the new row can be picked straight
 * away without pressing Sync.
 */
export const useCreateZohoContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, ...body }) =>
      apiFetch(`zoho/org/${organizationId}/contacts/create/`, {
        method: "POST",
        body,
      }),
    onSuccess: (data, variables) => {
      const key =
        variables.contact_type === "customer" ? "zohoCustomers" : "zohoVendors";
      queryClient.invalidateQueries({
        queryKey: [key, variables.organizationId],
      });
    },
  });
};
