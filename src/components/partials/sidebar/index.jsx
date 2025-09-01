import React, { useRef, useEffect, useState } from "react";
import SidebarLogo from "./Logo";
import Navmenu from "./Navmenu";
import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import svgRabitImage from "@/assets/images/svg/rabit.svg";
import { useSelector } from "react-redux";
import { useGetOrganizationModulesQuery } from "@/store/api/modules/modulesSlice";
import { getFilteredMenuItems } from "@/utils/menuUtils";

const Sidebar = () => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableNodeRef.current.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    scrollableNodeRef.current.addEventListener("scroll", handleScroll);
  }, [scrollableNodeRef]);

  const [collapsed, setMenuCollapsed] = useSidebar();
  const [menuHover, setMenuHover] = useState(false);

  // semi dark option
  const [isSemiDark] = useSemiDark();
  // skin
  const [skin] = useSkin();

  // Get selected organization from auth state
  const { selectedOrganization } = useSelector((state) => state.auth);
  
  // Fetch modules for the selected organization
  const {
    data: modulesData,
    isLoading: modulesLoading,
    error: modulesError,
  } = useGetOrganizationModulesQuery(selectedOrganization?.id, {
    skip: !selectedOrganization?.id,
  });

  // Get filtered menu items based on enabled modules
  const filteredMenuItems = getFilteredMenuItems(modulesData || []);

  // Show error state if modules failed to load
  const showError = modulesError && !modulesLoading;

  return (
    <div className={isSemiDark ? "dark" : ""}>
      <div
        className={`sidebar-wrapper bg-white dark:bg-slate-800     ${
          collapsed ? "w-[72px] close_sidebar" : "w-[248px]"
        }
      ${menuHover ? "sidebar-hovered" : ""}
      ${
        skin === "bordered"
          ? "border-r border-slate-200 dark:border-slate-700"
          : "shadow-base"
      }
      `}
        onMouseEnter={() => {
          setMenuHover(true);
        }}
        onMouseLeave={() => {
          setMenuHover(false);
        }}
      >
        <SidebarLogo menuHover={menuHover} />
        <div
          className={`h-[60px]  absolute top-[80px] nav-shadow z-1 w-full transition-all duration-200 pointer-events-none ${
            scroll ? " opacity-100" : " opacity-0"
          }`}
        ></div>

        <SimpleBar
          className="sidebar-menu px-4 h-[calc(100%-80px)]"
          scrollableNodeProps={{ ref: scrollableNodeRef }}
        >
          {modulesLoading ? (
            <div className="py-6">
              <div className="animate-pulse space-y-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto" />
                ))}
              </div>
            </div>
          ) : showError ? (
            <div className="py-6 px-2">
              <div className="text-center text-red-500 text-sm">
                <p>Failed to load modules</p>
                <p className="text-xs mt-1">Using default menu</p>
              </div>
              <Navmenu menus={menuItems} />
            </div>
          ) : (
            <Navmenu menus={filteredMenuItems} />
          )}
          {/* {!collapsed && (
            <div className="bg-slate-900 mb-16 mt-24 p-4 relative text-center rounded-2xl text-white">
              <img
                src={svgRabitImage}
                alt=""
                className="mx-auto relative -mt-[73px]"
              />
              <div className="max-w-[160px] mx-auto mt-6">
                <div className="widget-title">Unlimited Access</div>
                <div className="text-xs font-light">
                  Upgrade your system to business plan
                </div>
              </div>
              <div className="mt-6">
                <button className="btn bg-white hover:bg-opacity-80 text-slate-900 btn-sm w-full block">
                  Upgrade
                </button>
              </div>
            </div>
          )} */}
        </SimpleBar>
      </div>
    </div>
  );
};

export default Sidebar;
