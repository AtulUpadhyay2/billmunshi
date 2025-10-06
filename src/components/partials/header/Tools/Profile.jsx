import React from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { MenuItem } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "@/store/api/auth/authSlice";

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Debug: Log user data to check if is_superuser is present
  // console.log('User data in Profile component:', user);
  // console.log('Is superuser:', user?.is_superuser);
  // console.log('Is staff:', user?.is_staff);

  // Function to get user initials
  const getUserInitials = () => {
    if (!user || !user.first_name || !user.last_name) {
      return "U";
    }
    const firstInitial = user.first_name.charAt(0).toUpperCase();
    const lastInitial = user.last_name.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  const profileLabel = () => {
    const displayName = user ? `${user.first_name} ${user.last_name}`.trim() : "User";
    const userEmail = user?.email || "";
    const initials = getUserInitials();
    
    return (
      <div className="flex items-center">
        <div className="flex-1 ltr:mr-[10px] rtl:ml-[10px]">
          <div className="lg:h-8 lg:w-8 h-7 w-7 rounded-full bg-slate-500 dark:bg-slate-600 flex items-center justify-center text-white font-semibold text-xs lg:text-sm">
            {initials}
          </div>
        </div>
        <div className="flex-none text-slate-600 dark:text-white text-sm font-normal items-center lg:flex hidden overflow-hidden text-ellipsis whitespace-nowrap">
          <div className="text-right ltr:mr-[10px] rtl:ml-[10px]">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap w-[85px] block text-sm font-medium">
              {displayName || "User"}
            </div>
            {userEmail && (
              <div className="text-xs text-slate-500 dark:text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap w-[85px]">
                {userEmail}
              </div>
            )}
          </div>
          <span className="text-base inline-block">
            <Icon icon="heroicons-outline:chevron-down"></Icon>
          </span>
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    dispatch(logOut());
    navigate("/");
  };

  const ProfileMenu = [
    {
      label: "Profile",
      icon: "heroicons-outline:user",
      action: () => {
        navigate("/profile");
      },
    },
  ];

  // Add logout option
  ProfileMenu.push({
    label: "Logout",
    icon: "heroicons-outline:login",
    action: () => {
      handleLogout();
    },
    hasDivider: true
  });

  // Debug: Log the ProfileMenu to see what's included
  console.log('ProfileMenu:', ProfileMenu);
  console.log('ProfileMenu length:', ProfileMenu.length);

  return (
    <Dropdown label={profileLabel()} classMenuItems="w-[200px] top-[58px]">
      {/* User Info Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="text-sm font-medium text-slate-900 dark:text-white">
          {user ? `${user.first_name} ${user.last_name}`.trim() : "User"}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {user?.email}
        </div>
        {user?.organizations && user.organizations.length > 0 && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {user.organizations.length} organization{user.organizations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      
      {ProfileMenu.map((item, index) => (
        <MenuItem key={index}>
          {({ isActive }) => (
            <div
              onClick={() => !item.isStatus && item.action && item.action()}
              className={`${
                isActive && !item.isStatus
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                  : "text-slate-600 dark:text-slate-300"
              } block ${
                item.hasDivider
                  ? "border-t border-slate-100 dark:border-slate-700"
                  : ""
              } ${item.isStatus ? "opacity-75" : "cursor-pointer"}`}
            >
              <div className={`block px-4 py-2`}>
                <div className="flex items-center">
                  <span className={`block text-xl ltr:mr-3 rtl:ml-3 ${item.statusClass || ""}`}>
                    <Icon icon={item.icon} />
                  </span>
                  <span className={`block text-sm ${item.statusClass || ""}`}>{item.label}</span>
                </div>
              </div>
            </div>
          )}
        </MenuItem>
      ))}
    </Dropdown>
  );
};

export default Profile;
