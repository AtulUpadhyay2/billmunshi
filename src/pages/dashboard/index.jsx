import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import ZohoDashboard from "./ZohoDashboard";
import TallyDashboard from "./TallyDashboard";
import { useGetOrganizationModulesQuery } from "@/store/api/modules/modulesSlice";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(null);
  const { selectedOrganization } = useSelector((state) => state.auth);
  
  // Fetch organization modules
  const {
    data: modulesData,
    isLoading: modulesLoading,
    error: modulesError,
  } = useGetOrganizationModulesQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
  });

  // Define all available tabs
  const allTabs = [
    {
      id: "zoho",
      module: "zoho",
      label: "Zoho Dashboard",
      icon: (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "blue"
    },
    {
      id: "tally",
      module: "tally",
      label: "Tally Dashboard",
      icon: (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: "green"
    }
  ];

  // Filter tabs based on enabled modules
  const enabledTabs = useMemo(() => {
    if (!modulesData || !Array.isArray(modulesData)) {
      return [];
    }
    
    const enabledModules = modulesData
      .filter(moduleItem => moduleItem.is_enabled)
      .map(moduleItem => moduleItem.module);
    
    return allTabs.filter(tab => enabledModules.includes(tab.module));
  }, [modulesData]);

  // Set active tab when enabled tabs change
  useEffect(() => {
    if (enabledTabs.length > 0 && !activeTab) {
      setActiveTab(enabledTabs[0].id);
    } else if (enabledTabs.length > 0 && activeTab && !enabledTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(enabledTabs[0].id);
    }
  }, [enabledTabs, activeTab]);

  const getTabClasses = (tabId, color) => {
    const isActive = activeTab === tabId;
    
    if (color === "blue") {
      return isActive
        ? "inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/30"
        : "inline-flex items-center px-6 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-blue-400";
    } else {
      return isActive
        ? "inline-flex items-center px-6 py-3 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg shadow-sm hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30"
        : "inline-flex items-center px-6 py-3 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-green-400";
    }
  };

  // Loading state
  if (modulesLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4"></div>
            <div className="flex gap-2">
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (modulesError) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Dashboard
          </h1>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">
              Error loading modules. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No enabled modules
  if (enabledTabs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Dashboard
          </h1>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              No Modules Enabled
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              No dashboard modules are currently enabled for your organization. Please contact your administrator to enable modules.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>
          </div>
          
          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-2">
            {enabledTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={getTabClasses(tab.id, tab.color)}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <span className={`ml-2 inline-flex items-center justify-center w-2 h-2 ${tab.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'} rounded-full`}></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="transition-opacity duration-300 ease-in-out">
        {activeTab === "zoho" && enabledTabs.find(tab => tab.id === "zoho") && (
          <div className="opacity-100 transition-opacity duration-300">
            <ZohoDashboard />
          </div>
        )}
        
        {activeTab === "tally" && enabledTabs.find(tab => tab.id === "tally") && (
          <div className="opacity-100 transition-opacity duration-300">
            <TallyDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
