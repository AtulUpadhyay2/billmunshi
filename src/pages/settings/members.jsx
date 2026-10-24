import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import Modal from "@/components/ui/Modal";
import TablePagination from "@/components/ui/TablePagination";
import { useGetMembers, useGetOrgRoles } from "@/services/memberService";
import { globalToast } from "@/utils/toast";
import apiClient from "@/utils/apiClient";
import {
  BADGE,
  BTN_BASE_SHAPE,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SECONDARY_SM,
  CONTROL_SEARCH,
  SECTION_TITLE,
  SUBTLE_LABEL,
} from "@/constants/ui";



// Identical to SUBTLE_LABEL apart from alignment and wrapping — it had
// drifted to tracking-[0.1em], a fourth tracking value in an app that
// already has two by role.
const thBase = `px-3 py-2 ltr:text-left rtl:text-right whitespace-nowrap ${SUBTLE_LABEL}`;
const tdBase = "px-3 py-1.5";

/**
 * Roles are no longer listed here.
 *
 * This file used to hold `ROLE_OPTIONS` — a hand-written copy of the four
 * role codes. It was a second source of truth next to the server's
 * permission matrix, and the two could drift apart with nothing failing:
 * the screen would offer a role, the permission check would refuse the
 * action, and the user would find out by hitting a 403. The list, the
 * one-line summaries and the per-action yes/no all come from
 * `GET org/<id>/roles/` now, which is generated from the same matrix
 * `HasOrgPermission` enforces.
 *
 * Nothing in this file re-words a permission label. If one reads badly it
 * is fixed in `apps/common/roles.py`, so both sides move together.
 */

/** Shown while the catalogue is in flight, so the tab strip keeps its shape. */
const ROLE_TABS_SKELETON = 4;

/** Groups `actions` by `group`, in the order the server says. */
const groupActions = (actions = [], groupOrder = []) => {
  const byGroup = new Map(groupOrder.map((g) => [g, []]));
  for (const action of actions) {
    // A group the server added but did not list still has to appear;
    // dropping it silently would hide a permission from the matrix.
    if (!byGroup.has(action.group)) byGroup.set(action.group, []);
    byGroup.get(action.group).push(action);
  }
  return [...byGroup.entries()].filter(([, items]) => items.length > 0);
};

/** Tick / cross cell for the comparison matrix. */
const AllowCell = ({ allowed, label }) => (
  <td className="px-3 py-1.5 text-center">
    <Icon
      icon={allowed ? "heroicons:check-circle-solid" : "heroicons:minus-small"}
      className={
        allowed
          ? "text-sm text-emerald-600 dark:text-emerald-500"
          : "text-sm text-slate-300 dark:text-slate-600"
      }
      aria-hidden="true"
    />
    <span className="sr-only">{allowed ? `${label}: yes` : `${label}: no`}</span>
  </td>
);

/**
 * What one role grants, grouped. Used inside the invite modal so the
 * answer is on screen at the moment the role is chosen, rather than
 * behind a separate page.
 */
const RoleDetail = ({ role, actions, groupOrder }) => {
  if (!role) return null;
  const granted = new Set(role.permissions || []);
  const groups = groupActions(actions, groupOrder);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
        {role.summary}
      </p>
      <div className="mt-2.5 grid sm:grid-cols-2 gap-x-4 gap-y-2">
        {groups.map(([group, items]) => (
          <div key={group}>
            <div className={SUBTLE_LABEL}>{group}</div>
            <ul className="mt-1 space-y-0.5">
              {items.map((action) => {
                const allowed = granted.has(action.value);
                return (
                  <li
                    key={action.value}
                    className={`flex items-start gap-1.5 text-[11px] ${
                      allowed
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    <Icon
                      icon={allowed ? "heroicons:check" : "heroicons:x-mark"}
                      className={`mt-0.5 shrink-0 text-[11px] ${
                        allowed ? "text-emerald-600 dark:text-emerald-500" : "text-slate-300 dark:text-slate-600"
                      }`}
                      aria-hidden="true"
                    />
                    <span>{action.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * All four roles side by side. Lives on the Members page itself rather
 * than only in the invite modal, because the question "what does this
 * person's role already let them do?" is asked about existing members too.
 */
const RoleMatrix = ({ roles, actions, groupOrder }) => {
  const groups = groupActions(actions, groupOrder);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr>
            <th className={`${thBase} w-[46%]`}>Action</th>
            {roles.map((role) => (
              <th key={role.value} className={`${thBase} text-center`}>
                {role.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(([group, items]) => (
            <React.Fragment key={group}>
              <tr>
                <td
                  colSpan={roles.length + 1}
                  className="px-3 pt-3 pb-1 bg-slate-50/60 dark:bg-slate-900/40"
                >
                  <span className={SUBTLE_LABEL}>{group}</span>
                </td>
              </tr>
              {items.map((action) => (
                <tr
                  key={action.value}
                  className="border-t border-slate-100 dark:border-slate-800/70"
                >
                  <td className="px-3 py-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                    {action.label}
                  </td>
                  {roles.map((role) => (
                    <AllowCell
                      key={role.value}
                      allowed={(action.allowed_for || []).includes(role.value)}
                      label={`${role.label} — ${action.label}`}
                    />
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 dark:border-slate-800">
            <td className="px-3 py-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              Total
            </td>
            {roles.map((role) => (
              <td
                key={role.value}
                className="px-3 py-2 text-center text-[11px] font-semibold text-slate-600 dark:text-slate-400"
              >
                {(role.permissions || []).length}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const roleStyle = (role) => {
  switch ((role || "").toUpperCase()) {
    case "ADMIN":
      return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700";
  }
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "U";

const Members = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const { data: roleCatalogue } = useGetOrgRoles(selectedOrganization?.id);
  const roles = roleCatalogue?.roles ?? [];
  const roleActions = roleCatalogue?.actions ?? [];
  const groupOrder = roleCatalogue?.group_order ?? [];
  const [showRoleMatrix, setShowRoleMatrix] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "MANAGER",
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMember, setDeletingMember] = useState(null);
  const [deleteUserAccount, setDeleteUserAccount] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: membersData, isLoading, isError, refetch } = useGetMembers(
    selectedOrganization?.id
  );

  useEffect(() => {
    if (isError) globalToast.error("Failed to load members data");
  }, [isError]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter, pageSize]);

  const members = membersData?.data?.members || [];
  const orgInfo = membersData?.data?.organization;

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== "ALL" && (m.role || "").toUpperCase() !== roleFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.user?.full_name?.toLowerCase().includes(q) ||
        m.user?.email?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q)
      );
    });
  }, [members, searchQuery, roleFilter]);

  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.is_active).length;
    const admins = members.filter((m) => (m.role || "").toUpperCase() === "ADMIN").length;
    return {
      total,
      active,
      admins,
      inactive: total - active,
    };
  }, [members]);

  const paged = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filtered.slice(startIdx, startIdx + pageSize);
  }, [filtered, page, pageSize]);

  const selectedRole = useMemo(
    () => roles.find((r) => r.value === inviteData.role) ?? null,
    [roles, inviteData.role],
  );

  const handleInputChange = (field, value) => {
    setInviteData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteData.email.trim()) {
      globalToast.error("Email is required");
      return;
    }
    try {
      setInviteLoading(true);
      const response = await apiClient.post(
        `/org/${selectedOrganization.id}/members/invite/`,
        inviteData
      );
      globalToast.success(response.data.message);
      if (response.data.user_created && response.data.default_password) {
        globalToast.info(`Default password: ${response.data.default_password}`);
      }
      setIsInviteModalOpen(false);
      setInviteData({ email: "", first_name: "", last_name: "", role: "MANAGER" });
      refetch();
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to invite member";
      globalToast.error(errorMessage);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    try {
      setDeleteLoading(true);
      const deleteParams = deleteUserAccount ? "?delete_user=true" : "";
      const response = await apiClient.delete(
        `/org/${selectedOrganization.id}/members/${deletingMember.id}/delete/${deleteParams}`
      );
      globalToast.success(response.data.message);
      setDeleteModalOpen(false);
      setDeletingMember(null);
      setDeleteUserAccount(false);
      refetch();
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to delete member";
      globalToast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const StatusBadge = ({ active }) => (
    <span
      className={`${BADGE} gap-1.5 ring-1 ${
        active
          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60"
          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Members
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {orgInfo?.name ? (
              <>
                Manage who has access to{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {orgInfo.name}
                </span>
                .
              </>
            ) : (
              "Manage who has access to this workspace."
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className={BTN_SECONDARY}
          >
            <Icon icon="heroicons:arrow-path" className={`text-sm ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className={BTN_PRIMARY}
          >
            <Icon icon="heroicons:plus" className="text-sm" />
            Invite member
          </button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
        {[
          { label: "Total members", value: stats.total, icon: "heroicons:users" },
          { label: "Active", value: stats.active, icon: "heroicons:check-badge" },
          { label: "Administrators", value: stats.admins, icon: "heroicons:shield-check" },
          { label: "Inactive", value: stats.inactive, icon: "heroicons:no-symbol" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center gap-2"
          >
            <span className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
              <Icon icon={s.icon} className="text-xs" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {s.label}
              </div>
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                {isLoading ? "—" : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role reference.
          Collapsed by default — it is an answer to a question, not part of
          the daily job — but on the Members page rather than only in the
          invite modal, because "what is this person's role letting them
          do?" gets asked about people who already have one. */}
      {roles.length > 0 && (
        <div className="shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowRoleMatrix((v) => !v)}
            aria-expanded={showRoleMatrix}
            className="w-full flex items-center justify-between gap-2 px-3 md:px-4 py-2.5 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Icon
                icon="heroicons:shield-check"
                className="shrink-0 text-base text-blue-600 dark:text-blue-400"
              />
              <span className={SECTION_TITLE}>What can each role do?</span>
              <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {roles.map((r) => `${r.label} ${r.permissions?.length ?? 0}`).join(" · ")}
              </span>
            </span>
            <span className={`${BTN_SECONDARY_SM} pointer-events-none`}>
              <Icon
                icon={showRoleMatrix ? "heroicons:chevron-up" : "heroicons:chevron-down"}
                className="text-[11px]"
              />
              {showRoleMatrix ? "Hide" : "Compare"}
            </span>
          </button>
          {showRoleMatrix && (
            <div className="border-t border-slate-200 dark:border-slate-800">
              <div className="px-3 md:px-4 py-2.5 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 border-b border-slate-200 dark:border-slate-800">
                {roles.map((role) => (
                  <div key={role.value}>
                    <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                      {role.label}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {role.summary}
                    </p>
                  </div>
                ))}
              </div>
              <RoleMatrix
                roles={roles}
                actions={roleActions}
                groupOrder={groupOrder}
              />
            </div>
          )}
        </div>
      )}

      {/* Members card — the only thing on the page that scrolls */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-3 md:px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
          <div className="relative w-full md:max-w-xs">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role…"
              className={CONTROL_SEARCH}
            />
          </div>

          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 self-start md:self-auto overflow-x-auto">
            {[
              { value: "ALL", label: "All" },
              ...roles.map((r) => ({ value: r.value, label: r.label })),
            ].map((tab) => {
              const isActive = roleFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setRoleFilter(tab.value)}
                  className={`inline-flex items-center px-2.5 h-7 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="px-3 md:px-4 py-2.5 space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2.5">
                <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Failed to load members</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
                There was an error loading the members data.
              </p>
              <button type="button" onClick={() => refetch()} className={BTN_SECONDARY}>
                <Icon icon="heroicons:arrow-path" className="text-sm" />
                Try again
              </button>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className={thBase}>Member</th>
                  <th className={thBase}>Role</th>
                  <th className={thBase}>Status</th>
                  <th className={`${thBase} hidden md:table-cell`}>Joined</th>
                  <th className={`${thBase} hidden lg:table-cell`}>Last updated</th>
                  <th className={`${thBase} ltr:text-right rtl:text-left w-20`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
                        <Icon
                          icon={searchQuery || roleFilter !== "ALL" ? "heroicons:magnifying-glass" : "heroicons:user-plus"}
                          className="text-lg"
                        />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery || roleFilter !== "ALL" ? "No members match your filters" : "No members yet"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery || roleFilter !== "ALL"
                          ? "Try a different keyword or role."
                          : "Invite your first teammate to get started."}
                      </p>
                      {!searchQuery && roleFilter === "ALL" && (
                        <button
                          type="button"
                          onClick={() => setIsInviteModalOpen(true)}
                          className={`mt-3 ${BTN_PRIMARY}`}
                        >
                          <Icon icon="heroicons:plus" className="text-sm" />
                          Invite member
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paged.map((member) => {
                    const isOwner = member.user?.email === selectedOrganization?.owner?.email;
                    return (
                      <tr
                        key={member.id}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className={tdBase}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="shrink-0 h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                {initials(member.user?.full_name)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {member.user?.full_name || "—"}
                                </span>
                                {isOwner && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 text-[9px] font-bold">
                                    <Icon icon="heroicons:star" className="text-[9px]" />
                                    Owner
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {member.user?.email || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={tdBase}>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${roleStyle(
                              member.role
                            )}`}
                          >
                            {(member.role || "Member").charAt(0) +
                              (member.role || "Member").slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className={tdBase}>
                          <StatusBadge active={member.is_active} />
                        </td>
                        <td className={`${tdBase} hidden md:table-cell`}>
                          <div className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <Icon icon="heroicons:calendar" className="text-xs text-slate-400" />
                            {formatDate(member.created_at)}
                          </div>
                        </td>
                        <td className={`${tdBase} hidden lg:table-cell text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap`}>
                          {formatDate(member.updated_at)}
                        </td>
                        <td className={`${tdBase} ltr:text-right rtl:text-left`}>
                          {!isOwner ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingMember(member);
                                setDeleteModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/60 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                            >
                              <Icon icon="heroicons:trash" className="text-[10px]" />
                              Remove
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Owner</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && filtered.length > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        title="Invite a new member"
        labelclassName="btn-outline-dark"
        activeModal={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteData({ email: "", first_name: "", last_name: "", role: "MANAGER" });
        }}
      >
        <form onSubmit={handleInviteMember} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Icon icon="heroicons:envelope" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
              <input
                type="email"
                required
                value={inviteData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="member@company.com"
                className={CONTROL_SEARCH}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First name
              </label>
              <div className="relative">
                <Icon icon="heroicons:user" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  value={inviteData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="First name"
                  className={CONTROL_SEARCH}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last name
              </label>
              <div className="relative">
                <Icon icon="heroicons:user" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  value={inviteData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Last name (optional)"
                  className={CONTROL_SEARCH}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {roles.length === 0
                ? Array.from({ length: ROLE_TABS_SKELETON }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                    />
                  ))
                : roles.map((opt) => {
                    const isActive = inviteData.role === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => handleInputChange("role", opt.value)}
                        className={`h-8 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
            </div>

            {/* What the chosen role actually grants. Inline rather than a
                tooltip: the whole point is that nobody should have to go
                looking for it before sending the invite. */}
            <div className="mt-2">
              <RoleDetail
                role={selectedRole}
                actions={roleActions}
                groupOrder={groupOrder}
              />
            </div>
          </div>

          <div className="flex gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <Icon icon="heroicons:information-circle" className="text-blue-600 dark:text-blue-400 text-base shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              New users are created with default password{" "}
              <code className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Bill@2025
              </code>
              . They can change it after their first sign-in.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800 mt-3">
            <button
              type="button"
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteData({ email: "", first_name: "", last_name: "", role: "MANAGER" });
              }}
              className={BTN_SECONDARY}
            >
              Cancel
            </button>
            <button type="submit" disabled={inviteLoading} className={BTN_PRIMARY}>
              {inviteLoading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                  Inviting…
                </>
              ) : (
                <>
                  <Icon icon="heroicons:paper-airplane" className="text-sm" />
                  Send invite
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        title="Remove member"
        labelclassName="btn-outline-danger"
        activeModal={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingMember(null);
          setDeleteUserAccount(false);
        }}
      >
        <div className="space-y-3">
          <div className="flex gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/60">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="text-rose-600 dark:text-rose-400 text-base shrink-0 mt-0.5"
            />
            <div className="text-xs">
              <p className="font-semibold text-rose-800 dark:text-rose-300">This action cannot be undone</p>
              <p className="text-rose-700/80 dark:text-rose-400/80 mt-1">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{deletingMember?.user?.full_name}</span> (
                {deletingMember?.user?.email}) from this workspace?
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <input
              type="checkbox"
              checked={deleteUserAccount}
              onChange={(e) => setDeleteUserAccount(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-rose-600 focus:ring-rose-500 focus:ring-offset-0 cursor-pointer"
            />
            <div className="text-xs">
              <div className="font-semibold text-slate-900 dark:text-white">
                Also delete user account permanently
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                The account will only be deleted if the user has no other active workspace memberships.
              </div>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800 mt-3">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletingMember(null);
                setDeleteUserAccount(false);
              }}
              className={BTN_SECONDARY}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteMember}
              disabled={deleteLoading}
              // Solid rose rather than BTN_DANGER's tinted treatment: this is the
              // confirm button of a destructive dialog, not a toolbar action.
              className={`${BTN_BASE_SHAPE} text-white bg-rose-600 hover:bg-rose-700 shadow-sm`}
            >
              {deleteLoading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Icon icon="heroicons:trash" className="text-sm" />
                  Remove member
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Members;
