import React from "react";
import Card from "@/components/ui/Card";

const Members = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="card-title">Organization Members</h4>
      </div>

      <Card title="Members Management">
        <div className="text-center py-8">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">
              Organization Members
            </h3>
            <p className="text-indigo-600">
              Manage your organization members and their roles here.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Members;
