import React, { useState } from 'react'
import Card from "@/components/ui/Card";
import { useGetVendorBillsQuery, useUpdateVendorBillMutation, useDeleteVendorBillMutation, useUploadVendorBillsMutation } from "@/store/api/zoho/vendorBillsApiSlice";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";
import UploadBillModal from "@/components/modals/UploadBillModal";
import { useSelector } from "react-redux";

const ZohoVendorBill = () => {
    const { selectedOrganization } = useSelector((state) => state.auth);
    const { data: vendorBillsData, error, isLoading, refetch } = useGetVendorBillsQuery(selectedOrganization?.id, {
        skip: !selectedOrganization?.id,
    });
    const [updateVendorBill] = useUpdateVendorBillMutation();
    const [deleteVendorBill] = useDeleteVendorBillMutation();
    const [uploadVendorBills] = useUploadVendorBillsMutation();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const handleAction = async (billId, action) => {
        try {
            switch (action) {
                case 'analyse':
                    await updateVendorBill({ organizationId: selectedOrganization?.id, id: billId, status: 'Analysed' }).unwrap();
                    globalToast.success('Bill analysis completed');
                    break;
                case 'verify':
                    await updateVendorBill({ organizationId: selectedOrganization?.id, id: billId, status: 'Verified' }).unwrap();
                    globalToast.success('Bill verification completed');
                    break;
                case 'sync':
                    await updateVendorBill({ organizationId: selectedOrganization?.id, id: billId, status: 'Synced' }).unwrap();
                    globalToast.success('Bill synced to Zoho');
                    break;
                case 'edit':
                    // TODO: Implement edit functionality
                    globalToast.info('Edit functionality coming soon');
                    break;
                case 'delete':
                    if (window.confirm('Are you sure you want to delete this bill?')) {
                        await deleteVendorBill({ organizationId: selectedOrganization?.id, id: billId }).unwrap();
                        globalToast.success('Bill deleted successfully');
                    }
                    break;
                default:
                    globalToast.error('Unknown action');
            }
        } catch (error) {
            console.error('Action failed:', error);
            globalToast.error(error?.data?.message || `Failed to ${action} bill`);
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'Draft': 'text-yellow-700 bg-yellow-100 border-yellow-200',
            'Analysed': 'text-blue-700 bg-blue-100 border-blue-200',
            'Verified': 'text-green-700 bg-green-100 border-green-200',
            'Synced': 'text-purple-700 bg-purple-100 border-purple-200',
        };

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-full shadow-sm ${statusClasses[status] || statusClasses['Draft']}`}>
                <svg className="w-2 h-2 fill-current" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3"/>
                </svg>
                {status}
            </span>
        );
    };

    const handleUpload = async (formData) => {
        try {
            await uploadVendorBills({ organizationId: selectedOrganization?.id, formData }).unwrap();
            globalToast.success('Bills uploaded successfully');
            refetch(); // Refresh the list
        } catch (error) {
            console.error('Upload failed:', error);
            globalToast.error(error?.data?.message || 'Failed to upload bills');
        }
    };

    const renderActionButtons = (bill) => {
        const { status } = bill;

        if (status === 'Synced') {
            return (
                <div className="flex gap-2 flex-wrap items-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Completed</span>
                    </div>
                </div>
            );
        }

        if (status === 'Draft') {
            return (
                <div className="flex gap-2 flex-wrap items-center">
                    <button 
                        onClick={() => handleAction(bill.id, 'analyse')}
                        className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md shadow-sm hover:bg-purple-100 hover:border-purple-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 transition-all duration-200 active:scale-95"
                        title="Analyse document"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>
                        <span className="font-medium">Analyse</span>
                    </button>
                </div>
            );
        }

        if (status === 'Analysed') {
            return (
                <div className="flex gap-2 flex-wrap items-center">
                    <button 
                        onClick={() => handleAction(bill.id, 'verification')}
                        className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md shadow-sm hover:bg-green-100 hover:border-green-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 active:scale-95"
                        title="Start verification process"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                        </svg>
                        <span className="font-medium">Verification</span>
                    </button>
                    <button 
                        onClick={() => handleAction(bill.id, 'sync')}
                        className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md shadow-sm hover:bg-amber-100 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500 transition-all duration-200 active:scale-95"
                        title="Sync with system"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        <span className="font-medium">Sync</span>
                    </button>
                </div>
            );
        }

        if (status === 'Verified') {
            return (
                <div className="flex gap-2 flex-wrap items-center">
                    <button 
                        onClick={() => handleAction(bill.id, 'verification')}
                        className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md shadow-sm hover:bg-green-100 hover:border-green-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 active:scale-95"
                        title="Re-verify document"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                        </svg>
                        <span className="font-medium">Verification</span>
                    </button>
                    <button 
                        onClick={() => handleAction(bill.id, 'sync')}
                        className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md shadow-sm hover:bg-amber-100 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500 transition-all duration-200 active:scale-95"
                        title="Sync with system"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        <span className="font-medium">Sync</span>
                    </button>
                </div>
            );
        }

        // Default fallback
        return (
            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-slate-400">No actions available</span>
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (!selectedOrganization?.id) {
        return (
            <div className="text-center py-8">
                <div className="text-slate-500">No organization selected</div>
                <div className="text-xs text-slate-400 mt-2">Please select an organization to view vendor bills</div>
            </div>
        );
    }

    if (isLoading) return <Loading />;
    if (error) return <div className="text-red-500">Error loading vendor bills: {error.message}</div>;

    const vendorBills = vendorBillsData?.results || [];

    return (
        <div className="space-y-5">
            <Card 
                title={`Vendor Bills (${vendorBillsData?.count || 0})`}
                noBorder
                headerSlot={
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh vendor bills"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            {isLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button 
                            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95"
                            title="Upload vendor bills"
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                                viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" 
                                className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                                <path strokeLinecap="round" strokeLinejoin="round" 
                                    d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 10l-4-4m0 0-4 4m4-4v12" />
                            </svg>
                            Upload Bill
                        </button>
                    </div>
                }
            >
                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden ">
                            <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700!">
                                <thead className="bg-slate-200 dark:bg-slate-700">
                                    <tr>
                                        <th scope='col' className='table-th'>Sr. No</th>
                                        <th scope='col' className='table-th'>Document ID</th>
                                        <th scope='col' className='table-th'>Status</th>
                                        <th scope='col' className='table-th'>Created Date</th>
                                        <th scope='col' className='table-th'>Actions</th>
                                        <th scope='col' className='table-th'>Control</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700!">
                                    {vendorBills.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="table-td text-center py-8">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div className="text-slate-500">No vendor bills found</div>
                                                    <div className="text-xs text-slate-400">Upload your first vendor bill to get started</div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        vendorBills.map((bill, index) => (
                                            <tr key={bill.id}>
                                                <td className="table-td">{index + 1}</td>
                                                <td className="table-td">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{bill.billmunshiName}</span>
                                                        {bill.file && (
                                                            <a 
                                                                href={bill.file} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-600 hover:underline"
                                                            >
                                                                View File
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="table-td">
                                                    {getStatusBadge(bill.status)}
                                                </td>
                                                <td className="table-td">
                                                    <div className="text-sm">
                                                        {formatDate(bill.created_at)}
                                                    </div>
                                                </td>
                                                <td className="table-td">
                                                    {renderActionButtons(bill)}
                                                </td>
                                                <td className="table-td">
                                                    <div className="flex gap-2 items-center">
                                                        <button 
                                                            onClick={() => {
                                                                // TODO: Implement edit functionality
                                                                console.log('Edit bill:', bill.id);
                                                            }}
                                                            className="group relative inline-flex items-center justify-center w-8 h-8 text-blue-700 bg-blue-50 border border-blue-200 rounded-md shadow-sm hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95"
                                                            title="Edit vendor bill"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform duration-200">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(bill.id, 'delete')}
                                                            className="group relative inline-flex items-center justify-center w-8 h-8 text-red-700 bg-red-50 border border-red-200 rounded-md shadow-sm hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 transition-all duration-200 active:scale-95"
                                                            title="Delete vendor bill"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform duration-200">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                {/* Pagination */}
                {vendorBillsData && (vendorBillsData.next || vendorBillsData.previous) && (
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-6 py-3">
                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            Showing {vendorBills.length} of {vendorBillsData.count} results
                        </div>
                        <div className="flex items-center gap-2">
                            {vendorBillsData.previous && (
                                <button 
                                    onClick={() => {
                                        // TODO: Implement pagination
                                        console.log('Previous page:', vendorBillsData.previous);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                    Previous
                                </button>
                            )}
                            {vendorBillsData.next && (
                                <button 
                                    onClick={() => {
                                        // TODO: Implement pagination
                                        console.log('Next page:', vendorBillsData.next);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200"
                                >
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            {/* Upload Modal */}
            <UploadBillModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
            />
        </div>
    );
};

export default ZohoVendorBill;