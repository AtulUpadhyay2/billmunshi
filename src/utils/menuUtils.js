import { menuItems } from "@/constant/data";

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

  return menuItems.filter(item => {
    // Always show Dashboard and Settings sections
    if (item.isHeadr && (item.title === "menu" || item.title === "Settings")) {
      return true;
    }
    
    // Always show individual items in Settings section
    if (item.title === "Api Keys" || 
        item.title === "Members" || 
        item.title === "Profile" || 
        item.title === "Subscriptions") {
      return true;
    }
    
    // Always show Dashboard
    if (item.title === "Dashboard") {
      return true;
    }

    // Handle Zoho section
    if (item.isHeadr && item.title === "Zoho") {
      return enabledModuleNames.includes("zoho");
    }
    
    // Handle Zoho module items
    if (item.link && (
        item.link.startsWith("zoho/") || 
        (item.child && item.child.some(child => 
          child.childlink === "credentials" || 
          child.childlink === "chart-of-account" ||
          child.childlink === "taxes" ||
          child.childlink === "tds-tcs" ||
          child.childlink === "vendors" ||
          child.childlink === "vendors-credits"
        ))
      )) {
      return enabledModuleNames.includes("zoho");
    }

    // Handle Tally section
    if (item.isHeadr && item.title === "Tally") {
      return enabledModuleNames.includes("tally");
    }
    
    // Handle Tally module items
    if (item.link && (
        item.link === "vendor-bill" || 
        item.link === "expense-bill" ||
        (item.child && item.child.some(child => child.childlink === "credentials"))
      )) {
      // Check if this is a Tally-specific item (not in zoho/ path)
      if (!item.link.startsWith("zoho/")) {
        return enabledModuleNames.includes("tally");
      }
    }

    return true;
  });
};

/**
 * Hook to get filtered menu items based on current organization's enabled modules
 */
export const useFilteredMenuItems = (enabledModules) => {
  return getFilteredMenuItems(enabledModules);
};
