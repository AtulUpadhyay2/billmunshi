import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from "@/components/ui/Card";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import { useGetVendorBillQuery } from "@/store/api/zoho/vendorBillsApiSlice";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";

const ZohoVendorBillDetail = () => {
    const [mobileMenu, setMobileMenu] = useMobileMenu();
    const [collapsed, setMenuCollapsed] = useSidebar();
    const navigate = useNavigate();
    const { id: billId } = useParams();  // Fix: The route param is 'id', not 'billId'
    const { selectedOrganization } = useSelector((state) => state.auth);
    
    // Form state for vendor information
    const [vendorForm, setVendorForm] = useState({
        vendorName: '',
        invoiceNumber: '',
        vendorGST: '',
        dateIssued: ''
    });

    // State for managing item quantities
    const [itemQuantities, setItemQuantities] = useState([]);

    // Form state for bill summary
    const [billSummaryForm, setBillSummaryForm] = useState({
        subtotal: '',
        cgst: '',
        sgst: '',
        igst: '',
        total: ''
    });
    
    // Fetch vendor bill data
    const { data: vendorBillData, error, isLoading, refetch } = useGetVendorBillQuery(
        { organizationId: selectedOrganization?.id, billId },
        { skip: !selectedOrganization?.id || !billId }
    );

    // Extract analysed_data from the API response
    const analysedData = vendorBillData?.analysed_data || {};
    
    // Update form when data is loaded
    useEffect(() => {
        if (vendorBillData?.analysed_data) {
            const data = vendorBillData.analysed_data;
            setVendorForm({
                vendorName: data.vendorName || '',
                invoiceNumber: data.invoiceNumber || '',
                vendorGST: data.vendorGST || '',
                dateIssued: data.dateIssued ? new Date(data.dateIssued).toISOString().split('T')[0] : ''
            });

            // Initialize Bill Summary Form
            setBillSummaryForm({
                subtotal: data.subtotal || '',
                cgst: data.cgst || '',
                sgst: data.sgst || '',
                igst: data.igst || '',
                total: data.total || ''
            });

            // Initialize item quantities
            if (data.items && data.items.length > 0) {
                setItemQuantities(data.items.map(item => item.quantity || 0));
            }
        }
    }, [vendorBillData]);
    
    // Handle form input changes
    const handleFormChange = (name, value) => {
        setVendorForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle Bill Summary form changes
    const handleBillSummaryChange = (name, value) => {
        setBillSummaryForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle quantity updates
    const updateQuantity = (index, newQuantity) => {
        if (newQuantity >= 0) {
            setItemQuantities(prev => {
                const updated = [...prev];
                updated[index] = newQuantity;
                return updated;
            });
        }
    };
    
    // Debug logging - check what we actually get from the API
    useEffect(() => {
        if (vendorBillData) {
            console.log('Full API Response:', vendorBillData);
            console.log('Analysed Data:', analysedData);
        }
    }, [vendorBillData, analysedData]);

    // Auto-close sidebar when component mounts
    useEffect(() => {
        // Close mobile menu if it's open
        if (mobileMenu) {
            setMobileMenu(false);
        }
        // Always collapse sidebar when entering detail page for better viewing experience
        if (!collapsed) {
            setMenuCollapsed(true);
        }
    }, []); // Empty dependency array to run only on mount

    // Handle back button click
    const handleBackClick = () => {
        // Open sidebar if it's collapsed
        if (collapsed) {
            setMenuCollapsed(false);
        }
        // Navigate back to vendor bill list
        navigate('/zoho/vendor-bill');
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loading />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="space-y-5">
                <Card title="Error" noBorder>
                    <div className="flex flex-col items-center justify-center py-8">
                        <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-red-600 text-center">
                            <p className="text-lg font-medium">Failed to load vendor bill</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {error?.data?.message || error?.message || 'An error occurred while fetching vendor bill details'}
                            </p>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => refetch()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={handleBackClick}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Show message if no organization selected
    if (!selectedOrganization?.id) {
        return (
            <div className="text-center py-8">
                <div className="text-slate-500">No organization selected</div>
                <div className="text-xs text-slate-400 mt-2">Please select an organization to view vendor bill details</div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <Card 
                title={`Vendor Bill Detail${analysedData.invoiceNumber ? ` - ${analysedData.invoiceNumber}` : ''}`} 
                noBorder
                headerSlot={
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh vendor bill"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            {isLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button 
                            onClick={handleBackClick}
                            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-500 border border-transparent rounded-lg shadow-sm hover:bg-gray-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-all duration-200 active:scale-95"
                            title="Back"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <button 
                            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95"
                            title="Save"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>
                            Save
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Bill Photo/Image/PDF Section */}
                    <div className="lg:w-1/3">
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Bill Photo</h3>
                            <p className="text-sm text-gray-600 mb-4">Image/PDF</p>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                Upload File
                            </button>
                        </div>
                    </div>

                    {/* All Content in One Column */}
                    <div className="lg:w-2/3">
                        <div className="bg-white border border-gray-200 rounded-lg">
                            {/* Vendor Information Section */}
                            <div className="p-8 border-b border-gray-200">
                                {/* Simple Form Fields */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Vendor Name Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vendor Name
                                        </label>
                                        <input
                                            type="text"
                                            name="vendorName"
                                            value={vendorForm.vendorName}
                                            onChange={(e) => handleFormChange('vendorName', e.target.value)}
                                            placeholder="Enter vendor name"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    {/* Invoice Number Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Invoice Number
                                        </label>
                                        <input
                                            type="text"
                                            name="invoiceNumber"
                                            value={vendorForm.invoiceNumber}
                                            onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                                            placeholder="Enter invoice number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    {/* GST Number Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            GST Number
                                        </label>
                                        <input
                                            type="text"
                                            name="vendorGST"
                                            value={vendorForm.vendorGST}
                                            onChange={(e) => handleFormChange('vendorGST', e.target.value)}
                                            placeholder="Enter GST number"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>

                                    {/* Date Issued Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date Issued
                                        </label>
                                        <input
                                            type="date"
                                            name="dateIssued"
                                            value={vendorForm.dateIssued}
                                            onChange={(e) => handleFormChange('dateIssued', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Product Information Section */}
                            <div className="p-8 border-b border-gray-200">
                                {/* Items Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-900">Items Details</h3>
                                        </div>
                                        {analysedData.items && analysedData.items.length > 0 && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {analysedData.items.length} item{analysedData.items.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Enhanced Items Table */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                                                </svg>
                                                                Description
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                                </svg>
                                                                Quantity
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                            <div className="flex items-center gap-2">
                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                                </svg>
                                                                Rate
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                </svg>
                                                                Amount
                                                            </div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {analysedData.items && analysedData.items.length > 0 ? (
                                                        analysedData.items.map((item, index) => (
                                                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-start">
                                                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                                                            <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                                                                        </div>
                                                                        <div>
                                                                            <div className="text-sm font-medium text-gray-900 max-w-xs">
                                                                                {item.description || 'No description'}
                                                                            </div>
                                                                            {item.description && (
                                                                                <div className="text-xs text-gray-500 mt-1">Item #{index + 1}</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center gap-2">
                                                                        {/* Decrease Button */}
                                                                        <button
                                                                            onClick={() => updateQuantity(index, (itemQuantities[index] || item.quantity || 0) - 1)}
                                                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                                            disabled={(itemQuantities[index] !== undefined ? itemQuantities[index] : item.quantity || 0) <= 0}
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                                                            </svg>
                                                                        </button>
                                                                        
                                                                        {/* Quantity Display */}
                                                                        <div className="min-w-[60px] text-center">
                                                                            <input
                                                                                type="number"
                                                                                value={itemQuantities[index] !== undefined ? itemQuantities[index] : item.quantity || 0}
                                                                                readOnly
                                                                                className="w-16 px-2 py-1 text-center border border-gray-300 rounded bg-gray-50 text-gray-700 cursor-default [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                                min="0"
                                                                            />
                                                                        </div>
                                                                        
                                                                        {/* Increase Button */}
                                                                        <button
                                                                            onClick={() => updateQuantity(index, (itemQuantities[index] !== undefined ? itemQuantities[index] : item.quantity || 0) + 1)}
                                                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        ₹{item.rate?.toLocaleString('en-IN') || '0'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                                    <div className="text-sm font-bold text-green-600">
                                                                        ₹{((itemQuantities[index] !== undefined ? itemQuantities[index] : item.quantity || 0) * (item.rate || 0)).toLocaleString('en-IN')}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="px-6 py-12 text-center">
                                                                <div className="flex flex-col items-center">
                                                                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                                    </svg>
                                                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No items found</h3>
                                                                    <p className="text-sm text-gray-500">Items details not available in the document</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Bill Summary - Invoice Style */}
                            <div className="p-8 border-b border-gray-200">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Left Column - Tax Details */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-600 mr-2">₹</span>
                                                    <input
                                                        type="number"
                                                        name="subtotal"
                                                        value={billSummaryForm.subtotal}
                                                        onChange={e => handleBillSummaryChange('subtotal', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">CGST:</span>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-600 mr-2">₹</span>
                                                    <input
                                                        type="number"
                                                        name="cgst"
                                                        value={billSummaryForm.cgst}
                                                        onChange={e => handleBillSummaryChange('cgst', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">SGST:</span>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-600 mr-2">₹</span>
                                                    <input
                                                        type="number"
                                                        name="sgst"
                                                        value={billSummaryForm.sgst}
                                                        onChange={e => handleBillSummaryChange('sgst', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">IGST:</span>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-600 mr-2">₹</span>
                                                    <input
                                                        type="number"
                                                        name="igst"
                                                        value={billSummaryForm.igst}
                                                        onChange={e => handleBillSummaryChange('igst', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Right Column - Total */}
                                        <div className="flex items-center justify-center">
                                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 w-full">
                                                <div className="text-center">
                                                    <div className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-2">Total Amount</div>
                                                    <div className="flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-blue-600 mr-2">₹</span>
                                                        <input
                                                            type="number"
                                                            name="total"
                                                            value={billSummaryForm.total}
                                                            onChange={e => handleBillSummaryChange('total', e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-40 px-3 py-2 text-center text-2xl font-bold text-blue-600 border-0 border-b-2 border-blue-300 bg-transparent focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </div>
                                                    <div className="text-xs text-blue-600 mt-2">Including all taxes</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div className="p-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notes
                                    </label>
                                    <textarea 
                                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                                        placeholder="Add notes or comments..."
                                        rows={4}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ZohoVendorBillDetail;