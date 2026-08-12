import React, { Suspense, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
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
  const location = useLocation();

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

      {/* App shell. The shell owns the viewport height and never scrolls — the
          content region below is the app's single scroll container. Without
          this, header + page padding + footer added up to more than the
          `h-full` pages reserved for themselves, so the *window* scrolled a
          few dozen pixels and dragged the sticky header along with it.

          `100dvh` (not `100vh`) so the mobile browser's collapsing URL bar
          doesn't leave the footer cut off below the fold.

          The margin lives here rather than on Header/Footer/content
          separately: one offset for the whole column, so the three can never
          disagree about how wide the sidebar is. */}
      <div
        className={`flex flex-col h-[100dvh] overflow-hidden transition-all duration-150 ${
          width >= breakpoints.xl ? switchHeaderClass() : ""
        }`}
      >
        {/* `>=` matches the header's own `width >= breakpoints.xl` check. With
            `>` here, a viewport of exactly 1280px rendered the collapse toggle
            but no sidebar — and no mobile trigger either, so the menu was
            unreachable at that exact width. */}
        <Header className="shrink-0" />

        {/* Padding lives on the scroller itself so the chain down to the page
            is as short as possible. Every level below is `h-full` — a plain
            `height: 100%` — because a page that wants to fill the viewport
            needs a *definite* height to resolve against, and `min-height`
            does not provide one: with `min-h-full` the wrapper's `height`
            stays `auto`, the page's own `h-full` collapses to `auto` too, and
            the page grows to its content height, which is what made this
            region scroll the whole page (header, toolbar and sticky table
            head included) instead of just the table body. */}
        <main className="content-wrapper flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 px-3.5 md:px-5 py-3.5 md:py-4 pb-24 md:pb-4">
          <div
            className={`h-full ${
              contentWidth === "boxed" ? "container mx-auto" : "max-w-400 mx-auto"
            }`}
          >
            <Suspense fallback={<Loading />}>
              {/* Opacity only — deliberately no `y` slide. An animated
                  transform would make this element the containing block for
                  `position: fixed`, which is how ConfirmDialog and the
                  scanner overlays position themselves against the viewport. */}
              <motion.div
                ref={nodeRef}
                key={location.pathname}
                className="h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
              >
                {<Outlet />}
              </motion.div>
            </Suspense>
          </div>
        </main>

        {width >= breakpoints.md && <Footer className="shrink-0" />}
      </div>

      {/* Both of these are fixed-position and deliberately sit outside the
          shell column — they overlay the content region rather than taking a
          row in it, so the shell's `overflow-hidden` never clips them. The
          content region's `pb-24` below `md` is what keeps the last row of a
          table clear of the bottom nav. */}
      <SupportWidget />
      {width < breakpoints.md && <MobileFooter />}
    </>
  );
};

export default Layout;
