import React, { useRef, useState } from "react";
import SimpleBar from "simplebar-react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import { menuItems } from "@/constants/data";
import { useGetOrganizationModulesQuery } from "@/store/api/modules/modulesSlice";
import { getFilteredMenuItems } from "@/utils/menuUtils";
import Navmenu from "./Navmenu";

const Sidebar = () => {
  const scrollableNodeRef = useRef();
  const [collapsed, setMenuCollapsed] = useSidebar();
  const [menuHover, setMenuHover] = useState(false);
  const [isSemiDark] = useSemiDark();

  const { selectedOrganization } = useSelector((state) => state.auth);

  const { data: modulesData, isLoading: modulesLoading, error: modulesError } =
    useGetOrganizationModulesQuery(selectedOrganization?.id, {
      skip: !selectedOrganization?.id,
    });

  const filteredMenuItems = getFilteredMenuItems(modulesData || []);
  const showError = modulesError && !modulesLoading;
  const isExpanded = !collapsed || menuHover;

  return (
    <div className={isSemiDark ? "dark" : ""}>
      <aside
        onMouseEnter={() => setMenuHover(true)}
        onMouseLeave={() => setMenuHover(false)}
        className={`sidebar-wrapper bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 ${
          collapsed ? "w-[72px] close_sidebar" : "w-65"
        } ${menuHover ? "sidebar-hovered" : ""}`}
        style={{ width: isExpanded ? 260 : 72 }}
      >
        {/* Logo / brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
            <div className="shrink-0 w-9 h-9 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-700/20 group-hover:shadow-md transition-all">
              <Icon icon="heroicons:document-text" className="text-lg text-white" />
            </div>
            {isExpanded && (
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Bill Munshi
              </span>
            )}
          </Link>

          {isExpanded && (
            <button
              type="button"
              onClick={() => setMenuCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Icon
                icon={collapsed ? "heroicons:bars-3-bottom-right" : "heroicons:bars-3-bottom-left"}
                className="text-base"
              />
            </button>
          )}
        </div>

        {/* Menu */}
        <SimpleBar
          className="px-2.5 py-3 h-[calc(100%-4rem)]"
          scrollableNodeProps={{ ref: scrollableNodeRef }}
        >
          {modulesLoading ? (
            <div className="space-y-2 py-3">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse"
                />
              ))}
            </div>
          ) : showError ? (
            <div>
              <div className="mx-1 mb-3 px-3 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 text-rose-700 dark:text-rose-400">
                <div className="flex items-start gap-2">
                  <Icon icon="heroicons:exclamation-circle" className="text-base shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <div className="font-semibold">Failed to load modules</div>
                    <div className="text-rose-600/70 dark:text-rose-400/70">Showing default menu</div>
                  </div>
                </div>
              </div>
              <Navmenu menus={menuItems} collapsed={!isExpanded} />
            </div>
          ) : (
            <Navmenu menus={filteredMenuItems} collapsed={!isExpanded} />
          )}
        </SimpleBar>
      </aside>
    </div>
  );
};

export default Sidebar;
