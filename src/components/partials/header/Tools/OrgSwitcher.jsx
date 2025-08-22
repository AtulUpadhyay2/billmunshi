import React, { useMemo } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { MenuItem } from "@headlessui/react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedOrganization } from "@/store/api/auth/authSlice";

const OrgSwitcher = () => {
  const dispatch = useDispatch();
  const { user, selectedOrganization } = useSelector((s) => s.auth);

  const orgs = useMemo(() => Array.isArray(user?.organizations) ? user.organizations : [], [user]);
  if (!orgs || orgs.length === 0) return null;

  const current = selectedOrganization || orgs[0];

  const label = (
    <div className="flex items-center px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
      <span className="text-slate-700 dark:text-slate-200 text-sm font-medium max-w-[140px] truncate">
        {current?.name || "Organization"}
      </span>
      <span className="text-base ltr:ml-2 rtl:mr-2 text-slate-500">
        <Icon icon="heroicons-outline:chevron-down" />
      </span>
    </div>
  );

  return (
    <Dropdown label={label} classMenuItems="w-[220px] top-[58px]">
      {orgs.map((o) => (
        <MenuItem key={o.id}>
          {({ isActive }) => (
            <div
              onClick={() => dispatch(setSelectedOrganization(o))}
              className={`${
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-600/50 dark:text-slate-300"
                  : "text-slate-600 dark:text-slate-300"
              } block cursor-pointer px-4 py-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="block text-sm">{o.name}</span>
                </div>
                {current?.id === o.id && (
                  <span className="text-success-500 text-xl">
                    <Icon icon="bi:check-lg" />
                  </span>
                )}
              </div>
              {o.slug && (
                <div className="text-xs text-slate-400 mt-1">{o.slug}</div>
              )}
            </div>
          )}
        </MenuItem>
      ))}
    </Dropdown>
  );
};

export default OrgSwitcher;
