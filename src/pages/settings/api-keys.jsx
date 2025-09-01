import React from "react";
import Card from "@/components/ui/Card";

const ApiKeys = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="card-title">API Keys Management</h4>
      </div>

      <Card title="API Keys">
        <div className="text-center py-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">
              API Keys Management
            </h3>
            <p className="text-purple-600">
              Manage your API keys and integrations here.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiKeys;
