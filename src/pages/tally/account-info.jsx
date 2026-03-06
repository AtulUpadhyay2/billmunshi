import React from "react";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import { useGetHelpData } from "@/services/tally/tallyApiService";

const TallyAccountInfo = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);

  const {
    data: helpData,
    isLoading,
    error,
    refetch,
  } = useGetHelpData(selectedOrganization?.id, {
    enabled: !!selectedOrganization?.id,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (!selectedOrganization) {
    return (
      <div className="space-y-5">
        <Card title="Account Information" noBorder>
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              No Organization Selected
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Please select an organization to view account information
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card
        title="Account Information"
        noBorder
        headerSlot={
          <button
            onClick={refetch}
            disabled={isLoading || !selectedOrganization?.id}
            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh account data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className={`w-4 h-4 transition-transform duration-300 ${isLoading ? "animate-spin" : "group-hover:rotate-180"}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400 font-medium">
              Loading account information...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Failed to load account information
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {error?.data?.message ||
                error?.message ||
                "An error occurred while fetching account data"}
            </p>
            <button
              onClick={refetch}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Try Again
            </button>
          </div>
        ) : !helpData ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              No Account Information Available
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Account data has not been set up for this organization
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Tally Integration Key */}
            {helpData.api_key && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-600 text-white">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C11.978 9.578 12.811 9 14 9a6 6 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-green-900 dark:text-green-100">
                      Tally Integration Key
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <code className="text-sm text-green-700 dark:text-green-300 break-all font-mono">
                    {helpData.api_key}
                  </code>
                </div>
              </div>
            )}

            {/* Organization Details */}
            {helpData.organization && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Organization Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1.5">
                      Organization Name
                    </h3>
                    <p className="text-base font-semibold text-purple-900 dark:text-purple-100">
                      {helpData.organization.name}
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1.5">
                      Organization ID
                    </h3>
                    <p className="text-sm font-mono text-purple-900 dark:text-purple-100 break-all">
                      {helpData.organization.id}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Created By Information */}
            {helpData.created_by && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Created By
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1.5">
                      Full Name
                    </h3>
                    <p className="text-base font-semibold text-blue-900 dark:text-blue-100">
                      {helpData.created_by.full_name}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1.5">
                      Email Address
                    </h3>
                    <p className="text-sm text-blue-900 dark:text-blue-100 break-all">
                      {helpData.created_by.email}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1.5">
                      Account Status
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        helpData.created_by.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {helpData.created_by.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1.5">
                      Created At
                    </h3>
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {formatDate(helpData.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* API Endpoints */}
            {(helpData.ledgers ||
              helpData.masters ||
              helpData.vendor_bills_sync_external ||
              helpData.expense_bills_sync_external) && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  API Endpoints
                </h2>
                <div className="space-y-3">
                  {helpData.ledgers && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                        Ledgers
                      </h3>
                      <code className="text-xs text-indigo-600 dark:text-indigo-400 break-all block bg-white dark:bg-slate-800 p-2 rounded border border-indigo-200 dark:border-indigo-700">
                        {helpData.ledgers}
                      </code>
                    </div>
                  )}
                  {helpData.masters && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                        Masters
                      </h3>
                      <code className="text-xs text-indigo-600 dark:text-indigo-400 break-all block bg-white dark:bg-slate-800 p-2 rounded border border-indigo-200 dark:border-indigo-700">
                        {helpData.masters}
                      </code>
                    </div>
                  )}
                  {helpData.vendor_bills_sync_external && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                        Vendor Bills Sync External
                      </h3>
                      <code className="text-xs text-indigo-600 dark:text-indigo-400 break-all block bg-white dark:bg-slate-800 p-2 rounded border border-indigo-200 dark:border-indigo-700">
                        {helpData.vendor_bills_sync_external}
                      </code>
                    </div>
                  )}
                  {helpData.expense_bills_sync_external && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                        Expense Bills Sync External
                      </h3>
                      <code className="text-xs text-indigo-600 dark:text-indigo-400 break-all block bg-white dark:bg-slate-800 p-2 rounded border border-indigo-200 dark:border-indigo-700">
                        {helpData.expense_bills_sync_external}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TallyAccountInfo;
