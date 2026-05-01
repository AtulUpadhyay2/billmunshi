import React from "react";
import { Icon } from "@iconify/react";
import SwitchDark from "./Tools/SwitchDark";
import HorizontalMenu from "./Tools/HorizontalMenu";
import useWidth from "@/hooks/useWidth";
import useSidebar from "@/hooks/useSidebar";
import useNavbarType from "@/hooks/useNavbarType";
import useMenulayout from "@/hooks/useMenulayout";
import Logo from "./Tools/Logo";
import Profile from "./Tools/Profile";
import OrgSwitcher from "./Tools/OrgSwitcher";
import useRtl from "@/hooks/useRtl";
import useMobileMenu from "@/hooks/useMobileMenu";

const Header = ({ className = "custom-class" }) => {
  const [collapsed, setMenuCollapsed] = useSidebar();
  const { width, breakpoints } = useWidth();
  const [navbarType] = useNavbarType();
  const [menuType] = useMenulayout();
  const [isRtl] = useRtl();
  const [mobileMenu, setMobileMenu] = useMobileMenu();

  const navbarTypeClass = () => {
    switch (navbarType) {
      case "floating":
        return "floating has-sticky-header";
      case "sticky":
        return "sticky top-0 z-999";
      case "static":
        return "static";
      case "hidden":
        return "hidden";
      default:
        return "sticky top-0 z-999";
    }
  };

  return (
    <header className={`${className} ${navbarTypeClass()}`}>
      <div className="bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left zone */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {menuType === "vertical" && (
              <>
                {/* Desktop collapse toggle */}
                {width >= breakpoints.xl && (
                  <button
                    type="button"
                    onClick={() => setMenuCollapsed(!collapsed)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Icon
                      icon={
                        collapsed
                          ? isRtl
                            ? "heroicons:bars-3-bottom-right"
                            : "heroicons:bars-3-bottom-left"
                          : isRtl
                            ? "heroicons:bars-3-bottom-left"
                            : "heroicons:bars-3-bottom-right"
                      }
                      className="text-xl"
                    />
                  </button>
                )}
                {/* Mobile compact logo */}
                {width < breakpoints.xl && <Logo />}
                {/* Mobile menu trigger (md only) */}
                {width < breakpoints.xl && width >= breakpoints.md && (
                  <button
                    type="button"
                    onClick={() => setMobileMenu(!mobileMenu)}
                    aria-label="Toggle menu"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Icon icon="heroicons:bars-3" className="text-xl" />
                  </button>
                )}
              </>
            )}

            {menuType === "horizontal" && (
              <>
                <Logo />
                {width <= breakpoints.xl && (
                  <button
                    type="button"
                    onClick={() => setMobileMenu(!mobileMenu)}
                    aria-label="Toggle menu"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Icon icon="heroicons:bars-3" className="text-xl" />
                  </button>
                )}
              </>
            )}

          </div>

          {/* Horizontal menu (only when menuType=horizontal) */}
          {menuType === "horizontal" && width >= breakpoints.xl ? <HorizontalMenu /> : null}

          {/* Right zone */}
          <div className="flex items-center gap-2 md:gap-3">
            {width >= breakpoints.md && (
              <div className="flex items-center">
                <OrgSwitcher />
              </div>
            )}
            <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-800" />
            <SwitchDark />
            {width >= breakpoints.md && <Profile />}
            {width <= breakpoints.md && (
              <button
                type="button"
                onClick={() => setMobileMenu(!mobileMenu)}
                aria-label="Toggle menu"
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <Icon icon="heroicons:bars-3" className="text-xl" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
