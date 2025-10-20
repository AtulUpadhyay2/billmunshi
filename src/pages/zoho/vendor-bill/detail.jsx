import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import { useGetVendorBill, useVerifyVendorBill } from "@/hooks/api/zoho/zohoVendorBillService";
import { useGetVendors, useGetChartOfAccounts, useGetTaxes, useGetTdsTcs } from "@/hooks/api/zoho/zohoApiService";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";

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
        dueDate: '',
        selectedVendor: null,
        is_tax: 'TDS' // Default to TDS
    });

    // State for managing item quantities
    const [itemQuantities, setItemQuantities] = useState([]);

    // State for managing products from zoho_bill
    const [products, setProducts] = useState([]);

    // State for TDS/TCS selection
    const [selectedTdsTcs, setSelectedTdsTcs] = useState(null);

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
    
    // State for verification
    const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error', or null
    const [verificationMessage, setVerificationMessage] = useState('');
    
    // Fetch vendor bill data
    const { data: vendorBillData, error, isLoading, refetch } = useGetVendorBill(
        { organizationId: selectedOrganization?.id, billId }
    );

    // Verify vendor bill mutation
    const { 
        mutateAsync: verifyVendorBill,
        isPending: isVerifying, 
        error: verifyError, 
        isSuccess: verifySuccess 
    } = useVerifyVendorBill();

    // Fetch vendors list for dropdown
    const { data: vendorsData, isLoading: vendorsLoading } = useGetVendors(
        selectedOrganization?.id
    );

    // Fetch chart of accounts for dropdown
    const { data: chartOfAccountsData, isLoading: chartOfAccountsLoading } = useGetChartOfAccounts(
        { organizationId: selectedOrganization?.id, page: 1 }
    );

    // Fetch taxes for dropdown
    const { data: taxesData, isLoading: taxesLoading } = useGetTaxes(
        { organizationId: selectedOrganization?.id, page: 1 }
    );

    // Fetch TDS/TCS data based on selected tax type
    const { data: tdsTcsData, isLoading: tdsTcsLoading } = useGetTdsTcs(
        { 
            organizationId: selectedOrganization?.id, 
            page: 1, 
            tax_type: vendorForm.is_tax 
        },
        { 
            enabled: !!selectedOrganization?.id && !!vendorForm.is_tax 
        }
    );

    // Extract analysed_data from the API response
    const analysedData = vendorBillData?.analysed_data || {};
    const zohoData = vendorBillData?.zoho_bill || {};
    const productSync = vendorBillData?.product_sync || false;
    
    // Check if bill is verified, synced, or posted (disable inputs if any of these statuses)
    const isVerified = vendorBillData?.status === 'Verified' || vendorBillData?.status === 'Synced' || vendorBillData?.status === 'Posted';
    
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
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : 
                        (zoho?.due_date ? new Date(zoho.due_date).toISOString().split('T')[0] : ''),
                selectedVendor: zoho?.vendor || null,
                is_tax: zoho?.is_tax || 'TDS' // Load from zoho_bill or default to TDS
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
        if (vendor === null) {
            // Clear vendor selection
            setVendorForm(prev => ({
                ...prev,
                selectedVendor: null,
                vendorName: analysedData?.to?.name || '',
                vendorGST: ''
            }));
        } else {
            // Set selected vendor
            setVendorForm(prev => ({
                ...prev,
                selectedVendor: vendor,
                vendorName: vendor.companyName || '',
                vendorGST: vendor.gstNo || ''
            }));
        }
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

    // Handle verification success/error
    useEffect(() => {
        if (verifySuccess) {
            setVerificationStatus('success');
        } else if (verifyError) {
            setVerificationStatus('error');
        }
    }, [verifySuccess, verifyError]);

    // Handle back button click
    const handleBackClick = () => {
        // Open sidebar if it's collapsed
        if (collapsed) {
            setMenuCollapsed(false);
        }
        // Navigate back to vendor bill list
        navigate('/zoho/vendor-bill');
    };

    // Handle verification
    const handleVerification = async () => {
        try {
            setVerificationStatus(null);
            setVerificationMessage('');
            
            // Basic validation
            if (!vendorForm.invoiceNumber.trim()) {
                globalToast.error('Invoice number is required');
                setVerificationStatus('error');
                setVerificationMessage('Invoice number is required');
                return;
            }

            if (!vendorForm.dateIssued) {
                globalToast.error('Date issued is required');
                setVerificationStatus('error');
                setVerificationMessage('Date issued is required');
                return;
            }

            if (!billSummaryForm.total || parseFloat(billSummaryForm.total) <= 0) {
                globalToast.error('Valid total amount is required');
                setVerificationStatus('error');
                setVerificationMessage('Valid total amount is required');
                return;
            }

            // Check if at least one product exists with valid data
            const validProducts = products.filter(p => p.item_details.trim() && p.rate && p.quantity);
            if (validProducts.length === 0) {
                globalToast.error('At least one product with valid details, rate, and quantity is required');
                setVerificationStatus('error');
                setVerificationMessage('At least one product with valid details, rate, and quantity is required');
                return;
            }
            
            // Prepare the verification data based on the structure you provided
            const verificationData = {
                bill_id: billId,
                zoho_bill: {
                    id: zohoData?.id,
                    selectBill: billId,
                    vendor: vendorForm.selectedVendor?.id || null,
                    bill_no: vendorForm.invoiceNumber,
                    bill_date: vendorForm.dateIssued,
                    due_date: vendorForm.dueDate,
                    total: billSummaryForm.total,
                    igst: billSummaryForm.igst || "0",
                    cgst: billSummaryForm.cgst || "0",
                    sgst: billSummaryForm.sgst || "0",
                    tds_tcs_id: selectedTdsTcs,
                    is_tax: vendorForm.is_tax,
                    note: notes,
                    products: validProducts.map(product => ({
                        item_name: product.item_details.substring(0, 100), // Truncate if needed
                        item_details: product.item_details,
                        chart_of_accounts: product.chart_of_accounts,
                        taxes: product.taxes,
                        reverse_charge_tax_id: product.reverse_charge_tax_id,
                        itc_eligibility: product.itc_eligibility,
                        rate: product.rate,
                        quantity: product.quantity,
                        amount: product.amount
                    }))
                }
            };

            const result = await verifyVendorBill({
                organizationId: selectedOrganization?.id,
                billId,
                billData: verificationData
            });

            // Show success toast
            globalToast.success('Vendor bill verified successfully!');
            
            // setVerificationStatus('success');
            // setVerificationMessage('Vendor bill verified successfully');
            
            // Redirect to vendor bill list after a short delay
            setTimeout(() => {
                navigate('/zoho/vendor-bill');
            }, 1500);
            
        } catch (error) {
            console.error('Verification failed:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Verification failed. Please try again.';
            
            // Show error toast
            globalToast.error(errorMessage);
            
            setVerificationStatus('error');
            setVerificationMessage(errorMessage);
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
            {/* Verification Status Messages */}
            {verificationStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-green-800">Verification Successful</h3>
                            <p className="text-sm text-green-700 mt-1">
                                {verificationMessage || 'The vendor bill has been successfully verified and submitted to Zoho.'}
                            </p>
                        </div>
                        <button
                            onClick={() => setVerificationStatus(null)}
                            className="ml-auto text-green-600 hover:text-green-800"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {verificationStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                            <p className="text-sm text-red-700 mt-1">
                                {verificationMessage || 'There was an error verifying the vendor bill. Please check the form data and try again.'}
                            </p>
                        </div>
                        <button
                            onClick={() => setVerificationStatus(null)}
                            className="ml-auto text-red-600 hover:text-red-800"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <Card 
                title={`Vendor Bill Detail`} 
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
                            onClick={() => navigate(`/zoho/vendor-bill/${vendorBillData?.next_bill}`)}
                            disabled={!vendorBillData?.next_bill}
                            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={vendorBillData?.next_bill ? "Go to next bill" : "No next bill available"}
                        >
                            Next
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button 
                            onClick={handleVerification}
                            disabled={isVerifying || isVerified || !selectedOrganization?.id}
                            className={`group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isVerified ? 'bg-gray-400 hover:bg-gray-400' : ''}`}
                            title={isVerified ? "Bill already verified/synced/posted" : "Verify Bill"}
                        >
                            {isVerifying ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Verify
                                </>
                            )}
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col lg:flex-row gap-6 relative">
                    {/* Bill Photo/Image/PDF Section - Fixed/Sticky on Large Screens */}
                    <div className="w-full lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
                            {vendorBillData?.file ? (
                                <div className="w-full h-full flex flex-col">
                                    {/* Fixed Header - Always Visible */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-300 flex-shrink-0 z-10">
                                        <h3 className="text-base font-medium text-gray-900 truncate mr-2">{analysedData.invoiceNumber || zohoData.bill_no ? `${analysedData.invoiceNumber || zohoData.bill_no}` : 'Document'}</h3>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {/* Keyboard Shortcuts Info */}
                                            {!isPDF(vendorBillData.file) && (
                                                <div className="relative group">
                                                    <button className="p-1 rounded-md bg-gray-100 border border-gray-300 hover:bg-gray-200 transition-colors">
                                                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </button>
                                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
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
                                                        className="p-1 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Zoom Out (Ctrl + -)"
                                                        disabled={zoomLevel <= 0.25}
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-[11px] font-medium text-gray-700 min-w-[38px] text-center bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {Math.round(zoomLevel * 100)}%
                                                    </span>
                                                    <button
                                                        onClick={handleZoomIn}
                                                        className="p-1 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Zoom In (Ctrl + +)"
                                                        disabled={zoomLevel >= 3}
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={handleResetZoom}
                                                        className="p-1 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                                        title="Reset Zoom (Ctrl + 0)"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                            
                                            {/* Fullscreen Toggle */}
                                            <button
                                                onClick={toggleFullscreen}
                                                className="p-1 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                                                title="Toggle Fullscreen (Ctrl + F)"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Scrollable Content Area */}
                                    <div className="flex-1 overflow-auto bg-white">
                                        {isPDF(vendorBillData.file) ? (
                                            // PDF Viewer
                                            <iframe
                                                src={vendorBillData.file}
                                                className="w-full h-full border-0"
                                                title="Bill PDF Document"
                                                onError={(e) => {
                                                    console.error('PDF failed to load:', e);
                                                }}
                                            />
                                        ) : (
                                            // Image Viewer with Zoom and Scroll
                                            <div 
                                                className="w-full h-full p-4"
                                                style={{ 
                                                    cursor: zoomLevel > 1 ? 'move' : 'default',
                                                    minHeight: '100%',
                                                    display: 'flex',
                                                    alignItems: zoomLevel <= 1 ? 'center' : 'flex-start',
                                                    justifyContent: zoomLevel <= 1 ? 'center' : 'flex-start'
                                                }}
                                            >
                                                <img 
                                                    src={vendorBillData.file}
                                                    alt="Bill Document"
                                                    className="rounded-lg shadow-lg transition-transform duration-200 select-none"
                                                    style={{
                                                        width: zoomLevel <= 1 ? '100%' : `${zoomLevel * 100}%`,
                                                        height: 'auto',
                                                        maxWidth: zoomLevel <= 1 ? '100%' : 'none',
                                                        objectFit: 'contain'
                                                    }}
                                                    draggable="false"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div style={{display: 'none'}} className="flex flex-col items-center justify-center w-full h-full">
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
                            {/* Vendor Information Section */}
                            <div className="p-8 border-b border-gray-200">
                                {/* Simple Form Fields */}
                                <div className="space-y-4">
                                    {/* First Row: Vendor and Invoice Number */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Vendor Selection Field */}
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Vendor
                                                {zohoData?.vendor === null && (
                                                    <span className="ml-1 text-xs text-blue-600">(Select from list)</span>
                                                )}
                                            </label>
                                            {zohoData?.vendor === null ? (
                                                <div className="space-y-2">
                                                    <SearchableDropdown
                                                        options={vendorsData?.results?.map(vendor => ({
                                                            value: vendor.contactId,
                                                            label: vendor.companyName,
                                                            gstNo: vendor.gstNo
                                                        })) || []}
                                                        value={vendorForm.selectedVendor?.contactId || ''}
                                                        onChange={(value) => {
                                                            if (value === null || value === '') {
                                                                // Clear vendor selection
                                                                handleVendorSelect(null);
                                                            } else {
                                                                const selectedVendor = vendorsData?.results?.find(v => v.contactId === value);
                                                                if (selectedVendor) {
                                                                    handleVendorSelect(selectedVendor);
                                                                }
                                                            }
                                                        }}
                                                        onClear={() => {
                                                            // Explicitly clear vendor selection
                                                            handleVendorSelect(null);
                                                        }}
                                                        placeholder="Select a vendor..."
                                                        searchPlaceholder="Search vendors..."
                                                        loading={vendorsLoading}
                                                        loadingMessage="Loading vendors..."
                                                        disabled={isVerified}
                                                        noOptionsMessage="No vendors found"
                                                        renderOption={(option) => (
                                                            <div>
                                                                <div className="font-medium">{option.label}</div>
                                                                {option.gstNo && (
                                                                    <div className="text-xs text-gray-500">GST: {option.gstNo}</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    />
                                                    
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
                                                                Vendor Name: {analysedData.to.name}
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
                                                    disabled={isVerified}
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
                                                disabled={isVerified}
                                            />
                                        </div>
                                    </div>

                                    {/* Second Row: GST, Date Issued, Due Date in 4 columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* GST Number Field */}
                                        <div className="lg:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                GST Number
                                                {/* {zohoData?.vendor === null && vendorForm.selectedVendor && (
                                                    <span className="ml-1 text-xs text-green-600">(Auto-filled)</span>
                                                )} */}
                                            </label>
                                            <input
                                                type="text"
                                                name="vendorGST"
                                                value={vendorForm.vendorGST}
                                                onChange={(e) => handleFormChange('vendorGST', e.target.value)}
                                                placeholder="Enter GST number"
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none`}
                                                readOnly={zohoData?.vendor === null && vendorForm.selectedVendor}
                                                disabled={isVerified}
                                            />
                                            {zohoData?.vendor === null && vendorForm.selectedVendor && (
                                                <p className="mt-1 text-xs">
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
                                                disabled={isVerified}
                                            />
                                        </div>

                                        {/* Due Date Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Due Date
                                            </label>
                                            <input
                                                type="date"
                                                name="dueDate"
                                                value={vendorForm.dueDate}
                                                onChange={(e) => handleFormChange('dueDate', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                disabled={isVerified}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Information Section */}
                            <div className="relative p-8 border-b border-gray-200">
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
                                            <button
                                                onClick={addProduct}
                                                className="inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200"
                                                title="Add"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Enhanced Products Table - Scrollable */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
                                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                            <table className="w-full min-w-[1200px]">
                                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[200px]">
                                                            Item Details
                                                        </th>
                                                        {productSync && (
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[150px]">
                                                                Chart of Accounts
                                                            </th>
                                                        )}
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
                                                                    disabled={isVerified}
                                                                />
                                                            </td>

                                                            {/* Chart of Accounts - Only show if productSync is true */}
                                                            {productSync && (
                                                                <td className="relative px-4 py-3">
                                                                    <SearchableDropdown
                                                                        options={chartOfAccountsData?.results?.map(account => ({
                                                                            value: account.id,
                                                                            label: account.accountName
                                                                        })) || []}
                                                                        value={product.chart_of_accounts || ''}
                                                                        onChange={(value) => handleProductChange(index, 'chart_of_accounts', value || null)}
                                                                        onClear={() => handleProductChange(index, 'chart_of_accounts', null)}
                                                                        placeholder="Select Account..."
                                                                        searchPlaceholder="Search accounts..."
                                                                        loading={chartOfAccountsLoading}
                                                                        loadingMessage="Loading accounts..."
                                                                        noOptionsMessage="No accounts found"
                                                                        disabled={isVerified}
                                                                    />
                                                                </td>
                                                            )}

                                                            {/* Taxes */}
                                                            <td className="relative px-4 py-3">
                                                                <SearchableDropdown
                                                                    options={taxesData?.results?.map(tax => ({
                                                                        value: tax.id,
                                                                        label: tax.taxName
                                                                    })) || []}
                                                                    value={product.taxes || ''}
                                                                    onChange={(value) => handleProductChange(index, 'taxes', value || null)}
                                                                    onClear={() => handleProductChange(index, 'taxes', null)}
                                                                    placeholder="Select Tax..."
                                                                    searchPlaceholder="Search taxes..."
                                                                    loading={taxesLoading}
                                                                    loadingMessage="Loading taxes..."
                                                                    noOptionsMessage="No taxes found"
                                                                    disabled={isVerified}
                                                                />
                                                            </td>

                                                            {/* Reverse Charge Tax */}
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={product.reverse_charge_tax_id}
                                                                    onChange={(e) => handleProductChange(index, 'reverse_charge_tax_id', e.target.checked)}
                                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                                    disabled={isVerified}
                                                                />
                                                            </td>

                                                            {/* ITC Eligibility */}
                                                            <td className="relative px-4 py-3">
                                                                <SearchableDropdown
                                                                    options={itcEligibilityOptions}
                                                                    value={product.itc_eligibility}
                                                                    onChange={(value) => handleProductChange(index, 'itc_eligibility', value)}
                                                                    onClear={() => handleProductChange(index, 'itc_eligibility', null)}
                                                                    placeholder="Select ITC Eligibility..."
                                                                    searchPlaceholder="Search eligibility..."
                                                                    optionLabelKey="label"
                                                                    optionValueKey="value"
                                                                    disabled={isVerified}
                                                                />
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
                                                                    disabled={isVerified}
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
                                                                    disabled={isVerified}
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
                                                                {products.length > 1 && !isVerified && (
                                                                    <button
                                                                        onClick={() => removeProduct(index)}
                                                                        className="inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                                                                        title="Remove Product"
                                                                        disabled={isVerified}
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
                                                    Total Items: {products.length}
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    Subtotal: ₹{products.reduce((sum, product) => sum + parseFloat(product.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tax Deduction/Collection Section */}
                            <div className="p-8 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <h3 className="text-lg font-semibold text-gray-900">Tax Deduction/Collection</h3>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Tax Type Selection */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-3">
                                                Tax Type
                                            </label>
                                            <div className="flex items-center gap-6 flex-wrap">
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        id="tax-not-applicable"
                                                        name="is_tax"
                                                        value="NOT_APPLICABLE"
                                                        checked={vendorForm.is_tax === 'NOT_APPLICABLE' || !vendorForm.is_tax}
                                                        onChange={(e) => handleFormChange('is_tax', e.target.value)}
                                                        className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 focus:ring-gray-500 focus:ring-2 transition-colors"
                                                        disabled={isVerified}
                                                    />
                                                    <label htmlFor="tax-not-applicable" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
                                                        <span className="font-semibold text-gray-600">Not Applicable</span>
                                                        <span className="text-gray-500 ml-1">(No tax deduction/collection)</span>
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        id="tax-tds"
                                                        name="is_tax"
                                                        value="TDS"
                                                        checked={vendorForm.is_tax === 'TDS'}
                                                        onChange={(e) => handleFormChange('is_tax', e.target.value)}
                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2 transition-colors"
                                                        disabled={isVerified}
                                                    />
                                                    <label htmlFor="tax-tds" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
                                                        <span className="font-semibold text-blue-600">TDS</span>
                                                        <span className="text-gray-500 ml-1">(Tax Deducted at Source)</span>
                                                    </label>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        id="tax-tcs"
                                                        name="is_tax"
                                                        value="TCS"
                                                        checked={vendorForm.is_tax === 'TCS'}
                                                        onChange={(e) => handleFormChange('is_tax', e.target.value)}
                                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500 focus:ring-2 transition-colors"
                                                        disabled={isVerified}
                                                    />
                                                    <label htmlFor="tax-tcs" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
                                                        <span className="font-semibold text-green-600">TCS</span>
                                                        <span className="text-gray-500 ml-1">(Tax Collected at Source)</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* TDS/TCS Selection Dropdown - Only show when TDS or TCS is selected */}
                                        {vendorForm.is_tax && vendorForm.is_tax !== 'NOT_APPLICABLE' && (
                                            <div className="relative">
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Select {vendorForm.is_tax} Rate
                                                </label>
                                                <SearchableDropdown
                                                    options={tdsTcsData?.results?.map(item => ({
                                                        value: item.id,
                                                        label: `${item.taxName} - ${item.taxPercentage}%`,
                                                        taxName: item.taxName,
                                                        taxPercentage: item.taxPercentage,
                                                        taxType: item.taxType
                                                    })) || []}
                                                    value={selectedTdsTcs || ''}
                                                    onChange={(value) => setSelectedTdsTcs(value || null)}
                                                    onClear={() => setSelectedTdsTcs(null)}
                                                    placeholder={`Select ${vendorForm.is_tax} rate...`}
                                                    searchPlaceholder={`Search ${vendorForm.is_tax} rates...`}
                                                    loading={tdsTcsLoading}
                                                    loadingMessage={`Loading ${vendorForm.is_tax} rates...`}
                                                    noOptionsMessage={`No ${vendorForm.is_tax} rates found`}
                                                    disabled={isVerified}
                                                    renderOption={(option) => (
                                                        <div>
                                                            <div className="font-medium">{option.taxName}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {option.taxPercentage}% - {option.taxType}
                                                            </div>
                                                        </div>
                                                    )}
                                                />
                                                {vendorForm.is_tax && tdsTcsData?.results?.length === 0 && !tdsTcsLoading && (
                                                    <p className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                                        No {vendorForm.is_tax} rates found. Please sync {vendorForm.is_tax} data from Zoho first.
                                                    </p>
                                                )}
                                                
                                                {/* Selected TDS/TCS Details */}
                                                {/* {selectedTdsTcs && tdsTcsData?.results && (
                                                    (() => {
                                                        const selectedItem = tdsTcsData.results.find(item => item.id === selectedTdsTcs);
                                                        return selectedItem ? (
                                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                                <div className="flex items-center gap-2">
                                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    <span className="text-sm font-semibold text-green-800">
                                                                        Selected: {selectedItem.taxName}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 text-xs text-green-700">
                                                                    Rate: {selectedItem.taxPercentage}% | Type: {selectedItem.taxType} | ID: {selectedItem.taxId}
                                                                </div>
                                                            </div>
                                                        ) : null;
                                                    })()
                                                )} */}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tax and Other Items */}
                            <div className="p-8 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <h3 className="text-lg font-semibold text-gray-900">Tax and Other Items</h3>
                                    </div>
                                </div>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Left Column - Tax Details */}
                                        <div className="space-y-4">
                                            {/* <div className="flex justify-between items-center py-2 border-b border-gray-200">
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
                                                        disabled={isVerified}
                                                    />
                                                </div>
                                            </div> */}
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
                                                        disabled={isVerified}
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
                                                        disabled={isVerified}
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
                                                        disabled={isVerified}
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
                                                            disabled={isVerified}
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
                                        value={notes || `Bill from ${vendorForm.selectedVendor?.companyName || 'Vendor'} entered via BillMunshi ${window.location.href}\n\n`}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                                        placeholder="Add notes or comments..."
                                        rows={4}
                                        disabled={isVerified}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Fullscreen Modal */}
            {isFullscreen && vendorBillData?.file && (
                <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
                    <div className="relative w-full h-full flex flex-col">
                        {/* Fullscreen Header - Fixed */}
                        <div className="flex items-center justify-between px-6 py-4 bg-black bg-opacity-70 backdrop-blur-sm flex-shrink-0 z-10">
                            <div className="flex items-center gap-4">
                                <h3 className="text-white text-lg font-medium">
                                    Bill Document - {analysedData.invoiceNumber || zohoData.bill_no || 'Unknown'}
                                </h3>
                                {!isPDF(vendorBillData.file) && (
                                    <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-2 backdrop-blur-sm">
                                        <button
                                            onClick={handleZoomOut}
                                            className="p-1.5 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Zoom Out (Ctrl + -)"
                                            disabled={zoomLevel <= 0.25}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                            </svg>
                                        </button>
                                        <span className="text-white text-sm font-medium min-w-[45px] text-center">
                                            {Math.round(zoomLevel * 100)}%
                                        </span>
                                        <button
                                            onClick={handleZoomIn}
                                            className="p-1.5 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Zoom In (Ctrl + +)"
                                            disabled={zoomLevel >= 3}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleResetZoom}
                                            className="p-1.5 rounded text-white hover:bg-white hover:bg-opacity-20 transition-colors"
                                            title="Reset Zoom (Ctrl + 0)"
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
                                title="Exit Fullscreen (Esc)"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Fullscreen Content - Scrollable */}
                        <div className="flex-1 overflow-auto">
                            {isPDF(vendorBillData.file) ? (
                                <iframe
                                    src={vendorBillData.file}
                                    className="w-full h-full border-0"
                                    title="Bill PDF Document - Fullscreen"
                                />
                            ) : (
                                <div 
                                    className="w-full h-full p-8"
                                    style={{
                                        cursor: zoomLevel > 1 ? 'move' : 'default',
                                        minHeight: '100%',
                                        display: 'flex',
                                        alignItems: zoomLevel <= 1 ? 'center' : 'flex-start',
                                        justifyContent: zoomLevel <= 1 ? 'center' : 'flex-start'
                                    }}
                                >
                                    <img
                                        src={vendorBillData.file}
                                        alt="Bill Document - Fullscreen"
                                        className="rounded-lg shadow-2xl transition-transform duration-200 select-none"
                                        style={{
                                            width: zoomLevel <= 1 ? 'auto' : `${zoomLevel * 100}%`,
                                            height: zoomLevel <= 1 ? '100%' : 'auto',
                                            maxWidth: zoomLevel <= 1 ? '100%' : 'none',
                                            maxHeight: zoomLevel <= 1 ? '100%' : 'none',
                                            objectFit: 'contain'
                                        }}
                                        draggable="false"
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