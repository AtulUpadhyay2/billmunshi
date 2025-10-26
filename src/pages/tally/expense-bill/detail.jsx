import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import { useGetTallyExpenseBillDetails, useVerifyTallyExpenseBill } from "@/hooks/api/tally/tallyExpenseBillService";
import { useGetTallyVendorLedgers, useGetTallyTaxLedgers, useGetTallyExpenseChartOfAccountsLedgers, useGetTallyCgstLedgers, useGetTallySgstLedgers, useGetTallyIgstLedgers } from "@/hooks/api/tally/tallyApiService";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";

const TallyExpenseBillDetail = () => {
    const [mobileMenu, setMobileMenu] = useMobileMenu();
    const [collapsed, setMenuCollapsed] = useSidebar();
    const navigate = useNavigate();
    const { id: billId } = useParams();
    const { selectedOrganization } = useSelector((state) => state.auth);

    // Form state for bill information
    const [billForm, setBillForm] = useState({
        billNumber: '',
        billDate: '',
        dueDate: '',
        vendorName: '',
        companyId: '',
        totalAmount: '',
        selectedVendor: null,
        vendorGST: ''
    });

    // State for managing expense items
    const [expenseItems, setExpenseItems] = useState([]);

    // Form state for tax summary
    const [taxSummaryForm, setTaxSummaryForm] = useState({
        igst: '',
        cgst: '',
        sgst: '',
        igstLedgerId: null,
        cgstLedgerId: null,
        sgstLedgerId: null,
        igstDebitCredit: 'debit',
        cgstDebitCredit: 'debit',
        sgstDebitCredit: 'debit',
        vendorDebitCredit: 'credit'
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
    
    // State to track if user manually cleared vendor selection
    const [vendorManuallyCleared, setVendorManuallyCleared] = useState(false);

    // Fetch expense bill details
    const { data: expenseBillData, error, isLoading, refetch } = useGetTallyExpenseBillDetails(
        { organizationId: selectedOrganization?.id, billId },
        { enabled: !!selectedOrganization?.id && !!billId }
    );

    // Fetch expense chart of accounts ledgers for Chart of Accounts dropdown
    const { data: ledgersData, isLoading: ledgersLoading } = useGetTallyExpenseChartOfAccountsLedgers(
        selectedOrganization?.id,
        { enabled: !!selectedOrganization?.id }
    );

    // Fetch vendor ledgers for vendor selection dropdown
    const { data: vendorLedgersData, isLoading: vendorLedgersLoading } = useGetTallyVendorLedgers(
        selectedOrganization?.id,
        { enabled: !!selectedOrganization?.id }
    );

    // Fetch tax ledgers for tax selection dropdown
    const { data: taxLedgersData, isLoading: taxLedgersLoading } = useGetTallyTaxLedgers(
        selectedOrganization?.id,
        { enabled: !!selectedOrganization?.id }
    );

    // Fetch CGST ledgers for CGST dropdown
    const { data: cgstLedgersData, isLoading: cgstLedgersLoading } = useGetTallyCgstLedgers(
        selectedOrganization?.id,
        { enabled: !!selectedOrganization?.id }
    );

    // Fetch SGST ledgers for SGST dropdown
    const { data: sgstLedgersData, isLoading: sgstLedgersLoading } = useGetTallySgstLedgers(
        selectedOrganization?.id,
        { enabled: !!selectedOrganization?.id }
    );

    // Fetch IGST ledgers for IGST dropdown
    const { data: igstLedgersData, isLoading: igstLedgersLoading } = useGetTallyIgstLedgers(
        selectedOrganization?.id,
        { enabled: !!selectedOrganization?.id }
    );

    // Verify mutation
    const { mutateAsync: verifyExpenseBill } = useVerifyTallyExpenseBill();

    // Extract data from the API response
    const billInfo = expenseBillData?.bill || {};
    const analysedData = billInfo?.analysed_data || {};
    const tallyAnalysedData = expenseBillData?.analyzed_data || {};

    // Check if bill is synced or posted (disable inputs if any of these statuses)
    const isVerified = billInfo?.status === 'Synced' || billInfo?.bill_status === 'Synced' ||
                       billInfo?.status === 'Posted' || billInfo?.bill_status === 'Posted';

    // Validation helper functions
    const isVendorRequired = !billForm.selectedVendor;
    const getItemsWithoutCOA = () => expenseItems.filter(item => !item.chart_of_accounts_id);
    const hasValidationErrors = () => isVendorRequired || getItemsWithoutCOA().length > 0 || expenseItems.length === 0;

    // Process ledgers data for dropdown (Chart of Accounts)
    const processLedgers = () => {
        if (!ledgersData?.grouped_ledgers) return [];

        const ledgers = [];
        Object.values(ledgersData.grouped_ledgers).forEach(group => {
            if (group.ledgers && Array.isArray(group.ledgers)) {
                group.ledgers.forEach(ledger => {
                    ledgers.push({
                        id: ledger.id,
                        name: ledger.name,
                        master_id: ledger.master_id,
                        alter_id: ledger.alter_id,
                        opening_balance: ledger.opening_balance,
                        company: ledger.company,
                        parent_name: group.parent_name
                    });
                });
            }
        });
        return ledgers;
    };

    const ledgerOptions = processLedgers();

    // Process vendor ledgers data for dropdown
    const processVendorLedgers = () => {
        if (!vendorLedgersData?.grouped_ledgers) return [];

        const vendors = [];
        Object.values(vendorLedgersData.grouped_ledgers).forEach(group => {
            if (group.ledgers && Array.isArray(group.ledgers)) {
                group.ledgers.forEach(ledger => {
                    vendors.push({
                        id: ledger.id,
                        name: ledger.name,
                        gst_in: ledger.gst_in,
                        master_id: ledger.master_id,
                        alter_id: ledger.alter_id,
                        opening_balance: ledger.opening_balance,
                        company: ledger.company,
                        parent_name: group.parent_name
                    });
                });
            }
        });
        return vendors;
    };

    const vendorOptions = processVendorLedgers();

    // Process tax ledgers data for dropdown
    const processTaxLedgers = () => {
        if (!taxLedgersData?.grouped_ledgers) return [];

        const taxLedgers = [];
        Object.values(taxLedgersData.grouped_ledgers).forEach(group => {
            if (group.ledgers && Array.isArray(group.ledgers)) {
                group.ledgers.forEach(ledger => {
                    taxLedgers.push({
                        id: ledger.id,
                        name: ledger.name,
                        master_id: ledger.master_id,
                        alter_id: ledger.alter_id,
                        opening_balance: ledger.opening_balance,
                        company: ledger.company,
                        parent_name: group.parent_name
                    });
                });
            }
        });
        return taxLedgers;
    };

    const taxLedgerOptions = processTaxLedgers();

    // Process CGST ledgers data for dropdown
    const processCgstLedgers = () => {
        if (!cgstLedgersData?.grouped_ledgers) return [];

        const cgstLedgers = [];
        Object.values(cgstLedgersData.grouped_ledgers).forEach(group => {
            if (group.ledgers && Array.isArray(group.ledgers)) {
                group.ledgers.forEach(ledger => {
                    cgstLedgers.push({
                        id: ledger.id,
                        name: ledger.name,
                        master_id: ledger.master_id,
                        alter_id: ledger.alter_id,
                        opening_balance: ledger.opening_balance,
                        company: ledger.company,
                        parent_name: group.parent_name
                    });
                });
            }
        });
        return cgstLedgers;
    };

    // Process SGST ledgers data for dropdown
    const processSgstLedgers = () => {
        if (!sgstLedgersData?.grouped_ledgers) return [];

        const sgstLedgers = [];
        Object.values(sgstLedgersData.grouped_ledgers).forEach(group => {
            if (group.ledgers && Array.isArray(group.ledgers)) {
                group.ledgers.forEach(ledger => {
                    sgstLedgers.push({
                        id: ledger.id,
                        name: ledger.name,
                        master_id: ledger.master_id,
                        alter_id: ledger.alter_id,
                        opening_balance: ledger.opening_balance,
                        company: ledger.company,
                        parent_name: group.parent_name
                    });
                });
            }
        });
        return sgstLedgers;
    };

    // Process IGST ledgers data for dropdown
    const processIgstLedgers = () => {
        if (!igstLedgersData?.grouped_ledgers) return [];

        const igstLedgers = [];
        Object.values(igstLedgersData.grouped_ledgers).forEach(group => {
            if (group.ledgers && Array.isArray(group.ledgers)) {
                group.ledgers.forEach(ledger => {
                    igstLedgers.push({
                        id: ledger.id,
                        name: ledger.name,
                        master_id: ledger.master_id,
                        alter_id: ledger.alter_id,
                        opening_balance: ledger.opening_balance,
                        company: ledger.company,
                        parent_name: group.parent_name
                    });
                });
            }
        });
        return igstLedgers;
    };

    const cgstLedgerOptions = processCgstLedgers();
    const sgstLedgerOptions = processSgstLedgers();
    const igstLedgerOptions = processIgstLedgers();

    // Update form when data is loaded
    useEffect(() => {
        if (expenseBillData?.bill) {
            const data = analysedData;
            const tally = tallyAnalysedData;

            setBillForm({
                billNumber: tally?.bill_no || data.billNumber || '',
                billDate: tally?.bill_date || data.dateIssued || '',
                dueDate: tally?.due_date || data.dueDate || '',
                vendorName: tally?.name || data.from?.name || '',
                companyId: tally?.company_id || '',
                totalAmount: tally?.total || data.total || '',
                selectedVendor: null, // Will be set in the next useEffect
                vendorGST: ''
            });

            // Initialize Tax Summary Form
            setTaxSummaryForm({
                igst: tally?.taxes?.igst?.amount || data.igst || '',
                cgst: tally?.taxes?.cgst?.amount || data.cgst || '',
                sgst: tally?.taxes?.sgst?.amount || data.sgst || '',
                igstLedgerId: null,
                cgstLedgerId: null,
                sgstLedgerId: null
            });

            // Initialize notes
            setNotes('');

            // Initialize expense items from tally expense_items
            if (tally?.expense_items && tally.expense_items.length > 0) {
                setExpenseItems(tally.expense_items.map((item, index) => ({
                    id: item.item_id || index,
                    item_id: item.item_id || null,
                    item_details: item.item_details || '',
                    chart_of_accounts: item.chart_of_accounts || 'No COA Ledger',
                    chart_of_accounts_id: null,
                    amount: item.amount || '',
                    debit_or_credit: item.debit_or_credit || 'debit'
                })));
            } else if (data.expenses && data.expenses.length > 0) {
                // Fallback to analyzed_data expenses if no expense_items
                setExpenseItems(data.expenses.map((item, index) => ({
                    id: Date.now() + index,
                    item_id: null,
                    item_details: item.description || '',
                    chart_of_accounts: 'No COA Ledger',
                    chart_of_accounts_id: null,
                    amount: item.amount || '',
                    debit_or_credit: 'debit'
                })));
            } else {
                // Initialize with empty expense item if no items exist
                setExpenseItems([{
                    id: Date.now(),
                    item_id: null,
                    item_details: '',
                    chart_of_accounts: 'No COA Ledger',
                    chart_of_accounts_id: null,
                    amount: '',
                    debit_or_credit: 'debit'
                }]);
            }
        }
    }, [expenseBillData, analysedData, tallyAnalysedData]);

    // Match vendor from API response with vendor options when both are available
    // Only auto-match if user hasn't manually cleared the vendor
    useEffect(() => {
        if (vendorOptions.length > 0 && tallyAnalysedData && !billForm.selectedVendor && !vendorManuallyCleared) {
            // First try to match by vendor name from analyzed_data
            let matchedVendor = null;

            if (tallyAnalysedData.name) {
                matchedVendor = vendorOptions.find(vendor =>
                    vendor.name === tallyAnalysedData.name
                );
            }

            // If not found by name, try matching from analysed_data.from
            if (!matchedVendor && analysedData?.from?.name) {
                matchedVendor = vendorOptions.find(vendor =>
                    vendor.name === analysedData.from.name
                );
            }

            if (matchedVendor) {
                setBillForm(prev => ({
                    ...prev,
                    selectedVendor: matchedVendor,
                    vendorName: matchedVendor.name || prev.vendorName,
                    vendorGST: matchedVendor.gst_in || ''
                }));
            }
        }
    }, [vendorOptions, tallyAnalysedData, analysedData, billForm.selectedVendor, vendorManuallyCleared]);

    // Match tax ledgers from API response when both are available
    useEffect(() => {
        if (cgstLedgerOptions.length > 0 && sgstLedgerOptions.length > 0 && igstLedgerOptions.length > 0 && tallyAnalysedData?.taxes) {
            const taxes = tallyAnalysedData.taxes;

            // Match CGST ledger
            if (taxes.cgst?.ledger && !taxSummaryForm.cgstLedgerId) {
                const matchedCgstLedger = cgstLedgerOptions.find(ledger =>
                    ledger.name === taxes.cgst.ledger
                );
                if (matchedCgstLedger) {
                    setTaxSummaryForm(prev => ({
                        ...prev,
                        cgstLedgerId: matchedCgstLedger.id
                    }));
                }
            }

            // Match SGST ledger
            if (taxes.sgst?.ledger && !taxSummaryForm.sgstLedgerId) {
                const matchedSgstLedger = sgstLedgerOptions.find(ledger =>
                    ledger.name === taxes.sgst.ledger
                );
                if (matchedSgstLedger) {
                    setTaxSummaryForm(prev => ({
                        ...prev,
                        sgstLedgerId: matchedSgstLedger.id
                    }));
                }
            }

            // Match IGST ledger
            if (taxes.igst?.ledger && !taxSummaryForm.igstLedgerId) {
                const matchedIgstLedger = igstLedgerOptions.find(ledger =>
                    ledger.name === taxes.igst.ledger
                );
                if (matchedIgstLedger) {
                    setTaxSummaryForm(prev => ({
                        ...prev,
                        igstLedgerId: matchedIgstLedger.id
                    }));
                }
            }
        }
    }, [cgstLedgerOptions, sgstLedgerOptions, igstLedgerOptions, tallyAnalysedData, taxSummaryForm.cgstLedgerId, taxSummaryForm.sgstLedgerId, taxSummaryForm.igstLedgerId]);

    // Match chart of accounts ledgers from API response
    useEffect(() => {
        if (ledgerOptions.length > 0 && tallyAnalysedData?.expense_items && expenseItems.length > 0) {
            const updatedItems = expenseItems.map((item, index) => {
                // If item already has chart_of_accounts_id selected, don't override
                if (item.chart_of_accounts_id) {
                    return item;
                }

                // Find corresponding item in analyzed_data
                const analyzedItem = tallyAnalysedData.expense_items[index] ||
                    tallyAnalysedData.expense_items.find(p =>
                        p.item_details === item.item_details
                    );

                if (analyzedItem && analyzedItem.chart_of_accounts && analyzedItem.chart_of_accounts !== 'No COA Ledger') {
                    // Try to match by chart of accounts name
                    const matchedLedger = ledgerOptions.find(ledger =>
                        ledger.name === analyzedItem.chart_of_accounts
                    );

                    if (matchedLedger) {
                        return {
                            ...item,
                            chart_of_accounts: matchedLedger.name,
                            chart_of_accounts_id: matchedLedger.id
                        };
                    }
                }

                return item;
            });

            // Only update if there are actual changes
            const hasChanges = updatedItems.some((item, index) =>
                item.chart_of_accounts_id !== expenseItems[index].chart_of_accounts_id
            );

            if (hasChanges) {
                setExpenseItems(updatedItems);
            }
        }
    }, [ledgerOptions, tallyAnalysedData, expenseItems]);

    // Handle form input changes
    const handleFormChange = (name, value) => {
        setBillForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle vendor selection
    const handleVendorSelect = (vendorId) => {
        if (vendorId === null || vendorId === '') {
            // If null/empty value is passed via onChange, treat as clear
            handleVendorClear();
            return;
        }
        
        const vendor = vendorOptions.find(v => v.id === vendorId);
        if (vendor) {
            setBillForm(prev => ({
                ...prev,
                selectedVendor: vendor,
                vendorName: vendor.name || '',
                vendorGST: vendor.gst_in || ''
            }));
            setVendorManuallyCleared(false); // Reset flag when vendor is manually selected
        }
    };

    // Handle vendor deselection
    const handleVendorClear = () => {
        setBillForm(prev => ({
            ...prev,
            selectedVendor: null,
            vendorName: analysedData?.from?.name || '',
            vendorGST: ''
        }));
        setVendorManuallyCleared(true); // Flag that user manually cleared vendor
    };

    // Handle Chart of Accounts selection
    const handleChartOfAccountsSelect = (itemIndex, ledgerId) => {
        const ledger = ledgerOptions.find(l => l.id === ledgerId);
        if (ledger) {
            setExpenseItems(prev => {
                const updated = [...prev];
                updated[itemIndex] = {
                    ...updated[itemIndex],
                    chart_of_accounts: ledger.name,
                    chart_of_accounts_id: ledger.id
                };
                return updated;
            });
        }
    };

    // Handle Chart of Accounts deselection
    const handleChartOfAccountsClear = (itemIndex) => {
        setExpenseItems(prev => {
            const updated = [...prev];
            updated[itemIndex] = {
                ...updated[itemIndex],
                chart_of_accounts: 'No COA Ledger',
                chart_of_accounts_id: null
            };
            return updated;
        });
    };

    // Handle Tax Summary form changes
    const handleTaxSummaryChange = (name, value) => {
        setTaxSummaryForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle tax ledger selections
    const handleCgstLedgerSelect = (ledgerId) => {
        setTaxSummaryForm(prev => ({
            ...prev,
            cgstLedgerId: ledgerId
        }));
    };

    const handleSgstLedgerSelect = (ledgerId) => {
        setTaxSummaryForm(prev => ({
            ...prev,
            sgstLedgerId: ledgerId
        }));
    };

    const handleIgstLedgerSelect = (ledgerId) => {
        setTaxSummaryForm(prev => ({
            ...prev,
            igstLedgerId: ledgerId
        }));
    };

    const handleCgstLedgerClear = () => {
        setTaxSummaryForm(prev => ({
            ...prev,
            cgstLedgerId: null
        }));
    };

    const handleSgstLedgerClear = () => {
        setTaxSummaryForm(prev => ({
            ...prev,
            sgstLedgerId: null
        }));
    };

    const handleIgstLedgerClear = () => {
        setTaxSummaryForm(prev => ({
            ...prev,
            igstLedgerId: null
        }));
    };

    // Expense item manipulation functions
    const handleExpenseItemChange = (index, field, value) => {
        setExpenseItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const addExpenseItem = () => {
        setExpenseItems(prev => [...prev, {
            id: Date.now(),
            item_id: null,
            item_details: '',
            chart_of_accounts: 'No COA Ledger',
            chart_of_accounts_id: null,
            amount: '',
            debit_or_credit: 'debit'
        }]);
    };

    const removeExpenseItem = (index) => {
        if (expenseItems.length > 1) {
            setExpenseItems(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Transform form data to API format
    const transformToVerifyFormat = () => {
        // Get vendor ledger information
        const selectedVendor = billForm.selectedVendor;

        // Get tax ledger information for summary
        const cgstLedger = cgstLedgerOptions.find(ledger => ledger.id === taxSummaryForm.cgstLedgerId);
        const sgstLedger = sgstLedgerOptions.find(ledger => ledger.id === taxSummaryForm.sgstLedgerId);
        const igstLedger = igstLedgerOptions.find(ledger => ledger.id === taxSummaryForm.igstLedgerId);

        return {
            bill_id: billId,
            analyzed_bill: expenseBillData?.analyzed_bill || null,
            analyzed_data: {
                name: billForm.vendorName || "Unknown",
                voucher: billForm.billNumber || "",
                bill_no: billForm.billNumber || "",
                bill_date: billForm.billDate || "",
                due_date: billForm.dueDate || "",
                total: parseFloat(billForm.totalAmount) || 0,
                company_id: selectedVendor?.company || billForm.companyId || "Unknown",
                vendor_debit_or_credit: taxSummaryForm.vendorDebitCredit || "credit",
                vendor_amount: parseFloat(billForm.totalAmount) || 0,
                taxes: {
                    igst: {
                        amount: parseFloat(taxSummaryForm.igst) || 0.0,
                        ledger: igstLedger?.name || "No Tax Ledger",
                        debit_or_credit: taxSummaryForm.igstDebitCredit || "debit"
                    },
                    cgst: {
                        amount: parseFloat(taxSummaryForm.cgst) || 0.0,
                        ledger: cgstLedger?.name || "No Tax Ledger",
                        debit_or_credit: taxSummaryForm.cgstDebitCredit || "debit"
                    },
                    sgst: {
                        amount: parseFloat(taxSummaryForm.sgst) || 0.0,
                        ledger: sgstLedger?.name || "No Tax Ledger",
                        debit_or_credit: taxSummaryForm.sgstDebitCredit || "debit"
                    }
                },
                expense_items: expenseItems.map(item => {
                    const coaLedger = ledgerOptions.find(ledger => ledger.id === item.chart_of_accounts_id);
                    return {
                        item_id: item.id,
                        item_details: item.item_details || "",
                        chart_of_accounts: coaLedger?.name || "No COA Ledger",
                        amount: parseFloat(item.amount) || 0,
                        debit_or_credit: item.debit_or_credit || "debit"
                    };
                })
            }
        };
    };

    // Save function
    const handleSave = async () => {
        try {
            // Validation before verification
            if (!billForm.selectedVendor) {
                globalToast.error('Please select a vendor before verification');
                return;
            }

            // Check if all expense items have chart of accounts selected
            const itemsWithoutCOA = expenseItems.filter(item => !item.chart_of_accounts_id);
            if (itemsWithoutCOA.length > 0) {
                globalToast.error('Please select Chart of Accounts for all expense items before verification');
                return;
            }

            // Check if there are any expense items
            if (expenseItems.length === 0) {
                globalToast.error('Please add at least one expense item before verification');
                return;
            }

            setIsVerifying(true);

            // Transform data to the required API format
            const verifyData = transformToVerifyFormat();

            console.log('Transformed verify data:', verifyData);

            // Call the verify API
            await verifyExpenseBill({
                organizationId: selectedOrganization?.id,
                ...verifyData
            });

            globalToast.success('Expense bill verified successfully');

            // Navigate to expense bill list after successful verification
            navigate('/tally/expense-bill');
        } catch (error) {
            console.error('Failed to verify expense bill:', error);

            // Handle specific error messages from API response
            let errorMessage = 'Failed to verify expense bill';

            if (error?.response?.data) {
                // Check if error.response.data has an 'error' property with the specific message
                if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
                // Fallback to message property
                else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                // If error.response.data is a string
                else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                }
            }
            // Fallback to error message
            else if (error?.message) {
                errorMessage = error.message;
            }

            setErrorAlert({ show: true, message: errorMessage });
        } finally {
            setIsVerifying(false);
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

    // Keyboard shortcuts for zoom and fullscreen
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (!billInfo?.file || isPDF(billInfo.file)) return;

            switch (e.key) {
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
    }, [billInfo?.file, isFullscreen, zoomLevel]);

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
        // Navigate back to expense bill list
        navigate('/tally/expense-bill');
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
                title={`Tally Expense Bill Detail`}
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
                            onClick={() => navigate(`/tally/expense-bill/${expenseBillData?.next_bill}`)}
                            disabled={!expenseBillData?.next_bill}
                            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={expenseBillData?.next_bill ? "Go to next bill" : "No next bill available"}
                        >
                            Next
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isVerifying || isVerified || hasValidationErrors()}
                            className={`group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isVerified ? 'bg-gray-400 hover:bg-gray-400' : hasValidationErrors() ? 'bg-gray-400 hover:bg-gray-400' : ''}`}
                            title={isVerifying ? "Verifying..." : isVerified ? "Bill already synced/posted" : hasValidationErrors() ? "Please select vendor and chart of accounts for all items" : "Verify"}
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
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
                            {billInfo?.file ? (
                                <div className="w-full h-full flex flex-col">
                                    {/* Fixed Header - Always Visible */}
                                    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-300 flex-shrink-0 z-10">
                                        <h3 className="text-base font-medium text-gray-900 truncate mr-2">{billInfo.bill_munshi_name ? `${billInfo.bill_munshi_name}` : 'Document'}</h3>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {/* Keyboard Shortcuts Info */}
                                            {!isPDF(billInfo.file) && (
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
                                            {!isPDF(billInfo.file) && (
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
                                        {isPDF(billInfo.file) ? (
                                            // PDF Viewer
                                            <div className="w-full h-full">
                                                <iframe
                                                    src={billInfo.file}
                                                    className="w-full h-full border-0"
                                                    title="Bill PDF Document"
                                                    onError={(e) => {
                                                        console.error('PDF failed to load:', e);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            // Image Viewer with Zoom
                                            <div 
                                                className={`w-full min-h-full flex ${zoomLevel === 1 ? 'items-center justify-center' : 'items-start justify-start'} p-4`}
                                                style={{ cursor: zoomLevel > 1 ? 'move' : 'default' }}
                                            >
                                                <img
                                                    src={billInfo.file}
                                                    alt="Bill Document"
                                                    className="h-auto"
                                                    style={{ width: `${zoomLevel * 100}%` }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div style={{ display: 'none' }} className="flex flex-col items-center">
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
                                <div className="space-y-4">
                                    {/* First Row: Vendor and Bill Number */}
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
                                                    options={vendorOptions}
                                                    value={billForm.selectedVendor?.id || null}
                                                    onChange={handleVendorSelect}
                                                    onClear={handleVendorClear}
                                                    placeholder="Search and select vendor..."
                                                    searchPlaceholder="Type to search vendors..."
                                                    optionLabelKey="name"
                                                    optionValueKey="id"
                                                    loading={vendorLedgersLoading}
                                                    disabled={isVerified}
                                                    renderOption={(vendor) => (
                                                        <div className="flex flex-col py-1">
                                                            <div className="font-medium text-gray-900">{vendor.name}</div>
                                                            {vendor.gst_in && (
                                                                <div className="text-xs text-gray-500">GST: {vendor.gst_in}</div>
                                                            )}
                                                            {/* {vendor.parent_name && (
                                                                <div className="text-xs text-blue-600">{vendor.parent_name}</div>
                                                            )} */}
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
                                    </div>

                                    {/* Second Row: Total Amount, Bill Date, Due Date in 4 columns */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Total Amount Field */}
                                        <div className="lg:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Total Amount
                                            </label>
                                            <input
                                                type="number"
                                                name="totalAmount"
                                                value={billForm.totalAmount}
                                                onChange={e => handleFormChange('totalAmount', e.target.value)}
                                                placeholder="0.00"
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

                                        {/* Due Date Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Due Date
                                            </label>
                                            <input
                                                type="text"
                                                name="dueDate"
                                                value={billForm.dueDate}
                                                onChange={(e) => handleFormChange('dueDate', e.target.value)}
                                                placeholder="DD-MM-YYYY"
                                                disabled={isVerified}
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                            />
                                        </div>
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
                                            <h3 className="text-lg font-semibold text-gray-900">Credit / Debit Items</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={addExpenseItem}
                                                disabled={isVerified}
                                                className={`inline-flex items-center gap-2 px-2 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 ${isVerified ? 'opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400' : ''}`}
                                                title="Add"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Enhanced Expense Items Table - Scrollable */}
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
                                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                            <table className="w-full min-w-[800px]">
                                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[300px]">
                                                            Item Details
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[200px]">
                                                            Chart of Accounts <span className="text-red-500">*</span>
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[120px]">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[100px]">
                                                            Type
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[80px]">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {expenseItems.map((item, index) => (
                                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                            {/* Item Details */}
                                                            <td className="px-4 py-3">
                                                                <textarea
                                                                    value={item.item_details}
                                                                    onChange={(e) => handleExpenseItemChange(index, 'item_details', e.target.value)}
                                                                    placeholder="Enter item details..."
                                                                    disabled={isVerified}
                                                                    className={`w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 resize-none ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                                                    rows={3}
                                                                />
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                <div className={`${!item.chart_of_accounts_id && !isVerified ? 'ring-2 ring-red-300 rounded-md' : ''}`}>
                                                                    <SearchableDropdown
                                                                        options={ledgerOptions}
                                                                        value={item.chart_of_accounts_id || null}
                                                                        onChange={(ledgerId) => handleChartOfAccountsSelect(index, ledgerId)}
                                                                        onClear={() => handleChartOfAccountsClear(index)}
                                                                        placeholder="Select chart of accounts..."
                                                                        searchPlaceholder="Type to search ledgers..."
                                                                        optionLabelKey="name"
                                                                        optionValueKey="id"
                                                                        loading={ledgersLoading}
                                                                        disabled={isVerified}
                                                                        renderOption={(ledger) => (
                                                                            <div className="flex flex-col py-1">
                                                                                <div className="font-medium text-gray-900">{ledger.name}</div>
                                                                            </div>
                                                                        )}
                                                                        className="coa-dropdown"
                                                                    />
                                                                </div>
                                                            </td>
                                                            
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={item.amount}
                                                                    onChange={(e) => handleExpenseItemChange(index, 'amount', e.target.value)}
                                                                    placeholder="0.00"
                                                                    disabled={isVerified}
                                                                    className={`w-full px-3 py-2 text-sm text-right bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>

                                                            {/* Debit/Credit Type */}
                                                            <td className="px-4 py-3">
                                                                <select
                                                                    value={item.debit_or_credit}
                                                                    onChange={(e) => handleExpenseItemChange(index, 'debit_or_credit', e.target.value)}
                                                                    disabled={isVerified}
                                                                    className={`w-full px-3 py-2 text-sm text-center bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                                                >
                                                                    <option value="debit">Debit</option>
                                                                    <option value="credit">Credit</option>
                                                                </select>
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="px-4 py-3 text-center">
                                                                {expenseItems.length > 1 && (
                                                                    <button
                                                                        onClick={() => removeExpenseItem(index)}
                                                                        disabled={isVerified}
                                                                        className={`inline-flex items-center justify-center w-8 h-8 text-red-600 bg-red-100 rounded-full hover:bg-red-200 transition-colors ${isVerified ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 hover:bg-gray-100' : ''}`}
                                                                        title="Remove Item"
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

                                        {/* Expense Items Summary */}
                                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">
                                                    Total Items: {expenseItems.length}
                                                </span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Bill Summary - Tax and Other Items */}
                            <div className="p-8 border-b border-gray-200">
                                <div className="flex items-center gap-2 mb-6">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-900">Tax and Other Items</h3>
                                </div>
                                
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Left Column - Tax Details */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">CGST:</span>
                                                <div className="flex items-center gap-2">
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
                                                    <div className="flex-1 min-w-[200px]">
                                                        <SearchableDropdown
                                                            options={cgstLedgerOptions}
                                                            value={taxSummaryForm.cgstLedgerId || null}
                                                            onChange={handleCgstLedgerSelect}
                                                            onClear={handleCgstLedgerClear}
                                                            placeholder="Select CGST ledger..."
                                                            searchPlaceholder="Type to search CGST ledgers..."
                                                            optionLabelKey="name"
                                                            optionValueKey="id"
                                                            loading={cgstLedgersLoading}
                                                            disabled={isVerified}
                                                            renderOption={(ledger) => (
                                                                <div className="flex flex-col py-1">
                                                                    <div className="font-medium text-gray-900">{ledger.name}</div>
                                                                </div>
                                                            )}
                                                            className="text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">SGST:</span>
                                                <div className="flex items-center gap-2">
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
                                                    <div className="flex-1 min-w-[200px]">
                                                        <SearchableDropdown
                                                            options={sgstLedgerOptions}
                                                            value={taxSummaryForm.sgstLedgerId || null}
                                                            onChange={handleSgstLedgerSelect}
                                                            onClear={handleSgstLedgerClear}
                                                            placeholder="Select SGST ledger..."
                                                            searchPlaceholder="Type to search SGST ledgers..."
                                                            optionLabelKey="name"
                                                            optionValueKey="id"
                                                            loading={sgstLedgersLoading}
                                                            disabled={isVerified}
                                                            renderOption={(ledger) => (
                                                                <div className="flex flex-col py-1">
                                                                    <div className="font-medium text-gray-900">{ledger.name}</div>
                                                                </div>
                                                            )}
                                                            className="text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-sm font-medium text-gray-700">IGST:</span>
                                                <div className="flex items-center gap-2">
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
                                                    <div className="flex-1 min-w-[200px]">
                                                        <SearchableDropdown
                                                            options={igstLedgerOptions}
                                                            value={taxSummaryForm.igstLedgerId || null}
                                                            onChange={handleIgstLedgerSelect}
                                                            onClear={handleIgstLedgerClear}
                                                            placeholder="Select IGST ledger..."
                                                            searchPlaceholder="Type to search IGST ledgers..."
                                                            optionLabelKey="name"
                                                            optionValueKey="id"
                                                            loading={igstLedgersLoading}
                                                            disabled={isVerified}
                                                            renderOption={(ledger) => (
                                                                <div className="flex flex-col py-1">
                                                                    <div className="font-medium text-gray-900">{ledger.name}</div>
                                                                </div>
                                                            )}
                                                            className="text-xs"
                                                        />
                                                    </div>
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
                                    {/* Vendor Summary Section */}
                                    <div className="col-span-12 pt-2">
                                        <div className="grid grid-cols-12 gap-3 items-center py-2">
                                            <div className="col-span-2">
                                                <span className="text-sm font-medium text-gray-700">Payable to Vendor:</span>
                                            </div>
                                            <div className="col-span-5">
                                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                                                    {billForm.selectedVendor ? (
                                                        <div className="flex flex-col">
                                                            <div className="font-medium text-gray-900">{billForm.selectedVendor.name}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic">No vendor selected</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <select
                                                    value={taxSummaryForm.vendorDebitCredit || 'credit'}
                                                    onChange={(e) => handleTaxSummaryChange('vendorDebitCredit', e.target.value)}
                                                    disabled={isVerified}
                                                    className={`w-full px-2 py-1 text-sm text-center bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${isVerified ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                                >
                                                    <option value="debit">Debit</option>
                                                    <option value="credit">Credit</option>
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-600 mr-2">₹</span>
                                                    <div className="w-full px-2 py-1 text-right border border-gray-300 rounded-md bg-gray-50 text-sm font-medium">
                                                        {billForm.totalAmount ? parseFloat(billForm.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                                    </div>
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
                                        value={notes || `Bill from ${billForm.selectedVendor?.name || 'Vendor'} entered via BillMunshi ${window.location.href}\n\n`}
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
            {isFullscreen && billInfo?.file && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="relative w-full h-full flex flex-col">
                        {/* Fullscreen Header */}
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md border-b border-white/10 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <h3 className="text-white text-lg font-semibold drop-shadow-lg">
                                    Bill Document - {billInfo.bill_munshi_name || analysedData.billNumber || 'Unknown'}
                                </h3>
                                {!isPDF(billInfo.file) && (
                                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/20">
                                        <button
                                            onClick={handleZoomOut}
                                            className="p-1 rounded text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                                            className="p-1 rounded text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Zoom In (Ctrl + +)"
                                            disabled={zoomLevel >= 3}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleResetZoom}
                                            className="p-1 rounded text-white hover:bg-white/20 transition-all"
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
                                className="p-2 rounded-lg text-white hover:bg-white/20 transition-all backdrop-blur-sm"
                                title="Exit Fullscreen (Esc)"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Fullscreen Content */}
                        <div className="flex-1 overflow-auto">
                            {isPDF(billInfo.file) ? (
                                <div className="w-full h-full p-4">
                                    <iframe
                                        src={billInfo.file}
                                        className="w-full h-full border-0 rounded-lg shadow-2xl"
                                        title="Bill PDF Document - Fullscreen"
                                    />
                                </div>
                            ) : (
                                <div 
                                    className={`w-full min-h-full flex ${zoomLevel === 1 ? 'items-center justify-center' : 'items-start justify-start'} p-6`}
                                    style={{ cursor: zoomLevel > 1 ? 'move' : 'default' }}
                                >
                                    <img
                                        src={billInfo.file}
                                        alt="Bill Document - Fullscreen"
                                        className="h-auto rounded-lg shadow-2xl"
                                        style={{ width: `${zoomLevel * 100}%` }}
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

export default TallyExpenseBillDetail