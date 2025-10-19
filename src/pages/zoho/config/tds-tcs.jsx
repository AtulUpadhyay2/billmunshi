import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Card from "@/components/ui/Card";
import { useGetTdsTcs, useSyncTdsTcs } from '@/hooks/api/zoho/zohoApiService';
import { toast } from "react-toastify";

const TdsTcs = () => {
    const { selectedOrganization } = useSelector((state) => state.auth);
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    
    const {
        data: tdsTcsData,
        isLoading,
        isError,
        error,
        refetch
    } = useGetTdsTcs({ 
        organizationId: selectedOrganization?.id, 
        page: currentPage 
    });

    const { mutateAsync: syncTdsTcs } = useSyncTdsTcs();

    const handleSync = async () => {
        if (!selectedOrganization?.id) {
            toast.error("No organization selected");
            return;
        }

        try {
            setIsSyncing(true);
            await syncTdsTcs(selectedOrganization.id);
            toast.success("TDS/TCS synced successfully");
            setCurrentPage(1); // Reset to first page after sync
            refetch(); // Refresh the data after sync
        } catch (error) {
            console.error('Sync failed:', error);
            toast.error(error?.response?.data?.message || error?.message || "Failed to sync TDS/TCS");
        } finally {
            setIsSyncing(false);
        }
    };

    const handlePrevious = () => {
        if (tdsTcsData?.previous) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (tdsTcsData?.next) {
            setCurrentPage(currentPage + 1);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTaxTypeBadge = (taxType) => {
        const isTds = taxType === 'TDS';
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${
                isTds 
                    ? 'text-blue-700 bg-blue-100 border border-blue-200' 
                    : 'text-purple-700 bg-purple-100 border border-purple-200'
            }`}>
                <svg className="w-2 h-2 fill-current" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3"/>
                </svg>
                {taxType}
            </span>
        );
    };
    return (
        <div className="space-y-5">
            <Card 
                title="TDS / TCS" 
                noBorder
                headerSlot={
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing || !selectedOrganization?.id}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sync all TDS / TCS"
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
                            <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700!">
                                <thead className="bg-slate-200 dark:bg-slate-700">
                                    <tr>
                                        <th scope='col' className='table-th'>Sr. No</th>
                                        <th scope='col' className='table-th'>Tax ID</th>
                                        <th scope='col' className='table-th'>Tax Name</th>
                                        <th scope='col' className='table-th'>Tax Percentage</th>
                                        <th scope='col' className='table-th'>Type</th>
                                        <th scope='col' className='table-th'>Created Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700!">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" className="table-td text-center py-8">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    <span className="text-slate-600">Loading TDS/TCS...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : isError ? (
                                        <tr>
                                            <td colSpan="6" className="table-td text-center py-8">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="text-red-600">
                                                        <p className="text-lg font-medium">Failed to load TDS/TCS</p>
                                                        <p className="text-sm text-slate-500 mt-2">
                                                            {error?.data?.message || error?.message || 'An error occurred while fetching TDS/TCS'}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={refetch}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                                    >
                                                        Try Again
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : !tdsTcsData?.results?.length ? (
                                        <tr>
                                            <td colSpan="6" className="table-td text-center py-8">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div className="text-slate-500">
                                                        <p className="text-lg font-medium">No TDS/TCS found</p>
                                                        <p className="text-sm mt-2">Click "Sync" to fetch your TDS/TCS from Zoho</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        tdsTcsData.results.map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="table-td">{((currentPage - 1) * 20) + index + 1}</td>
                                                <td className="table-td">{item.taxId}</td>
                                                <td className="table-td">{item.taxName}</td>
                                                <td className="table-td">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {item.taxPercentage}%
                                                    </span>
                                                </td>
                                                <td className="table-td">
                                                    {getTaxTypeBadge(item.taxType)}
                                                </td>
                                                <td className="table-td">{formatDate(item.created_at)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                {/* Pagination Controls - Only show when we have data and pagination is needed */}
                {tdsTcsData?.results?.length > 0 && (tdsTcsData?.next || tdsTcsData?.previous) && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>
                                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, tdsTcsData?.count || 0)} of {tdsTcsData?.count || 0} TDS/TCS entries
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevious}
                                disabled={!tdsTcsData?.previous || isLoading}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                Page {currentPage}
                            </span>
                            
                            <button
                                onClick={handleNext}
                                disabled={!tdsTcsData?.next || isLoading}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TdsTcs;