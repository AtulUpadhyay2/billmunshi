import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Seo from '@/components/Seo';
import { CookieSettingsLink } from '@/components/cookies';
import { PAGE_SEO } from '@/config/seo';

const sections = [
  {
    id: 'collect',
    t: '1. Information We Collect',
    c: 'We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, items requested (for delivery services), delivery notes, and other information you choose to provide.',
  },
  {
    id: 'use',
    t: '2. How We Use Your Information',
    c: 'We use the information we collect to provide, maintain, and improve our services, such as to:',
    list: [
      'Process payments and facilitate your transactions',
      'Send you technical notices, updates, security alerts, and support messages',
      'Respond to your comments, questions, and requests',
      'Communicate with you about products, services, offers, promotions, and events',
    ],
  },
  {
    id: 'sharing',
    t: '3. Information Sharing',
    c: 'We may share the information we collect about you as described in this Statement or as described at the time of collection or sharing, including as follows:',
    list: [
      'With third party service providers to enable them to provide the Services we request',
      'With the general public if you submit content in a public forum',
      'With third parties with whom you choose to let us share information',
    ],
  },
  {
    id: 'security',
    t: '4. Data Security',
    c: 'We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.',
  },
  {
    id: 'cookies',
    t: '5. Cookies',
    c: 'We use cookies and similar storage to keep you signed in, remember your preferences and understand how the Service is used. Everything beyond what is strictly necessary is off until you agree, and you can change or withdraw that consent at any time from the "Cookie Settings" link in the footer. Our Cookie Policy lists every cookie we set, what it is for and how long it lasts.',
  },
  {
    id: 'changes',
    t: '6. Changes to This Policy',
    c: 'We may update this privacy policy from time to time. If we make significant changes, we will notify you of the changes through the Services or through others means, such as email.',
  },
  {
    id: 'contact',
    t: '7. Contact Us',
    c: 'If you have any questions about this Privacy Policy, please contact us at privacy@billmunshi.com.',
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 antialiased">
      <Seo {...PAGE_SEO.privacy} />

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
              <Icon icon="heroicons:shield-check" className="text-blue-600 dark:text-blue-400 text-sm" />
              Legal
            </span>
            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Privacy Policy
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
                      {s.list && (
                        <ul className="mt-3 space-y-2">
                          {s.list.map((item, j) => (
                            <li key={j} className="flex gap-2.5 text-[15px] text-slate-600 dark:text-slate-400">
                              <Icon icon="heroicons:check-circle" className="text-emerald-500 text-base mt-1 shrink-0" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  ))}
                </div>

                <div className="mt-10 pt-7 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon icon="heroicons:envelope" className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Privacy questions?</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Email our privacy team — we usually reply within 24 hours.</div>
                  </div>
                  <a
                    href="mailto:privacy@billmunshi.com"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                  >
                    Contact privacy team
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
            <Link to="/cookie-policy" className="text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Cookie Policy
            </Link>
            <CookieSettingsLink className="text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
