import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import { useGetZohoExpenseBillQuery, useVerifyZohoExpenseBillMutation } from "@/store/api/zoho/expenseBillsApiSlice";
import { useGetVendorsQuery, useGetChartOfAccountsQuery, useGetTaxesQuery, useGetTdsTcsQuery } from "@/store/api/zoho/zohoApiSlice";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";

const ZohoExpenseBillDetail = () => {
    const [mobileMenu, setMobileMenu] = useMobileMenu();
    const [collapsed, setMenuCollapsed] = useSidebar();
    const navigate = useNavigate();
    const { id: billId } = useParams();
    const { selectedOrganization } = useSelector((state) => state.auth);
    
    // Form state for expense bill information
    const [billForm, setBillForm] = useState({
        billNumber: '',
        billDate: '',
        vendorName: '',
        totalAmount: '',
        selectedVendor: null,
        vendorGST: '',
        is_tax: 'TDS' // Default to TDS
    });

    // State for managing expense items
    const [expenseItems, setExpenseItems] = useState([]);

    // State for TDS/TCS selection
    const [selectedTdsTcs, setSelectedTdsTcs] = useState(null);

    // Form state for tax summary
    const [taxSummaryForm, setTaxSummaryForm] = useState({
        igst: '',
        cgst: '',
        sgst: '',
        total: ''
    });

    // State for notes
    const [notes, setNotes] = useState('');

    // State for image zoom and viewing
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // State for verification loading
    const [isVerifying, setIsVerifying] = useState(false);
    
    // State for error alert
    const [errorAlert, setErrorAlert] = useState({ show: false, message: '' });
    
    // Fetch expense bill data using the exact endpoint: zoho/org/{org_id}/expense-bills/{bill_id}/
    const { data: expenseBillData, error, isLoading, refetch } = useGetZohoExpenseBillQuery(
        { organizationId: selectedOrganization?.id, billId },
        { skip: !selectedOrganization?.id || !billId }
    );

    // Verify expense bill mutation
    const [verifyExpenseBill] = useVerifyZohoExpenseBillMutation();

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

    // Fetch TDS/TCS data based on selected tax type
    const { data: tdsTcsData, isLoading: tdsTcsLoading } = useGetTdsTcsQuery(
        { 
            organizationId: selectedOrganization?.id, 
            page: 1, 
            tax_type: billForm.is_tax 
        },
        { skip: !selectedOrganization?.id || !billForm.is_tax }
    );

    // Extract data from the API response
    const billInfo = expenseBillData?.bill || {};
    const analysedData = expenseBillData?.analysed_data || {};
    
    // Check if bill is verified (disable inputs if verified)
    const isVerified = billInfo?.status === 'Verified' || billInfo?.bill_status === 'Verified';
    
    // Validation helper functions
    const isVendorRequired = !billForm.selectedVendor;
    const getItemsWithoutCOA = () => expenseItems.filter(item => !item.chart_of_accounts_id);
    const hasValidationErrors = () => isVendorRequired || getItemsWithoutCOA().length > 0 || expenseItems.length === 0;

    // Utility function to check if file is PDF
    const isPDF = (url) => url && url.toLowerCase().includes('.pdf');

    // Handle form changes
    const handleFormChange = (field, value) => {
        setBillForm(prev => ({ ...prev, [field]: value }));
    };

    // Handle vendor selection
    const handleVendorSelect = (vendor) => {
        setBillForm(prev => ({ 
            ...prev, 
            selectedVendor: vendor,
            vendorName: vendor?.contact_name || '',
            vendorGST: vendor?.gst_in || ''
        }));
    };

    // Handle vendor clear
    const handleVendorClear = () => {
        setBillForm(prev => ({ 
            ...prev, 
            selectedVendor: null,
            vendorName: '',
            vendorGST: ''
        }));
    };

    // Handle back click
    const handleBackClick = () => {
        navigate('/zoho/expense-bills');
    };

    // Handle zoom functions
    const handleZoomIn = () => setZoomLevel(prev => Math.min(3, prev + 0.25));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(0.25, prev - 0.25));
    const handleResetZoom = () => setZoomLevel(1);

    // Handle fullscreen toggle
    const toggleFullscreen = () => setIsFullscreen(prev => !prev);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'f':
                        e.preventDefault();
                        toggleFullscreen();
                        break;
                    case '+':
                    case '=':
                        e.preventDefault();
                        handleZoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        handleZoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        handleResetZoom();
                        break;
                }
            } else if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Add expense item
    const addExpenseItem = () => {
        setExpenseItems(prev => [...prev, {
            item_name: '',
            item_details: '',
            chart_of_accounts_id: null,
            amount: ''
        }]);
    };

    // Remove expense item
    const removeExpenseItem = (index) => {
        setExpenseItems(prev => prev.filter((_, i) => i !== index));
    };

    // Handle tax summary changes
    const handleTaxSummaryChange = (field, value) => {
        setTaxSummaryForm(prev => ({ ...prev, [field]: value }));
    };
    
    // Update form data when expense bill data is loaded
    useEffect(() => {
        if (expenseBillData && billInfo) {
            // Update expense form with bill data
            setBillForm(prev => ({
                ...prev,
                billNumber: billInfo.bill_no || analysedData.bill_no || '',
                billDate: billInfo.bill_date || analysedData.bill_date || '',
                vendorName: billInfo.vendor_name || analysedData.vendor_name || '',
                totalAmount: billInfo.total || analysedData.total || '',
                vendorGST: billInfo.vendor_gst || analysedData.vendor_gst || '',
                selectedVendor: billInfo.vendor_id ? { 
                    id: billInfo.vendor_id, 
                    contact_name: billInfo.vendor_name 
                } : null,
                is_tax: billInfo.is_tax || 'TDS'
            }));

            // Update expense items if available
            if (billInfo.expense_items || analysedData.expense_items) {
                const items = billInfo.expense_items || analysedData.expense_items || [];
                setExpenseItems(items.map(item => ({
                    ...item,
                    chart_of_accounts_id: item.chart_of_accounts_id || item.chart_of_accounts || null,
                    amount: item.amount || '0'
                })));
            }

            // Update tax summary
            setTaxSummaryForm(prev => ({
                ...prev,
                cgst: billInfo.cgst || analysedData.cgst || '',
                sgst: billInfo.sgst || analysedData.sgst || '',
                igst: billInfo.igst || analysedData.igst || '',
                total: billInfo.total || analysedData.total || ''
            }));

            // Update notes
            setNotes(billInfo.note || analysedData.note || '');

            // Update TDS/TCS selection
            if (billInfo.tds_tcs_id) {
                setSelectedTdsTcs(billInfo.tds_tcs_id);
            }
        }
    }, [expenseBillData, billInfo, analysedData]);

    // Handle verify expense bill (save function)
    const handleSave = async () => {
        if (!selectedOrganization?.id || !billId) {
            setErrorAlert({ show: true, message: 'Missing organization or bill information' });
            return;
        }

        // Prepare items for verification
        const validItems = expenseItems.filter(item => 
            item.chart_of_accounts_id && 
            item.amount && 
            parseFloat(item.amount) > 0
        );

        if (validItems.length === 0) {
            setErrorAlert({ show: true, message: 'Please ensure all expense items have chart of accounts and amounts' });
            return;
        }

        if (!billForm.selectedVendor) {
            setErrorAlert({ show: true, message: 'Please select a vendor' });
            return;
        }

        setIsVerifying(true);
        setErrorAlert({ show: false, message: '' });

        try {
            const verifyData = {
                bill_id: billId,
                vendor: billForm.selectedVendor?.id || null,
                bill_no: billForm.billNumber,
                bill_date: billForm.billDate,
                total: taxSummaryForm.total,
                igst: taxSummaryForm.igst || "0",
                cgst: taxSummaryForm.cgst || "0",
                sgst: taxSummaryForm.sgst || "0",
                tds_tcs_id: selectedTdsTcs,
                is_tax: billForm.is_tax,
                note: notes,
                expense_items: validItems.map(item => ({
                    item_name: item.item_name?.substring(0, 100) || '', // Truncate if needed
                    item_details: item.item_details || '',
                    chart_of_accounts: item.chart_of_accounts_id,
                    amount: item.amount
                }))
            };

            await verifyExpenseBill({
                organizationId: selectedOrganization?.id,
                ...verifyData
            }).unwrap();

            globalToast.success('Expense bill verified successfully!');
            refetch(); // Refresh data after verification
        } catch (error) {
            console.error('Verification failed:', error);
            setErrorAlert({ 
                show: true, 
                message: error?.data?.message || 'Verification failed' 
            });
        } finally {
            setIsVerifying(false);
        }
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
                            <p className="text-lg font-medium">Failed to load expense bill</p>
                            <p className="text-sm text-gray-500 mt-2">
                                {error?.data?.message || error?.message || 'An error occurred while fetching expense bill details'}
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
                <div className="text-xs text-slate-400 mt-2">Please select an organization to view expense bill details</div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <Card 
                title={`Zoho Expense Bill Detail${billInfo.bill_munshi_name ? ` - ${billInfo.bill_munshi_name}` : ''}`} 
                noBorder
                headerSlot={
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh expense bill"
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
                            onClick={handleSave}
                            disabled={isVerifying || isVerified || hasValidationErrors()}
                            className={`group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isVerified ? 'bg-gray-400 hover:bg-gray-400' : hasValidationErrors() ? 'bg-gray-400 hover:bg-gray-400' : ''}`}
                            title={isVerifying ? "Verifying..." : isVerified ? "Already Verified" : hasValidationErrors() ? "Please select vendor and chart of accounts for all items" : "Verify"}
                        >
                            {isVerifying ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            ) : isVerified ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {isVerifying ? 'Verifying...' : isVerified ? 'Verified' : 'Verify'}
                        </button>
                    </div>
                }
            >
                {/* Bootstrap-style Error Alert */}
                {errorAlert.show && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg relative" role="alert">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <strong className="font-medium">Verification Error:</strong>
                                <div className="mt-1 text-sm">{errorAlert.message}</div>
                            </div>
                            <button
                                onClick={() => setErrorAlert({ show: false, message: '' })}
                                className="ml-4 text-red-500 hover:text-red-700 focus:outline-none"
                                aria-label="Close alert"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="flex flex-col lg:flex-row gap-6 relative">
                    {/* Bill Photo/Image/PDF Section - Fixed/Sticky on Large Screens */}
                    <div className="w-full lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
                            {billInfo?.bill_image_url ? (
                                <div className="w-full h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                        <h3 className="text-lg font-medium text-gray-900">Bill Document</h3>
                                        <div className="flex items-center gap-2">
                                            {/* Keyboard Shortcuts Info */}
                                            {!isPDF(billInfo.bill_image_url) && (
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
                                            {!isPDF(billInfo.bill_image_url) && (
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
                                        {isPDF(billInfo.bill_image_url) ? (
                                            // PDF Viewer
                                            <iframe
                                                src={billInfo.bill_image_url}
                                                className="w-full h-full border-0"
                                                title="Bill PDF Document"
                                                onError={(e) => {
                                                    console.error('PDF failed to load:', e);
                                                }}
                                            />
                                        ) : (
                                            // Image Viewer with Zoom
                                            <div 
                                                className="overflow-auto w-full h-full flex items-center justify-center"
                                                style={{ 
                                                    cursor: zoomLevel > 1 ? 'grab' : 'default'
                                                }}
                                            >
                                                <img 
                                                    src={billInfo.bill_image_url}
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

                    {/* Scrollable Content Column */}
                    <div className="lg:w-2/3">
                        <div className="bg-white border border-gray-200 rounded-lg overflow-visible">
                            {/* Bill Information Section */}
                            <div className="p-8 border-b border-gray-200">
                                <div className="flex items-center gap-2 mb-6">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-900">Bill Information</h3>
                                </div>

                                {/* Validation Summary */}
                                {!isVerified && hasValidationErrors() && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            <div>
                                                <h4 className="text-sm font-medium text-red-800 mb-2">Required for verification:</h4>
                                                <ul className="text-sm text-red-700 space-y-1">
                                                    {isVendorRequired && <li>• Select a vendor</li>}
                                                    {expenseItems.length === 0 && <li>• Add at least one expense item</li>}
                                                    {getItemsWithoutCOA().length > 0 && (
                                                        <li>• Select Chart of Accounts for {getItemsWithoutCOA().length} expense item{getItemsWithoutCOA().length > 1 ? 's' : ''}</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Bill Form Fields */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Vendor Selection Field */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vendor <span className="text-red-500">*</span>
                                            {isVendorRequired && !isVerified && (
                                                <span className="text-red-500 text-xs ml-2">Required for verification</span>
                                            )}
                                        </label>
                                        <div className={`${isVendorRequired && !isVerified ? 'ring-2 ring-red-300 rounded-md' : ''}`}>
                                            <SearchableDropdown
                                                options={vendorsData?.contacts || []}
                                                value={billForm.selectedVendor?.id || null}
                                                onChange={handleVendorSelect}
                                                onClear={handleVendorClear}
                                                placeholder="Search and select vendor..."
                                                searchPlaceholder="Type to search vendors..."
                                                optionLabelKey="contact_name"
                                                optionValueKey="id"
                                                loading={vendorsLoading}
                                                disabled={isVerified}
                                                renderOption={(vendor) => (
                                                    <div className="flex flex-col py-1">
                                                        <div className="font-medium text-gray-900">{vendor.contact_name}</div>
                                                        {vendor.gst_in && (
                                                            <div className="text-xs text-gray-500">GST: {vendor.gst_in}</div>
                                                        )}
                                                    </div>
                                                )}
                                                className="mb-2"
                                            />
                                        </div>

                                        {/* Bill From Badge - showing analysed_data.from.name */}
                                        {analysedData?.from?.name && (
                                            <div className="mt-3">
                                                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    Bill From: {analysedData.from.name}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bill Number Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bill Number
                                        </label>
                                        <input
                                            type="text"
                                            name="billNumber"
                                            value={billForm.billNumber}
                                            onChange={(e) => handleFormChange('billNumber', e.target.value)}
                                            placeholder="Enter bill number"
                                            disabled={isVerified}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                        />
                                    </div>

                                    {/* Bill Date Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bill Date
                                        </label>
                                        <input
                                            type="text"
                                            name="billDate"
                                            value={billForm.billDate}
                                            onChange={(e) => handleFormChange('billDate', e.target.value)}
                                            placeholder="DD-MM-YYYY"
                                            disabled={isVerified}
                                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Expense Items Section */}
                            <div className="relative p-8 border-b border-gray-200">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-gray-900">Expense Items</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {expenseItems.length} item{expenseItems.length > 1 ? 's' : ''}
                                            </span>
                                            <button
                                                onClick={addExpenseItem}
                                                disabled={isVerified}
                                                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 ${isVerified ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' : ''}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Add Item
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expense Items List */}
                                    <div className="space-y-4">
                                        {expenseItems.length > 0 ? (
                                            expenseItems.map((item, index) => (
                                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <h4 className="text-sm font-medium text-gray-900">Item {index + 1}</h4>
                                                        {!isVerified && (
                                                            <button
                                                                onClick={() => removeExpenseItem(index)}
                                                                className="text-red-500 hover:text-red-700 focus:outline-none"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {/* Item Details */}
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                Item Details
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.item_details || ''}
                                                                onChange={(e) => {
                                                                    const newItems = [...expenseItems];
                                                                    newItems[index] = { ...item, item_details: e.target.value };
                                                                    setExpenseItems(newItems);
                                                                }}
                                                                disabled={isVerified}
                                                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                                                placeholder="Enter item details..."
                                                            />
                                                        </div>

                                                        {/* Chart of Accounts and Amount in same row */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className={`${!item.chart_of_accounts_id && !isVerified ? 'ring-2 ring-red-300 rounded-md' : ''}`}>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Chart of Accounts <span className="text-red-500">*</span>
                                                                    {!item.chart_of_accounts_id && !isVerified && (
                                                                        <span className="text-red-500 text-xs ml-1">Required</span>
                                                                    )}
                                                                </label>
                                                                <SearchableDropdown
                                                                    options={chartOfAccountsData?.chart_of_accounts || []}
                                                                    value={chartOfAccountsData?.chart_of_accounts?.find(acc => acc.account_id === item.chart_of_accounts_id) || null}
                                                                    onChange={(account) => {
                                                                        const newItems = [...expenseItems];
                                                                        newItems[index] = { ...item, chart_of_accounts_id: account?.account_id || null };
                                                                        setExpenseItems(newItems);
                                                                    }}
                                                                    placeholder="Select account..."
                                                                    searchPlaceholder="Type to search accounts..."
                                                                    optionLabelKey="account_name"
                                                                    optionValueKey="account_id"
                                                                    loading={chartOfAccountsLoading}
                                                                    disabled={isVerified}
                                                                    renderOption={(account) => (
                                                                        <div className="flex flex-col py-1">
                                                                            <div className="font-medium text-gray-900">{account.account_name}</div>
                                                                            {account.account_code && (
                                                                                <div className="text-xs text-gray-500">Code: {account.account_code}</div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    className="text-xs"
                                                                />
                                                            </div>
                                                            
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    Amount <span className="text-red-500">*</span>
                                                                </label>
                                                                <div className="flex items-center">
                                                                    <span className="text-sm text-gray-600 mr-2">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={item.amount || ''}
                                                                        onChange={(e) => {
                                                                            const newItems = [...expenseItems];
                                                                            newItems[index] = { ...item, amount: e.target.value };
                                                                            setExpenseItems(newItems);
                                                                        }}
                                                                        disabled={isVerified}
                                                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                <h3 className="text-lg font-medium text-gray-900 mb-2">No expense items</h3>
                                                <p className="text-sm text-gray-600 mb-4">Add expense items to continue with verification</p>
                                                {!isVerified && (
                                                    <button
                                                        onClick={addExpenseItem}
                                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                        Add First Item
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tax Summary Section */}
                            <div className="p-8 border-b border-gray-200">
                                <div className="flex items-center gap-2 mb-6">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-900">Tax Summary</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column - Tax Details */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-sm font-medium text-gray-700">CGST:</span>
                                            <div className="flex items-center">
                                                <span className="text-sm text-gray-600 mr-2">₹</span>
                                                <input
                                                    type="number"
                                                    name="cgst"
                                                    value={taxSummaryForm.cgst}
                                                    onChange={e => handleTaxSummaryChange('cgst', e.target.value)}
                                                    placeholder="0.00"
                                                    disabled={isVerified}
                                                    className={`w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                                    value={taxSummaryForm.sgst}
                                                    onChange={e => handleTaxSummaryChange('sgst', e.target.value)}
                                                    placeholder="0.00"
                                                    disabled={isVerified}
                                                    className={`w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                                    value={taxSummaryForm.igst}
                                                    onChange={e => handleTaxSummaryChange('igst', e.target.value)}
                                                    placeholder="0.00"
                                                    disabled={isVerified}
                                                    className={`w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                                        name="totalAmount"
                                                        value={billForm.totalAmount}
                                                        onChange={e => handleFormChange('totalAmount', e.target.value)}
                                                        placeholder="0.00"
                                                        disabled={isVerified}
                                                        className={`w-40 px-3 py-2 text-center text-2xl font-bold text-blue-600 border-0 border-b-2 border-blue-300 bg-transparent focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isVerified ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    />
                                                </div>
                                                <div className="text-xs text-blue-600 mt-2">Including all taxes</div>
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
                                        value={notes || `Page URL: ${window.location.href}\n\n`}
                                        onChange={(e) => setNotes(e.target.value)}
                                        disabled={isVerified}
                                        className={`w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                        placeholder="Add notes or comments..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Fullscreen Modal */}
            {isFullscreen && billInfo?.bill_image_url && (
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="relative w-full h-full flex flex-col">
                        {/* Fullscreen Header */}
                        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
                            <div className="flex items-center gap-4">
                                <h3 className="text-white text-lg font-medium">
                                    Bill Document - {billInfo.bill_munshi_name || analysedData.billNumber || 'Unknown'}
                                </h3>
                                {!isPDF(billInfo.bill_image_url) && (
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
                            {isPDF(billInfo.bill_image_url) ? (
                                <iframe
                                    src={billInfo.bill_image_url}
                                    className="w-full h-full border-0 rounded-lg"
                                    title="Bill PDF Document - Fullscreen"
                                />
                            ) : (
                                <div className="overflow-auto w-full h-full flex items-center justify-center">
                                    <img
                                        src={billInfo.bill_image_url}
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
}

export default ZohoExpenseBillDetail