import React, { Suspense, useRef } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/partials/header";
import Sidebar from "@/components/partials/sidebar";
import useWidth from "@/hooks/useWidth";
import useSidebar from "@/hooks/useSidebar";
import useContentWidth from "@/hooks/useContentWidth";
import useMenulayout from "@/hooks/useMenulayout";
import useMenuHidden from "@/hooks/useMenuHidden";
import useProfileRefresh from "@/hooks/useProfileRefresh";
import usePageTitle from "@/hooks/usePageTitle";
import useNoIndex from "@/hooks/useNoIndex";
import Footer from "@/components/partials/footer";
import SupportWidget from "@/components/support/SupportWidget";
import MobileMenu from "../components/partials/sidebar/MobileMenu";
import useMobileMenu from "@/hooks/useMobileMenu";
import MobileFooter from "@/components/partials/footer/MobileFooter";
import Loading from "@/components/Loading";
import { motion } from "framer-motion";

// NOTE: auth gating lives in <RequireAuth> in App.jsx so that the redirect
// happens *before* this layout (and its children) ever mount. Doing it here
// in a useEffect caused the post-login screen flash.
const Layout = () => {
  const { width, breakpoints } = useWidth();
  const [collapsed] = useSidebar();

  // Auto-refresh user profile data every 5 minutes
  useProfileRefresh(5);

  // Update page title based on current route
  usePageTitle();
  // The signed-in application is private — keep it out of search results.
  useNoIndex();

  const switchHeaderClass = () => {
    if (menuType === "horizontal" || menuHidden) {
      return "ltr:ml-0 rtl:mr-0";
    } else if (collapsed) {
      return "ltr:ml-[72px] rtl:mr-[72px]";
    } else {
      return "ltr:ml-[260px] rtl:mr-[260px]";
    }
  };
  // content width
  const [contentWidth] = useContentWidth();
  const [menuType] = useMenulayout();
  const [menuHidden] = useMenuHidden();
  // mobile menu
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const nodeRef = useRef(null);

  return (
    <>
      {/* `>=` matches the header's own `width >= breakpoints.xl` check. With
          `>` here, a viewport of exactly 1280px rendered the collapse toggle
          but no sidebar — and no mobile trigger either, so the menu was
          unreachable at that exact width. */}
      <Header className={width >= breakpoints.xl ? switchHeaderClass() : ""} />
      {menuType === "vertical" && width >= breakpoints.xl && !menuHidden && (
        <Sidebar />
      )}

      <MobileMenu
        className={`${
          width < breakpoints.xl && mobileMenu
            ? "left-0 visible opacity-100  z-9999"
            : "-left-75 invisible opacity-0  z-[-999] "
        }`}
      />
      {/* mobile menu overlay*/}
      {width < breakpoints.xl && mobileMenu && (
        <div
          className="overlay bg-slate-900/50 backdrop-filter backdrop-blur-xs opacity-100 fixed inset-0 z-999"
          onClick={() => setMobileMenu(false)}
        ></div>
      )}
      {/* `min-h-screen` used to make total layout = 100vh + footer height,
          which forced a page-level scroll on every route. Cap at viewport
          height and let inner pages scroll themselves. Pages that need
          natural page-scroll should set their own root to `min-h-full`. */}
      <div
        className={`content-wrapper transition-all duration-150 bg-slate-50 dark:bg-slate-950 min-h-screen overflow-x-hidden ${
          width >= breakpoints.xl ? switchHeaderClass() : ""
        }`}
      >
        <div className="page-min-height px-4 md:px-6 pt-4 md:pt-6 pb-4 md:pb-6">
          <div
            className={
              contentWidth === "boxed" ? "container mx-auto" : "max-w-400 mx-auto"
            }
          >
            <Suspense fallback={<Loading />}>
              <motion.div
                key={location.pathname}
                initial="pageInitial"
                animate="pageAnimate"
                exit="pageExit"
                variants={{
                  pageInitial: {
                    opacity: 0,
                    y: 50,
                  },
                  pageAnimate: {
                    opacity: 1,
                    y: 0,
                  },
                  pageExit: {
                    opacity: 0,
                    y: -50,
                  },
                }}
                transition={{
                  type: "tween",
                  ease: "easeInOut",
                  duration: 0.5,
                }}
              >
                {/* <Breadcrumbs /> */}
                {<Outlet />}
              </motion.div>
            </Suspense>
          </div>
        </div>
      </div>
      <SupportWidget />
      {width < breakpoints.md && <MobileFooter />}
      {width > breakpoints.md && (
        <Footer className={width > breakpoints.xl ? switchHeaderClass() : ""} />
      )}
    </>
  );
};

export default Layout;
