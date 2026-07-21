import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const updateTitle = () => {
      const path = location.pathname;
      let pageTitle = "Bill Munshi";

      // Handle dynamic routes with parameters first (checking for detail pages)
      if (path.includes("/zoho/vendor-bill/") && path.split("/").length === 4) {
        pageTitle = `Bill Munshi | Zoho Vendor Bill`;
        document.title = pageTitle;
        return;
      } else if (
        path.includes("/zoho/expense-bill/") &&
        path.split("/").length === 4
      ) {
        pageTitle = `Bill Munshi | Zoho Expense Bill`;
        document.title = pageTitle;
        return;
      } else if (
        path.includes("/zoho/journal-entry/") &&
        path.split("/").length === 4
      ) {
        pageTitle = `Bill Munshi | Zoho Journal Entry`;
        document.title = pageTitle;
        return;
      } else if (
        path.includes("/tally/vendor-bill/") &&
        path.split("/").length === 4
      ) {
        pageTitle = `Bill Munshi | Tally Purchase Voucher`;
        document.title = pageTitle;
        return;
      } else if (
        path.includes("/tally/expense-bill/") &&
        path.split("/").length === 4
      ) {
        pageTitle = `Bill Munshi | Tally Journal Entry`;
        document.title = pageTitle;
        return;
      } else if (
        path.includes("/tally/payment-voucher/") &&
        path.split("/").length === 4
      ) {
        pageTitle = `Bill Munshi | Tally Payment Voucher`;
        document.title = pageTitle;
        return;
      }

      // Route-based title mapping
      const routeTitles = {
        "/dashboard": "Dashboard",
        "/profile": "Profile",
        "/notifications": "Notifications",

        // Zoho routes
        "/zoho/vendor-bill": "Zoho Vendor Bills",
        "/zoho/expense-bill": "Zoho Expense Bills",
        "/zoho/journal-entry": "Zoho Journal Entries",
        "/zoho/config/credentials": "Zoho Credentials",
        "/zoho/chart-of-account": "Zoho Chart of Accounts",
        "/zoho/taxes": "Zoho Taxes",
        "/zoho/tds-tcs": "Zoho TDS/TCS",
        "/zoho/vendors": "Zoho Vendors",
        "/zoho/vendors-credits": "Zoho Vendor Credits",

        // Tally routes
        "/tally/vendor-bill": "Tally Purchase Vouchers",
        "/tally/expense-bill": "Tally Journal Entries",
        "/tally/payment-voucher": "Tally Payment Vouchers",
        "/tally/ledgers": "Tally Ledgers",
        "/tally/setup": "Tally Setup",
        "/tally/masters": "Tally Masters",
        "/tally/account-info": "Account Information",

        // Settings routes
        "/members": "Members",

        // Auth routes
        "/": "Login",
        "/register": "Register",
        "/forgot-password": "Forgot Password",
        "/no-organization": "No Organization",
        "/404": "Page Not Found",
      };

      // Check for exact matches first
      if (routeTitles[path]) {
        pageTitle = `Bill Munshi | ${routeTitles[path]}`;
      } else {
        // Default fallback for unknown routes
        const segments = path.split("/").filter(Boolean);
        if (segments.length > 0) {
          const lastSegment = segments[segments.length - 1];
          const formattedSegment = lastSegment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          pageTitle = `Bill Munshi | ${formattedSegment}`;
        }
      }

      document.title = pageTitle;
    };

    updateTitle();
  }, [location.pathname]);

  return location.pathname;
};

export default usePageTitle;
