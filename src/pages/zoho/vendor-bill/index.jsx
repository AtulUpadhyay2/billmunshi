import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from "@/components/ui/Card";
import { 
    useGetVendorBillsQuery, 
    useUpdateVendorBillMutation, 
    useDeleteVendorBillMutation, 
    useUploadVendorBillsMutation,
    useAnalyzeVendorBillMutation,
    useSyncVendorBillMutation
} from '@/store/api/zoho/vendorBillsApiSlice';
import { globalToast } from "@/utils/toast";
import UploadBillModal from "@/components/modals/UploadBillModal";
import FileViewerModal from "@/components/modals/FileViewerModal";
import { useSelector } from "react-redux";
import Swal from 'sweetalert2';

const ZohoVendorBill = () => {
    const navigate = useNavigate();
    const { selectedOrganization } = useSelector((state) => state.auth);
    const [activeTab, setActiveTab] = useState('all');
    
    // Build query parameters based on active tab
    const getQueryParams = () => {
        const params = { organizationId: selectedOrganization?.id };
        if (activeTab !== 'all') {
            params.status = activeTab;
        }
        return params;
    };

    const { data: vendorBillsData, error, isLoading, refetch } = useGetVendorBillsQuery(getQueryParams(), {
        skip: !selectedOrganization?.id,
    });
    const [updateVendorBill] = useUpdateVendorBillMutation();
    const [deleteVendorBill] = useDeleteVendorBillMutation();
    const [uploadVendorBills] = useUploadVendorBillsMutation();
    const [analyzeVendorBill] = useAnalyzeVendorBillMutation();
    const [syncVendorBill] = useSyncVendorBillMutation();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState({ url: '', name: '' });
    const [analyzingBills, setAnalyzingBills] = useState(new Set());
    const [syncingBills, setSyncingBills] = useState(new Set());
    const [deletingBills, setDeletingBills] = useState(new Set());

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'draft', label: 'Draft' },
        { key: 'analysed', label: 'Analysed' },
        { key: 'synced', label: 'Synced' }
    ];

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
    };

    const handleAction = async (billId, action) => {
        try {
            switch (action) {
                case 'analyse':
                    // Set loading state
                    setAnalyzingBills(prev => new Set([...prev, billId]));
                    try {
                        await analyzeVendorBill({ 
                            organizationId: selectedOrganization?.id, 
                            billId 
                        }).unwrap();
                        globalToast.success('Bill analysis started successfully');
                        refetch(); // Refresh the list to show updated status
                    } finally {
                        // Remove loading state
                        setAnalyzingBills(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(billId);
                            return newSet;
                        });
                    }
                    break;
                case 'verify':
                    await updateVendorBill({ organizationId: selectedOrganization?.id, id: billId, status: 'Verified' }).unwrap();
                    globalToast.success('Bill verification completed');
                    break;
                case 'sync':
                    // Set loading state
                    setSyncingBills(prev => new Set([...prev, billId]));
                    try {
                        await syncVendorBill({ 
                            organizationId: selectedOrganization?.id, 
                            billId 
                        }).unwrap();
                        globalToast.success('Bill synced to Zoho successfully');
                        refetch(); // Refresh the list to show updated status
                    } finally {
                        // Remove loading state
                        setSyncingBills(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(billId);
                            return newSet;
                        });
                    }
                    break;
                case 'edit':
                    // TODO: Implement edit functionality
                    globalToast.info('Edit functionality coming soon');
                    break;
                case 'delete':
                    const result = await Swal.fire({
                        title: 'Are you sure?',
                        text: "You won't be able to revert this!",
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Yes, delete it!',
                        cancelButtonText: 'Cancel'
                    });

                    if (result.isConfirmed) {
                        // Set loading state
                        setDeletingBills(prev => new Set([...prev, billId]));
                        try {
                            await deleteVendorBill({ organizationId: selectedOrganization?.id, id: billId }).unwrap();
                            globalToast.success('Bill deleted successfully');
                            Swal.fire(
                                'Deleted!',
                                'Your bill has been deleted.',
                                'success'
                            );
                        } finally {
                            // Remove loading state
                            setDeletingBills(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(billId);
                                return newSet;
                            });
                        }
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

    const handleViewFile = (fileUrl, fileName) => {
        setSelectedFile({ url: fileUrl, name: fileName });
        setIsFileViewerOpen(true);
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
            const isAnalyzing = analyzingBills.has(bill.id);
            return (
                <div className="flex gap-2 flex-wrap items-center">
                    <button 
                        onClick={() => handleAction(bill.id, 'analyse')}
                        disabled={isAnalyzing}
                        className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 ${
                            isAnalyzing 
                                ? 'text-purple-400 bg-purple-25 border-purple-100 cursor-not-allowed opacity-75' 
                                : 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300 hover:shadow-md focus:ring-purple-500 active:scale-95'
                        }`}
                        title={isAnalyzing ? "Analysis in progress..." : "Analyse document"}
                    >
                        {isAnalyzing ? (
                            <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                            </svg>
                        )}
                        <span className="font-medium">{isAnalyzing ? 'Analyzing...' : 'Analyse'}</span>
                    </button>
                </div>
            );
        }

        if (status === 'Analysed') {
            const isSyncing = syncingBills.has(bill.id);
            return (
                <div className="flex gap-2 flex-wrap items-center">
                    <button 
                        onClick={() => handleAction(bill.id, 'sync')}
                        disabled={isSyncing}
                        className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 ${
                            isSyncing 
                                ? 'text-gray-400 bg-gray-25 border-gray-100 cursor-not-allowed opacity-75' 
                                : 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-md focus:ring-gray-500 active:scale-95'
                        }`}
                        title={isSyncing ? "Syncing in progress..." : "Sync with system"}
                    >
                        {isSyncing ? (
                            <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        )}
                        <span className="font-medium">{isSyncing ? 'Syncing...' : 'Sync'}</span>
                    </button>
                </div>
            );
        }

        if (status === 'Verified') {
            const isSyncing = syncingBills.has(bill.id);
            return (
                <div className="flex gap-2 flex-wrap items-center">
                    <button 
                        onClick={() => handleAction(bill.id, 'sync')}
                        disabled={isSyncing}
                        className={`group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 ${
                            isSyncing 
                                ? 'text-gray-400 bg-gray-25 border-gray-100 cursor-not-allowed opacity-75' 
                                : 'text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-md focus:ring-gray-500 active:scale-95'
                        }`}
                        title={isSyncing ? "Syncing in progress..." : "Sync with system"}
                    >
                        {isSyncing ? (
                            <svg className="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        )}
                        <span className="font-medium">{isSyncing ? 'Syncing...' : 'Sync'}</span>
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

    const vendorBills = vendorBillsData?.results || [];

    return (
        <div className="space-y-5">
            <Card 
                title={`Vendor Bills`}
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
                {/* Tab Navigation */}
                <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                                    activeTab === tab.key
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                            >
                                <span className="font-medium">{tab.label}</span>
                                {activeTab === tab.key && vendorBillsData?.count > 0 && (
                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                                        {vendorBillsData.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden ">
                            <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700!">
                                <thead className="bg-slate-200 dark:bg-slate-700">
                                    <tr>
                                        <th scope='col' className='table-th'>Sr. No</th>
                                        <th scope='col' className='table-th'>Document ID</th>
                                        <th scope='col' className='table-th'>Status</th>
                                        <th scope='col' className='table-th'>Created By</th>
                                        <th scope='col' className='table-th'>Created Date</th>
                                        <th scope='col' className='table-th'>Actions</th>
                                        <th scope='col' className='table-th'>Control</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700!">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" className="table-td text-center py-8">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                    <span className="text-slate-600">Loading vendor bills...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan="6" className="table-td text-center py-8">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="text-red-600">
                                                        <p className="text-lg font-medium">Failed to load vendor bills</p>
                                                        <p className="text-sm text-slate-500 mt-2">
                                                            {error?.data?.message || error?.message || 'An error occurred while fetching vendor bills'}
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
                                    ) : !vendorBills.length ? (
                                        <tr>
                                            <td colSpan="6" className="table-td text-center py-8">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div className="text-slate-500">
                                                        <p className="text-lg font-medium">No vendor bills found</p>
                                                        <p className="text-sm mt-2">Upload your first vendor bill to get started</p>
                                                    </div>
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
                                                            <button 
                                                                onClick={() => handleViewFile(bill.file, bill.billmunshiName || 'Vendor Bill')}
                                                                className="text-xs text-blue-600 hover:underline cursor-pointer"
                                                            >
                                                                View File
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="table-td">
                                                    {getStatusBadge(bill.status)}
                                                </td>
                                                <td className="table-td">
                                                    {bill.uploaded_by_name || 'N/A'}
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
                                                        {['Analysed', 'Verified', 'Posted', 'Synced'].includes(bill.status) && (
                                                            <button 
                                                                onClick={() => navigate(`/zoho/vendor-bill/${bill.id}`)}
                                                                className="group relative inline-flex items-center justify-center w-8 h-8 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm hover:bg-indigo-100 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all duration-200 active:scale-95"
                                                                title="View vendor bill details"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform duration-200">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleAction(bill.id, 'delete')}
                                                            disabled={deletingBills.has(bill.id)}
                                                            className={`group relative inline-flex items-center justify-center w-8 h-8 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 active:scale-95 ${
                                                                deletingBills.has(bill.id)
                                                                    ? 'text-red-400 bg-red-25 border-red-100 cursor-not-allowed opacity-75'
                                                                    : 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 focus:ring-red-500'
                                                            }`}
                                                            title={deletingBills.has(bill.id) ? "Deleting..." : "Delete vendor bill"}
                                                        >
                                                            {deletingBills.has(bill.id) ? (
                                                                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 group-hover:scale-110 transition-transform duration-200">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                                </svg>
                                                            )}
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
                
                {/* Pagination Controls - Only show when we have data and pagination is needed */}
                {vendorBills.length > 0 && (vendorBillsData?.next || vendorBillsData?.previous) && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>
                                Showing {vendorBills.length} of {vendorBillsData?.count || 0} vendor bills
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    // TODO: Implement pagination
                                    console.log('Previous page:', vendorBillsData.previous);
                                }}
                                disabled={!vendorBillsData?.previous || isLoading}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                Page
                            </span>
                            
                            <button
                                onClick={() => {
                                    // TODO: Implement pagination
                                    console.log('Next page:', vendorBillsData.next);
                                }}
                                disabled={!vendorBillsData?.next || isLoading}
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

            {/* Upload Modal */}
            <UploadBillModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
            />

            {/* File Viewer Modal */}
            <FileViewerModal
                isOpen={isFileViewerOpen}
                onClose={() => setIsFileViewerOpen(false)}
                fileUrl={selectedFile.url}
                fileName={selectedFile.name}
            />
        </div>
    );
};

export default ZohoVendorBill;