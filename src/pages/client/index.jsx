import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import apiClient from "@/utils/apiClient";
import Modal from "@/components/ui/Modal";
import TablePagination from "@/components/ui/TablePagination";
import { setSelectedOrganization } from "@/store/api/auth/authSlice";

const inputBase =
  "w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600";

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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${c.bg} ${c.txt} ${c.ring}`}>
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
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Clients
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            Manage all your client workspaces from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchClients(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-base ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
          >
            <Icon icon="heroicons:plus" className="text-base" />
            Add new client
          </button>
        </div>
      </div>

      {/* Compact stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Total clients", value: stats.total, icon: "heroicons:building-office-2" },
          { label: "Active", value: stats.active, icon: "heroicons:check-badge" },
          { label: "Pending", value: stats.pending, icon: "heroicons:clock" },
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
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table card — fills remaining viewport */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-5 md:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="relative w-full md:max-w-sm">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, owner, GSTIN…"
              className={inputBase}
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 self-start md:self-auto">
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold ${
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
            <div className="px-5 md:px-6 py-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Client</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden md:table-cell">Unique ID</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden lg:table-cell">GSTIN</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden md:table-cell">Owner</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden xl:table-cell">Created by</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden lg:table-cell">Created</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                        <Icon
                          icon={searchQuery || statusFilter !== "ALL" ? "heroicons:magnifying-glass" : "heroicons:building-office-2"}
                          className="text-2xl"
                        />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery || statusFilter !== "ALL" ? "No clients match your filters" : "No clients yet"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery || statusFilter !== "ALL"
                          ? "Try a different keyword or change the filter."
                          : "Create your first client to get started."}
                      </p>
                      {!searchQuery && statusFilter === "ALL" && (
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 transition-all cursor-pointer"
                        >
                          <Icon icon="heroicons:plus" className="text-base" />
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
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleOrganizationClick(client)}
                            className="flex items-center gap-3 group/link cursor-pointer min-w-0 text-left"
                          >
                            <div className={`shrink-0 h-9 w-9 rounded-lg bg-linear-to-br ${grad} flex items-center justify-center shadow-sm ring-1 ring-black/5`}>
                              <span className="text-white font-bold text-sm">
                                {client.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover/link:text-blue-700 dark:group-hover/link:text-blue-400 truncate transition-colors">
                                {client.name}
                              </div>
                              <div className="md:hidden text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                                {client.unique_name}
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-1 text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
                            {client.unique_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {client.gst_number ? (
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
                              {client.gst_number}
                            </span>
                          ) : (
                            <span className="text-xs italic text-slate-400 dark:text-slate-500">
                              Not provided
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-50">
                              {client.owner?.full_name || "—"}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-50">
                              {client.owner?.email || ""}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={client.status} />
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-50">
                              {client.created_by?.full_name || "—"}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-50">
                              {client.created_by?.email || ""}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <Icon icon="heroicons:calendar" className="text-base text-slate-400" />
                            {formatDate(client.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOrganizationClick(client)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          >
                            Open
                            <Icon icon="heroicons:arrow-right" className="text-xs" />
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
        <form onSubmit={handleCreateClient} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Icon icon="heroicons:building-office" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter client / organization name"
                required
                className={inputBase}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              GSTIN
            </label>
            <div className="relative">
              <Icon icon="heroicons:receipt-percent" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
              <input
                type="text"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                placeholder="Enter GSTIN (optional)"
                className={inputBase}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Module
            </label>
            <div className="grid grid-cols-2 gap-3">
              {moduleOptions.map((opt) => {
                const isActive = formData.module === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, module: opt.value })}
                    className={`p-3 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isActive && <Icon icon="heroicons:check-circle" className="text-base" />}
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: "", module: "tally", gst_number: "" });
              }}
              className="px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
            >
              {createLoading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Icon icon="heroicons:plus" className="text-base" />
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
