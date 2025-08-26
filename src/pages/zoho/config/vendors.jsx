import React from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import Card from "@/components/ui/Card";
import { useGetVendorsQuery, useSyncVendorsMutation } from '@/store/api/zoho/zohoApiSlice'

const Vendors = () => {
    const { selectedOrganization } = useSelector(state => state.auth)
    
    const { 
        data: vendorsData, 
        isLoading, 
        isError, 
        error, 
        refetch 
    } = useGetVendorsQuery(selectedOrganization?.id, {
        skip: !selectedOrganization?.id
    })
    
    const [syncVendors, { isLoading: isSyncing }] = useSyncVendorsMutation()

    const handleSync = async () => {
        if (!selectedOrganization?.id) {
            toast.error('Please select an organization first')
            return
        }

        try {
            await syncVendors(selectedOrganization.id).unwrap()
            toast.success('Vendors synced successfully!')
        } catch (error) {
            console.error('Sync failed:', error)
            toast.error(error?.data?.message || 'Failed to sync vendors')
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    return (
        <div className="space-y-5">
            <Card 
                title="Vendors" 
                noBorder
                headerSlot={
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing || !selectedOrganization?.id}
                        className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Sync all vendors"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.8} 
                            stroke="currentColor" 
                            className={`w-4 h-4 transition-transform duration-300 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        {isSyncing ? 'Syncing...' : 'Sync'}
                    </button>
                }
            >
                <div className="overflow-x-auto -mx-6">
                    <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-slate-600">Loading vendors...</span>
                                </div>
                            ) : isError ? (
                                <div className="text-center py-8">
                                    <div className="text-red-600 mb-4">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">Failed to load vendors</p>
                                        <p className="text-sm text-slate-500 mt-2">
                                            {error?.data?.message || error?.message || 'An error occurred while fetching vendors'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={refetch}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : !vendorsData?.results?.length ? (
                                <div className="text-center py-8">
                                    <div className="text-slate-500">
                                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <p className="text-lg font-medium">No vendors found</p>
                                        <p className="text-sm mt-2">Click "Sync" to fetch your vendors from Zoho</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700!">
                                        <thead className="bg-slate-200 dark:bg-slate-700">
                                            <tr>
                                                <th scope='col' className='table-th'>Sr. No</th>
                                                <th scope='col' className='table-th'>Contact ID</th>
                                                <th scope='col' className='table-th'>Company Name</th>
                                                <th scope='col' className='table-th'>GST Number</th>
                                                <th scope='col' className='table-th'>Created Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700!">
                                            {vendorsData.results.map((vendor, index) => (
                                                <tr key={vendor.id}>
                                                    <td className="table-td">{index + 1}</td>
                                                    <td className="table-td">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                                            {vendor.contactId}
                                                        </span>
                                                    </td>
                                                    <td className="table-td">
                                                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                            {vendor.companyName}
                                                        </span>
                                                    </td>
                                                    <td className="table-td">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                            {vendor.gstNo}
                                                        </span>
                                                    </td>
                                                    <td className="table-td">{formatDate(vendor.created_at)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {vendorsData?.count > 0 && (
                                        <div className="mt-4 px-6 pb-4 text-sm text-slate-500">
                                            Showing {vendorsData.results.length} of {vendorsData.count} vendors
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Vendors;