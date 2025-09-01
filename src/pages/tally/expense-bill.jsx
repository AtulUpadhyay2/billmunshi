import React from "react";
import Card from "@/components/ui/Card";

const TallyExpenseBill = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="card-title">Tally Expense Bills</h4>
      </div>

      <Card title="Tally Expense Bills Management">
        <div className="text-center py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Tally Expense Bills
            </h3>
            <p className="text-green-600">
              This section will contain Tally expense bill management functionality.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TallyExpenseBill;
