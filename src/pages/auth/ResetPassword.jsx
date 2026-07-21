import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import ResetPasswordForm from "./common/ResetPasswordForm";

const ResetPassword = () => {
  return (
    <div className="h-screen flex bg-white dark:bg-slate-950 antialiased overflow-hidden">
      {/* Left: form */}
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-16 py-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-700/20 group-hover:shadow-md transition-all">
              <Icon icon="heroicons:document-text" className="text-lg text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bill Munshi
            </span>
          </Link>
          <Link
            to="/auth/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Icon icon="heroicons:arrow-left" className="text-base" />
            Back to sign in
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 ring-1 ring-orange-100 dark:ring-orange-900/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-5">
              <Icon icon="heroicons:key" className="text-2xl" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Choose a new password
            </h1>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-400 mb-7">
              Pick something strong you can remember. You&rsquo;ll be signed in
              right after.
            </p>

            <ResetPasswordForm />

            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Didn&rsquo;t request this?{" "}
              <Link
                to="/auth/login"
                className="font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 dark:text-slate-500">
          © {new Date().getFullYear()} BillMunshi · All rights reserved
        </div>
      </div>

      {/* Right: brand panel — same style as ForgotPassword */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[48%] relative overflow-hidden bg-slate-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgb(255 255 255 / 1) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div aria-hidden="true" className="absolute top-0 right-0 w-96 h-96 bg-orange-500/25 rounded-full blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center w-full px-12 xl:px-16 text-white">
          <span className="self-start inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold">
            <Icon icon="heroicons:lock-closed" className="text-sm text-orange-300" />
            Secure reset
          </span>

          <h2 className="mt-6 text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1]">
            One more step to get you back{" "}
            <span className="bg-linear-to-r from-orange-300 to-blue-300 bg-clip-text text-transparent">
              in the driver&rsquo;s seat.
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-300 max-w-md leading-relaxed">
            Every reset link is single-use and short-lived, so your account
            stays yours &mdash; even if this email is ever forwarded.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
