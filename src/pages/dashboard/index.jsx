import React, { useState } from "react";
import Card from "@/components/ui/Card";
import HomeBredCurbs from "./HomeBredCurbs";

const Dashboard = () => {
  const [filterMap, setFilterMap] = useState("usa");
  return (
    <div>
      <HomeBredCurbs title="Dashboard" />

      {/* Welcome Message */}
      <div className="mb-6">
        <Card>
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome to BillMunshi! 🎉
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Your all-in-one bill management solution
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Manage your expenses, vendor bills, and track your financial data with ease.
            </p>
          </div>
        </Card>
      </div>
      
    </div>
  );
};

export default Dashboard;
