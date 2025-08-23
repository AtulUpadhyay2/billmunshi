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
      <div className="flex-1">
        <div className="text-slate-700 dark:text-slate-200 text-sm font-medium max-w-[140px] truncate">
          {current?.name || "Organization"}
        </div>
        {current?.role && (
          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
            {current.role}
          </div>
        )}
      </div>
      <span className="text-base ltr:ml-2 rtl:mr-2 text-slate-500">
        <Icon icon="heroicons-outline:chevron-down" />
      </span>
    </div>
  );

  return (
    <Dropdown label={label} classMenuItems="w-[250px] top-[58px]">
      {orgs.map((o) => (
        <MenuItem key={o.id}>
          {({ isActive }) => (
            <div
              onClick={() => dispatch(setSelectedOrganization(o))}
              className={`${
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-600/50 dark:text-slate-300"
                  : "text-slate-600 dark:text-slate-300"
              } block cursor-pointer px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="block text-sm font-medium truncate">{o.name}</span>
                    {current?.id === o.id && (
                      <span className="text-success-500 text-lg ml-2">
                        <Icon icon="bi:check-lg" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {o.slug && (
                      <div className="text-xs text-slate-400">@{o.slug}</div>
                    )}
                    <div className="flex items-center space-x-2">
                      {o.role && (
                        <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                          o.role === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          o.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {o.role}
                        </span>
                      )}
                      {o.status && (
                        <span className={`text-xs ${
                          o.status === 'ACTIVE' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          <Icon icon={o.status === 'ACTIVE' ? 'heroicons:check-circle' : 'heroicons:clock'} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </MenuItem>
      ))}
    </Dropdown>
  );
};

export default OrgSwitcher;
