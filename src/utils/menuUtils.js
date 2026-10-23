import { menuItems } from "@/constants/data";

/**
 * Filters child menu items based on enabled modules
 * @param {Array} children - Array of child menu items
 * @param {Array} enabledModuleNames - Array of enabled module names
 * @returns {Array} Filtered child menu items
 */
export const getFilteredChildItems = (
  children = [],
  enabledModuleNames = [],
) => {
  return children.filter((child) => {
    // Filter out Zoho children if Zoho is not enabled
    if (child.childlink && child.childlink.startsWith("/zoho/")) {
      return enabledModuleNames.includes("zoho");
    }

    // Filter out Tally children if Tally is not enabled
    if (child.childlink && child.childlink.startsWith("/tally/")) {
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
/**
 * Build the sidebar for this workspace.
 *
 * ``isAdmin`` gates the entries that are internal instruments rather
 * than product features. Accuracy is one: it reports how often our own
 * extractor was wrong, which is useful to the team and misleading to
 * anyone else. Defaults to true so a caller that has not loaded
 * permissions yet does not flicker the entry away from an admin.
 */
export const getFilteredMenuItems = (enabledModules = [], isAdmin = true) => {
  // Extract enabled module names
  const enabledModuleNames = enabledModules
    .filter((module) => module.is_enabled)
    .map((module) => module.module.toLowerCase());

  return menuItems
    .filter((item) => {
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

      // Handle any item with direct Zoho link - only show if Zoho is enabled
      if (item.link && item.link.startsWith("/zoho/")) {
        return enabledModuleNames.includes("zoho");
      }

      // Handle Zoho Journal Entry specifically
      if (
        item.title === "Journal Entry" &&
        item.link === "/zoho/journal-entry"
      ) {
        return enabledModuleNames.includes("zoho");
      }

      // Handle Zoho Expense Bill with children (Journal Entry, Expense)
      if (
        item.title === "Expense Bill" &&
        item.child &&
        item.child.some(
          (child) => child.childlink && child.childlink.startsWith("/zoho/"),
        )
      ) {
        return enabledModuleNames.includes("zoho");
      }

      // Handle Zoho Config with children (Credentials, Chart of account, etc.)
      if (
        item.title === "Config" &&
        item.child &&
        item.child.some(
          (child) => child.childlink && child.childlink.startsWith("/zoho/"),
        )
      ) {
        return enabledModuleNames.includes("zoho");
      }

      // Handle Tally section header - only show if Tally is enabled
      if (item.isHeadr && item.title === "Tally") {
        return enabledModuleNames.includes("tally");
      }

      // Handle the Tally "Purchase" group (Purchase Voucher, Payment Voucher)
      if (
        item.title === "Purchase" &&
        item.child &&
        item.child.some(
          (child) => child.childlink && child.childlink.startsWith("/tally/"),
        )
      ) {
        return enabledModuleNames.includes("tally");
      }

      // Handle Tally Journal Entry (which has link tally/expense-bill)
      if (
        item.title === "Journal Entry" &&
        item.link === "/tally/expense-bill"
      ) {
        return enabledModuleNames.includes("tally");
      }

      // Handle the Tally Sales group (Sales Voucher, Receipt Voucher)
      if (item.title === "Sales" && item.child) {
        return enabledModuleNames.includes("tally");
      }

      // Handle Tally Approvals (bills waiting on a Manager's decision)
      if (item.title === "Approvals" && item.link === "/tally/approvals") {
        return enabledModuleNames.includes("tally");
      }

      // Handle Tally Activity (organisation-wide bill activity log)
      if (item.title === "Activity" && item.link === "/tally/activity") {
        return enabledModuleNames.includes("tally");
      }

      // Accuracy is admin-only and covers every module, not just Tally.
      if (item.title === "Accuracy" && item.link === "/tally/accuracy") {
        return isAdmin;
      }

      // Handle Tally Trash (recoverable deletes for every Tally bill type)
      if (item.title === "Trash" && item.link === "/tally/trash") {
        return enabledModuleNames.includes("tally");
      }

      // Handle Tally Config with children (Account Info, Config, Ledgers, Masters)
      if (
        item.title === "Config" &&
        item.child &&
        item.child.some(
          (child) => child.childlink && child.childlink.startsWith("/tally/"),
        )
      ) {
        return enabledModuleNames.includes("tally");
      }

      // Handle Tally Settings with children (Account Info, Config, Ledgers, Masters)
      if (
        item.title === "Settings" &&
        item.child &&
        item.child.some(
          (child) => child.childlink && child.childlink.startsWith("/tally/"),
        )
      ) {
        return enabledModuleNames.includes("tally");
      }

      // Handle Settings section header - always show
      if (item.isHeadr && item.title === "Settings") {
        return true;
      }

      // Handle individual Settings items (Members, Clients, Subscriptions)
      if (
        item.title === "Members" ||
        item.title === "Clients" ||
        item.title === "Subscriptions"
      ) {
        return true;
      }

      // Default: show items that don't match any specific module filtering
      return true;
    })
    .map((item) => {
      // Filter children if the item has children
      if (item.child) {
        return {
          ...item,
          child: getFilteredChildItems(item.child, enabledModuleNames),
        };
      }
      return item;
    });
};

/**
 * Hook to get filtered menu items based on current organization's enabled modules
 */
export const useFilteredMenuItems = (enabledModules, isAdmin = true) => {
  return getFilteredMenuItems(enabledModules, isAdmin);
};
