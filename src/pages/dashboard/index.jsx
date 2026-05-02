import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import ZohoDashboard from "./ZohoDashboard";
import TallyDashboard from "./TallyDashboard";
import { useGetOrganizationModulesQuery } from "@/store/api/modules/modulesSlice";

const ALL_TABS = [
  {
    id: "tally",
    module: "tally",
    label: "Tally",
    icon: "heroicons:cube-transparent",
    description: "Vendor bills & journal entries",
  },
  {
    id: "zoho",
    module: "zoho",
    label: "Zoho",
    icon: "heroicons:cloud",
    description: "Vendor bills & journal entries",
  },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(null);
  const { selectedOrganization } = useSelector((state) => state.auth);

  const {
    data: modulesData,
    isLoading: modulesLoading,
    error: modulesError,
  } = useGetOrganizationModulesQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
  });

  const enabledTabs = useMemo(() => {
    if (!modulesData || !Array.isArray(modulesData)) return [];
    const enabledModules = modulesData
      .filter((m) => m.is_enabled)
      .map((m) => m.module);
    return ALL_TABS.filter((t) => enabledModules.includes(t.module));
  }, [modulesData]);

  useEffect(() => {
    if (enabledTabs.length === 0) {
      if (activeTab !== null) setActiveTab(null);
      return;
    }
    if (!activeTab || !enabledTabs.find((t) => t.id === activeTab)) {
      setActiveTab(enabledTabs[0].id);
    }
  }, [enabledTabs, activeTab]);

  /* ------------------------------------------------------------------ */
  /*  Loading skeleton                                                   */
  /* ------------------------------------------------------------------ */
  if (modulesLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="h-6 w-44 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-4" />
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-9 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Error                                                              */
  /* ------------------------------------------------------------------ */
  if (modulesError) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <Icon icon="heroicons:exclamation-triangle" className="text-2xl" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Failed to load modules
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Please refresh the page or contact your administrator if the issue
          persists.
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  No modules                                                         */
  /* ------------------------------------------------------------------ */
  if (enabledTabs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-100 dark:ring-amber-900/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
          <Icon icon="heroicons:adjustments-horizontal" className="text-2xl" />
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-white">
          No modules enabled
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          No dashboard modules are currently enabled for your organization.
          Please contact your administrator to enable the Tally or Zoho module.
        </p>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Header + tabs                                                      */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
            {selectedOrganization?.name
              ? `Activity overview for ${selectedOrganization.name}.`
              : "Pick a workspace to view its bill activity overview."}
          </p>
        </div>

        {/* Tab pills */}
        {enabledTabs.length > 1 && (
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg shrink-0">
            {enabledTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/40"
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon icon={tab.icon} className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Active dashboard */}
      <div className="transition-opacity duration-200 ease-out">
        {activeTab === "tally" && <TallyDashboard />}
        {activeTab === "zoho" && <ZohoDashboard />}
      </div>
    </div>
  );
};

export default Dashboard;
