import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from "@/components/ui/Card";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";
import { useGetTallyVendorBillDetailsQuery, useUpdateTallyVendorBillMutation, useVerifyTallyVendorBillMutation } from "@/store/api/tally/vendorBillsApiSlice";
import { useGetTallyLedgersQuery, useGetTallyVendorLedgersQuery, useGetTallyTaxLedgersQuery, useGetTallyCgstLedgersQuery, useGetTallySgstLedgersQuery, useGetTallyIgstLedgersQuery, useGetTallyMastersQuery } from "@/store/api/tally/tallyApiSlice";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { globalToast } from "@/utils/toast";

const TallyVendorBillDetail = () => {
    const [mobileMenu, setMobileMenu] = useMobileMenu();
    const [collapsed, setMenuCollapsed] = useSidebar();
    const navigate = useNavigate();
    const { id: billId } = useParams();
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

    // State for managing products from tally_bill
    const [products, setProducts] = useState([]);

    // State for TDS/TCS selection
    const [selectedTdsTcs, setSelectedTdsTcs] = useState(null);

    // Form state for bill summary
    const [billSummaryForm, setBillSummaryForm] = useState({
        subtotal: '',
        cgst: '',
        sgst: '',
        igst: '',
        total: '',
        cgstLedgerId: null,
        sgstLedgerId: null,
        igstLedgerId: null
    });

    // State for notes
    const [notes, setNotes] = useState('');
    
    // State for image zoom and viewing
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // State for verification loading
    const [isVerifying, setIsVerifying] = useState(false);
    
    // Fetch vendor bill details
    const { data: vendorBillData, error, isLoading, refetch } = useGetTallyVendorBillDetailsQuery(
        { organizationId: selectedOrganization?.id, billId },
        { skip: !selectedOrganization?.id || !billId }
    );

    // Fetch ledgers for dropdown (available for Tally)
    const { data: ledgersData, isLoading: ledgersLoading } = useGetTallyLedgersQuery(
        selectedOrganization?.id,
        { skip: !selectedOrganization?.id }
    );

    // Fetch vendor ledgers for vendor selection dropdown
    const { data: vendorLedgersData, isLoading: vendorLedgersLoading } = useGetTallyVendorLedgersQuery(
        selectedOrganization?.id,
        { skip: !selectedOrganization?.id }
    );

    // Fetch tax ledgers for product tax selection dropdown
    const { data: taxLedgersData, isLoading: taxLedgersLoading } = useGetTallyTaxLedgersQuery(
        selectedOrganization?.id,
        { skip: !selectedOrganization?.id }
    );

    // Fetch CGST ledgers for CGST dropdown
    const { data: cgstLedgersData, isLoading: cgstLedgersLoading } = useGetTallyCgstLedgersQuery(
        selectedOrganization?.id,
        { skip: !selectedOrganization?.id }
    );

    // Fetch SGST ledgers for SGST dropdown
    const { data: sgstLedgersData, isLoading: sgstLedgersLoading } = useGetTallySgstLedgersQuery(
        selectedOrganization?.id,
        { skip: !selectedOrganization?.id }
    );

    // Fetch IGST ledgers for IGST dropdown
    const { data: igstLedgersData, isLoading: igstLedgersLoading } = useGetTallyIgstLedgersQuery(
        selectedOrganization?.id,
        { skip: !selectedOrganization?.id }
    );

    // Fetch masters data for item name dropdown
    const { data: mastersData, isLoading: mastersLoading } = useGetTallyMastersQuery(
        selectedOrganization?.id,
        { skip: !selectedOrganization?.id }
    );

    // Update mutation
    const [updateVendorBill] = useUpdateTallyVendorBillMutation();
    
    // Verify mutation
    const [verifyVendorBill] = useVerifyTallyVendorBillMutation();

    // Extract data from the API response
    const billInfo = vendorBillData?.bill || {};
    const analysedData = billInfo?.analysed_data || {};
    const tallyAnalysedData = vendorBillData?.analyzed_data || {};
    
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
    
    // Process masters data for item name dropdown
    const processStockItems = () => {
        if (!mastersData?.stock_items) return [];
        
        return mastersData.stock_items.map(item => ({
            id: item.id,
            name: item.name,
            alias: item.alias,
            unit: item.unit,
            category: item.category,
            parent: item.parent,
            gst_applicable: item.gst_applicable
        }));
    };

    const stockItemOptions = processStockItems();
    
    // Update form when data is loaded
    useEffect(() => {
        if (vendorBillData?.bill) {
            const data = analysedData;
            const tally = tallyAnalysedData;
            
            setVendorForm({
                vendorName: tallyAnalysedData?.vendor_name || data.from?.name || '',
                invoiceNumber: data.invoiceNumber || tally?.bill_details?.bill_number || tally?.bill_no || '',
                vendorGST: tally?.vendor?.gst_in || '',
                dateIssued: data.dateIssued ? new Date(data.dateIssued).toISOString().split('T')[0] : 
                           (tally?.bill_details?.date ? new Date(tally.bill_details.date.split('-').reverse().join('-')).toISOString().split('T')[0] : 
                           (tally?.bill_date ? new Date(tally.bill_date.split('-').reverse().join('-')).toISOString().split('T')[0] : '')),
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '',
                selectedVendor: null, // Will be set in the next useEffect
                is_tax: 'TDS' // Default to TDS
            });

            // Initialize Bill Summary Form
            setBillSummaryForm({
                subtotal: (data.items?.reduce((sum, item) => sum + (item.price * item.quantity || 0), 0) || '').toString(),
                cgst: tally?.taxes?.cgst?.amount || data.cgst || '',
                sgst: tally?.taxes?.sgst?.amount || data.sgst || '',
                igst: tally?.taxes?.igst?.amount || data.igst || '',
                total: tally?.total_amount || tally?.bill_details?.total_amount || data.total || ''
            });

            // Initialize notes (if any notes field exists in the API)
            setNotes('');

            // Initialize products from tally products
            if (tally?.products && tally.products.length > 0) {
                setProducts(tally.products.map((item, index) => ({
                    id: item.item_id || index,
                    item_id: item.item_id || null,
                    item_name: item.item_name || null,
                    item_details: item.item_details || '',
                    tax_ledger: item.tax_ledger || 'No Tax Ledger',
                    tax_ledger_id: item.tax_ledger_id || null,
                    price: item.price || '',
                    quantity: item.quantity || '',
                    amount: item.amount || '',
                    gst: item.product_gst || '',
                    igst: item.igst || 0.0,
                    cgst: item.cgst || 0.0,
                    sgst: item.sgst || 0.0
                })));
            } else if (data.items && data.items.length > 0) {
                setProducts(data.items.map((item, index) => ({
                    id: Date.now() + index,
                    item_id: null,
                    item_name: null,
                    item_details: item.description || '',
                    tax_ledger: 'No Tax Ledger',
                    tax_ledger_id: null,
                    price: item.price || '',
                    quantity: item.quantity || '',
                    amount: (item.price * item.quantity) || '',
                    gst: '',
                    igst: 0.0,
                    cgst: 0.0,
                    sgst: 0.0
                })));
            } else {
                // Initialize with empty product if no products exist
                setProducts([{
                    id: Date.now(),
                    item_id: null,
                    item_name: null,
                    item_details: '',
                    tax_ledger: 'No Tax Ledger',
                    tax_ledger_id: null,
                    price: '',
                    quantity: '',
                    amount: '',
                    gst: '',
                    igst: 0.0,
                    cgst: 0.0,
                    sgst: 0.0
                }]);
            }

            // Initialize item quantities
            if (data.items && data.items.length > 0) {
                setItemQuantities(data.items.map(item => item.quantity || 0));
            }
        }
    }, [vendorBillData, analysedData, tallyAnalysedData]);

    // Match vendor from API response with vendor options when both are available
    useEffect(() => {
        if (vendorOptions.length > 0 && tallyAnalysedData && !vendorForm.selectedVendor) {
            // First try to match by vendor_name from analyzed_data
            let matchedVendor = null;
            
            if (tallyAnalysedData.vendor_name) {
                matchedVendor = vendorOptions.find(vendor => 
                    vendor.name === tallyAnalysedData.vendor_name
                );
            }
            
            // If not found by vendor_name, try other matching methods
            if (!matchedVendor && tallyAnalysedData.vendor) {
                matchedVendor = vendorOptions.find(vendor => 
                    vendor.name === tallyAnalysedData.vendor.name || 
                    vendor.gst_in === tallyAnalysedData.vendor.gst_in ||
                    vendor.id === tallyAnalysedData.vendor.id
                );
            }
            
            if (matchedVendor) {
                setVendorForm(prev => ({
                    ...prev,
                    selectedVendor: matchedVendor,
                    vendorName: matchedVendor.name || prev.vendorName,
                    vendorGST: matchedVendor.gst_in || prev.vendorGST
                }));
            }
        }
    }, [vendorOptions, tallyAnalysedData, vendorForm.selectedVendor]);
    
    // Match stock items from API response with stock item options when both are available
    useEffect(() => {
        if (stockItemOptions.length > 0 && tallyAnalysedData?.products && products.length > 0) {
            let hasChanges = false;
            const updatedProducts = products.map(product => {
                // If product already has item_id and a matching stock item exists, don't override
                if (product.item_id) {
                    const existingStockItem = stockItemOptions.find(item => item.id === product.item_id);
                    if (existingStockItem) {
                        return product;
                    }
                }
                
                // Find corresponding product in analyzed_data by item_id first, then by item_name
                let analyzedProduct = null;
                if (product.item_id) {
                    analyzedProduct = tallyAnalysedData.products.find(p => p.item_id === product.item_id);
                }
                
                if (!analyzedProduct) {
                    analyzedProduct = tallyAnalysedData.products.find(p => 
                        p.item_details === product.item_details || 
                        p.item_name === product.item_name ||
                        (p.item_name && product.item_name && p.item_name === product.item_name)
                    );
                }
                
                if (analyzedProduct) {
                    let matchedStockItem = null;
                    
                    // First try to match by item_id if available
                    if (analyzedProduct.item_id) {
                        matchedStockItem = stockItemOptions.find(stockItem => 
                            stockItem.id === analyzedProduct.item_id
                        );
                    }
                    
                    // If not found by ID, try to match by item_name
                    if (!matchedStockItem && analyzedProduct.item_name) {
                        matchedStockItem = stockItemOptions.find(stockItem => 
                            stockItem.name === analyzedProduct.item_name
                        );
                    }
                    
                    if (matchedStockItem && (product.item_id !== matchedStockItem.id || product.item_name !== matchedStockItem.name)) {
                        hasChanges = true;
                        return {
                            ...product,
                            item_id: matchedStockItem.id,
                            item_name: matchedStockItem.name
                        };
                    }
                }
                
                return product;
            });
            
            // Only update if there are actual changes
            if (hasChanges) {
                setProducts(updatedProducts);
            }
        }
    }, [stockItemOptions, tallyAnalysedData]);
    
    // Match tax ledgers from API response when both are available
    useEffect(() => {
        if (cgstLedgerOptions.length > 0 && sgstLedgerOptions.length > 0 && igstLedgerOptions.length > 0 && tallyAnalysedData?.taxes) {
            const taxes = tallyAnalysedData.taxes;
            
            // Match CGST ledger
            if (taxes.cgst?.ledger && !billSummaryForm.cgstLedgerId) {
                const matchedCgstLedger = cgstLedgerOptions.find(ledger => 
                    ledger.name === taxes.cgst.ledger
                );
                if (matchedCgstLedger) {
                    setBillSummaryForm(prev => ({
                        ...prev,
                        cgstLedgerId: matchedCgstLedger.id
                    }));
                }
            }
            
            // Match SGST ledger
            if (taxes.sgst?.ledger && !billSummaryForm.sgstLedgerId) {
                const matchedSgstLedger = sgstLedgerOptions.find(ledger => 
                    ledger.name === taxes.sgst.ledger
                );
                if (matchedSgstLedger) {
                    setBillSummaryForm(prev => ({
                        ...prev,
                        sgstLedgerId: matchedSgstLedger.id
                    }));
                }
            }
            
            // Match IGST ledger
            if (taxes.igst?.ledger && !billSummaryForm.igstLedgerId) {
                const matchedIgstLedger = igstLedgerOptions.find(ledger => 
                    ledger.name === taxes.igst.ledger
                );
                if (matchedIgstLedger) {
                    setBillSummaryForm(prev => ({
                        ...prev,
                        igstLedgerId: matchedIgstLedger.id
                    }));
                }
            }
        }
    }, [cgstLedgerOptions, sgstLedgerOptions, igstLedgerOptions, tallyAnalysedData, billSummaryForm.cgstLedgerId, billSummaryForm.sgstLedgerId, billSummaryForm.igstLedgerId]);
    
    // Match product tax ledgers from API response
    useEffect(() => {
        if (taxLedgerOptions.length > 0 && tallyAnalysedData?.products && products.length > 0) {
            const updatedProducts = products.map((product, index) => {
                // If product already has tax_ledger_id selected, don't override
                if (product.tax_ledger_id) {
                    return product;
                }
                
                // Find corresponding product in analyzed_data
                const analyzedProduct = tallyAnalysedData.products[index] || 
                    tallyAnalysedData.products.find(p => 
                        p.item_details === product.item_details || 
                        p.item_name === product.item_name
                    );
                
                if (analyzedProduct && analyzedProduct.tax_ledger && analyzedProduct.tax_ledger !== 'No Tax Ledger') {
                    // Try to match by tax ledger name
                    const matchedTaxLedger = taxLedgerOptions.find(taxLedger => 
                        taxLedger.name === analyzedProduct.tax_ledger
                    );
                    
                    if (matchedTaxLedger) {
                        return {
                            ...product,
                            tax_ledger: matchedTaxLedger.name,
                            tax_ledger_id: matchedTaxLedger.id
                        };
                    }
                }
                
                return product;
            });
            
            // Only update if there are actual changes
            const hasChanges = updatedProducts.some((product, index) => 
                product.tax_ledger_id !== products[index].tax_ledger_id
            );
            
            if (hasChanges) {
                setProducts(updatedProducts);
            }
        }
    }, [taxLedgerOptions, tallyAnalysedData, products]);
    
    // Specific effect to handle initial stock item selection after products are loaded
    useEffect(() => {
        if (stockItemOptions.length > 0 && products.length > 0) {            
            let needsUpdate = false;
            const updatedProducts = products.map(product => {
                // Check if product has item_id but the dropdown might not be showing it
                if (product.item_id && product.item_name) {
                    const stockItemExists = stockItemOptions.find(item => item.id === product.item_id);
                    if (stockItemExists) {
                        return product;
                    } else {
                        // Try to find by name
                        const stockItemByName = stockItemOptions.find(item => item.name === product.item_name);
                        if (stockItemByName) {
                            needsUpdate = true;
                            return {
                                ...product,
                                item_id: stockItemByName.id,
                                item_name: stockItemByName.name
                            };
                        }
                    }
                } else if (product.item_name && !product.item_id) {
                    // Product has name but no ID, try to find matching stock item
                    const stockItemByName = stockItemOptions.find(item => item.name === product.item_name);
                    if (stockItemByName) {
                        needsUpdate = true;
                        return {
                            ...product,
                            item_id: stockItemByName.id,
                            item_name: stockItemByName.name
                        };
                    }
                }
                
                return product;
            });
            
            if (needsUpdate) {
                setProducts(updatedProducts);
            }
        }
    }, [stockItemOptions]);
    
    // Handle form input changes
    const handleFormChange = (name, value) => {
        setVendorForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle vendor selection
    const handleVendorSelect = (vendorId) => {
        const vendor = vendorOptions.find(v => v.id === vendorId);
        if (vendor) {
            setVendorForm(prev => ({
                ...prev,
                selectedVendor: vendor,
                vendorName: vendor.name || '',
                vendorGST: vendor.gst_in || ''
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

    // Handle tax ledger selection
    const handleTaxLedgerSelect = (productIndex, taxLedgerId) => {
        const taxLedger = taxLedgerOptions.find(tl => tl.id === taxLedgerId);
        if (taxLedger) {
            setProducts(prev => {
                const updated = [...prev];
                updated[productIndex] = {
                    ...updated[productIndex],
                    tax_ledger: taxLedger.name,
                    tax_ledger_id: taxLedger.id
                };
                return updated;
            });
        }
    };

    // Handle tax ledger deselection
    const handleTaxLedgerClear = (productIndex) => {
        setProducts(prev => {
            const updated = [...prev];
            updated[productIndex] = {
                ...updated[productIndex],
                tax_ledger: 'No Tax Ledger',
                tax_ledger_id: null
            };
            return updated;
        });
    };

    // Handle item name selection
    const handleItemNameSelect = (productIndex, itemId) => {
        const stockItem = stockItemOptions.find(item => item.id === itemId);
        if (stockItem) {
            setProducts(prev => {
                const updated = [...prev];
                updated[productIndex] = {
                    ...updated[productIndex],
                    item_name: stockItem.name,
                    item_id: stockItem.id
                };
                return updated;
            });
        }
    };

    // Handle item name deselection
    const handleItemNameClear = (productIndex) => {
        setProducts(prev => {
            const updated = [...prev];
            updated[productIndex] = {
                ...updated[productIndex],
                item_name: null,
                item_id: null
            };
            return updated;
        });
    };

    // Handle Bill Summary form changes
    const handleBillSummaryChange = (name, value) => {
        setBillSummaryForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle tax ledger selections
    const handleCgstLedgerSelect = (ledgerId) => {
        setBillSummaryForm(prev => ({
            ...prev,
            cgstLedgerId: ledgerId
        }));
    };

    const handleSgstLedgerSelect = (ledgerId) => {
        setBillSummaryForm(prev => ({
            ...prev,
            sgstLedgerId: ledgerId
        }));
    };

    const handleIgstLedgerSelect = (ledgerId) => {
        setBillSummaryForm(prev => ({
            ...prev,
            igstLedgerId: ledgerId
        }));
    };

    const handleCgstLedgerClear = () => {
        setBillSummaryForm(prev => ({
            ...prev,
            cgstLedgerId: null
        }));
    };

    const handleSgstLedgerClear = () => {
        setBillSummaryForm(prev => ({
            ...prev,
            sgstLedgerId: null
        }));
    };

    const handleIgstLedgerClear = () => {
        setBillSummaryForm(prev => ({
            ...prev,
            igstLedgerId: null
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

    // Product manipulation functions
    const handleProductChange = (index, field, value) => {
        setProducts(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            
            // Auto-calculate amount when price or quantity changes
            if (field === 'price' || field === 'quantity') {
                const price = field === 'price' ? parseFloat(value) || 0 : parseFloat(updated[index].price) || 0;
                const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updated[index].quantity) || 0;
                updated[index].amount = (price * quantity).toString();
            }
            
            return updated;
        });
    };

    const addProduct = () => {
        setProducts(prev => [...prev, {
            id: Date.now(),
            item_id: null,
            item_name: null,
            item_details: '',
            tax_ledger: 'No Tax Ledger',
            tax_ledger_id: null,
            price: '',
            quantity: '',
            amount: '',
            gst: '',
            igst: 0.0,
            cgst: 0.0,
            sgst: 0.0
        }]);
    };

    const removeProduct = (index) => {
        if (products.length > 1) {
            setProducts(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Transform form data to API format
    const transformToVerifyFormat = () => {
        // Get vendor ledger information
        const selectedVendor = vendorForm.selectedVendor;
        
        // Get tax ledger information for summary
        const cgstLedger = cgstLedgerOptions.find(ledger => ledger.id === billSummaryForm.cgstLedgerId);
        const sgstLedger = sgstLedgerOptions.find(ledger => ledger.id === billSummaryForm.sgstLedgerId);
        const igstLedger = igstLedgerOptions.find(ledger => ledger.id === billSummaryForm.igstLedgerId);
        
        return {
            bill_id: billId,
            analyzed_bill: vendorBillData?.analyzed_bill || null,
            analyzed_data: {
                vendor_name: vendorForm.vendorName || "Unknown Vendor",
                bill_no: vendorForm.invoiceNumber || "",
                bill_date: vendorForm.dateIssued ? 
                    new Date(vendorForm.dateIssued).toLocaleDateString('en-GB').split('/').reverse().join('-') : "",
                total_amount: parseFloat(billSummaryForm.total) || 0,
                company_id: selectedVendor?.company || "Unknown",
                taxes: {
                    igst: {
                        amount: parseFloat(billSummaryForm.igst) || 0.0,
                        ledger: igstLedger?.name || "No Tax Ledger"
                    },
                    cgst: {
                        amount: parseFloat(billSummaryForm.cgst) || 0.0,
                        ledger: cgstLedger?.name || "No Tax Ledger"
                    },
                    sgst: {
                        amount: parseFloat(billSummaryForm.sgst) || 0.0,
                        ledger: sgstLedger?.name || "No Tax Ledger"
                    }
                },
                products: products.map(product => {
                    const taxLedger = taxLedgerOptions.find(ledger => ledger.id === product.tax_ledger_id);
                    return {
                        item_id: product.item_id || null,
                        item_name: product.item_name || null,
                        item_details: product.item_details || "",
                        tax_ledger: taxLedger?.name || "No Tax Ledger",
                        price: parseFloat(product.price) || 0,
                        quantity: parseFloat(product.quantity) || 0,
                        amount: parseFloat(product.amount) || 0,
                        product_gst: product.gst || null,
                        igst: parseFloat(product.igst) || 0.0,
                        cgst: parseFloat(product.cgst) || 0.0,
                        sgst: parseFloat(product.sgst) || 0.0
                    };
                })
            }
        };
    };

    // Save function
    const handleSave = async () => {
        try {
            setIsVerifying(true);
            
            // Transform data to the required API format
            const verifyData = transformToVerifyFormat();
            
            // Call the verify API
            await verifyVendorBill({
                organizationId: selectedOrganization?.id,
                ...verifyData
            }).unwrap();

            globalToast.success('Vendor bill verified successfully');
            
            // Navigate to vendor bill list after successful verification
            navigate('/tally/vendor-bill');
        } catch (error) {
            console.error('Failed to verify vendor bill:', error);
            globalToast.error(error?.data?.message || 'Failed to verify vendor bill');
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
        // Navigate back to vendor bill list
        navigate('/tally/vendor-bill');
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
                title={`Tally Vendor Bill Detail${billInfo.bill_munshi_name ? ` - ${billInfo.bill_munshi_name}` : ''}`} 
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
                            onClick={handleSave}
                            disabled={isVerifying}
                            className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isVerifying ? "Verifying..." : "Verify"}
                        >
                            {isVerifying ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {isVerifying ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col lg:flex-row gap-6 relative">
                    {/* Bill Photo/Image/PDF Section - Fixed/Sticky on Large Screens */}
                    <div className="w-full lg:w-1/3 lg:sticky lg:top-4 lg:self-start">
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 h-[400px] lg:h-[calc(100vh-200px)] flex flex-col">
                            {billInfo?.file ? (
                                <div className="w-full h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                                        <h3 className="text-lg font-medium text-gray-900">Bill Document</h3>
                                        <div className="flex items-center gap-2">
                                            {/* Keyboard Shortcuts Info */}
                                            {!isPDF(billInfo.file) && (
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
                                            {!isPDF(billInfo.file) && (
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
                                        {isPDF(billInfo.file) ? (
                                            // PDF Viewer
                                            <iframe
                                                src={billInfo.file}
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
                                                    src={billInfo.file}
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
                            {/* Vendor Information Section */}
                            <div className="p-8 border-b border-gray-200">
                                <div className="flex items-center gap-2 mb-6">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-900">Vendor Information</h3>
                                </div>

                                {/* Simple Form Fields */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Vendor Selection Field */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vendor
                                        </label>
                                        <SearchableDropdown
                                            options={vendorOptions}
                                            value={vendorForm.selectedVendor?.id || null}
                                            onChange={handleVendorSelect}
                                            placeholder="Search and select vendor..."
                                            searchPlaceholder="Type to search vendors..."
                                            optionLabelKey="name"
                                            optionValueKey="id"
                                            loading={vendorLedgersLoading}
                                            renderOption={(vendor) => (
                                                <div className="flex flex-col py-1">
                                                    <div className="font-medium text-gray-900">{vendor.name}</div>
                                                    {vendor.gst_in && (
                                                        <div className="text-xs text-gray-500">GST: {vendor.gst_in}</div>
                                                    )}
                                                    {vendor.parent_name && (
                                                        <div className="text-xs text-blue-600">{vendor.parent_name}</div>
                                                    )}
                                                </div>
                                            )}
                                            className="mb-2"
                                        />

                                        {/* Bill To Badge - showing analysed_data.from.name */}
                                        {analysedData?.from?.name && (
                                            <div className="mt-3">
                                                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    Bill To: {analysedData.from.name}
                                                </div>
                                            </div>
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
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
                                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                            <table className="w-full min-w-[1000px]">
                                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[150px]">
                                                            Item Name
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[200px]">
                                                            Item Details
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[150px]">
                                                            Tax Ledger
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[100px]">
                                                            Price
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[80px]">
                                                            Quantity
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[100px]">
                                                            Amount
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[80px]">
                                                            GST %
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[90px]">
                                                            IGST
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[90px]">
                                                            CGST
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[90px]">
                                                            SGST
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 min-w-[80px]">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {products.map((product, index) => (
                                                        <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                            {/* Item Name */}
                                                            <td className="px-4 py-3">
                                                                <SearchableDropdown
                                                                    key={`item-${product.id}-${product.item_id}`}
                                                                    options={stockItemOptions}
                                                                    value={product.item_id || null}
                                                                    onChange={(itemId) => handleItemNameSelect(index, itemId)}
                                                                    onClear={() => handleItemNameClear(index)}
                                                                    placeholder="Select item name..."
                                                                    searchPlaceholder="Type to search stock items..."
                                                                    optionLabelKey="name"
                                                                    optionValueKey="id"
                                                                    loading={mastersLoading}
                                                                    renderOption={(stockItem) => (
                                                                        <div className="flex flex-col py-1">
                                                                            <div className="font-medium text-gray-900">{stockItem.name}</div>
                                                                            {stockItem.alias !== "0" && stockItem.alias && (
                                                                                <div className="text-xs text-blue-600">Alias: {stockItem.alias}</div>
                                                                            )}
                                                                            <div className="text-xs text-gray-500 flex gap-2">
                                                                                <span>Unit: {stockItem.unit}</span>
                                                                                <span>Category: {stockItem.category}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    className="item-name-dropdown"
                                                                />
                                                            </td>
                                                            
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

                                                            {/* Tax Ledger */}
                                                            <td className="px-4 py-3">
                                                                <SearchableDropdown
                                                                    options={taxLedgerOptions}
                                                                    value={product.tax_ledger_id || null}
                                                                    onChange={(taxLedgerId) => handleTaxLedgerSelect(index, taxLedgerId)}
                                                                    onClear={() => handleTaxLedgerClear(index)}
                                                                    placeholder="Select tax ledger..."
                                                                    searchPlaceholder="Type to search tax ledgers..."
                                                                    optionLabelKey="name"
                                                                    optionValueKey="id"
                                                                    loading={taxLedgersLoading}
                                                                    renderOption={(taxLedger) => (
                                                                        <div className="flex flex-col py-1">
                                                                            <div className="font-medium text-gray-900">{taxLedger.name}</div>
                                                                            {taxLedger.parent_name && (
                                                                                <div className="text-xs text-blue-600">{taxLedger.parent_name}</div>
                                                                            )}
                                                                            {taxLedger.opening_balance && parseFloat(taxLedger.opening_balance) !== 0 && (
                                                                                <div className="text-xs text-gray-500">Balance: ₹{parseFloat(taxLedger.opening_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    className="tax-ledger-dropdown"
                                                                />
                                                            </td>

                                                            {/* Price */}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={product.price}
                                                                    onChange={(e) => handleProductChange(index, 'price', e.target.value)}
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
                                                                <input
                                                                    type="number"
                                                                    value={product.amount}
                                                                    onChange={(e) => handleProductChange(index, 'amount', e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="w-full px-3 py-2 text-sm text-right bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>

                                                            {/* GST % */}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="text"
                                                                    value={product.gst || ''}
                                                                    onChange={(e) => handleProductChange(index, 'gst', e.target.value)}
                                                                    placeholder="0.00%"
                                                                    className="w-full px-3 py-2 text-sm text-center bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400"
                                                                />
                                                            </td>

                                                            {/* IGST */}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={product.igst || 0.0}
                                                                    onChange={(e) => handleProductChange(index, 'igst', parseFloat(e.target.value) || 0.0)}
                                                                    placeholder="0.00"
                                                                    className="w-full px-3 py-2 text-sm text-right bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>

                                                            {/* CGST */}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={product.cgst || 0.0}
                                                                    onChange={(e) => handleProductChange(index, 'cgst', parseFloat(e.target.value) || 0.0)}
                                                                    placeholder="0.00"
                                                                    className="w-full px-3 py-2 text-sm text-right bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
                                                            </td>

                                                            {/* SGST */}
                                                            <td className="px-4 py-3">
                                                                <input
                                                                    type="number"
                                                                    value={product.sgst || 0.0}
                                                                    onChange={(e) => handleProductChange(index, 'sgst', parseFloat(e.target.value) || 0.0)}
                                                                    placeholder="0.00"
                                                                    className="w-full px-3 py-2 text-sm text-right bg-white border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    min="0"
                                                                    step="0.01"
                                                                />
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
                                                <div className="flex items-center gap-2">
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
                                                    <div className="flex-1 min-w-[200px]">
                                                        <SearchableDropdown
                                                            options={cgstLedgerOptions}
                                                            value={billSummaryForm.cgstLedgerId || null}
                                                            onChange={handleCgstLedgerSelect}
                                                            onClear={handleCgstLedgerClear}
                                                            placeholder="Select CGST ledger..."
                                                            searchPlaceholder="Type to search CGST ledgers..."
                                                            optionLabelKey="name"
                                                            optionValueKey="id"
                                                            loading={cgstLedgersLoading}
                                                            renderOption={(ledger) => (
                                                                <div className="flex flex-col py-1">
                                                                    <div className="font-medium text-gray-900">{ledger.name}</div>
                                                                    {ledger.parent_name && (
                                                                        <div className="text-xs text-blue-600">{ledger.parent_name}</div>
                                                                    )}
                                                                    {ledger.opening_balance && parseFloat(ledger.opening_balance) !== 0 && (
                                                                        <div className="text-xs text-gray-500">Balance: ₹{parseFloat(ledger.opening_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                                    )}
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
                                                            value={billSummaryForm.sgst}
                                                            onChange={e => handleBillSummaryChange('sgst', e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-[200px]">
                                                        <SearchableDropdown
                                                            options={sgstLedgerOptions}
                                                            value={billSummaryForm.sgstLedgerId || null}
                                                            onChange={handleSgstLedgerSelect}
                                                            onClear={handleSgstLedgerClear}
                                                            placeholder="Select SGST ledger..."
                                                            searchPlaceholder="Type to search SGST ledgers..."
                                                            optionLabelKey="name"
                                                            optionValueKey="id"
                                                            loading={sgstLedgersLoading}
                                                            renderOption={(ledger) => (
                                                                <div className="flex flex-col py-1">
                                                                    <div className="font-medium text-gray-900">{ledger.name}</div>
                                                                    {ledger.parent_name && (
                                                                        <div className="text-xs text-blue-600">{ledger.parent_name}</div>
                                                                    )}
                                                                    {ledger.opening_balance && parseFloat(ledger.opening_balance) !== 0 && (
                                                                        <div className="text-xs text-gray-500">Balance: ₹{parseFloat(ledger.opening_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                                    )}
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
                                                            value={billSummaryForm.igst}
                                                            onChange={e => handleBillSummaryChange('igst', e.target.value)}
                                                            placeholder="0.00"
                                                            className="w-24 px-2 py-1 text-right border-0 border-b border-gray-300 bg-transparent focus:border-blue-500 focus:outline-none text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-[200px]">
                                                        <SearchableDropdown
                                                            options={igstLedgerOptions}
                                                            value={billSummaryForm.igstLedgerId || null}
                                                            onChange={handleIgstLedgerSelect}
                                                            onClear={handleIgstLedgerClear}
                                                            placeholder="Select IGST ledger..."
                                                            searchPlaceholder="Type to search IGST ledgers..."
                                                            optionLabelKey="name"
                                                            optionValueKey="id"
                                                            loading={igstLedgersLoading}
                                                            renderOption={(ledger) => (
                                                                <div className="flex flex-col py-1">
                                                                    <div className="font-medium text-gray-900">{ledger.name}</div>
                                                                    {ledger.parent_name && (
                                                                        <div className="text-xs text-blue-600">{ledger.parent_name}</div>
                                                                    )}
                                                                    {ledger.opening_balance && parseFloat(ledger.opening_balance) !== 0 && (
                                                                        <div className="text-xs text-gray-500">Balance: ₹{parseFloat(ledger.opening_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                                    )}
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
                                        value={notes || `Page URL: ${window.location.href}\n\n`}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
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
                <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
                    <div className="relative w-full h-full flex flex-col">
                        {/* Fullscreen Header */}
                        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
                            <div className="flex items-center gap-4">
                                <h3 className="text-white text-lg font-medium">
                                    Bill Document - {billInfo.bill_munshi_name || analysedData.invoiceNumber || 'Unknown'}
                                </h3>
                                {!isPDF(billInfo.file) && (
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
                            {isPDF(billInfo.file) ? (
                                <iframe
                                    src={billInfo.file}
                                    className="w-full h-full border-0 rounded-lg"
                                    title="Bill PDF Document - Fullscreen"
                                />
                            ) : (
                                <div className="overflow-auto w-full h-full flex items-center justify-center">
                                    <img
                                        src={billInfo.file}
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

export default TallyVendorBillDetail
