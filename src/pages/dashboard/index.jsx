import React, { useState } from "react";
import ZohoDashboard from "./ZohoDashboard";

const Dashboard = () => {
  const [filterMap, setFilterMap] = useState("usa");
  return (
    <div>
      {/* Zoho Dashboard */}
      <ZohoDashboard />
      
    </div>
  );
};

export default Dashboard;
