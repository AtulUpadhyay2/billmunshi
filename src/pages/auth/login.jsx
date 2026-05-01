import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import LoginForm from "./common/LoginForm";

const login = () => {
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
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Icon icon="heroicons:arrow-left" className="text-base" />
            Back to home
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome back
              </h1>
              <p className="mt-2 text-base text-slate-600 dark:text-slate-400">
                Sign in to your account to continue managing bills with Bill Munshi.
              </p>
            </div>

            <LoginForm />

            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/auth/register"
                className="font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                Create one
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
        {/* Grid pattern */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(255 255 255 / 1) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Glow orbs */}
        <div aria-hidden="true" className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center w-full px-12 xl:px-16 text-white">
          {/* Pill */}
          <span className="self-start inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            Trusted by accounting teams
          </span>

          <h2 className="mt-6 text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1]">
            Streamline your{" "}
            <span className="bg-linear-to-r from-blue-400 to-orange-300 bg-clip-text text-transparent">
              billing management
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-300 max-w-md leading-relaxed">
            AI-powered OCR, native Tally &amp; Zoho sync, and granular team controls — all in one platform.
          </p>

          {/* Mini dashboard preview */}
          <div className="mt-10 max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/30"></span>
                <span className="w-2 h-2 rounded-full bg-white/30"></span>
                <span className="w-2 h-2 rounded-full bg-white/30"></span>
              </div>
              <span className="text-[10px] font-mono text-white/50">app.billmunshi.com</span>
            </div>
            <div className="space-y-2">
              {[
                { v: 'AC', name: 'Acme Components', amt: '₹ 1,24,500', tone: 'success' },
                { v: 'RT', name: 'Reliable Traders', amt: '₹ 86,200', tone: 'info' },
                { v: 'SK', name: 'Sky Logistics', amt: '₹ 42,890', tone: 'warn' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                  <div className="w-7 h-7 rounded-md bg-white/10 text-white text-[11px] font-bold flex items-center justify-center">{row.v}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{row.name}</div>
                    <div className="text-[10px] font-mono text-white/60">{row.amt}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                    ${row.tone === 'success' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                    ${row.tone === 'info' ? 'bg-blue-500/20 text-blue-300' : ''}
                    ${row.tone === 'warn' ? 'bg-amber-500/20 text-amber-300' : ''}`}>
                    {row.tone === 'success' ? 'Synced' : row.tone === 'info' ? 'Approved' : 'Review'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust footer */}
          <div className="mt-10 flex items-center gap-x-6 gap-y-2 flex-wrap text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="heroicons:shield-check" className="text-emerald-400 text-base" /> Enterprise-grade security
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="heroicons:lock-closed" className="text-emerald-400 text-base" /> Encrypted at rest
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default login;
