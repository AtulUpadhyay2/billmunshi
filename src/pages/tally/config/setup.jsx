import React from 'react'
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import { useGetTallyConfigsQuery } from "@/store/api/tally/tallyApiSlice";
import { toast } from "react-toastify";

const TallySetup = () => {
    const { selectedOrganization } = useSelector((state) => state.auth);
    
    const {
        data: configsData,
        isLoading,
        error,
        refetch
    } = useGetTallyConfigsQuery(selectedOrganization?.id, {
        skip: !selectedOrganization?.id,
    });

    // Extract the first config from results array
    const config = configsData?.results?.[0];

    const renderParentNamesList = (parentNames, title, bgColor = "bg-slate-50", textColor = "text-slate-900", borderColor = "border-slate-200") => {
        if (!parentNames || parentNames.length === 0) {
            return (
                <div className={`${bgColor} dark:bg-slate-800 ${borderColor} dark:border-slate-700 border rounded-lg p-4`}>
                    <h3 className={`text-sm font-medium text-slate-500 dark:text-slate-400 mb-2`}>{title}</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 italic">No items configured</p>
                </div>
            );
        }

        return (
            <div className={`${bgColor} dark:bg-slate-800 ${borderColor} dark:border-slate-700 border rounded-lg p-4`}>
                <h3 className={`text-sm font-medium text-slate-500 dark:text-slate-400 mb-3`}>{title}</h3>
                <div className="space-y-2">
                    {parentNames.map((name, index) => (
                        <div 
                            key={index}
                            className={`${textColor} dark:text-white text-sm font-medium px-3 py-2 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600`}
                        >
                            {name}
                        </div>
                    ))}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {parentNames.length} item{parentNames.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-5">
            <Card
                title="Tally Configuration"
                noBorder
                headerSlot={
                    <button
                        onClick={refetch}
                        disabled={isLoading || !selectedOrganization?.id}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh configuration"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </button>
                }
            >
                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-slate-600 dark:text-slate-400">Loading configuration...</span>
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <div className="text-red-600 mb-4">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">Failed to load configuration</p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            {error?.data?.message || error?.message || 'An error occurred while fetching configuration'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={refetch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : !config ? (
                                <div className="text-center py-12">
                                    <div className="text-slate-500">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">No configuration found</p>
                                        <p className="text-sm mt-2">No Tally configuration has been set up for this organization</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 space-y-8">
                                    {/* Tax Configuration */}
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Tax Configuration</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {renderParentNamesList(
                                                config.igst_parent_names, 
                                                "IGST Parent Names",
                                                "bg-red-50",
                                                "text-red-900",
                                                "border-red-200"
                                            )}
                                            {renderParentNamesList(
                                                config.cgst_parent_names, 
                                                "CGST Parent Names",
                                                "bg-green-50",
                                                "text-green-900",
                                                "border-green-200"
                                            )}
                                            {renderParentNamesList(
                                                config.sgst_parent_names, 
                                                "SGST Parent Names",
                                                "bg-yellow-50",
                                                "text-yellow-900",
                                                "border-yellow-200"
                                            )}
                                        </div>
                                    </div>

                                    {/* Account Configuration */}
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Account Configuration</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {renderParentNamesList(
                                                config.vendor_parent_names, 
                                                "Vendor Parent Names",
                                                "bg-purple-50",
                                                "text-purple-900",
                                                "border-purple-200"
                                            )}
                                            {renderParentNamesList(
                                                config.coa_parent_names, 
                                                "COA Parent Names",
                                                "bg-indigo-50",
                                                "text-indigo-900",
                                                "border-indigo-200"
                                            )}
                                            {renderParentNamesList(
                                                config.expense_coa_parent_names, 
                                                "Expense COA Parent Names",
                                                "bg-teal-50",
                                                "text-teal-900",
                                                "border-teal-200"
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </Card>
        </div>
    );
};

export default TallySetup;
