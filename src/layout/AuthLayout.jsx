import React, { useEffect, Suspense } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import usePageTitle from "@/hooks/usePageTitle";

const AuthLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuth, user } = useSelector((state) => state.auth);

  // Update page title based on current route
  usePageTitle();

  useEffect(() => {
    // If user is authenticated and has organizations, redirect to dashboard
    if (isAuth && user && user.organizations && user.organizations.length > 0) {
      // Unless they're on the no-organization page and shouldn't be there
      if (location.pathname !== "/no-organization") {
        navigate("/dashboard");
      }
    }
    // If user is authenticated but has no organizations, and they're not on the no-org page
    else if (isAuth && user && (!user.organizations || user.organizations.length === 0)) {
      if (location.pathname !== "/no-organization") {
        navigate("/no-organization");
      }
    }
  }, [isAuth, user, navigate, location.pathname]);

  return (
    <>
      <Suspense fallback={<Loading />}>
        <ToastContainer />
        {<Outlet />}
      </Suspense>
    </>
  );
};

export default AuthLayout;
