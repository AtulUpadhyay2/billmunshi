import React from "react";
import { Link } from "react-router-dom";
import useFooterType from "@/hooks/useFooterType";

const Footer = ({ className = "custom-class" }) => {
  const date = new Date();
  const [footerType] = useFooterType();
  const footerclassName = () => {
    switch (footerType) {
      case "sticky":
        return "sticky bottom-0 z-999";
      case "static":
        return "static";
      case "hidden":
        return "hidden";
    }
  };
  return (
    <footer className={className + " " + footerclassName()}>
      {/* The footer is a permanent row of the app shell now, so it stays as
          thin as it can while remaining legible — every pixel here is a pixel
          the table body doesn't get. */}
      <div className="site-footer px-3.5 md:px-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 py-2">
        <div className="grid md:grid-cols-2 grid-cols-1 md:gap-5">
          <div className="text-center md:ltr:text-start md:rtl:text-right text-[11px]">
            COPYRIGHT &copy; {date.getFullYear()} Bill Munshi, All rights Reserved
          </div>
          <div className="ltr:md:text-right rtl:md:text-end text-center text-[11px]">
            <Link to="/privacy-policy" className="hover:text-slate-900 dark:hover:text-white mr-4">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-900 dark:hover:text-white">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
