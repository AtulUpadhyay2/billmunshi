import React from "react";
import Card from "@/components/ui/Card";

const TallyVendorBill = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="card-title">Tally Vendor Bills</h4>
      </div>

      <Card title="Tally Vendor Bills Management">
        <div className="text-center py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Tally Vendor Bills
            </h3>
            <p className="text-blue-600">
              This section will contain Tally vendor bill management functionality.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TallyVendorBill;
