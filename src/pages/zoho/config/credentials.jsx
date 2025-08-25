import React from 'react'
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import { useGetZohoCredentialsQuery, useSyncZohoCredentialsMutation } from "@/store/api/zoho/zohoApiSlice";
import { toast } from "react-toastify";

const ZohoCredentials = () => {
    const { selectedOrganization } = useSelector((state) => state.auth);
    
    const {
        data: credentials,
        isLoading,
        error,
        refetch
    } = useGetZohoCredentialsQuery(selectedOrganization?.id, {
        skip: !selectedOrganization?.id,
    });

    const [syncCredentials, { isLoading: isSyncing }] = useSyncZohoCredentialsMutation();

    const handleSync = async () => {
        if (!selectedOrganization?.id) {
            toast.error("No organization selected");
            return;
        }

        try {
            await syncCredentials(selectedOrganization.id).unwrap();
            toast.success("Credentials synced successfully");
            refetch(); // Refresh the data
        } catch (error) {
            console.error("Sync error:", error);
            toast.error(error?.data?.message || "Failed to sync credentials");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const maskSensitiveData = (data, visibleChars = 4) => {
        if (!data) return 'N/A';
        if (data.length <= visibleChars) return data;
        return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
    };

    return (
        <div className="space-y-5">
            <Card
                title="Zoho Credentials"
                noBorder
                headerSlot={
                    <button
                        onClick={handleSync}
                        disabled={isSyncing || !selectedOrganization?.id}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sync zoho credentials"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        {isSyncing ? 'Syncing...' : 'Sync'}
                    </button>
                }
            >
                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-slate-600">Loading credentials...</span>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <div className="text-red-600 mb-4">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">Failed to load credentials</p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            {error?.data?.message || error?.message || 'An error occurred while fetching credentials'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={refetch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : !credentials ? (
                                <div className="text-center py-8">
                                    <div className="text-slate-500">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-lg font-medium">No credentials found</p>
                                        <p className="text-sm mt-2">Click "Sync" to fetch your Zoho credentials</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 space-y-6">
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Organization ID</h3>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-white">{credentials.organisationId || 'N/A'}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Client ID</h3>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono">{credentials.clientId || 'N/A'}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Redirect URL</h3>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-white break-all">{credentials.redirectUrl || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Sensitive Information</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Client Secret</h3>
                                                <p className="text-sm font-mono text-amber-900 dark:text-amber-100">{maskSensitiveData(credentials.clientSecret, 6)}</p>
                                            </div>
                                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Access Code</h3>
                                                <p className="text-sm font-mono text-amber-900 dark:text-amber-100">{maskSensitiveData(credentials.accessCode, 6)}</p>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Access Token</h3>
                                                <p className="text-sm font-mono text-green-900 dark:text-green-100">{maskSensitiveData(credentials.accessToken, 8)}</p>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">Refresh Token</h3>
                                                <p className="text-sm font-mono text-green-900 dark:text-green-100">{maskSensitiveData(credentials.refreshToken, 8)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Timestamps</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Last Updated</h3>
                                                <p className="text-sm text-blue-900 dark:text-blue-100">{formatDate(credentials.update_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </Card>
        </div>
    );
};

export default ZohoCredentials;