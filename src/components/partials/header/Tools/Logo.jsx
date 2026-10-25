import React from "react";
import { Link } from "react-router-dom";
import useWidth from "@/hooks/useWidth";
import BrandLogo from "@/components/BrandLogo";

const Logo = () => {
  const { width, breakpoints } = useWidth();

  return (
    <div>
      <Link to="/dashboard" aria-label="Bill Munshi home">
        <BrandLogo variant={width >= breakpoints.xl ? "full" : "mark"} />
      </Link>
    </div>
  );
};

export default Logo;
