import React from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import RegForm from "./common/RegisterForm";

const register = () => {
  return (
    <div className="h-screen flex bg-white dark:bg-slate-950 antialiased overflow-hidden">
      {/* Left: form */}
      <div className="flex-1 flex flex-col px-6 sm:px-10 lg:px-12 py-5 overflow-y-auto">
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
            Already a member?
            <span className="font-semibold text-blue-700 dark:text-blue-400">Sign in</span>
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center py-6">
          <div className="w-full max-w-xl">
            {/* Eyebrow offer pill */}
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/60 rounded-full text-[11px] font-semibold text-orange-700 dark:text-orange-400 mb-3">
              <Icon icon="heroicons:gift" className="text-xs" />
              First 100 users get 50 bills/mo + 1GB free
            </span>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 mb-5">
              Get started in minutes — no credit card required.
            </p>

            <RegForm />

            <p className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400 sm:hidden">
              Already a member?{" "}
              <Link to="/auth/login" className="font-semibold text-blue-700 dark:text-blue-400">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 dark:text-slate-500">
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
        <div aria-hidden="true" className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center w-full px-12 xl:px-16 text-white">
          <span className="self-start inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold">
            <Icon icon="heroicons:rocket-launch" className="text-sm text-blue-300" />
            Get started today
          </span>

          <h2 className="mt-6 text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
            Automate your{" "}
            <span className="bg-linear-to-r from-blue-400 to-orange-300 bg-clip-text text-transparent">
              accounting workflow.
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-300 max-w-md leading-relaxed">
            Process bills with AI-OCR, sync to Tally or Zoho in real-time, and stay on top of every rupee.
          </p>

          {/* Benefit list */}
          <ul className="mt-10 space-y-4 max-w-md">
            {[
              { icon: 'heroicons:bolt', t: '70% time saved', d: 'In bill processing across the team.' },
              { icon: 'heroicons:eye', t: '99% OCR accuracy', d: 'Line items, taxes, and amounts captured.' },
              { icon: 'heroicons:shield-check', t: 'Enterprise-grade security', d: 'Role-based access &amp; encrypted storage.' },
            ].map((b, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="shrink-0 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <Icon icon={b.icon} className="text-lg text-blue-300" />
                </span>
                <div>
                  <div className="font-semibold text-white">{b.t}</div>
                  <div className="text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: b.d }} />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex items-center gap-x-6 gap-y-2 flex-wrap text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="heroicons:check-circle" className="text-emerald-400 text-base" /> No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon icon="heroicons:check-circle" className="text-emerald-400 text-base" /> Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default register;
