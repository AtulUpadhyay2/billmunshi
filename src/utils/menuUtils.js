import { menuItems } from "@/constant/data";

/**
 * Filters child menu items based on enabled modules
 * @param {Array} children - Array of child menu items
 * @param {Array} enabledModuleNames - Array of enabled module names
 * @returns {Array} Filtered child menu items
 */
export const getFilteredChildItems = (children = [], enabledModuleNames = []) => {
  return children.filter(child => {
    // Filter out Zoho children if Zoho is not enabled
    if (child.childlink && child.childlink.startsWith("zoho/")) {
      return enabledModuleNames.includes("zoho");
    }
    
    // Filter out Tally children if Tally is not enabled
    if (child.childlink && child.childlink.startsWith("tally/")) {
      return enabledModuleNames.includes("tally");
    }
    
    // Filter out api-keys if Tally is not enabled
    if (child.childlink === "api-keys") {
      return enabledModuleNames.includes("tally");
    }
    
    // Default: show other children
    return true;
  });
};

/**
 * Filters menu items based on enabled modules
 * @param {Array} enabledModules - Array of module objects from API
 * @returns {Array} Filtered menu items
 */
export const getFilteredMenuItems = (enabledModules = []) => {
  // Extract enabled module names
  const enabledModuleNames = enabledModules
    .filter(module => module.is_enabled)
    .map(module => module.module.toLowerCase());

  console.log('Enabled modules:', enabledModuleNames);

  return menuItems.filter(item => {
    // Always show main menu header
    if (item.isHeadr && item.title === "menu") {
      return true;
    }
    
    // Always show Dashboard
    if (item.title === "Dashboard") {
      return true;
    }

    // Handle Zoho section header - only show if Zoho is enabled
    if (item.isHeadr && item.title === "Zoho") {
      return enabledModuleNames.includes("zoho");
    }
    
    // Handle Zoho Vendor Bill
    if (item.title === "Vendor Bill" && item.link === "zoho/vendor-bill") {
      return enabledModuleNames.includes("zoho");
    }

    // Handle Zoho Expense Bill with children (Journal Entry, Expense)
    if (item.title === "Expense Bill" && item.child && 
        item.child.some(child => child.childlink && child.childlink.startsWith("zoho/"))) {
      return enabledModuleNames.includes("zoho");
    }

    // Handle Zoho Config with children (Credentials, Chart of account, etc.)
    if (item.title === "Config" && item.child && 
        item.child.some(child => child.childlink && child.childlink.startsWith("zoho/"))) {
      return enabledModuleNames.includes("zoho");
    }

    // Handle Tally section header - only show if Tally is enabled
    if (item.isHeadr && item.title === "Tally") {
      return enabledModuleNames.includes("tally");
    }
    
    // Handle Tally Vendor Bill
    if (item.title === "Vendor Bill" && item.link === "tally/vendor-bill") {
      return enabledModuleNames.includes("tally");
    }

    // Handle Tally Expense Bill
    if (item.title === "Expense Bill" && item.link === "tally/expense-bill") {
      return enabledModuleNames.includes("tally");
    }

    // Handle Tally Settings with children (Api Key, Config, Ledgers, Masters)
    if (item.title === "Settings" && item.child && 
        item.child.some(child => 
          child.childlink === "api-keys" || 
          (child.childlink && child.childlink.startsWith("tally/"))
        )) {
      return enabledModuleNames.includes("tally");
    }

    // Handle Settings section header - always show
    if (item.isHeadr && item.title === "Settings") {
      return true;
    }

    // Handle individual Settings items (Members, Subscriptions)
    if (item.title === "Members" || item.title === "Subscriptions") {
      return true;
    }

    // Default: show items that don't match any specific module filtering
    return true;
  }).map(item => {
    // Filter children if the item has children
    if (item.child) {
      return {
        ...item,
        child: getFilteredChildItems(item.child, enabledModuleNames)
      };
    }
    return item;
  });
};

/**
 * Hook to get filtered menu items based on current organization's enabled modules
 */
export const useFilteredMenuItems = (enabledModules) => {
  return getFilteredMenuItems(enabledModules);
};
