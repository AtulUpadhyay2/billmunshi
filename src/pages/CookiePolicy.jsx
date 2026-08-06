import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Seo from '@/components/Seo';
import { PAGE_SEO } from '@/config/seo';
import { COOKIE_CATEGORIES, CONSENT_MAX_AGE_DAYS } from '@/config/cookies';
import { useCookieConsent } from '@/components/cookies';

/**
 * Public cookie disclosure.
 *
 * The per-category tables are generated from `config/cookies.js`, the
 * same registry the preferences panel reads — so the page cannot drift
 * out of date the way a hand-written policy always eventually does.
 */

const intro = [
  {
    id: 'what',
    t: '1. What cookies are',
    c: 'Cookies are small text files a website asks your browser to store. We also use your browser’s local storage, which works the same way and is covered by this policy wherever we say "cookies". They let us keep you signed in, remember how you like the app set up, and understand how the site is used.',
  },
  {
    id: 'choices',
    t: '2. Your choices',
    c: `Everything except the strictly necessary cookies is off until you turn it on. We ask the first time you visit, and you can change your answer at any time from the "Cookie Settings" link in the footer of every page. Refusing is always as easy as accepting, and withdrawing consent deletes what was already stored. We ask again after ${CONSENT_MAX_AGE_DAYS} days, or sooner if what we use changes.`,
  },
];

const outro = [
  {
    id: 'browser',
    t: '4. Controlling cookies in your browser',
    c: 'Every major browser lets you block or delete cookies from its settings. That control sits above ours — but blocking everything will sign you out and may stop parts of Bill Munshi working, because some cookies are what keep your session alive.',
  },
  {
    id: 'third-party',
    t: '5. Third parties',
    c: 'Google reCAPTCHA runs on our sign-up and demo-request forms to tell humans from bots, and sets a cookie when you use those forms. It is classed as strictly necessary because without it those forms cannot be protected from automated abuse. Google’s handling of that data is governed by their own privacy policy.',
  },
  {
    id: 'changes',
    t: '6. Changes to this policy',
    c: 'If we add a cookie or change what an existing one does, we update this page and ask for your consent again. Your previous answer is not carried over to purposes you have not agreed to.',
  },
  {
    id: 'contact',
    t: '7. Contact us',
    c: 'Questions about this policy, or want to exercise your data rights? Email privacy@billmunshi.com and we usually reply within 24 hours.',
  },
];

const tocEntries = [
  ...intro.map((s) => ({ id: s.id, t: s.t })),
  { id: 'categories', t: '3. What we store' },
  ...outro.map((s) => ({ id: s.id, t: s.t })),
];

const Section = ({ id, t, c }) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
      {t}
    </h2>
    <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">{c}</p>
  </section>
);

const CookiePolicy = () => {
  const { openPreferences } = useCookieConsent();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 antialiased">
      <Seo {...PAGE_SEO.cookies} />

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
              Cookie Policy
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <button
              type="button"
              onClick={openPreferences}
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-600/25 transition-colors cursor-pointer"
            >
              <Icon icon="heroicons:adjustments-horizontal" className="text-base" />
              Manage your cookie settings
            </button>
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
                  {tocEntries.map((s) => (
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
                  {intro.map((s) => (
                    <Section key={s.id} {...s} />
                  ))}

                  {/* Category tables, generated from the registry */}
                  <section id="categories" className="scroll-mt-24">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                      3. What we store
                    </h2>
                    <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Grouped by the categories you can control in your cookie
                      settings.
                    </p>

                    <div className="mt-5 space-y-5">
                      {COOKIE_CATEGORIES.map((category) => (
                        <div
                          key={category.id}
                          className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                        >
                          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {category.name}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  category.required
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                                }`}
                              >
                                {category.required ? 'Always on' : 'Your choice'}
                              </span>
                            </div>
                            <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              {category.summary}
                            </p>
                          </div>

                          {category.items.length === 0 ? (
                            <p className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">
                              None in use at the moment.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-[13px] min-w-[34rem]">
                                <thead className="text-slate-500 dark:text-slate-400">
                                  <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <th scope="col" className="px-4 py-2 font-semibold">Name</th>
                                    <th scope="col" className="px-4 py-2 font-semibold">Purpose</th>
                                    <th scope="col" className="px-4 py-2 font-semibold">Provider</th>
                                    <th scope="col" className="px-4 py-2 font-semibold">Retention</th>
                                  </tr>
                                </thead>
                                <tbody className="text-slate-600 dark:text-slate-400">
                                  {category.items.map((item) => (
                                    <tr
                                      key={item.name}
                                      className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 align-top"
                                    >
                                      <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                                        {item.name}
                                        <div className="text-[11px] font-normal text-slate-500">{item.type}</div>
                                      </td>
                                      <td className="px-4 py-2.5 leading-relaxed">{item.purpose}</td>
                                      <td className="px-4 py-2.5">{item.provider}</td>
                                      <td className="px-4 py-2.5">{item.duration}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>

                  {outro.map((s) => (
                    <Section key={s.id} {...s} />
                  ))}
                </div>

                <div className="mt-10 pt-7 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon icon="heroicons:adjustments-horizontal" className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Changed your mind?</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Update or withdraw your consent at any time — it takes effect immediately.</div>
                  </div>
                  <button
                    type="button"
                    onClick={openPreferences}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Cookie settings
                    <Icon icon="heroicons:arrow-right" className="text-sm" />
                  </button>
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
            <button
              type="button"
              onClick={openPreferences}
              className="text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CookiePolicy;
