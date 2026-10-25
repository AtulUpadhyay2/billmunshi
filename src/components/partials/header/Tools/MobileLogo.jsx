import React from "react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

const MobileLogo = () => (
  <Link to="/" aria-label="Bill Munshi home">
    <BrandLogo variant="mark" />
  </Link>
);

export default MobileLogo;
