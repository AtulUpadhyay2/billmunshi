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

  console.log('Enabled modules:', enabledModuleNames);

  return menuItems.filter(item => {
    // Always show Dashboard and Settings sections headers
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

    // Handle Zoho section header
    if (item.isHeadr && item.title === "Zoho") {
      return enabledModuleNames.includes("zoho");
    }
    
    // Handle Zoho module items
    if (item.link && item.link.startsWith("zoho/")) {
      return enabledModuleNames.includes("zoho");
    }

    // Handle Zoho Config items with child links
    if (item.title === "Config" && item.child && 
        item.child.some(child => child.childlink && child.childlink.startsWith("zoho/"))) {
      return enabledModuleNames.includes("zoho");
    }

    // Handle Tally section header
    if (item.isHeadr && item.title === "Tally") {
      return enabledModuleNames.includes("tally");
    }
    
    // Handle Tally module items (those not starting with zoho/)
    if (item.link && (item.link === "vendor-bill" || item.link === "expense-bill")) {
      return enabledModuleNames.includes("tally");
    }

    // Handle Tally Config items (if any in the future)
    if (item.title === "Config" && item.child && 
        item.child.some(child => 
          child.childlink === "credentials" && !child.childlink.startsWith("zoho/")
        )) {
      return enabledModuleNames.includes("tally");
    }

    // Default: show items that don't belong to any specific module
    return true;
  });
};

/**
 * Hook to get filtered menu items based on current organization's enabled modules
 */
export const useFilteredMenuItems = (enabledModules) => {
  return getFilteredMenuItems(enabledModules);
};
