import React from "react";
import Card from "@/components/ui/Card";

const TallyVendorBill = () => {
  return (
    <div className="space-y-5">
      <Card
        title="Vendor Bill"
        noBorder
        headerSlot={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh vendor bills"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={`w-3.5 h-3.5`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
            <button
              className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all duration-200 active:scale-95"
              title="Upload vendor bills"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"
                className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 10l-4-4m0 0-4 4m4-4v12" />
              </svg>
              Upload Bill
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden ">
              <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700!">
                <thead className="bg-slate-200 dark:bg-slate-700">
                  <tr>
                    <th scope='col' className='table-th'>Sr. No</th>
                    <th scope='col' className='table-th'>Document ID</th>
                    <th scope='col' className='table-th'>Status</th>
                    <th scope='col' className='table-th'>Created Date</th>
                    <th scope='col' className='table-th'>Actions</th>
                    <th scope='col' className='table-th'>Control</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700!">
                  <tr>
                    <td colSpan="7" className="table-td text-center py-8">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-slate-500">No vendor bills found</div>
                        <div className="text-xs text-slate-400">Upload your first vendor bill to get started</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TallyVendorBill;
