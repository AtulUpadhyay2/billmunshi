import React from 'react';
import { useSelector } from 'react-redux';
import { useGetZohoFunnelQuery, useGetZohoOverviewQuery, useGetZohoUsageQuery } from '@/store/api/zoho/zohoDashboardApiSlice';
import Card from '@/components/ui/Card';
import Loading from '@/components/Loading';

const OverviewCards = ({ overviewData }) => {
  const { vendor_bills, expense_bills, financial_summary, vendor_count, recent_activity } = overviewData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Financial Summary */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Total Amount
            </h3>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(financial_summary.combined_amount)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Vendor: {formatCurrency(financial_summary.total_vendor_amount)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Expense: {formatCurrency(financial_summary.total_expense_amount)}
            </div>
          </div>
        </div>
      </Card>

      {/* Vendor Bills Summary */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Vendor Bills
            </h3>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {vendor_bills.total_count}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Analysed:</span>
              <span className="text-slate-900 dark:text-white">{vendor_bills.analysed_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Synced:</span>
              <span className="text-slate-900 dark:text-white">{vendor_bills.synced_count}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Expense Bills Summary */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Expense Bills
            </h3>
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {expense_bills.total_count}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Draft:</span>
              <span className="text-slate-900 dark:text-white">{expense_bills.draft_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Synced:</span>
              <span className="text-slate-900 dark:text-white">{expense_bills.synced_count}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Vendors & Recent Activity */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Activity
            </h3>
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {vendor_count}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Total Vendors
            </div>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Last 7 days:</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-600 dark:text-slate-300">Vendor Bills:</span>
                <span className="text-slate-900 dark:text-white">{recent_activity.vendor_bills_last_7_days}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300">Expense Bills:</span>
                <span className="text-slate-900 dark:text-white">{recent_activity.expense_bills_last_7_days}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const UsageAnalytics = ({ usageData }) => {
  const { usage_by_period, file_statistics } = usageData;

  const periods = [
    { key: 'today', label: 'Today', color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' },
    { key: 'week', label: 'This Week', color: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' },
    { key: 'month', label: 'This Month', color: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' },
    { key: 'quarter', label: 'This Quarter', color: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400' }
  ];

  return (
    <div className="space-y-6">
      {/* Usage by Period */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          Usage Analytics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {periods.map(({ key, label, color }) => {
            const periodData = usage_by_period[key];
            return (
              <Card key={key}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                      {label}
                    </h4>
                    <div className={`w-3 h-3 rounded-full ${color.split(' ')[0]} ${color.split(' ')[1]}`}></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Vendor Bills</span>
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {periodData.vendor_bills_uploaded}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Expense Bills</span>
                      <span className="text-lg font-semibold text-slate-900 dark:text-white">
                        {periodData.expense_bills_uploaded}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Analysed</span>
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {periodData.bills_analysed}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Synced</span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {periodData.bills_synced}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* File Statistics */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
          File Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {file_statistics.total_vendor_files}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Vendor Files
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {file_statistics.total_expense_files}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Expense Files
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {file_statistics.total_files}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Total Files
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const FunnelCard = ({ title, data, type }) => {
  const { total_uploaded, draft, analysed, verified, synced, conversion_rates } = data;

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          {title}
        </h3>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {total_uploaded}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Total Uploaded
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {draft}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Draft
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {analysed}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Analysed
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {verified}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Verified
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {synced}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Synced
            </div>
          </div>
        </div>

        {/* Conversion Rates */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Conversion Rates
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Analysis Rate
              </span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {conversion_rates.analysis_rate}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Verification Rate
              </span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {conversion_rates.verification_rate}%
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Sync Rate
              </span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {conversion_rates.sync_rate}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
            <span>Progress:</span>
            <span>{synced}/{total_uploaded} completed</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${total_uploaded > 0 ? (synced / total_uploaded) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ZohoDashboard = () => {
  const selectedOrganization = useSelector(state => state.auth.selectedOrganization);
  
  const {
    data: funnelData,
    isLoading: isFunnelLoading,
    isError: isFunnelError,
    error: funnelError
  } = useGetZohoFunnelQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError
  } = useGetZohoOverviewQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
    refetchOnMountOrArgChange: true,
  });

  const {
    data: usageData,
    isLoading: isUsageLoading,
    isError: isUsageError,
    error: usageError
  } = useGetZohoUsageQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
    refetchOnMountOrArgChange: true,
  });

  if (!selectedOrganization) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-300">
          Please select an organization to view the dashboard.
        </p>
      </div>
    );
  }

  const isLoading = isFunnelLoading || isOverviewLoading || isUsageLoading;
  const isError = isFunnelError || isOverviewError || isUsageError;
  const error = funnelError || overviewError || usageError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400 mb-2">
            Error loading dashboard data
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {error?.data?.message || error?.message || 'Failed to fetch data'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Zoho Dashboard
        </h2>
        <p className="text-slate-600 dark:text-slate-300">
          Overview of your bill processing and financial data
        </p>
      </div>

      {/* Overview Cards */}
      {overviewData && <OverviewCards overviewData={overviewData} />}

      {/* Usage Analytics */}
      {usageData && <UsageAnalytics usageData={usageData} />}

      {/* Funnel Analysis */}
      {funnelData && (
        <div className="space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Processing Funnel
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Track your bill processing workflow from upload to sync
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* Vendor Bills Funnel */}
            <FunnelCard
              title="Vendor Bills Funnel"
              data={funnelData.vendor_bills_funnel}
              type="vendor"
            />

            {/* Expense Bills Funnel */}
            <FunnelCard
              title="Expense Bills Funnel"
              data={funnelData.expense_bills_funnel}
              type="expense"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ZohoDashboard;