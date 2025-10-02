import React, { useState } from "react";
import ZohoDashboard from "./ZohoDashboard";
import TallyDashboard from "./TallyDashboard";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("zoho");

  const tabs = [
    {
      id: "zoho",
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
      label: "Tally Dashboard",
      icon: (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: "green"
    }
  ];

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
            {tabs.map((tab) => (
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
        {activeTab === "zoho" && (
          <div className="opacity-100 transition-opacity duration-300">
            <ZohoDashboard />
          </div>
        )}
        
        {activeTab === "tally" && (
          <div className="opacity-100 transition-opacity duration-300">
            <TallyDashboard />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
