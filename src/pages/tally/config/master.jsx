import React from 'react'
import { useSelector } from 'react-redux'
import Card from '@/components/ui/Card'
import { useGetTallyMastersQuery } from '@/store/api/tally/tallyApiSlice'

const TallyMaster = () => {
    const { selectedOrganization } = useSelector((state) => state.auth)

    const {
        data: mastersData,
        isLoading,
        isError,
        error,
        refetch
    } = useGetTallyMastersQuery(selectedOrganization?.id, {
        skip: !selectedOrganization?.id
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card title="Tally Masters" noBorder>
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="text-slate-600 dark:text-slate-400 text-lg">Loading masters data...</span>
                            <p className="text-sm text-slate-500 dark:text-slate-500">Please wait while we fetch your stock items</p>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="space-y-6">
                <Card title="Tally Masters" noBorder>
                    <div className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-red-600">
                                <p className="text-xl font-semibold">Failed to load masters data</p>
                                <p className="text-sm text-slate-500 mt-2">
                                    {error?.data?.message || error?.message || 'An error occurred while fetching masters data'}
                                </p>
                            </div>
                            <button
                                onClick={refetch}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        )
    }

    const { organization, stock_items = [], stock_items_count = 0 } = mastersData || {}

    if (!selectedOrganization?.id) {
        return (
            <div className="text-center py-8">
                <div className="text-slate-500">No organization selected</div>
                <div className="text-xs text-slate-400 mt-2">Please select an organization to view masters data</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            
            {/* Masters Cards */}
            <Card
                title="Stock Items"
                subtitle={`${stock_items_count} total items`}
                noBorder
                headerSlot={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh masters data"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            {isLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                }
            >
                {stock_items.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <div className="text-slate-500">No stock items found</div>
                            <div className="text-xs text-slate-400">No stock items are available for this organization.</div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stock_items.map((item, index) => (
                            <div
                                key={item.id}
                                className="relative bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                {/* Serial Number Badge */}
                                <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {index + 1}
                                </div>

                                {/* Item Name & Alias */}
                                <div className="mb-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg leading-tight">
                                        {item.name}
                                    </h3>
                                    {item.alias !== "0" && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            Alias: {item.alias}
                                        </p>
                                    )}
                                </div>

                                {/* Main Details Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                            Unit
                                        </label>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                                            {item.unit}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                            Category
                                        </label>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                                            {item.category}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                            Parent
                                        </label>
                                        <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                                            {item.parent}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                            GST Status
                                        </label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border rounded-full ${item.gst_applicable.trim() === 'Applicable'
                                                    ? 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700'
                                                    : 'text-gray-700 bg-gray-100 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                                                }`}>
                                                <svg className="w-1.5 h-1.5 fill-current" viewBox="0 0 8 8">
                                                    <circle cx="4" cy="4" r="3" />
                                                </svg>
                                                {item.gst_applicable.trim() || 'Not Specified'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}

export default TallyMaster