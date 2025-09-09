import React, { useState } from "react";
import Card from "@/components/ui/Card";
import HomeBredCurbs from "./HomeBredCurbs";

const Dashboard = () => {
  const [filterMap, setFilterMap] = useState("usa");
  return (
    <div>
      <HomeBredCurbs title="Dashboard" />
    </div>
  );
};

export default Dashboard;
