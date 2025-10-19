import React from "react";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import { useGetHelpData } from "@/hooks/api/tally/tallyApiService";

const Help = () => {
    const { selectedOrganization } = useSelector((state) => state.auth);

    // TanStack Query hooks
    const {
        data: helpData,
        isLoading,
        error,
        refetch
    } = useGetHelpData(selectedOrganization?.id, {
        enabled: !!selectedOrganization?.id,
    });

    if (!selectedOrganization) {
        return (
            <div className="space-y-5">
                <Card title="Help & API Information" noBorder>
                    <div className="overflow-x-auto -mx-6">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden">
                                <div className="text-center py-12">
                                    <div className="text-orange-600">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">No Organization Selected</p>
                                        <p className="text-sm text-slate-500 mt-2">Please select an organization to view help information</p>
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
                title="Help & API Information"
                noBorder
                headerSlot={
                    <button
                        onClick={refetch}
                        disabled={isLoading || !selectedOrganization?.id}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh help data"
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
                                    <span className="ml-3 text-slate-600 dark:text-slate-400">Loading help data...</span>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <div className="text-red-600 mb-4">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">Failed to load help data</p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            {error?.data?.message || error?.message || 'An error occurred while fetching help data'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={refetch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : !helpData ? (
                                <div className="text-center py-8">
                                    <div className="text-slate-500">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">No help data found</p>
                                        <p className="text-sm mt-2">No help information is available for this organization</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 space-y-6">
                                    {/* Organization Info */}
                                    {helpData.organization && (
                                        <div className="mb-6">
                                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Organization Details</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                                    <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Organization ID</h3>
                                                    <p className="text-sm font-mono text-purple-900 dark:text-purple-100 break-all">{helpData.organization.id}</p>
                                                </div>
                                                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                                    <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">Organization Name</h3>
                                                    <p className="text-sm text-purple-900 dark:text-purple-100 break-words font-medium">{helpData.organization.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* API Endpoints */}
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mb-6">
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">API Endpoints</h2>
                                        <div className="space-y-4">
                                            {helpData.ledgers && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Ledgers</h3>
                                                    <code className="text-sm text-blue-600 dark:text-blue-400 break-all">{helpData.ledgers}</code>
                                                </div>
                                            )}

                                            {helpData.masters && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Masters</h3>
                                                    <code className="text-sm text-blue-600 dark:text-blue-400 break-all">{helpData.masters}</code>
                                                </div>
                                            )}

                                            {helpData.vendor_bills_sync_external && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Vendor Bills Sync External</h3>
                                                    <code className="text-sm text-blue-600 dark:text-blue-400 break-all">{helpData.vendor_bills_sync_external}</code>
                                                </div>
                                            )}

                                            {helpData.expense_bills_sync_external && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Expense Bills Sync External</h3>
                                                    <code className="text-sm text-blue-600 dark:text-blue-400 break-all">{helpData.expense_bills_sync_external}</code>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* API Key */}
                                    {helpData.api_key && (
                                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mb-6">
                                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">API Authentication</h2>
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">API Key</h3>
                                                <code className="text-sm text-green-600 dark:text-green-400 break-all">{helpData.api_key}</code>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Help;