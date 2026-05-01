import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Collapse } from "react-collapse";
import { Icon } from "@iconify/react";
import useMobileMenu from "@/hooks/useMobileMenu";

const Navmenu = ({ menus, collapsed = false }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const location = useLocation();
  const locationName = location.pathname;
  const [mobileMenu, setMobileMenu] = useMobileMenu();

  const isLocationMatch = (target) =>
    target && (locationName === target || locationName.startsWith(`${target}/`));

  useEffect(() => {
    let openIdx = null;
    menus.forEach((item, i) => {
      if (item.child) {
        item.child.forEach((c) => {
          if (isLocationMatch(c.childlink)) openIdx = i;
        });
      }
      if (isLocationMatch(item.link)) openIdx = i;
    });
    setActiveSubmenu(openIdx);
    if (mobileMenu) setMobileMenu(false);
  }, [location]);

  const toggleSubmenu = (i) => setActiveSubmenu(activeSubmenu === i ? null : i);

  return (
    <ul className="space-y-0.5">
      {menus.map((item, i) => {
        if (item.isHeadr && !item.child) {
          return collapsed ? (
            <li key={i} className="pt-3 pb-1.5">
              <div className="mx-2 h-px bg-slate-200 dark:bg-slate-800" />
            </li>
          ) : (
            <li key={i} className="px-3 pt-4 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {item.title}
              </span>
            </li>
          );
        }

        const hasChild = !!item.child;
        const isActive = isLocationMatch(item.link);
        const isParentActive = hasChild && item.child.some((c) => isLocationMatch(c.childlink));

        if (!hasChild) {
          return (
            <li key={i} className="relative group">
              <NavLink
                to={item.link}
                className={({ isActive: navActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    navActive || isActive
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                <Icon icon={item.icon} className="text-lg shrink-0" />
                {!collapsed && (
                  <span className="flex-1 truncate">{item.title}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {item.title}
                </span>
              )}
            </li>
          );
        }

        // Item with children
        const open = activeSubmenu === i;
        return (
          <li key={i} className="relative group">
            <button
              type="button"
              onClick={() => toggleSubmenu(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                isParentActive
                  ? "bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon icon={item.icon} className="text-lg shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.title}</span>
                  <Icon
                    icon="heroicons:chevron-right"
                    className={`text-sm text-slate-400 transition-transform duration-200 ${
                      open ? "rotate-90" : ""
                    }`}
                  />
                </>
              )}
            </button>

            {/* Submenu */}
            {!collapsed && (
              <Collapse isOpened={open}>
                <ul className="mt-1 mb-1 ml-4 pl-3 border-l border-slate-200 dark:border-slate-800 space-y-0.5">
                  {item.child.map((sub, j) => (
                    <li key={j}>
                      <NavLink
                        to={sub.childlink}
                        className={({ isActive: navActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                            navActive
                              ? "text-blue-700 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/30"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`
                        }
                      >
                        {({ isActive: navActive }) => (
                          <>
                            <span
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                navActive
                                  ? "bg-blue-600 dark:bg-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/40"
                                  : "bg-slate-300 dark:bg-slate-700"
                              }`}
                            />
                            <span className="flex-1 truncate">{sub.childtitle}</span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </Collapse>
            )}

            {/* Hover-popout submenu when collapsed */}
            {collapsed && (
              <div className="pointer-events-none absolute left-full ml-2 top-0 min-w-55 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  {item.title}
                </div>
                <ul className="space-y-0.5">
                  {item.child.map((sub, j) => (
                    <li key={j}>
                      <NavLink
                        to={sub.childlink}
                        className={({ isActive: navActive }) =>
                          `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                            navActive
                              ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`
                        }
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="truncate">{sub.childtitle}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default Navmenu;
