import React from "react";
import { useSelector } from "react-redux";
import { useGetOrganizationModulesQuery } from "@/store/api/modules/modulesSlice";

const ModulesDebug = () => {
  const { selectedOrganization, user } = useSelector((state) => state.auth);
  
  const {
    data: modulesData,
    isLoading: modulesLoading,
    error: modulesError,
  } = useGetOrganizationModulesQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
  });

  if (!user) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold text-yellow-800">No User Logged In</h3>
        <p className="text-yellow-700">Please log in to see modules</p>
      </div>
    );
  }

  if (!selectedOrganization) {
    return (
      <div className="p-4 bg-orange-100 border border-orange-400 rounded">
        <h3 className="font-bold text-orange-800">No Organization Selected</h3>
        <p className="text-orange-700">Please select an organization</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-blue-100 border border-blue-400 rounded p-3">
        <h3 className="font-bold text-blue-800">Selected Organization</h3>
        <p className="text-blue-700">
          ID: {selectedOrganization.id} | Name: {selectedOrganization.name || 'N/A'}
        </p>
      </div>

      <div className="bg-gray-100 border border-gray-400 rounded p-3">
        <h3 className="font-bold text-gray-800">Modules API Status</h3>
        {modulesLoading && (
          <p className="text-gray-600">Loading modules...</p>
        )}
        {modulesError && (
          <p className="text-red-600">
            Error: {modulesError.message || JSON.stringify(modulesError)}
          </p>
        )}
        {modulesData && (
          <div>
            <p className="text-green-600">✓ Modules loaded successfully</p>
            <pre className="mt-2 text-xs bg-gray-200 p-2 rounded overflow-x-auto">
              {JSON.stringify(modulesData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModulesDebug;
