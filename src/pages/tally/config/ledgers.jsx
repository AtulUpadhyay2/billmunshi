import React, { useState, useMemo } from 'react'
import { useSelector } from "react-redux";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/Loading";
import Textinput from "@/components/ui/Textinput";
import Icon from "@/components/ui/Icon";
import { useGetTallyLedgers } from '@/hooks/api/tally/tallyApiService';
import { globalToast } from "@/utils/toast";

const Ledgers = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const { data: ledgersData, error, isLoading, refetch } = useGetTallyLedgers(selectedOrganization?.id, {
    enabled: !!selectedOrganization?.id,
  });

  const [expandedParents, setExpandedParents] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleParentExpansion = (parentId) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  // Filter grouped ledgers based on search term
  const filteredGroupedLedgers = useMemo(() => {
    if (!ledgersData?.grouped_ledgers || !searchTerm) {
      return ledgersData?.grouped_ledgers || {};
    }

    const filtered = {};
    Object.entries(ledgersData.grouped_ledgers).forEach(([parentName, parentData]) => {
      if (parentData.parent_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[parentName] = parentData;
      }
    });
    return filtered;
  }, [ledgersData?.grouped_ledgers, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    globalToast.error("Failed to load ledgers data");
    return (
      <Card title="Tally Ledgers">
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load ledgers data</p>
          <button 
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  if (!ledgersData || !ledgersData.success) {
    return (
      <Card title="Tally Ledgers">
        <div className="text-center py-8">
          <p>No ledgers data available</p>
        </div>
      </Card>
    );
  }

  const { total_parents, total_ledgers, grouped_ledgers } = ledgersData;

  return (
    <div className="space-y-6">
      {/* Ledgers Groups */}
      <Card title="Tally Ledgers">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Textinput
              label="Search Parent Groups"
              placeholder="Type to search parent groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prependIcon="heroicons-outline:search"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <Icon icon="heroicons-outline:x" />
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {Object.keys(filteredGroupedLedgers).length} of {Object.keys(grouped_ledgers).length} parent groups
            </div>
          )}
        </div>

        <div className="space-y-4">
          {Object.keys(filteredGroupedLedgers).length > 0 ? (
            Object.entries(filteredGroupedLedgers).map(([parentName, parentData]) => (
              <div key={parentData.parent_id} className="border border-gray-200 rounded-lg">
                {/* Parent Group Header */}
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleParentExpansion(parentData.parent_id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-semibold text-gray-800">
                      {parentData.parent_name}
                    </div>
                    <Badge 
                      label={`${parentData.ledger_count} ledgers`}
                      className="bg-blue-100 text-blue-800 text-xs"
                    />
                  </div>
                  <div className="text-gray-500">
                    {expandedParents.has(parentData.parent_id) ? '▼' : '▶'}
                  </div>
                </div>

                {/* Ledgers List (Expandable) */}
                {expandedParents.has(parentData.parent_id) && (
                  <div className="border-t border-gray-200">
                    {parentData.ledgers.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto">
                        {parentData.ledgers.map((ledger) => (
                          <div key={ledger.id} className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{ledger.name}</div>
                                {ledger.alias !== "0" && (
                                  <div className="text-sm text-gray-500">Alias: {ledger.alias}</div>
                                )}
                                <div className="text-sm text-gray-600 mt-1">
                                  Master ID: {ledger.master_id} | Alter ID: {ledger.alter_id}
                                </div>
                                {ledger.company && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {ledger.company.trim()}
                                  </div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-medium text-gray-900">
                                  ₹{parseFloat(ledger.opening_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-xs text-gray-500">Opening Balance</div>
                                {ledger.gst_in !== "0" && (
                                  <Badge 
                                    label="GST"
                                    className="bg-yellow-100 text-yellow-800 text-xs mt-1"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No ledgers found in this group
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Icon icon="heroicons-outline:search" className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm 
                  ? `No parent groups found matching "${searchTerm}"` 
                  : 'No parent groups available'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default Ledgers
