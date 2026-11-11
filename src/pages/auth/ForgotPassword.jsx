import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import ForgotPass from "./common/ForgotPasswordForm";

const forgotPass = () => {
  return (
    <div className="h-screen flex bg-white dark:bg-slate-950 antialiased overflow-hidden">
      {/* Left: form */}
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-16 py-8">
        {/* Top brand */}
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

        {/* Form */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-4">
              <Icon icon="heroicons:lock-closed" className="text-xl" />
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Forgot your password?
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 mb-6">
              No worries — enter your email and we'll send you instructions to reset it.
            </p>

            <ForgotPass />

            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex gap-3">
              <Icon icon="heroicons:information-circle" className="text-blue-600 dark:text-blue-400 text-xl shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                If an account exists for that email, you'll receive a password reset link within a few minutes.
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
              Remember your password?{" "}
              <Link
                to="/auth/login"
                className="font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-500">
          © {new Date().getFullYear()} BillMunshi · All rights reserved
        </div>
      </div>

      {/* Right: brand showcase */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[48%] relative overflow-hidden bg-slate-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(255 255 255 / 1) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-center w-full px-12 xl:px-16 text-white">
          <span className="self-start inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold">
            <Icon icon="heroicons:shield-check" className="text-sm text-blue-300" />
            Account recovery
          </span>

          <h2 className="mt-5 text-3xl xl:text-4xl font-semibold tracking-tight leading-[1.15] text-white">
            Your data is{" "}
            <span className="text-white">
              always protected.
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-300 max-w-md leading-relaxed">
            We use strong encryption and follow industry best practices, so your account stays secure even during recovery.
          </p>

          <ul className="mt-10 space-y-4 max-w-md">
            {[
              { icon: 'heroicons:lock-closed', t: 'Encrypted recovery link', d: 'Single-use, time-limited reset tokens.' },
              { icon: 'heroicons:envelope', t: 'Email verification', d: 'We confirm it\'s really you before any change.' },
              { icon: 'heroicons:bell-alert', t: 'Activity alerts', d: 'You\'re notified of every account event.' },
            ].map((b, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="shrink-0 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <Icon icon={b.icon} className="text-lg text-blue-300" />
                </span>
                <div>
                  <div className="font-semibold text-white">{b.t}</div>
                  <div className="text-sm text-slate-400">{b.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default forgotPass;
