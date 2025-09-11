import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from "@/components/ui/Card";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import { useGetVendorBillQuery } from "@/store/api/zoho/vendorBillsApiSlice";
import { useGetVendorsQuery, useGetChartOfAccountsQuery, useGetTaxesQuery } from "@/store/api/zoho/zohoApiSlice";
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
        dateIssued: '',
        selectedVendor: null
    });

    // State for managing item quantities
    const [itemQuantities, setItemQuantities] = useState([]);

    // State for managing products from zoho_bill
    const [products, setProducts] = useState([]);

    // Form state for bill summary
    const [billSummaryForm, setBillSummaryForm] = useState({
        subtotal: '',
        cgst: '',
        sgst: '',
        igst: '',
        total: ''
    });

    // State for notes
    const [notes, setNotes] = useState('');

    // State for image zoom and viewing
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Fetch vendor bill data
    const { data: vendorBillData, error, isLoading, refetch } = useGetVendorBillQuery(
        { organizationId: selectedOrganization?.id, billId },
        { skip: !selectedOrganization?.id || !billId }
    );

    // Fetch vendors list for dropdown
    const { data: vendorsData, isLoading: vendorsLoading } = useGetVendorsQuery(
        selectedOrganization?.id,
        { skip: !selectedOrganization?.id }
    );

    // Fetch chart of accounts for dropdown
    const { data: chartOfAccountsData, isLoading: chartOfAccountsLoading } = useGetChartOfAccountsQuery(
        { organizationId: selectedOrganization?.id, page: 1 },
        { skip: !selectedOrganization?.id }
    );

    // Fetch taxes for dropdown
    const { data: taxesData, isLoading: taxesLoading } = useGetTaxesQuery(
        { organizationId: selectedOrganization?.id, page: 1 },
        { skip: !selectedOrganization?.id }
    );

    // Extract analysed_data from the API response
    const analysedData = vendorBillData?.analysed_data || {};
    const zohoData = vendorBillData?.zoho_bill || {};
    
    // Update form when data is loaded
    useEffect(() => {
        if (vendorBillData?.analysed_data) {
            const data = vendorBillData.analysed_data;
            const zoho = vendorBillData.zoho_bill;
            
            setVendorForm({
                vendorName: data.from?.name || '',
                invoiceNumber: data.invoiceNumber || zoho?.bill_no || '',
                vendorGST: '',
                dateIssued: data.dateIssued ? new Date(data.dateIssued).toISOString().split('T')[0] : 
                           (zoho?.bill_date ? new Date(zoho.bill_date).toISOString().split('T')[0] : ''),
                selectedVendor: zoho?.vendor || null
            });

            // Initialize Bill Summary Form
            setBillSummaryForm({
                subtotal: (data.items?.reduce((sum, item) => sum + (item.price || 0), 0) || '').toString(),
                cgst: data.cgst || zoho?.cgst || '',
                sgst: data.sgst || zoho?.sgst || '',
                igst: data.igst || zoho?.igst || '',
                total: data.total || zoho?.total || ''
            });

            // Initialize notes from zoho_bill.note
            setNotes(zoho?.note || '');

            // Initialize products from zoho_bill.products
            if (zoho?.products && zoho.products.length > 0) {
                setProducts(zoho.products.map(product => ({
                    id: product.id,
                    item_details: product.item_details || product.item_name || '',
                    chart_of_accounts: product.chart_of_accounts || null,
                    taxes: product.taxes || null,
                    reverse_charge_tax_id: product.reverse_charge_tax_id || false,
                    itc_eligibility: product.itc_eligibility || 'eligible',
                    rate: product.rate || '',
                    quantity: product.quantity || '',
                    amount: product.amount || ''
                })));
            } else {
                // Initialize with empty product if no products exist
                setProducts([{
                    id: Date.now(),
                    item_details: '',
                    chart_of_accounts: null,
                    taxes: null,
                    reverse_charge_tax_id: false,
                    itc_eligibility: 'eligible',
                    rate: '',
                    quantity: '',
                    amount: ''
                }]);
            }

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

    // Handle vendor selection
    const handleVendorSelect = (vendor) => {
        setVendorForm(prev => ({
            ...prev,
            selectedVendor: vendor,
            vendorName: vendor.companyName || '',
            vendorGST: vendor.gstNo || ''
        }));
    };

    // Handle vendor deselection
    const handleVendorClear = () => {
        setVendorForm(prev => ({
            ...prev,
            selectedVendor: null,
            vendorName: analysedData?.from?.name || '',
            vendorGST: ''
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

    // Zoom and viewing functions
    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    // Check if file is PDF
    const isPDF = (fileUrl) => {
        return fileUrl && (fileUrl.toLowerCase().includes('.pdf') || fileUrl.toLowerCase().includes('pdf'));
    };

    // Product manipulation functions
    const handleProductChange = (index, field, value) => {
        setProducts(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            
            // Auto-calculate amount when rate or quantity changes
            if (field === 'rate' || field === 'quantity') {
                const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(updated[index].rate) || 0;
                const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updated[index].quantity) || 0;
                updated[index].amount = (rate * quantity).toString();
            }
            
            return updated;
        });
    };

    const addProduct = () => {
        setProducts(prev => [...prev, {
            id: Date.now(),
            item_details: '',
            chart_of_accounts: null,
            taxes: null,
            reverse_charge_tax_id: false,
            itc_eligibility: 'eligible',
            rate: '',
            quantity: '',
            amount: ''
        }]);
    };

    const removeProduct = (index) => {
        if (products.length > 1) {
            setProducts(prev => prev.filter((_, i) => i !== index));
        }
    };

    // ITC Eligibility options
    const itcEligibilityOptions = [
        { value: 'eligible', label: 'Eligible' },
        { value: 'ineligible_section17', label: 'Ineligible Section 17' },
        { value: 'ineligible_others', label: 'Ineligible Others' }
    ];
    
    // Debug logging - check what we actually get from the API
    useEffect(() => {
        if (vendorBillData) {
            console.log('Full API Response:', vendorBillData);
            console.log('Analysed Data:', analysedData);
            console.log('Zoho Bill Data:', zohoData);
        }
        if (vendorsData) {
            console.log('Vendors Data:', vendorsData);
            console.log('First Vendor Structure:', vendorsData.results?.[0]);
        }
    }, [vendorBillData, analysedData, zohoData, vendorsData]);

    // Keyboard shortcuts for zoom and fullscreen
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!vendorBillData?.file || isPDF(vendorBillData.file)) return;
            
            switch(e.key) {
                case 'f':
                case 'F':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        toggleFullscreen();
                    }
                    break;
                case '=':
                case '+':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomIn();
                    }
                    break;
                case '-':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomOut();
                    }
                    break;
                case '0':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleResetZoom();
                    }
                    break;
                case 'Escape':
                    if (isFullscreen) {
                        toggleFullscreen();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [vendorBillData?.file, isFullscreen, zoomLevel]);

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
                title={`Vendor Bill Detail${analysedData.invoiceNumber || zohoData.bill_no ? ` - ${analysedData.invoiceNumber || zohoData.bill_no}` : ''}`} 
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
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[400px] flex flex-col">
                            {vendorBillData?.file ? (
                                <div className="w-full h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">Bill Document</h3>
                                        <div className="flex items-center gap-2">
                                            {/* Keyboard Shortcuts Info */}
                                            {!isPDF(vendorBillData.file) && (
                                                <div className="relative group">
                                                    <button className="p-1.5 rounded-md bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors">
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                        <div className="font-medium mb-1">Keyboard Shortcuts:</div>
                                                        <div>Ctrl/Cmd + F: Fullscreen</div>
                                                        <div>Ctrl/Cmd + +: Zoom In</div>
                                                        <div>Ctrl/Cmd + -: Zoom Out</div>
                                                        <div>Ctrl/Cmd + 0: Reset Zoom</div>
                                                        <div>Esc: Exit Fullscreen</div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Zoom Controls - only for images */}
                                            {!isPDF(vendorBillData.file) && (
                                                <>
                                                    <button
                                                        onClick={handleZoomOut}
                                                        className="p-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                                        title="Zoom Out (Ctrl + -)"
                                                        disabled={zoomLevel <= 0.25}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-xs text-gray-600 min-w-[40px] text-center">
                                                        {Math.round(zoomLevel * 100)}%
                                                    </span>
                                                    <button
                                                        onClick={handleZoomIn}
                                                        className="p-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                                        title="Zoom In (Ctrl + +)"
                                                        disabled={zoomLevel >= 3}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={handleResetZoom}
                                                        className="p-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                                        title="Reset Zoom (Ctrl + 0)"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                            
                                            {/* Fullscreen Toggle */}
                                            <button
                                                onClick={toggleFullscreen}
                                                className="p-1.5 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                                title="Toggle Fullscreen (Ctrl + F)"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 flex items-center justify-center overflow-auto bg-white rounded-lg border border-gray-200">
                                        {isPDF(vendorBillData.file) ? (
                                            // PDF Viewer
                                            <iframe
                                                src={vendorBillData.file}
                                                className="w-full h-full min-h-[350px] border-0"
                                                title="Bill PDF Document"
                                                onError={(e) => {
                                                    console.error('PDF failed to load:', e);
                                                }}
                                            />
                                        ) : (
                                            // Image Viewer with Zoom
                                            <div 
                                                className="overflow-auto max-h-[350px] w-full flex items-center justify-center"
                                                style={{ 
                                                    cursor: zoomLevel > 1 ? 'grab' : 'default'
                                                }}
                                            >
                                                <img 
                                                    src={vendorBillData.file}
                                                    alt="Bill Document"
                                                    className="rounded-lg shadow-lg transition-transform duration-200"
                                                    style={{
                                                        transform: `scale(${zoomLevel})`,
                                                        maxWidth: zoomLevel <= 1 ? '100%' : 'none',
                                                        height: 'auto'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                                <div style={{display: 'none'}} className="flex flex-col items-center">
                                                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-sm text-gray-600">Unable to load document</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Bill Document</h3>
                                    <p className="text-sm text-gray-600">No document available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* All Content in One Column */}
                    <div className="lg:w-2/3">
                        <div className="bg-white border border-gray-200 rounded-lg">
                            {/* Vendor Information Section */}
                            <div className="p-8 border-b border-gray-200">
                                {/* Simple Form Fields */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Vendor Selection Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vendor
                                            {zohoData?.vendor === null && (
                                                <span className="ml-1 text-xs text-blue-600">(Select from list)</span>
                                            )}
                                        </label>
                                        {zohoData?.vendor === null ? (
                                            <div className="space-y-2">
                                                <div className="relative">
                                                    <select
                                                        value={vendorForm.selectedVendor?.contactId || ''}
                                                        onChange={(e) => {
                                                            const selectedVendor = vendorsData?.results?.find(v => v.contactId === e.target.value);
                                                            if (selectedVendor) {
                                                                handleVendorSelect(selectedVendor);
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                                        disabled={vendorsLoading}
                                                    >
                                                        <option value="" className="text-gray-500">
                                                            {vendorsLoading ? 'Loading vendors...' : 'Select a vendor...'}
                                                        </option>
                                                        {vendorsData?.results?.map((vendor) => (
                                                            <option key={vendor.contactId} value={vendor.contactId} className="text-gray-900">
                                                                {vendor.companyName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                        {vendorsLoading ? (
                                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* No vendors notification */}
                                                {vendorsData?.results?.length === 0 && !vendorsLoading && (
                                                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-700">
                                                        No vendors found. Please sync vendors from Zoho first.
                                                    </div>
                                                )}
                                                
                                                {/* Bill To Badge - showing analysed_data.to.name */}
                                                {analysedData?.to?.name && (
                                                    <div className="mt-2">
                                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            Bill To: {analysedData.to.name}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={vendorForm.vendorName}
                                                onChange={(e) => handleFormChange('vendorName', e.target.value)}
                                                placeholder="Enter vendor name"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                            />
                                        )}
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
                                            {zohoData?.vendor === null && vendorForm.selectedVendor && (
                                                <span className="ml-1 text-xs text-green-600">(Auto-filled)</span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            name="vendorGST"
                                            value={vendorForm.vendorGST}
                                            onChange={(e) => handleFormChange('vendorGST', e.target.value)}
                                            placeholder="Enter GST number"
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${
                                                zohoData?.vendor === null && vendorForm.selectedVendor 
                                                    ? 'bg-green-50 border-green-300' 
                                                    : ''
                                            }`}
                                            readOnly={zohoData?.vendor === null && vendorForm.selectedVendor}
                                        />
                                        {zohoData?.vendor === null && vendorForm.selectedVendor && (
                                            <p className="mt-1 text-xs text-green-600">
                                                GST number automatically filled from selected vendor
                                            </p>
                                        )}
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
                                {/* Products Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-900">Products Details</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {products.length} product{products.length > 1 ? 's' : ''}
                                            </span>
                                            <button
                                                onClick={addProduct}
                                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Add Product
                                            </button>
                                        </div>
                                    </div>

                                    {/* Enhanced Products Table - Scrollable */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                            <table className="w-full min-w-[1200px]">
                                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[200px]">
                                                            Item Details
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[150px]">
                                                            Chart of Accounts
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[120px]">
                                                            Taxes
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[120px]">
                                                            Reverse Charge
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[140px]">
                                                            ITC Eligibility
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[100px]">
                                                            Rate
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[80px]">
                                                            Quantity
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[100px]">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[80px]">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {products.map((product, index) => (
                                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                            {/* Item Details */}
                                                            <td className="px-4 py-3">
                                                                <textarea
                                                                    value={product.item_details}
                                                                    onChange={(e) => handleProductChange(index, 'item_details', e.target.value)}
                                                                    placeholder="Enter item details..."
                                                                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 resize-none"
                                                                    rows={2}
                                                                />
                                                            </td>

                                                            {/* Chart of Accounts */}
                                                            <td className="px-4 py-3">
                                                                <div className="relative">
                                                                    <select
                                                                        value={product.chart_of_accounts || ''}
                                                                        onChange={(e) => handleProductChange(index, 'chart_of_accounts', e.target.value || null)}
                                                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                                                        disabled={chartOfAccountsLoading}
                                                                    >
                                                                        <option value="" className="text-gray-500">Select Account...</option>
                                                                        {chartOfAccountsData?.results?.map((account) => (
                                                                            <option key={account.accountId} value={account.accountId} className="text-gray-900">
                                                                                {account.accountName}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                        {chartOfAccountsLoading ? (
                                                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                                        ) : (
                                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Taxes */}
                                                            <td className="px-4 py-3">
                                                                <div className="relative">
                                                                    <select
                                                                        value={product.taxes || ''}
                                                                        onChange={(e) => handleProductChange(index, 'taxes', e.target.value || null)}
                                                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                                                                        disabled={taxesLoading}
                                                                    >
                                                                        <option value="" className="text-gray-500">Select Tax...</option>
                                                                        {taxesData?.results?.map((tax) => (
                                                                            <option key={tax.taxId} value={tax.taxId} className="text-gray-900">
                                                                                {tax.taxName}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                        {taxesLoading ? (
                                                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                                        ) : (
                                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Reverse Charge Tax */}
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={product.reverse_charge_tax_id}
                                                                    onChange={(e) => handleProductChange(index, 'reverse_charge_tax_id', e.target.checked)}
                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                                />
                                                            </td>

                                                            {/* ITC Eligibility */}
                                                            <td className="px-4 py-3">
                                                                <div className="relative">
                                                                    <select
                                                                        value={product.itc_eligibility}
                                                                        onChange={(e) => handleProductChange(index, 'itc_eligibility', e.target.value)}
                                                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm appearance-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400"
                                                                    >
                                                                        {itcEligibilityOptions.map((option) => (
                                                                            <option key={option.value} value={option.value} className="text-gray-900">
                                                                                {option.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Rate */}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={product.rate}
                                                                    onChange={(e) => handleProductChange(index, 'rate', e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="w-full px-3 py-2 text-sm text-right bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>

                                                            {/* Quantity */}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={product.quantity}
                                                                    onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                                                                    placeholder="0"
                                                                    className="w-full px-3 py-2 text-sm text-center bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    min="0"
                                                                    step="1"
                                                                />
                                                            </td>

                                                            {/* Amount */}
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm font-semibold text-gray-900 text-right">
                                                                    ₹{parseFloat(product.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="px-4 py-3 text-center">
                                                                {products.length > 1 && (
                                                                    <button
                                                                        onClick={() => removeProduct(index)}
                                                                        className="inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                                                                        title="Remove Product"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {/* Products Summary */}
                                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">
                                                    Total Products: {products.length}
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    Subtotal: ₹{products.reduce((sum, product) => sum + parseFloat(product.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
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
                                        {zohoData?.note && (
                                            <span className="ml-1 text-xs text-blue-600">(Auto-loaded from bill)</span>
                                        )}
                                        {zohoData?.note && notes !== zohoData.note && notes.trim() !== '' && (
                                            <span className="ml-1 text-xs text-orange-600">(Modified)</span>
                                        )}
                                    </label>
                                    <textarea 
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                                        placeholder="Add notes or comments..."
                                        rows={4}
                                    />
                                    {zohoData?.note && notes === zohoData.note && (
                                        <p className="mt-1 text-xs text-blue-600">
                                            Original note from Zoho Bill
                                        </p>
                                    )}
                                    {zohoData?.note && notes !== zohoData.note && notes.trim() !== '' && (
                                        <p className="mt-1 text-xs text-orange-600">
                                            Note has been modified from original
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Fullscreen Modal */}
            {isFullscreen && vendorBillData?.file && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="relative w-full h-full flex flex-col">
                        {/* Fullscreen Header */}
                        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
                            <div className="flex items-center gap-4">
                                <h3 className="text-white text-lg font-medium">
                                    Bill Document - {analysedData.invoiceNumber || zohoData.bill_no || 'Unknown'}
                                </h3>
                                {!isPDF(vendorBillData.file) && (
                                    <div className="flex items-center gap-2 bg-black bg-opacity-50 rounded-lg px-3 py-1">
                                        <button
                                            onClick={handleZoomOut}
                                            className="p-1 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                                            title="Zoom Out"
                                            disabled={zoomLevel <= 0.25}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                            </svg>
                                        </button>
                                        <span className="text-white text-sm min-w-[40px] text-center">
                                            {Math.round(zoomLevel * 100)}%
                                        </span>
                                        <button
                                            onClick={handleZoomIn}
                                            className="p-1 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                                            title="Zoom In"
                                            disabled={zoomLevel >= 3}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleResetZoom}
                                            className="p-1 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                                            title="Reset Zoom"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                                title="Exit Fullscreen"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Fullscreen Content */}
                        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                            {isPDF(vendorBillData.file) ? (
                                <iframe
                                    src={vendorBillData.file}
                                    className="w-full h-full border-0 rounded-lg"
                                    title="Bill PDF Document - Fullscreen"
                                />
                            ) : (
                                <div className="overflow-auto w-full h-full flex items-center justify-center">
                                    <img
                                        src={vendorBillData.file}
                                        alt="Bill Document - Fullscreen"
                                        className="rounded-lg shadow-2xl transition-transform duration-200"
                                        style={{
                                            transform: `scale(${zoomLevel})`,
                                            maxWidth: zoomLevel <= 1 ? '100%' : 'none',
                                            maxHeight: zoomLevel <= 1 ? '100%' : 'none'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZohoVendorBillDetail;