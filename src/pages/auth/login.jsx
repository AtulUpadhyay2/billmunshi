import React from "react";
import { Link } from "react-router-dom";
import LoginForm from "./common/login-form";
import useDarkMode from "@/hooks/useDarkMode";

const login = () => {
  const [isDark] = useDarkMode();
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 via-slate-100 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-r from-blue-100 to-slate-200 dark:from-blue-900/30 dark:to-slate-700/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-gradient-to-r from-slate-200 to-gray-300 dark:from-slate-700/30 dark:to-gray-800/30 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
      </div>

      <div className="w-full max-w-sm relative z-10 max-h-full overflow-y-auto">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Bill Munshi
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
            Financial Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="relative">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Sign In
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Access your account to manage your financial portfolio
              </p>
            </div>

            {/* Login Form Container */}
            <div className="space-y-4">
              <div className="bg-gray-50/50 dark:bg-slate-700/30 rounded-xl p-4 border border-gray-200/30 dark:border-slate-600/30">
                <LoginForm />
              </div>
            </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="text-center mt-6">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-sm">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              © {new Date().getFullYear()} Bill Munshi. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default login;
