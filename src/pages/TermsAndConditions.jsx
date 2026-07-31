import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Seo from '@/components/Seo';
import { PAGE_SEO } from '@/config/seo';

const sections = [
  { id: 'introduction', t: '1. Introduction', c: 'Welcome to Bill Munshi. By accessing our website and using our services, you agree to be bound by these Terms and Conditions. Please read them carefully.' },
  { id: 'use-of-service', t: '2. Use of Service', c: 'You agree to use our service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else\'s use and enjoyment of the website.' },
  { id: 'account', t: '3. Account Registration', c: 'To access certain features of the service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process.' },
  { id: 'ip', t: '4. Intellectual Property', c: 'The content, organization, graphics, design, compilation, and other matters related to the Site are protected under applicable copyrights, trademarks, and other proprietary rights.' },
  { id: 'termination', t: '5. Termination', c: 'We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever.' },
  { id: 'changes', t: '6. Changes to Terms', c: 'We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.' },
  { id: 'contact', t: '7. Contact Us', c: 'If you have any questions about these Terms, please contact us at support@billmunshi.com.' },
];

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 antialiased">
      <Seo {...PAGE_SEO.terms} />

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-3.5 flex items-center justify-between">
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Icon icon="heroicons:arrow-left" className="text-base" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] mask-[radial-gradient(ellipse_60%_50%_at_50%_30%,black_30%,transparent_75%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(15 23 42 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="container mx-auto px-6 pt-12 md:pt-16 pb-10 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Icon icon="heroicons:scale" className="text-blue-600 dark:text-blue-400 text-sm" />
              Legal
            </span>
            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="pb-20 md:pb-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
            {/* TOC */}
            <aside className="lg:col-span-3">
              <div className="sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h6 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 mb-3">
                  On this page
                </h6>
                <nav className="flex flex-col gap-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      {s.t}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <article className="lg:col-span-9">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 md:p-10 shadow-sm">
                <div className="space-y-7">
                  {sections.map((s, i) => (
                    <section key={i} id={s.id} className="scroll-mt-24">
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                        {s.t}
                      </h2>
                      <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {s.c}
                      </p>
                    </section>
                  ))}
                </div>

                <div className="mt-10 pt-7 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon icon="heroicons:envelope" className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Have questions?</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Reach our support team for clarifications on any clause.</div>
                  </div>
                  <a
                    href="mailto:support@billmunshi.com"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                  >
                    Contact support
                    <Icon icon="heroicons:arrow-right" className="text-sm" />
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} Bill Munshi · All rights reserved
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacy-policy" className="text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsAndConditions;
