import React from "react";
import { NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { useSelector } from "react-redux";
const MobileFooter = () => {
  const { user } = useSelector((state) => state.auth);

  // Function to get user initials
  const getUserInitials = () => {
    if (!user || !user.first_name || !user.last_name) {
      return "U";
    }
    const firstInitial = user.first_name.charAt(0).toUpperCase();
    const lastInitial = user.last_name.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="bg-white bg-no-repeat custom-dropshadow footer-bg dark:bg-slate-700 flex justify-around items-center backdrop-filter backdrop-blur-[40px] fixed left-0 w-full z-9999 bottom-0 py-[12px] px-4">
      <NavLink to="/dashboard">
        {({ isActive }) => (
          <div>
            <span
              className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
         ${isActive ? "text-primary-500" : "dark:text-white text-slate-900"}
          `}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            <span
              className={` block text-[11px]
          ${isActive ? "text-primary-500" : "text-slate-600 dark:text-slate-300"
                }
          `}
            >
              Zoho
            </span>
          </div>
        )}
      </NavLink>
      <NavLink
        to="profile"
        className="relative bg-white bg-no-repeat backdrop-filter backdrop-blur-[40px] rounded-full footer-bg dark:bg-slate-700 h-[65px] w-[65px] z-[-1] -mt-[40px] flex justify-center items-center"
      >
        {({ isActive }) => (
          <div className={`h-[50px] w-[50px] rounded-full relative left-[0px] top-[0px] custom-dropshadow bg-slate-500 dark:bg-slate-600 flex items-center justify-center text-white font-semibold text-lg
          ${isActive
                  ? "border-2 border-primary-500"
                  : "border-2 border-slate-100"
                }
              `}>
            {getUserInitials()}
          </div>
        )}
      </NavLink>
      <NavLink to="/dashboard">
        {({ isActive }) => (
          <div>
            <span
              className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
      ${isActive ? "text-primary-500" : "dark:text-white text-slate-900"}
          `}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <span
              className={` block text-[11px]
         ${isActive ? "text-primary-500" : "text-slate-600 dark:text-slate-300"}
        `}
            >
              Tally
            </span>
          </div>
        )}
      </NavLink>
    </div>
  );
};

export default MobileFooter;
