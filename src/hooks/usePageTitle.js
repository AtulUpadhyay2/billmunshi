import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const updateTitle = () => {
      const path = location.pathname;
      let pageTitle = 'Bill Munshi';

      // Route-based title mapping
      const routeTitles = {
        '/dashboard': 'Dashboard',
        '/profile': 'Profile',
        '/notifications': 'Notifications',
        
        // Zoho routes
        '/zoho/vendor-bill': 'Zoho Vendor Bills',
        '/zoho/expense-bill': 'Zoho Expense Bills',
        '/zoho/credentials': 'Zoho Credentials',
        '/zoho/chart-of-account': 'Zoho Chart of Accounts',
        '/zoho/taxes': 'Zoho Taxes',
        '/zoho/tds-tcs': 'Zoho TDS/TCS',
        '/zoho/vendors': 'Zoho Vendors',
        '/zoho/vendors-credits': 'Zoho Vendor Credits',
        
        // Tally routes
        '/tally/vendor-bill': 'Tally Vendor Bills',
        '/tally/expense-bill': 'Tally Expense Bills',
        '/tally/ledgers': 'Tally Ledgers',
        '/tally/setup': 'Tally Setup',
        '/tally/masters': 'Tally Masters',
        '/tally/help': 'Tally Help',
        
        // Settings routes
        '/api-keys': 'API Keys',
        '/members': 'Members',
        
        // Auth routes
        '/': 'Login',
        '/register': 'Register',
        '/forgot-password': 'Forgot Password',
        '/no-organization': 'No Organization',
        '/404': 'Page Not Found'
      };

      // Check for exact matches first
      if (routeTitles[path]) {
        pageTitle = `Bill Munshi | ${routeTitles[path]}`;
      } else {
        // Handle dynamic routes with parameters
        if (path.match(/^\/zoho\/vendor-bill\/[\w-]+$/)) {
          const billId = path.split('/').pop();
          pageTitle = `Bill Munshi | Zoho Vendor Bill ${billId}`;
        } else if (path.match(/^\/zoho\/expense-bill\/[\w-]+$/)) {
          const billId = path.split('/').pop();
          pageTitle = `Bill Munshi | Zoho Expense Bill ${billId}`;
        } else if (path.match(/^\/tally\/vendor-bill\/[\w-]+$/)) {
          const billId = path.split('/').pop();
          pageTitle = `Bill Munshi | Tally Vendor Bill ${billId}`;
        } else if (path.match(/^\/tally\/expense-bill\/[\w-]+$/)) {
          const billId = path.split('/').pop();
          pageTitle = `Bill Munshi | Tally Expense Bill ${billId}`;
        } else {
          // Default fallback for unknown routes
          const segments = path.split('/').filter(Boolean);
          if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            const formattedSegment = lastSegment
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            pageTitle = `Bill Munshi | ${formattedSegment}`;
          }
        }
      }

      document.title = pageTitle;
    };

    updateTitle();
  }, [location.pathname]);

  return location.pathname;
};

export default usePageTitle;