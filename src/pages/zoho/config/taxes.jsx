import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Card from "@/components/ui/Card";
import { useGetTaxesQuery, useSyncTaxesMutation } from '@/store/api/zoho/zohoApiSlice';
import { toast } from "react-toastify";

const Taxes = () => {
    const { selectedOrganization } = useSelector((state) => state.auth);
    const [isSyncing, setIsSyncing] = useState(false);
    
    const {
        data: taxesData,
        isLoading,
        isError,
        error,
        refetch
    } = useGetTaxesQuery(selectedOrganization?.id, {
        skip: !selectedOrganization?.id,
    });

    const [syncTaxes] = useSyncTaxesMutation();

    const handleSync = async () => {
        if (!selectedOrganization?.id) {
            toast.error("No organization selected");
            return;
        }

        try {
            setIsSyncing(true);
            await syncTaxes(selectedOrganization.id).unwrap();
            toast.success("Taxes synced successfully");
            refetch(); // Refresh the data after sync
        } catch (error) {
            console.error('Sync failed:', error);
            toast.error(error?.data?.message || "Failed to sync taxes");
        } finally {
            setIsSyncing(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    return (
        <div className="space-y-5">
            <Card 
                title="Taxes" 
                noBorder
                headerSlot={
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing || !selectedOrganization?.id}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sync all taxes"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.8} 
                            stroke="currentColor" 
                            className={`w-4 h-4 transition-transform duration-300 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`}
                        >
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
                                    <span className="ml-3 text-slate-600">Loading taxes...</span>
                                </div>
                            ) : isError ? (
                                <div className="text-center py-8">
                                    <div className="text-red-600 mb-4">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">Failed to load taxes</p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            {error?.data?.message || error?.message || 'An error occurred while fetching taxes'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={refetch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : !taxesData?.results?.length ? (
                                <div className="text-center py-8">
                                    <div className="text-slate-500">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-lg font-medium">No taxes found</p>
                                        <p className="text-sm mt-2">Click "Sync" to fetch your taxes from Zoho</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700!">
                                        <thead className="bg-slate-200 dark:bg-slate-700">
                                            <tr>
                                                <th scope='col' className='table-th'>Sr. No</th>
                                                <th scope='col' className='table-th'>Tax ID</th>
                                                <th scope='col' className='table-th'>Tax Name</th>
                                                <th scope='col' className='table-th'>Created Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700!">
                                            {taxesData.results.map((tax, index) => (
                                                <tr key={tax.id}>
                                                    <td className="table-td">{index + 1}</td>
                                                    <td className="table-td">{tax.taxId}</td>
                                                    <td className="table-td">{tax.taxName}</td>
                                                    <td className="table-td">{formatDate(tax.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {taxesData?.count > 0 && (
                                        <div className="mt-4 px-6 pb-4 text-sm text-slate-500">
                                            Showing {taxesData.results.length} of {taxesData.count} taxes
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Taxes;