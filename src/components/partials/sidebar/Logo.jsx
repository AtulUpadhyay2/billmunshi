import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import useSidebar from "@/hooks/useSidebar";

const SidebarLogo = ({ menuHover }) => {
  const [collapsed] = useSidebar();
  const expanded = !collapsed || menuHover;

  return (
    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
      <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
        <div className="shrink-0 w-9 h-9 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-700/20 group-hover:shadow-md transition-all">
          <Icon icon="heroicons:document-text" className="text-lg text-white" />
        </div>
        {expanded && (
          <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
            Bill Munshi
          </span>
        )}
      </Link>
    </div>
  );
};

export default SidebarLogo;
