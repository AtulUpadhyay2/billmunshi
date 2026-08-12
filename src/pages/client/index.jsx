import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import apiClient from "@/utils/apiClient";
import Modal from "@/components/ui/Modal";
import TablePagination from "@/components/ui/TablePagination";
import { setSelectedOrganization } from "@/store/api/auth/authSlice";
import { CONTROL_SEARCH } from "@/constants/ui";


const btnBase =
  "inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50";
const btnNeutral =
  `${btnBase} text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`;
const btnPrimary =
  `${btnBase} text-white bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20`;

const thBase =
  "px-3 py-2 ltr:text-left rtl:text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 whitespace-nowrap";
const tdBase = "px-3 py-1.5";

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-purple-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-indigo-600",
  "from-fuchsia-500 to-purple-600",
];

const avatarFor = (name = "") => {
  const idx =
    Math.abs(Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0)) %
    AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
};

const ClientList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    module: "tally",
    gst_number: "",
  });

  const moduleOptions = [
    { value: "tally", label: "Tally" },
    { value: "zoho", label: "Zoho" },
  ];

  useEffect(() => {
    fetchClients();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const fetchClients = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const response = await apiClient.get("/org/");
      setClients(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch clients list");
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    try {
      setCreateLoading(true);
      const response = await apiClient.post("/org/create-with-module/", formData);
      toast.success(response.data.data.message);
      setShowCreateModal(false);
      setFormData({ name: "", module: "tally", gst_number: "" });
      fetchClients(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Failed to create organization";
      toast.error(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOrganizationClick = (organization) => {
    dispatch(setSelectedOrganization(organization));
    navigate("/dashboard");
    toast.success(`Switched to ${organization.name}`);
  };

  const StatusBadge = ({ status }) => {
    const s = (status || "").toUpperCase();
    const map = {
      ACTIVE: { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", txt: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-100 dark:ring-emerald-900/60" },
      INACTIVE: { dot: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-950/40", txt: "text-rose-700 dark:text-rose-400", ring: "ring-rose-100 dark:ring-rose-900/60" },
      PENDING: { dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40", txt: "text-amber-700 dark:text-amber-400", ring: "ring-amber-100 dark:ring-amber-900/60" },
    };
    const c = map[s] || { dot: "bg-slate-400", bg: "bg-slate-100 dark:bg-slate-800", txt: "text-slate-600 dark:text-slate-300", ring: "ring-slate-200 dark:ring-slate-700" };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${c.bg} ${c.txt} ${c.ring}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
        {s ? s.charAt(0) + s.slice(1).toLowerCase() : "—"}
      </span>
    );
  };

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (statusFilter !== "ALL" && (c.status || "").toUpperCase() !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.unique_name?.toLowerCase().includes(q) ||
        c.gst_number?.toLowerCase().includes(q) ||
        c.owner?.full_name?.toLowerCase().includes(q) ||
        c.owner?.email?.toLowerCase().includes(q) ||
        c.created_by?.full_name?.toLowerCase().includes(q)
      );
    });
  }, [clients, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => (c.status || "").toUpperCase() === "ACTIVE").length;
    const inactive = clients.filter((c) => (c.status || "").toUpperCase() === "INACTIVE").length;
    const pending = clients.filter((c) => (c.status || "").toUpperCase() === "PENDING").length;
    return { total, active, inactive, pending };
  }, [clients]);

  const paged = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filtered.slice(startIdx, startIdx + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Clients
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Manage all your client workspaces from one place.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fetchClients(true)}
            disabled={refreshing}
            className={btnNeutral}
          >
            <Icon icon="heroicons:arrow-path" className={`text-sm ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className={btnPrimary}
          >
            <Icon icon="heroicons:plus" className="text-sm" />
            Add new client
          </button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
        {[
          { label: "Total clients", value: stats.total, icon: "heroicons:building-office-2" },
          { label: "Active", value: stats.active, icon: "heroicons:check-badge" },
          { label: "Pending", value: stats.pending, icon: "heroicons:clock" },
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
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card — the only thing on the page that scrolls */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-3 md:px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
          <div className="relative w-full md:max-w-xs">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, owner, GSTIN…"
              className={CONTROL_SEARCH}
            />
          </div>

          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 self-start md:self-auto overflow-x-auto">
            {[
              { value: "ALL", label: "All", count: stats.total },
              { value: "ACTIVE", label: "Active", count: stats.active },
              { value: "PENDING", label: "Pending", count: stats.pending },
              { value: "INACTIVE", label: "Inactive", count: stats.inactive },
            ].map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60"
                        : "bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="px-3 md:px-4 py-2.5 space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className={thBase}>Client</th>
                  <th className={`${thBase} hidden md:table-cell`}>Unique ID</th>
                  <th className={`${thBase} hidden lg:table-cell`}>GSTIN</th>
                  <th className={`${thBase} hidden md:table-cell`}>Owner</th>
                  <th className={thBase}>Status</th>
                  <th className={`${thBase} hidden xl:table-cell`}>Created by</th>
                  <th className={`${thBase} hidden lg:table-cell`}>Created</th>
                  <th className={`${thBase} ltr:text-right rtl:text-left w-16`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
                        <Icon
                          icon={searchQuery || statusFilter !== "ALL" ? "heroicons:magnifying-glass" : "heroicons:building-office-2"}
                          className="text-lg"
                        />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery || statusFilter !== "ALL" ? "No clients match your filters" : "No clients yet"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery || statusFilter !== "ALL"
                          ? "Try a different keyword or change the filter."
                          : "Create your first client to get started."}
                      </p>
                      {!searchQuery && statusFilter === "ALL" && (
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(true)}
                          className={`mt-3 ${btnPrimary}`}
                        >
                          <Icon icon="heroicons:plus" className="text-sm" />
                          Add new client
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paged.map((client) => {
                    const grad = avatarFor(client.name || "");
                    return (
                      <tr
                        key={client.id}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className={tdBase}>
                          <button
                            type="button"
                            onClick={() => handleOrganizationClick(client)}
                            className="flex items-center gap-2 group/link cursor-pointer min-w-0 text-left"
                          >
                            <div className={`shrink-0 h-7 w-7 rounded-lg bg-linear-to-br ${grad} flex items-center justify-center shadow-sm ring-1 ring-black/5`}>
                              <span className="text-white font-bold text-[11px]">
                                {client.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover/link:text-blue-700 dark:group-hover/link:text-blue-400 truncate transition-colors">
                                {client.name}
                              </div>
                              <div className="md:hidden text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                                {client.unique_name}
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className={`${tdBase} hidden md:table-cell`}>
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
                            {client.unique_name}
                          </span>
                        </td>
                        <td className={`${tdBase} hidden lg:table-cell`}>
                          {client.gst_number ? (
                            <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                              {client.gst_number}
                            </span>
                          ) : (
                            <span className="text-[10px] italic text-slate-400 dark:text-slate-500">
                              Not provided
                            </span>
                          )}
                        </td>
                        <td className={`${tdBase} hidden md:table-cell`}>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-45">
                              {client.owner?.full_name || "—"}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-45">
                              {client.owner?.email || ""}
                            </div>
                          </div>
                        </td>
                        <td className={tdBase}>
                          <StatusBadge status={client.status} />
                        </td>
                        <td className={`${tdBase} hidden xl:table-cell`}>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-45">
                              {client.created_by?.full_name || "—"}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-45">
                              {client.created_by?.email || ""}
                            </div>
                          </div>
                        </td>
                        <td className={`${tdBase} hidden lg:table-cell`}>
                          <div className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <Icon icon="heroicons:calendar" className="text-xs text-slate-400" />
                            {formatDate(client.created_at)}
                          </div>
                        </td>
                        <td className={`${tdBase} ltr:text-right rtl:text-left`}>
                          <button
                            type="button"
                            onClick={() => handleOrganizationClick(client)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 rounded-md hover:bg-blue-100 dark:hover:bg-blue-950/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          >
                            Open
                            <Icon icon="heroicons:arrow-right" className="text-[10px]" />
                          </button>
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
        {!loading && filtered.length > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Create Modal */}
      <Modal
        title="Create new client"
        labelclassName="btn-outline-dark"
        activeModal={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: "", module: "tally", gst_number: "" });
        }}
      >
        <form onSubmit={handleCreateClient} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Icon icon="heroicons:building-office" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter client / organization name"
                required
                className={CONTROL_SEARCH}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GSTIN
            </label>
            <div className="relative">
              <Icon icon="heroicons:receipt-percent" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
              <input
                type="text"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                placeholder="Enter GSTIN (optional)"
                className={CONTROL_SEARCH}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Module
            </label>
            <div className="grid grid-cols-2 gap-2">
              {moduleOptions.map((opt) => {
                const isActive = formData.module === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, module: opt.value })}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {isActive && <Icon icon="heroicons:check-circle" className="text-sm" />}
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800 mt-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: "", module: "tally", gst_number: "" });
              }}
              className={btnNeutral}
            >
              Cancel
            </button>
            <button type="submit" disabled={createLoading} className={btnPrimary}>
              {createLoading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Icon icon="heroicons:plus" className="text-sm" />
                  Create client
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClientList;
