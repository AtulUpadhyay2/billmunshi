import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Icon } from "@iconify/react";
import { setUser, setSelectedOrganization } from "@/store/api/auth/authSlice";
import { useLazyGetOrganizationsQuery } from "@/store/api/auth/authApiSlice";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import Loading from "@/components/Loading";
import apiClient from "@/utils/apiClient";

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

const SelectOrganization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [triggerGetOrganizations, { isLoading }] =
    useLazyGetOrganizationsQuery();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    module: "tally",
    gst_number: "",
  });

  const moduleOptions = [
    { value: "tally", label: "Tally" },
    { value: "zoho", label: "Zoho" },
  ];

  const loginData = location.state?.loginData;

  useEffect(() => {
    if (!loginData) {
      navigate("/login");
      return;
    }
    localStorage.setItem("access_token", loginData.access);
    localStorage.setItem("refresh_token", loginData.refresh);
    fetchOrganizations();
  }, [loginData]);

  const fetchOrganizations = async () => {
    try {
      const result = await triggerGetOrganizations();
      if (result.error) {
        toast.error("Failed to fetch organizations");
        setOrganizations([]);
      } else {
        const orgs = result.data?.data || [];
        setOrganizations(orgs);
        if (orgs.length > 0) setSelectedOrgId(orgs[0].id);
      }
    } catch (error) {
      toast.error("Failed to fetch organizations");
    }
  };

  const handleSelectOrganization = async () => {
    if (!selectedOrgId || !loginData) return;
    setIsSelecting(true);
    try {
      const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
      if (selectedOrg) {
        dispatch(setUser(loginData));
        dispatch(setSelectedOrganization(selectedOrg));
        toast.success(`Selected ${selectedOrg.name}`);
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Failed to select client");
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }
    try {
      setCreateLoading(true);
      const response = await apiClient.post(
        "/org/create-with-module/",
        formData,
      );
      toast.success(
        response.data.data.message || "Organization created successfully",
      );
      setShowCreateModal(false);
      setFormData({ name: "", module: "tally", gst_number: "" });
      fetchOrganizations();
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const StatusBadge = ({ status }) => {
    const s = (status || "").toUpperCase();
    const map = {
      ACTIVE: {
        dot: "bg-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        txt: "text-emerald-700 dark:text-emerald-400",
        ring: "ring-emerald-100 dark:ring-emerald-900/60",
      },
      INACTIVE: {
        dot: "bg-rose-500",
        bg: "bg-rose-50 dark:bg-rose-950/40",
        txt: "text-rose-700 dark:text-rose-400",
        ring: "ring-rose-100 dark:ring-rose-900/60",
      },
      PENDING: {
        dot: "bg-amber-500",
        bg: "bg-amber-50 dark:bg-amber-950/40",
        txt: "text-amber-700 dark:text-amber-400",
        ring: "ring-amber-100 dark:ring-amber-900/60",
      },
    };
    const c = map[s] || {
      dot: "bg-slate-400",
      bg: "bg-slate-100 dark:bg-slate-800",
      txt: "text-slate-600 dark:text-slate-300",
      ring: "ring-slate-200 dark:ring-slate-700",
    };
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${c.bg} ${c.txt} ${c.ring}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
        {s ? s.charAt(0) + s.slice(1).toLowerCase() : "—"}
      </span>
    );
  };

  if (isLoading) return <Loading />;

  const filtered = organizations.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.name?.toLowerCase().includes(q) ||
      o.unique_name?.toLowerCase().includes(q) ||
      o.slug?.toLowerCase().includes(q) ||
      o.owner?.full_name?.toLowerCase().includes(q) ||
      o.owner?.email?.toLowerCase().includes(q)
    );
  });

  const selectedOrg = organizations.find((o) => o.id === selectedOrgId);

  return (
    <div className="h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 antialiased flex flex-col overflow-hidden">
      {/* Top trust bar */}
      <div className="bg-slate-950 text-slate-300 text-[12.5px]">
        <div className="container mx-auto px-6 py-2 flex items-center justify-center gap-2 text-center">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">Signed in</span>
          <span className="text-slate-700 hidden sm:inline">·</span>
          <span className="hidden sm:inline">Choose a client to continue</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-700/20 group-hover:shadow-md transition-all">
              <Icon
                icon="heroicons:document-text"
                className="text-lg text-white"
              />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bill Munshi
            </span>
          </Link>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              navigate("/auth/login");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Icon
              icon="heroicons:arrow-left-on-rectangle"
              className="text-base"
            />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </nav>

      {/* Body */}
      <section className="flex-1 flex flex-col min-h-0 relative bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] mask-[radial-gradient(ellipse_60%_50%_at_50%_30%,black_30%,transparent_75%)] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(15 23 42 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.06) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="px-4 sm:px-6 lg:px-8 pt-5 pb-3 relative">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xs text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <Icon
                  icon="heroicons:building-office"
                  className="text-blue-600 dark:text-blue-400 text-xs"
                />
                Workspace selection
              </span>
              <h1 className="mt-2 text-2xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Select a client
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Choose the workspace you want to continue with. You can switch
                any time.
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 px-4 sm:px-6 lg:px-8 pb-5 relative">
          <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {organizations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-5">
                  <Icon icon="heroicons:building-office" className="text-3xl" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  No clients found
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                  You don't have any clients yet. Create your first client
                  workspace to get started.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 transition-all cursor-pointer"
                  >
                    <Icon icon="heroicons:plus" className="text-base" />
                    Create client
                  </button>
                  <button
                    type="button"
                    onClick={fetchOrganizations}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                  >
                    <Icon
                      icon="heroicons:arrow-path"
                      className={`text-base ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="px-5 md:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="relative w-full sm:max-w-xs">
                    <Icon
                      icon="heroicons:magnifying-glass"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search clients, owner, slug…"
                      className={inputBase}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Icon
                      icon="heroicons:information-circle"
                      className="text-base"
                    />
                    <span>
                      Showing{" "}
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {filtered.length}
                      </span>{" "}
                      of {organizations.length} client
                      {organizations.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 min-h-0 overflow-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                      <tr>
                        <th className="w-10 px-4 py-3.5 text-left">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                          Client
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden md:table-cell">
                          Unique ID
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                          Slug
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                          Status
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden md:table-cell">
                          Owner
                        </th>
                        <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-16 text-center">
                            <Icon
                              icon="heroicons:magnifying-glass"
                              className="text-4xl text-slate-300 dark:text-slate-700 mx-auto mb-3"
                            />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              No clients match your search
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Try different keywords or clear the filter.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((org) => {
                          const isSelected = selectedOrgId === org.id;
                          const grad = avatarFor(org.name || "");
                          return (
                            <tr
                              key={org.id}
                              onClick={() => setSelectedOrgId(org.id)}
                              className={`group cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-blue-50/60 dark:bg-blue-950/20"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                              }`}
                            >
                              <td className="px-4 py-4">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-600 shadow-md shadow-blue-600/30"
                                      : "border-slate-300 dark:border-slate-600 group-hover:border-slate-400"
                                  }`}
                                >
                                  {isSelected && (
                                    <Icon
                                      icon="heroicons:check"
                                      className="text-white text-xs"
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`shrink-0 h-10 w-10 rounded-lg bg-linear-to-br ${grad} flex items-center justify-center shadow-sm ring-1 ring-black/5`}
                                  >
                                    <span className="text-white font-bold text-sm">
                                      {org.name?.charAt(0).toUpperCase() || "?"}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                      {org.name}
                                    </div>
                                    <div className="md:hidden text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                                      {org.unique_name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 hidden md:table-cell">
                                <span className="inline-flex items-center px-2 py-1 text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md ring-1 ring-slate-200 dark:ring-slate-700">
                                  {org.unique_name}
                                </span>
                              </td>
                              <td className="px-4 py-4 hidden lg:table-cell">
                                <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                                  @{org.slug}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <StatusBadge status={org.status} />
                              </td>
                              <td className="px-4 py-4 hidden md:table-cell">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-45">
                                    {org.owner?.full_name || "—"}
                                  </div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-45">
                                    {org.owner?.email || ""}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 hidden lg:table-cell">
                                <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                  <Icon
                                    icon="heroicons:calendar"
                                    className="text-base text-slate-400"
                                  />
                                  {formatDate(org.created_at)}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="px-5 md:px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 min-w-0">
                    {selectedOrg ? (
                      <>
                        <Icon
                          icon="heroicons:check-badge"
                          className="text-emerald-500 text-lg shrink-0"
                        />
                        <span className="truncate">
                          Selected:{" "}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedOrg.name}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <Icon
                          icon="heroicons:cursor-arrow-rays"
                          className="text-slate-400 text-lg shrink-0"
                        />
                        <span>Select a client to continue.</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                    >
                      <Icon icon="heroicons:plus" className="text-base" />
                      Add new client
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectOrganization}
                      disabled={!selectedOrgId || isSelecting}
                      className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
                    >
                      {isSelecting ? (
                        <>
                          <Icon
                            icon="heroicons:arrow-path"
                            className="text-base animate-spin"
                          />
                          Continuing…
                        </>
                      ) : (
                        <>
                          Continue to dashboard
                          <Icon
                            icon="heroicons:arrow-right"
                            className="text-base group-hover:translate-x-0.5 transition-transform"
                          />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

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
        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Client name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Icon
                icon="heroicons:building-office"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"
              />
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
              <Icon
                icon="heroicons:receipt-percent"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"
              />
              <input
                type="text"
                value={formData.gst_number}
                onChange={(e) =>
                  setFormData({ ...formData, gst_number: e.target.value })
                }
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
                    onClick={() =>
                      setFormData({ ...formData, module: opt.value })
                    }
                    className={`p-3 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isActive && (
                        <Icon
                          icon="heroicons:check-circle"
                          className="text-base"
                        />
                      )}
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
                  <Icon
                    icon="heroicons:arrow-path"
                    className="text-base animate-spin"
                  />
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

export default SelectOrganization;
