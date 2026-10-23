import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiFetch } from "@/utils/apiClient";

/**
 * Role permissions and the bill approval step.
 *
 * Both are read from the server rather than inferred here. The matrix
 * is enforced server-side; this only decides what to draw, so the two
 * cannot drift into a button that always answers 403.
 */

export const ACTIONS = {
  VIEW_BILLS: "view_bills",
  UPLOAD_BILLS: "upload_bills",
  ANALYSE_BILLS: "analyse_bills",
  EDIT_BILLS: "edit_bills",
  VERIFY_BILLS: "verify_bills",
  APPROVE_BILLS: "approve_bills",
  SYNC_BILLS: "sync_bills",
  MOVE_BILLS: "move_bills",
  TRASH_BILLS: "trash_bills",
  DELETE_BILLS: "delete_bills",
  EXPORT_REPORTS: "export_reports",
  MANAGE_MASTERS: "manage_masters",
  MANAGE_SETTINGS: "manage_settings",
  MANAGE_MEMBERS: "manage_members",
};

const json = { "Content-Type": "application/json" };

/**
 * What the signed-in user may do in the selected organisation.
 *
 * While it is loading, `can()` answers true. The alternative is a
 * toolbar that appears a moment after the page, which reads as a bug to
 * everyone who has the rights — and the server refuses the request
 * anyway if they do not.
 */
export const useOrgPermissions = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const organizationId = selectedOrganization?.id;

  const query = useQuery({
    queryKey: ["orgPermissions", organizationId],
    queryFn: () =>
      apiFetch(`org/${organizationId}/me/permissions/`, { method: "GET", headers: json }),
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000,
  });

  const permissions = query.data?.permissions;
  const can = (action) => (permissions ? permissions.includes(action) : true);

  return {
    ...query,
    role: query.data?.role ?? null,
    permissions: permissions ?? [],
    approvalRequired: Boolean(query.data?.require_bill_approval),
    can,
  };
};

export const useApprovalQueue = (organizationId, filters = {}, options = {}) => {
  const search = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) search.append(k, v);
  });
  const qs = search.toString();
  return useQuery({
    queryKey: ["approvalQueue", organizationId, filters],
    queryFn: () =>
      apiFetch(`org/${organizationId}/approvals/${qs ? `?${qs}` : ""}`, {
        method: "GET",
        headers: json,
      }),
    enabled: Boolean(organizationId),
    ...options,
  });
};

export const useBillApproval = (organizationId, billId, options = {}) =>
  useQuery({
    queryKey: ["billApproval", organizationId, billId],
    queryFn: () =>
      apiFetch(`org/${organizationId}/approvals/${billId}/`, { method: "GET", headers: json }),
    enabled: Boolean(organizationId && billId),
    ...options,
  });

const useApprovalAction = (organizationId, action) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, note = "" }) =>
      apiFetch(`org/${organizationId}/approvals/${billId}/${action}/`, {
        method: "POST",
        headers: json,
        body: JSON.stringify({ note }),
      }),
    onSuccess: (_data, { billId }) => {
      queryClient.invalidateQueries({ queryKey: ["billApproval", organizationId, billId] });
      queryClient.invalidateQueries({ queryKey: ["approvalQueue", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["billActivity", organizationId, billId] });
    },
  });
};

export const useSubmitForApproval = (organizationId) =>
  useApprovalAction(organizationId, "submit");
export const useApproveBill = (organizationId) => useApprovalAction(organizationId, "approve");
export const useRejectBill = (organizationId) => useApprovalAction(organizationId, "reject");
