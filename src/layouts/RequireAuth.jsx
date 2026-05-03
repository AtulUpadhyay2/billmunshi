import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Protect routes that require an authenticated session WITH at least one
 * organization. Redirects synchronously *before* the protected children
 * mount, which is what stops the post-login screen flash that happened
 * when the redirect lived inside Layout's useEffect.
 */
const RequireAuth = () => {
  const location = useLocation();
  const { isAuth, user } = useSelector((state) => state.auth);

  if (!isAuth || !user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }
  if (!user.organizations || user.organizations.length === 0) {
    return <Navigate to="/auth/no-organization" replace />;
  }
  return <Outlet />;
};

export default RequireAuth;
