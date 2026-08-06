import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Seo from '@/components/Seo';
import { CookieSettingsLink } from '@/components/cookies';
import { PAGE_SEO, buildFaqSchema } from '@/config/seo';

const Landing = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const stats = [
        { value: '70%', label: 'Hours saved in bill processing', icon: 'heroicons:clock' },
        { value: '90%', label: 'Improved tax compliance', icon: 'heroicons:shield-check' },
        { value: '99%', label: 'OCR accuracy', icon: 'heroicons:eye' },
        { value: '24/7', label: 'Support', icon: 'heroicons:chat-bubble-left-right' },
    ];

    const accountantPoints = [
        'Manage all clients from a single dashboard with secure & controlled access.',
        'Fewer errors & less processing time saves cost.',
        'Enhance your practice with accounting automation free up your time.',
        'Deliver more with less efforts.',
    ];

    const ownerPoints = [
        'Share bills / expense receipts with auditors',
        'Save money & environment by avoiding storing & printing e-bills',
        "Don't lose your receipts with option to real-time upload",
        'Access reports & stay on top of your business expenses.',
    ];

    const aboutCards = [
        {
            icon: 'heroicons:eye',
            title: 'Best-in-class AI-powered OCR',
            description: 'Extracts all bill details including line items with exceptional accuracy.',
        },
        {
            icon: 'heroicons:key',
            title: 'Secure API key management',
            description: 'For seamless third-party integrations and automation.',
        },
        {
            icon: 'heroicons:shield-check',
            title: 'Enterprise-grade security',
            description: 'With role-based access control and data encryption.',
        },
    ];

    const benefits = [
        {
            icon: 'heroicons:clock',
            title: 'Save Time',
            description: 'Automate repetitive tasks and reduce manual data entry by up to 80%',
        },
        {
            icon: 'heroicons:currency-rupee',
            title: 'Reduce Costs',
            description: 'Cut operational costs with streamlined workflows and automation',
        },
        {
            icon: 'heroicons:chart-bar-square',
            title: 'Better Insights',
            description: 'Get real-time analytics and reports for informed decision making',
        },
    ];

    const faqs = [
        {
            q: 'What is Bill Munshi?',
            a: 'BM is a platform that helps automate bookkeeping tasks by capturing, processing and organising financial documents. It uses AI to extract data from receipts and bills, reducing the need for manual entry. BM integrates with widely used accounting software in India by both accountants and small businesses.',
        },
        {
            q: 'What kind of businesses uses Bill Munshi?',
            a: "Bill Munshi is designed for businesses of all sizes and industries. It's commonly used by retail, wholesale, hospitality, construction, and professional service businesses. Whether you handle a few transactions or thousands every month, Bill Munshi grows with your business and adapts to your workload.",
        },
        {
            q: 'Which accounting software Bill Munshi can integrate with?',
            a: 'Presently, BM integrates with Zoho Books and Tally.',
        },
        {
            q: 'What are the benefits of using Bill Munshi for accounting firms?',
            a: 'Bill Munshi helps accountants save time and work more efficiently. By automating routine admin and reducing manual data entry, it frees up your time to serve more clients, focus on higher-value advisory work, or simply enjoy better work-life balance—with fewer late nights.',
        },
        {
            q: 'How secure is the financial data on Bill Munshi?',
            a: 'Your financial data is safe with Bill Munshi. We use strong encryption to protect your information and follow industry best practices for data security. All documents on Bill Munshi are handled in line with GDPR and ISO standards, so your data remains secure and compliant at all times.',
        },
        {
            q: 'How do I get started?',
            a: 'You just need to submit a request here and our team will happily help you set up your account, and get your team up to speed.',
        },
        {
            q: 'Can I grant access of my Bill Munshi account to people outside my organization?',
            a: 'Yes. You can securely invite people outside your organization such as your accountant, consultant, or business partner to your Bill Munshi account. You stay in control by choosing what they can see or edit through customizable access levels.',
        },
        {
            q: 'Can I manage my clients from my account?',
            a: "Yes. You can manage multiple clients from a single Bill Munshi account. Easily keep each client's documents and data separate, control user access, and monitor activity—all from one dashboard.",
        },
        {
            q: 'Is Bill Munshi suitable for multi-user environment?',
            a: "Yes, Bill Munshi works well for teams. Multiple users can upload and manage documents at the same time. You can easily control each user's access and keep track of who has submitted what.",
        },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 antialiased">
            {/* The FAQ list below is also emitted as FAQPage structured data.
                Note: since Aug 2023 Google only renders FAQ rich results for
                government and health sites, so treat this as machine-readable
                context (and Bing/LLM crawlers), not a rich-snippet win. */}
            <Seo {...PAGE_SEO.home} schemas={[buildFaqSchema(faqs)]} />

            {/* Top trust bar */}
            <div className="bg-slate-950 text-slate-300 text-[13px]">
                <div className="container mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-center">
                    <span className="relative inline-flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-slate-400">All systems operational</span>
                    <span className="text-slate-700 hidden sm:inline">·</span>
                    <span className="hidden sm:inline text-white font-medium">Enterprise-grade security</span>
                    <span className="text-slate-700 hidden sm:inline">·</span>
                    <span className="hidden sm:inline">Hosted in India</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/85 dark:bg-slate-950/85 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-slate-800/80'
                : 'bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800'}`}>
                <div className="container mx-auto px-4 sm:px-6 py-3.5">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-700/20 group-hover:shadow-md transition-all duration-300">
                                <Icon icon="heroicons:document-text" className="text-lg text-white" />
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Bill Munshi
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-2">
                            <Link
                                to="/book-demo"
                                className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 shadow-xs"
                            >
                                Book Your Demo
                            </Link>
                            <Link
                                to="/auth/login"
                                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/auth/register"
                                className="group inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-all duration-200 shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20"
                            >
                                Start for Free
                                <Icon icon="heroicons:arrow-right" className="text-sm group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Icon icon={mobileMenuOpen ? 'heroicons:x-mark' : 'heroicons:bars-3'} className="text-2xl text-slate-900 dark:text-white" />
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-2 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                            <Link to="/book-demo" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-center text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">Book a Demo</Link>
                            <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Sign In</Link>
                            <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-center text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30">Start for Free</Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* ===================== HERO ===================== */}
            <section className="relative overflow-hidden bg-linear-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                {/* Subtle grid pattern */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] mask-[radial-gradient(ellipse_60%_50%_at_50%_30%,black_30%,transparent_75%)]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgb(15 23 42 / 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.06) 1px, transparent 1px)',
                        backgroundSize: '56px 56px',
                    }}
                />
                {/* Soft brand glow */}
                <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-240 h-160 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="container mx-auto px-4 sm:px-6 pt-10 sm:pt-16 md:pt-20 pb-14 sm:pb-16 md:pb-24 relative">
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                        {/* min-w-0: grid items default to min-width:auto, so the
                            preview card's nowrap content (see below) would force
                            this shared mobile column wider than the viewport. */}
                        <div className="lg:col-span-7 min-w-0 animate-fade-in-up">
                            {/* Eyebrow */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xs">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">New</span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI-powered OCR with native Tally &amp; Zoho sync</span>
                            </div>

                            <h1 className="mt-5 sm:mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1] sm:leading-[1.05] text-slate-900 dark:text-white">
                                <span className="bg-linear-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-white dark:via-blue-300 dark:to-white bg-clip-text text-transparent">
                                    Tired of manually recording &amp; organizing bills or expenses?
                                </span>
                            </h1>

                            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                                Save hours each week in processing purchases &amp; expenses. <br className="hidden sm:block" />
                                Create accounting entries in a few clicks with accuracy &amp; compliance.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/auth/register"
                                    className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-200 ring-1 ring-orange-600/20"
                                >
                                    <span>Start for Free</span>
                                    <Icon icon="heroicons:arrow-right" className="text-lg group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <Link
                                    to="/book-demo"
                                    className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg shadow-sm transition-all duration-200"
                                >
                                    <Icon icon="heroicons:play-circle" className="text-lg" />
                                    <span>Book Your Demo</span>
                                </Link>
                            </div>

                            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon icon="heroicons:check-circle" className="text-emerald-500 text-base" />
                                    No credit card required
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon icon="heroicons:check-circle" className="text-emerald-500 text-base" />
                                    Cancel anytime
                                </span>
                            </div>
                        </div>

                        {/* Hero showcase: dashboard preview card.
                            min-w-0 lets the truncating bill rows inside shrink
                            below their intrinsic width instead of stretching
                            the grid column past the screen edge. */}
                        <div className="lg:col-span-5 min-w-0 animate-fade-in" aria-hidden="true">
                            <div className="relative">
                                {/* Decorative gradient ring */}
                                <div className="absolute -inset-px rounded-3xl bg-linear-to-br from-blue-500/30 via-transparent to-orange-500/20 blur-sm" />
                                <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/40 p-3">
                                    {/* Window chrome */}
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <div className="flex gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                        </div>
                                        <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 font-mono">app.billmunshi.com/bills</div>
                                        <span className="w-3" />
                                    </div>
                                    {/* Content */}
                                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">This month</div>
                                                <div className="text-lg font-bold text-slate-900 dark:text-white">Vendor Bills</div>
                                            </div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                                                <Icon icon="heroicons:arrow-trending-up" className="text-xs" /> +24%
                                            </span>
                                        </div>

                                        {[
                                            { v: 'AC', name: 'Acme Components Pvt Ltd', amt: '₹ 1,24,500', state: 'Synced', tone: 'success' },
                                            { v: 'RT', name: 'Reliable Traders', amt: '₹ 86,200', state: 'Approved', tone: 'info' },
                                            { v: 'SK', name: 'Sky Logistics LLP', amt: '₹ 42,890', state: 'Review', tone: 'warn' },
                                            { v: 'VG', name: 'Vega Office Supplies', amt: '₹ 11,675', state: 'Synced', tone: 'success' },
                                        ].map((row, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 rounded-xl px-3 py-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center">{row.v}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{row.name}</div>
                                                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">{row.amt}</div>
                                                </div>
                                                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full
                                                    ${row.tone === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : ''}
                                                    ${row.tone === 'info' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' : ''}
                                                    ${row.tone === 'warn' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : ''}`}>
                                                    {row.state}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* KPIs strip */}
                                    <div className="mt-3 grid grid-cols-3 gap-px rounded-2xl overflow-hidden bg-slate-900 dark:bg-slate-800 text-white">
                                        {[
                                            { num: '98.7%', lbl: 'Accuracy' },
                                            { num: '12s', lbl: 'Avg. process' },
                                            { num: '0', lbl: 'Manual entries' },
                                        ].map((k, i) => (
                                            <div key={i} className="bg-slate-900 dark:bg-slate-800 px-3 py-3 text-center">
                                                <div className="text-base font-extrabold tracking-tight">{k.num}</div>
                                                <div className="text-[10px] uppercase tracking-wider text-slate-400">{k.lbl}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Floating badges */}
                                <div className="absolute -left-4 top-10 hidden md:flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-lg">
                                    <Icon icon="heroicons:check-badge" className="text-emerald-500 text-lg" />
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Synced to</div>
                                        <div className="text-xs font-semibold text-slate-900 dark:text-white">Tally ERP</div>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 hidden md:flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-lg">
                                    <Icon icon="heroicons:bolt" className="text-orange-500 text-lg" />
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Auto-extract</div>
                                        <div className="text-xs font-semibold text-slate-900 dark:text-white">Line items + GST</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats strip */}
                    <div className="mt-16 md:mt-20 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                        {stats.map((s, i) => (
                            <div key={i} className="p-6 md:p-7 text-center group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="inline-flex w-10 h-10 mb-3 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                                    <Icon icon={s.icon} className="text-xl" />
                                </div>
                                <div className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{s.value}</div>
                                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400 font-medium">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== HOW IT HELPS ===================== */}
            <section className="py-14 sm:py-20 md:py-28 bg-white dark:bg-slate-950">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-16 md:mb-20">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            How it helps
                        </h2>
                    </div>

                    {/* For Accountants */}
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 mb-20 md:mb-24 items-center">
                        <div className="order-2 md:order-1">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-linear-to-br from-blue-500/15 to-transparent rounded-3xl blur-xl" aria-hidden="true" />
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900">
                                    <img
                                        src="/accountants_dashboard_illustration.png"
                                        alt="Accountants managing multiple clients with dashboard"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-7 tracking-tight">For Accountants</h3>
                            <ul className="space-y-5">
                                {accountantPoints.map((p, i) => (
                                    <li key={i} className="flex gap-4">
                                        <span className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm">{i + 1}</span>
                                        <p className="text-slate-700 dark:text-slate-300 text-base md:text-lg leading-relaxed pt-0.5">{p}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* For Business Owner */}
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-7 tracking-tight">For Business Owner</h3>
                            <ul className="space-y-5">
                                {ownerPoints.map((p, i) => (
                                    <li key={i} className="flex gap-4">
                                        <span className="shrink-0 w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 ring-1 ring-orange-100 dark:ring-orange-900/60 text-orange-700 dark:text-orange-400 flex items-center justify-center font-bold text-sm">{i + 1}</span>
                                        <p className="text-slate-700 dark:text-slate-300 text-base md:text-lg leading-relaxed pt-0.5">{p}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <div className="relative">
                                <div className="absolute -inset-2 bg-linear-to-br from-orange-500/15 to-transparent rounded-3xl blur-xl" aria-hidden="true" />
                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900">
                                    <img
                                        src="/business_owner_expenses_illustration.png"
                                        alt="Business owners managing expenses and receipts"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== THREE STEPS AUTOMATION ===================== */}
            <section className="py-14 sm:py-20 md:py-28 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center mb-14 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Three Steps Automation
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[
                            { n: '01', icon: 'heroicons:arrow-up-tray', title: 'Upload', desc: 'Drop a PDF, photo or email attachment. We handle the rest.' },
                            { n: '02', icon: 'heroicons:check-badge', title: 'Verify', desc: 'AI extracts vendor, amounts, GST and line items — you review.' },
                            { n: '03', icon: 'heroicons:arrow-path', title: 'Sync', desc: 'Push directly to Tally or Zoho — fully audit-trailed.' },
                        ].map((s, i) => (
                            <div key={i} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-7 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300">
                                <span className="absolute top-5 right-5 text-xs font-mono font-semibold text-slate-400 dark:text-slate-600">{s.n}</span>
                                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 flex items-center justify-center mb-5">
                                    <Icon icon={s.icon} className="text-2xl" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">{s.title}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Video placeholder */}
                    <div className="max-w-4xl mx-auto mt-14">
                        <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-2xl border border-slate-200 dark:border-slate-800">
                            <div className="relative rounded-xl overflow-hidden bg-linear-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900" style={{ paddingBottom: '56.25%' }}>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                    <button
                                        type="button"
                                        aria-label="Play product demo"
                                        className="group inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
                                    >
                                        <Icon icon="heroicons:play-solid" className="text-2xl text-white translate-x-0.5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== ABOUT BILLMUNSHI ===================== */}
            <section className="py-14 sm:py-20 md:py-28 bg-white dark:bg-slate-950">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            About BillMunshi
                        </h2>
                        <p className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400">
                            Automate your manual accounting process with greater accuracy &amp; efficiency
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {[...aboutCards, ...benefits].map((c, i) => (
                            <div
                                key={i}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 md:p-8 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                                    <Icon icon={c.icon} className="text-2xl" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                                    {c.title}
                                </h3>
                                <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {c.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== INTEGRATIONS ===================== */}
            <section className="py-14 sm:py-20 md:py-28 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-12 md:mb-14">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-full text-xs font-semibold text-blue-700 dark:text-blue-400">
                            <Icon icon="heroicons:link" className="text-sm" />
                            Integrations
                        </span>
                        <h2 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                            Connect Your Tools
                        </h2>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                            Integrate with your favorite accounting platforms in just a few clicks
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 md:gap-6 max-w-4xl mx-auto">
                        {/* Zoho Books */}
                        <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 md:p-8 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
                            {/* flex-wrap + min-w-0 so the "Connected" pill drops to
                                its own line on narrow phones instead of squeezing
                                the title into a two-line wrap. */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 flex items-center justify-center">
                                    <Icon icon="simple-icons:zoho" className="text-2xl sm:text-3xl text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Zoho Books</div>
                                    <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Full Integration</div>
                                </div>
                                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Connected
                                </span>
                            </div>
                            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                                <li className="flex items-center gap-2"><Icon icon="heroicons:check-circle" className="text-emerald-500 text-base" /> Push vendor &amp; expense bills directly</li>
                                <li className="flex items-center gap-2"><Icon icon="heroicons:check-circle" className="text-emerald-500 text-base" /> Real-time chart of accounts sync</li>
                                <li className="flex items-center gap-2"><Icon icon="heroicons:check-circle" className="text-emerald-500 text-base" /> Tax &amp; GST mapping preserved</li>
                            </ul>
                        </div>

                        {/* Tally ERP */}
                        <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 md:p-8 hover:border-emerald-200 dark:hover:border-emerald-900 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-5">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/60 flex items-center justify-center">
                                    <Icon icon="heroicons:calculator" className="text-2xl sm:text-3xl text-emerald-700 dark:text-emerald-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Tally ERP</div>
                                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Complete Support</div>
                                </div>
                                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Connected
                                </span>
                            </div>
                            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                                <li className="flex items-center gap-2"><Icon icon="heroicons:check-circle" className="text-emerald-500 text-base" /> Native XML voucher posting</li>
                                <li className="flex items-center gap-2"><Icon icon="heroicons:check-circle" className="text-emerald-500 text-base" /> Ledger, master &amp; cost-centre mapping</li>
                                <li className="flex items-center gap-2"><Icon icon="heroicons:check-circle" className="text-emerald-500 text-base" /> Round-off &amp; auto-reconciliation</li>
                            </ul>
                        </div>
                    </div>

                    {/* Trust strip */}
                    <div className="mt-10 flex items-center justify-center gap-x-8 gap-y-3 flex-wrap text-sm text-slate-600 dark:text-slate-400">
                        <div className="inline-flex items-center gap-2">
                            <Icon icon="heroicons:bolt" className="text-blue-600 dark:text-blue-400 text-base" />
                            <span className="font-medium">Real-time Sync</span>
                        </div>
                        <span className="hidden sm:inline w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <div className="inline-flex items-center gap-2">
                            <Icon icon="heroicons:cog-6-tooth" className="text-blue-600 dark:text-blue-400 text-base" />
                            <span className="font-medium">Automated Workflows</span>
                        </div>
                        <span className="hidden sm:inline w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        <div className="inline-flex items-center gap-2">
                            <Icon icon="heroicons:lock-closed" className="text-blue-600 dark:text-blue-400 text-base" />
                            <span className="font-medium">Secure Connection</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== CTA ===================== */}
            <section className="py-14 sm:py-20 md:py-28 bg-white dark:bg-slate-950">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="relative bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 md:p-16 text-center overflow-hidden shadow-2xl border border-slate-800">
                        <div aria-hidden="true" className="absolute inset-0 opacity-60">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />
                        </div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold text-white">
                                <Icon icon="heroicons:rocket-launch" className="text-blue-400" />
                                Get Started Today
                            </span>

                            <h2 className="mt-6 text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                                Ready to upgrade the way you manage accounting.
                            </h2>

                            <p className="mt-4 text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
                                Automate routine tasks, improve accuracy, and scale with confidence.
                            </p>

                            <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                                <Link
                                    to="/auth/register"
                                    className="group inline-flex items-center justify-center gap-2 px-7 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-base shadow-xl shadow-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-200 ring-1 ring-orange-600/30"
                                >
                                    <span>Start for Free</span>
                                    <Icon icon="heroicons:arrow-right" className="text-lg group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                                <Link
                                    to="/book-demo"
                                    className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 hover:border-white/30 text-white rounded-lg font-semibold text-base transition-all duration-200"
                                >
                                    Book Your Demo
                                </Link>
                            </div>

                            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
                                <div className="inline-flex items-center gap-2">
                                    <Icon icon="heroicons:check-badge" className="text-emerald-400 text-base" />
                                    No credit card required
                                </div>
                                <div className="inline-flex items-center gap-2">
                                    <Icon icon="heroicons:check-badge" className="text-emerald-400 text-base" />
                                    Cancel anytime
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== FAQs ===================== */}
            <section className="py-14 sm:py-20 md:py-28 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-xs mb-5">
                            <Icon icon="heroicons:question-mark-circle" className="text-blue-600 dark:text-blue-400 text-sm" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Got Questions?</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            FAQs
                        </h2>
                        <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-400">
                            Find answers to common questions about Bill Munshi
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-3">
                        {faqs.map((f, i) => {
                            const open = openFaq === i;
                            return (
                                <div
                                    key={i}
                                    className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 ${open ? 'border-blue-200 dark:border-blue-900 shadow-md shadow-blue-500/5' : 'border-slate-200 dark:border-slate-800 shadow-xs'}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(open ? null : i)}
                                        aria-expanded={open}
                                        className="w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
                                    >
                                        <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white pr-2">{f.q}</h3>
                                        <span className={`shrink-0 w-8 h-8 rounded-lg ring-1 flex items-center justify-center transition-all duration-200 ${open ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 ring-blue-200 dark:ring-blue-900' : 'ring-slate-200 dark:ring-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                            <Icon icon={open ? 'heroicons:minus' : 'heroicons:plus'} className="text-base" />
                                        </span>
                                    </button>
                                    {open && (
                                        <div className="px-5 md:px-6 pb-5 md:pb-6 -mt-1">
                                            <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">{f.a}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ===================== FOOTER ===================== */}
            <footer className="bg-slate-950 text-slate-400">
                <div className="container mx-auto px-4 sm:px-6 py-14">
                    <div className="grid grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10 pb-10 border-b border-slate-800">
                        <div className="col-span-2 md:col-span-5">
                            <Link to="/" className="inline-flex items-center gap-2.5 group">
                                <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-blue-700/30">
                                    <Icon icon="heroicons:document-text" className="text-lg text-white" />
                                </div>
                                <span className="text-xl font-bold text-white tracking-tight">Bill Munshi</span>
                            </Link>
                            <p className="mt-4 text-sm leading-relaxed max-w-sm text-slate-400">
                                Automate your manual accounting process with greater accuracy &amp; efficiency.
                            </p>
                            <a href="mailto:support@billmunshi.com" className="mt-5 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                                <Icon icon="heroicons:envelope" className="text-base" />
                                support@billmunshi.com
                            </a>
                        </div>

                        <div className="md:col-span-3">
                            <h6 className="text-xs font-bold uppercase tracking-[0.14em] text-white mb-4">Product</h6>
                            <ul className="space-y-2.5 text-sm">
                                <li><Link to="/book-demo" className="hover:text-white transition-colors">Book Your Demo</Link></li>
                                <li><Link to="/auth/register" className="hover:text-white transition-colors">Start for Free</Link></li>
                                <li><Link to="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
                            </ul>
                        </div>

                        <div className="md:col-span-2">
                            <h6 className="text-xs font-bold uppercase tracking-[0.14em] text-white mb-4">Company</h6>
                            <ul className="space-y-2.5 text-sm">
                                <li><Link to="/" className="hover:text-white transition-colors">About</Link></li>
                            </ul>
                        </div>

                        <div className="md:col-span-2">
                            <h6 className="text-xs font-bold uppercase tracking-[0.14em] text-white mb-4">Legal</h6>
                            <ul className="space-y-2.5 text-sm">
                                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                                <li>
                                    <CookieSettingsLink className="hover:text-white transition-colors cursor-pointer" />
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                        <p>© {new Date().getFullYear()} Bill Munshi. All rights reserved.</p>
                        <div className="flex items-center gap-2">
                            <span className="relative inline-flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            </span>
                            All systems operational
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
