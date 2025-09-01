import React from "react";
import Card from "@/components/ui/Card";
import ModulesDebug from "@/components/ModulesDebug";
import { useSelector } from "react-redux";
import { useGetOrganizationModulesQuery } from "@/store/api/modules/modulesSlice";
import { getFilteredMenuItems } from "@/utils/menuUtils";
import { menuItems } from "@/constant/data";

const ModulesTestPage = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  
  const {
    data: modulesData,
    isLoading: modulesLoading,
    error: modulesError,
  } = useGetOrganizationModulesQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
  });

  const filteredMenuItems = getFilteredMenuItems(modulesData || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="card-title">Modules Test & Debug</h4>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debug Component */}
        <Card title="Modules Debug Info">
          <ModulesDebug />
        </Card>

        {/* Menu Comparison */}
        <Card title="Menu Items Comparison">
          <div className="space-y-4">
            <div>
              <h5 className="font-semibold text-sm mb-2 text-slate-600">
                Original Menu Items ({menuItems.length})
              </h5>
              <div className="bg-slate-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
                {menuItems.map((item, index) => (
                  <div key={index} className={`${item.isHeadr ? 'font-bold text-blue-600' : 'ml-2'}`}>
                    {item.isHeadr ? `[HEADER] ${item.title}` : item.title}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-sm mb-2 text-slate-600">
                Filtered Menu Items ({filteredMenuItems.length})
              </h5>
              <div className="bg-green-100 p-2 rounded text-xs max-h-40 overflow-y-auto">
                {filteredMenuItems.map((item, index) => (
                  <div key={index} className={`${item.isHeadr ? 'font-bold text-green-600' : 'ml-2'}`}>
                    {item.isHeadr ? `[HEADER] ${item.title}` : item.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Enabled Modules Summary">
        {modulesLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading modules...</p>
          </div>
        )}

        {modulesError && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h6 className="font-semibold text-red-800">Error Loading Modules</h6>
            <p className="text-red-600 text-sm mt-1">
              {modulesError.message || JSON.stringify(modulesError)}
            </p>
          </div>
        )}

        {modulesData && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {modulesData.map((module) => (
                <div
                  key={module.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    module.is_enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {module.module.toUpperCase()}
                  <span className="ml-1">
                    {module.is_enabled ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600">
              <p>
                <strong>Organization:</strong> {modulesData[0]?.organization?.name} 
                (ID: {modulesData[0]?.organization?.id})
              </p>
              <p>
                <strong>Total Modules:</strong> {modulesData.length}
              </p>
              <p>
                <strong>Enabled Modules:</strong> {modulesData.filter(m => m.is_enabled).length}
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModulesTestPage;
