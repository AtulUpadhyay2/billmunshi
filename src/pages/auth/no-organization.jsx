import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useDarkMode from "@/hooks/useDarkMode";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { useDispatch, useSelector } from "react-redux";
import { logOut, setUser } from "@/store/api/auth/authSlice";
import { useLazyGetProfileQuery } from "@/store/api/auth/authApiSlice";
import { toast } from "react-toastify";
import { handleApiError } from "@/utils/apiErrorHandler";

// image import
import LogoWhite from "@/assets/images/logo/logo-white.svg";
import Logo from "@/assets/images/logo/logo.svg";
import Illustration from "@/assets/images/auth/ils1.svg";

const NoOrganization = () => {
    const [isDark] = useDarkMode();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastChecked, setLastChecked] = useState(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, accessToken, refreshToken } = useSelector((state) => state.auth);
    const [triggerGetProfile] = useLazyGetProfileQuery();

    const handleLogout = () => {
        dispatch(logOut());
        toast.success("Logged out successfully");
        navigate("/");
    };

    const handleOnboardOrganization = () => {
        // You can implement organization onboarding logic here
        // For now, this is a placeholder
        toast.info("Organization onboarding feature coming soon!");
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // Call the actual API to get updated profile
            const result = await triggerGetProfile();
            
            if (result.error) {
                throw new Error(result.error.data?.message || "Failed to fetch profile");
            }

            if (result.data) {
                const updatedUser = result.data;
                
                // Update user data in the store
                dispatch(setUser({
                    user: updatedUser,
                    access: accessToken,
                    refresh: refreshToken
                }));

                // Check if user now has organizations
                if (updatedUser.organizations && updatedUser.organizations.length > 0) {
                    toast.success("Organizations found! Redirecting to dashboard...");
                    navigate("/dashboard");
                } else {
                    toast.info("Profile refreshed. No organizations found yet.");
                }
                
                setLastChecked(new Date());
            }
        } catch (error) {
            console.error("Profile refresh error:", error);
            
            // Use centralized error handler
            const isTokenExpired = handleApiError(error, "Failed to refresh profile. Please try again.");
            
            // If token expired, user will be automatically logged out
            // Otherwise, show the error that was already handled by handleApiError
        } finally {
            setIsRefreshing(false);
        }
    };

    const userDisplayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : user?.email || 'User';

    // Auto-check for organizations every 30 seconds
    useEffect(() => {
        const checkOrganizations = async () => {
            try {
                const result = await triggerGetProfile();
                if (result.data?.organizations?.length > 0) {
                    // Silently update user data and redirect
                    dispatch(setUser({
                        user: result.data,
                        access: accessToken,
                        refresh: refreshToken
                    }));
                    navigate("/dashboard");
                } else {
                    setLastChecked(new Date());
                }
            } catch (error) {
                // Handle error with centralized error handler
                const isTokenExpired = handleApiError(error);
                
                if (!isTokenExpired) {
                    // Only log if it's not a token expiration (which is handled automatically)
                    console.log("Background organization check failed:", error);
                }
            }
        };

        // Check immediately, then every 30 seconds
        const interval = setInterval(checkOrganizations, 30000);
        
        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, [triggerGetProfile, dispatch, navigate, accessToken, refreshToken]);

    return (
        <div className="loginwrapper">
            <div className="lg-inner-column">
                <div className="right-column relative bg-white dark:bg-slate-800">
                    <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
                        <div className="auth-box h-full flex flex-col justify-center">
                            <div className="mobile-logo text-center mb-6 lg:hidden block">
                                <Link to="/">
                                    <img
                                        src={isDark ? LogoWhite : Logo}
                                        alt=""
                                        className="mx-auto"
                                    />
                                </Link>
                            </div>

                            <div className="text-center 2xl:mb-10 mb-8">
                                <div className="mb-4">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Icon
                                            icon="heroicons-outline:office-building"
                                            className="text-2xl text-slate-400"
                                        />
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                                        Welcome, {userDisplayName}
                                    </div>
                                </div>
                                <h4 className="font-medium text-2xl text-slate-900 dark:text-white mb-3">
                                    No Organization Found
                                </h4>
                                <div className="text-slate-500 dark:text-slate-400 text-base max-w-[400px] mx-auto">
                                    You are not part of any organization yet. To access the dashboard, you need to either join an existing organization or create a new one.
                                </div>
                                <div className="text-xs text-slate-400 mt-3">
                                    We're automatically checking for organization updates every 30 seconds.
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    text="Onboard Your Organization"
                                    className="btn btn-primary block w-full text-center"
                                    icon="heroicons-outline:plus"
                                    onClick={handleOnboardOrganization}
                                />

                                <Button
                                    text="Refresh Profile"
                                    className="btn btn-outline-primary block w-full text-center"
                                    icon="heroicons-outline:refresh"
                                    isLoading={isRefreshing}
                                    onClick={handleRefresh}
                                />

                                <Button
                                    text="Logout"
                                    className="btn btn-outline-dark block w-full text-center"
                                    icon="heroicons-outline:logout"
                                    onClick={handleLogout}
                                />
                            </div>

                            <div className="text-center mt-8">
                                <div className="text-slate-500 dark:text-slate-400 text-sm">
                                    Need help? {" "}
                                    <Link
                                        to="/contact"
                                        className="text-slate-900 dark:text-white font-medium hover:underline"
                                    >
                                        Contact Support
                                    </Link>
                                </div>
                                {lastChecked && (
                                    <div className="text-xs text-slate-400 mt-2">
                                        Last checked: {lastChecked.toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="auth-footer text-center">
                            Copyright {new Date().getFullYear()}, BillMunshi All Rights Reserved.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoOrganization;
