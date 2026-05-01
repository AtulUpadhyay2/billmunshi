import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import Modal from "@/components/ui/Modal";
import TablePagination from "@/components/ui/TablePagination";
import { useGetMembers } from "@/services/memberService";
import { globalToast } from "@/utils/toast";
import apiClient from "@/utils/apiClient";

const inputBase =
  "w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "ACCOUNTANT", label: "Accountant" },
  { value: "CONSULTANT", label: "Consultant" },
];

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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${
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
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Members
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-base ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
          >
            <Icon icon="heroicons:plus" className="text-base" />
            Invite member
          </button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Total members", value: stats.total, icon: "heroicons:users" },
          { label: "Active", value: stats.active, icon: "heroicons:check-badge" },
          { label: "Administrators", value: stats.admins, icon: "heroicons:shield-check" },
          { label: "Inactive", value: stats.inactive, icon: "heroicons:no-symbol" },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 flex items-center gap-3"
          >
            <span className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
              <Icon icon={s.icon} className="text-sm" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {s.label}
              </div>
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                {isLoading ? "—" : s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Members card — fills remaining viewport */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-5 md:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="relative w-full md:max-w-sm">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role…"
              className={inputBase}
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 self-start md:self-auto overflow-x-auto">
            {[
              { value: "ALL", label: "All" },
              ...ROLE_OPTIONS.map((r) => ({ value: r.value, label: r.label })),
            ].map((tab) => {
              const isActive = roleFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setRoleFilter(tab.value)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
            <div className="px-5 md:px-6 py-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <Icon icon="heroicons:exclamation-triangle" className="text-2xl" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Failed to load members</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                There was an error loading the members data.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Icon icon="heroicons:arrow-path" className="text-base" />
                Try again
              </button>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Member</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden lg:table-cell">Last updated</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                        <Icon
                          icon={searchQuery || roleFilter !== "ALL" ? "heroicons:magnifying-glass" : "heroicons:user-plus"}
                          className="text-2xl"
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery || roleFilter !== "ALL" ? "No members match your filters" : "No members yet"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery || roleFilter !== "ALL"
                          ? "Try a different keyword or role."
                          : "Invite your first teammate to get started."}
                      </p>
                      {!searchQuery && roleFilter === "ALL" && (
                        <button
                          type="button"
                          onClick={() => setIsInviteModalOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
                        >
                          <Icon icon="heroicons:plus" className="text-base" />
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 flex items-center justify-center">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {initials(member.user?.full_name)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {member.user?.full_name || "—"}
                                </span>
                                {isOwner && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 text-[10px] font-bold">
                                    <Icon icon="heroicons:star" className="text-[10px]" />
                                    Owner
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {member.user?.email || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${roleStyle(
                              member.role
                            )}`}
                          >
                            {(member.role || "Member").charAt(0) +
                              (member.role || "Member").slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge active={member.is_active} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <Icon icon="heroicons:calendar" className="text-base text-slate-400" />
                            {formatDate(member.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(member.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isOwner ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingMember(member);
                                setDeleteModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                            >
                              <Icon icon="heroicons:trash" className="text-xs" />
                              Remove
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Owner</span>
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
        <form onSubmit={handleInviteMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Icon icon="heroicons:envelope" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                type="email"
                required
                value={inviteData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="member@company.com"
                className={inputBase}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First name
              </label>
              <div className="relative">
                <Icon icon="heroicons:user" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                <input
                  type="text"
                  value={inviteData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="First name"
                  className={inputBase}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last name
              </label>
              <div className="relative">
                <Icon icon="heroicons:user" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                <input
                  type="text"
                  value={inviteData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Last name (optional)"
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const isActive = inviteData.role === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleInputChange("role", opt.value)}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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
          </div>

          <div className="flex gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <Icon icon="heroicons:information-circle" className="text-blue-600 dark:text-blue-400 text-lg shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              New users are created with default password{" "}
              <code className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                Bill@2025
              </code>
              . They can change it after their first sign-in.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => {
                setIsInviteModalOpen(false);
                setInviteData({ email: "", first_name: "", last_name: "", role: "MANAGER" });
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
            >
              {inviteLoading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                  Inviting…
                </>
              ) : (
                <>
                  <Icon icon="heroicons:paper-airplane" className="text-base" />
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
        <div className="space-y-4">
          <div className="flex gap-3 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/60">
            <Icon
              icon="heroicons:exclamation-triangle"
              className="text-rose-600 dark:text-rose-400 text-xl shrink-0 mt-0.5"
            />
            <div className="text-sm">
              <p className="font-semibold text-rose-800 dark:text-rose-300">This action cannot be undone</p>
              <p className="text-rose-700/80 dark:text-rose-400/80 mt-1">
                Are you sure you want to remove{" "}
                <span className="font-semibold">{deletingMember?.user?.full_name}</span> (
                {deletingMember?.user?.email}) from this workspace?
              </p>
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <input
              type="checkbox"
              checked={deleteUserAccount}
              onChange={(e) => setDeleteUserAccount(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-rose-600 focus:ring-rose-500 focus:ring-offset-0 cursor-pointer"
            />
            <div className="text-sm">
              <div className="font-semibold text-slate-900 dark:text-white">
                Also delete user account permanently
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The account will only be deleted if the user has no other active workspace memberships.
              </div>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletingMember(null);
                setDeleteUserAccount(false);
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteMember}
              disabled={deleteLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg shadow-sm cursor-pointer"
            >
              {deleteLoading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Icon icon="heroicons:trash" className="text-base" />
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
