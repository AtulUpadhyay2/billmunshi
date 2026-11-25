import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Protect routes that require an authenticated session WITH at least one
 * organization. Redirects synchronously *before* the protected children
 * mount, which is what stops the post-login screen flash that happened
 * when the redirect lived inside Layout's useEffect.
 *
 * Support agents are the exception, and have to be.
 *
 * An agent is deliberately not a member of any client organization —
 * that is the whole point of the access-grant design: they get into an
 * account by consent, for a ticket, for an hour, and never by
 * membership. But "has no organization" was the only test here, so the
 * first real agent to sign in was bounced to "No Organization Found"
 * and could not reach the support desk at all. The two rules were
 * written for different people and collided on the one person who is
 * signed in without an account of their own.
 */
const RequireAuth = () => {
  const location = useLocation();
  const { isAuth, user } = useSelector((state) => state.auth);

  if (!isAuth || !user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  const hasOrg = Boolean(user.organizations && user.organizations.length);
  if (!hasOrg) {
    // An agent with no organization belongs on the desk, not on the
    // onboarding screen. Anywhere else is still out of bounds for them.
    if (user.is_support_agent) {
      return location.pathname.startsWith("/support-desk") ? (
        <Outlet />
      ) : (
        <Navigate to="/support-desk" replace />
      );
    }
    return <Navigate to="/auth/no-organization" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
