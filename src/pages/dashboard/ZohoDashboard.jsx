import React from 'react';
import { useSelector } from 'react-redux';
import { useGetZohoFunnelQuery, useGetZohoOverviewQuery, useGetZohoUsageQuery } from '@/store/api/zoho/zohoDashboardApiSlice';
import Card from '@/components/ui/Card';
import Loading from '@/components/Loading';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Financial Summary */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full transform translate-x-6 -translate-y-6"></div>
        <div className="p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Total Amount
            </h3>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {formatCurrency(financial_summary.combined_amount)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300">Vendor:</span>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(financial_summary.total_vendor_amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-300">Expense:</span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {formatCurrency(financial_summary.total_expense_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Vendor Bills Summary */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full transform translate-x-6 -translate-y-6"></div>
        <div className="p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Vendor Bills
            </h3>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {vendor_bills.total_count}
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Analysed: <span className="font-bold text-blue-600">{vendor_bills.analysed_count}</span></span>
              <span className="text-slate-600 dark:text-slate-300">Synced: <span className="font-bold text-green-600">{vendor_bills.synced_count}</span></span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-1 rounded-full transition-all duration-300" style={{width: `${vendor_bills.total_count > 0 ? (vendor_bills.synced_count / vendor_bills.total_count) * 100 : 0}%`}}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Expense Bills Summary */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full transform translate-x-6 -translate-y-6"></div>
        <div className="p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Expense Bills
            </h3>
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {expense_bills.total_count}
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">Draft: <span className="font-bold text-yellow-600">{expense_bills.draft_count}</span></span>
              <span className="text-slate-600 dark:text-slate-300">Synced: <span className="font-bold text-green-600">{expense_bills.synced_count}</span></span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full transition-all duration-300" style={{width: `${expense_bills.total_count > 0 ? (expense_bills.synced_count / expense_bills.total_count) * 100 : 0}%`}}></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Vendors & Recent Activity */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full transform translate-x-6 -translate-y-6"></div>
        <div className="p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Activity
            </h3>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {vendor_count}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              Total Vendors
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Last 7 days</div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">Vendor: <span className="font-bold text-green-600">{recent_activity.vendor_bills_last_7_days}</span></span>
                <span className="text-slate-600 dark:text-slate-300">Expense: <span className="font-bold text-purple-600">{recent_activity.expense_bills_last_7_days}</span></span>
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

  // Prepare data for charts
  const trendData = [
    { name: 'Today', vendor: usage_by_period.today.vendor_bills_uploaded, expense: usage_by_period.today.expense_bills_uploaded, analysed: usage_by_period.today.bills_analysed, synced: usage_by_period.today.bills_synced },
    { name: 'Week', vendor: usage_by_period.week.vendor_bills_uploaded, expense: usage_by_period.week.expense_bills_uploaded, analysed: usage_by_period.week.bills_analysed, synced: usage_by_period.week.bills_synced },
    { name: 'Month', vendor: usage_by_period.month.vendor_bills_uploaded, expense: usage_by_period.month.expense_bills_uploaded, analysed: usage_by_period.month.bills_analysed, synced: usage_by_period.month.bills_synced },
    { name: 'Quarter', vendor: usage_by_period.quarter.vendor_bills_uploaded, expense: usage_by_period.quarter.expense_bills_uploaded, analysed: usage_by_period.quarter.bills_analysed, synced: usage_by_period.quarter.bills_synced }
  ];

  const pieData = [
    { name: 'Vendor Files', value: file_statistics.total_vendor_files, color: '#3B82F6' },
    { name: 'Expense Files', value: file_statistics.total_expense_files, color: '#8B5CF6' }
  ];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Compact Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Usage Trends */}
        <Card className="lg:col-span-2">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Usage Trends & Performance
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }} 
                  />
                  <Bar dataKey="vendor" name="Vendor Bills" fill="#10B981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expense" name="Expense Bills" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="analysed" name="Analysed" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="synced" name="Synced" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* File Distribution */}
        <Card>
          <div className="p-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              File Distribution
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    dataKey="value"
                    label={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Compact Stats */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{file_statistics.total_vendor_files}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Vendor</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{file_statistics.total_expense_files}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">Expense</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const FunnelCard = ({ title, data, type }) => {
  const { total_uploaded, draft, analysed, verified, synced, conversion_rates } = data;

  const getGradientColor = (type) => {
    return type === 'vendor' 
      ? 'from-green-500 to-emerald-600' 
      : 'from-purple-500 to-pink-600';
  };

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <div className={`px-2 py-1 bg-gradient-to-r ${getGradientColor(type)} rounded-full text-white text-xs font-medium`}>
            {((synced / total_uploaded) * 100 || 0).toFixed(1)}% Complete
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{total_uploaded}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Uploaded</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{analysed}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Analysed</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{verified}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Verified</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{synced}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">Synced</div>
            </div>
          </div>

          {/* Conversion Rates */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
              Conversion Rates
            </h4>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Analysis</span>
                  <span className="font-bold text-slate-900 dark:text-white">{conversion_rates.analysis_rate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                  <div className="bg-purple-500 h-1 rounded-full" style={{width: `${conversion_rates.analysis_rate}%`}}></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Verification</span>
                  <span className="font-bold text-slate-900 dark:text-white">{conversion_rates.verification_rate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                  <div className="bg-orange-500 h-1 rounded-full" style={{width: `${conversion_rates.verification_rate}%`}}></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Sync</span>
                  <span className="font-bold text-slate-900 dark:text-white">{conversion_rates.sync_rate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full" style={{width: `${conversion_rates.sync_rate}%`}}></div>
                </div>
              </div>
            </div>
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
      {/* Overview Cards */}
      {overviewData && <OverviewCards overviewData={overviewData} />}

      {/* Usage Analytics */}
      {usageData && <UsageAnalytics usageData={usageData} />}

      {/* Funnel Analysis */}
      {funnelData && (
        <div className="space-y-4"> 
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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