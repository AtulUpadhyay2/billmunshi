import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import useMobileMenu from "@/hooks/useMobileMenu";
import useSidebar from "@/hooks/useSidebar";

const ZohoVendorBillDetail = () => {
    const [activeTab, setActiveTab] = useState('info');
    const [mobileMenu, setMobileMenu] = useMobileMenu();
    const [collapsed, setMenuCollapsed] = useSidebar();
    const navigate = useNavigate();

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

    const tabs = [
        { id: 'info', label: 'Info' },
        { id: 'product', label: 'Product' },
        { id: 'notes', label: 'Notes' }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-2">Vendor Information</h2>
                        <p className="text-sm text-gray-600">Details about the vendor associated with this bill.</p>
                        {/* Add more vendor info fields here */}
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bill Number</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                    </div>
                );
            case 'product':
                return (
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-2">Product Information</h2>
                        <p className="text-sm text-gray-600 mb-4">Details about products in this bill.</p>
                        {/* Add product table or list here */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-300 px-4 py-2">Sample Product</td>
                                        <td className="border border-gray-300 px-4 py-2">1</td>
                                        <td className="border border-gray-300 px-4 py-2">$100</td>
                                        <td className="border border-gray-300 px-4 py-2">$100</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'notes':
                return (
                    <div className="p-6">
                        <h2 className="text-lg font-semibold mb-2">Notes</h2>
                        <p className="text-sm text-gray-600 mb-4">Additional notes and comments for this bill.</p>
                        <textarea 
                            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md resize-none"
                            placeholder="Add your notes here..."
                        ></textarea>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-5">
            <Card 
                title="Vendor Bill Detail" 
                noBorder
                headerSlot={
                    <div className="flex items-center gap-3">
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

                    {/* Tabs Section */}
                    <div className="lg:w-2/3">
                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-200 mb-0">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ZohoVendorBillDetail;