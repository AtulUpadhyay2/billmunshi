import React from "react";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import { useGetApiKeysQuery } from "@/store/api/app/apiKeysSlice";

const ApiKeys = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);

  // RTK Query hooks
  const {
    data: apiKeys = [],
    isLoading,
    error,
    refetch
  } = useGetApiKeysQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (!selectedOrganization) {
    return (
      <div className="space-y-5">
        <Card title="API Keys" noBorder>
          <div className="overflow-x-auto -mx-6">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <div className="text-center py-12">
                  <div className="text-orange-600">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium">No Organization Selected</p>
                    <p className="text-sm text-slate-500 mt-2">Please select an organization to view API keys</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card
        title="API Keys"
        noBorder
        headerSlot={
          <button
            onClick={refetch}
            disabled={isLoading || !selectedOrganization?.id}
            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh API keys"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        }
      >
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-slate-600 dark:text-slate-400">Loading API keys...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg font-medium">Failed to load API keys</p>
                    <p className="text-sm text-slate-500 mt-2">
                      {error?.data?.message || error?.message || 'An error occurred while fetching API keys'}
                    </p>
                  </div>
                  <button
                    onClick={refetch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : !apiKeys || apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-500">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C11.978 9.578 12.811 9 14 9a6 6 0 018 0z" />
                    </svg>
                    <p className="text-lg font-medium">No API keys found</p>
                    <p className="text-sm mt-2">No API keys have been created for this organization</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {apiKeys.map((apiKey, index) => (
                    <div key={apiKey.id}>
                      {index > 0 && <div className="border-t border-slate-200 dark:border-slate-700 pt-6" />}
                      
                      {/* API Key Header
                      <div className="flex items-center space-x-3 mb-6">
                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3a1 1 0 011-1h2.586l6.243-6.243C11.978 9.578 12.811 9 14 9a6 6 0 018 0z" />
                        </svg>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{apiKey.name}</h2>
                      </div> */}

                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">API Key ID</h3>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono break-all">{apiKey.id}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Key Name</h3>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white break-words">{apiKey.name}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Status</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </span>
                        </div>
                      </div>

                      {/* Organization Information */}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Organization Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Organization Name</h3>
                            <p className="text-sm text-purple-900 dark:text-purple-100 break-words font-medium">{apiKey.organization.name}</p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Unique Name</h3>
                            <p className="text-sm font-mono text-purple-900 dark:text-purple-100 break-all">{apiKey.organization.unique_name}</p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Organization ID</h3>
                            <p className="text-sm font-mono text-purple-900 dark:text-purple-100 break-all">{apiKey.organization.id}</p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Slug</h3>
                            <p className="text-sm text-purple-900 dark:text-purple-100 break-words">{apiKey.organization.slug || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Creator Information */}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Created By</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-1">Full Name</h3>
                            <p className="text-sm text-indigo-900 dark:text-indigo-100 break-words font-medium">{apiKey.created_by.full_name}</p>
                          </div>
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-1">Email Address</h3>
                            <p className="text-sm text-indigo-900 dark:text-indigo-100 break-all">{apiKey.created_by.email}</p>
                          </div>
                          
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-1">Account Status</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              apiKey.created_by.is_active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}>
                              {apiKey.created_by.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Created At</h3>
                            <p className="text-sm text-blue-900 dark:text-blue-100 break-words">{formatDate(apiKey.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiKeys;
