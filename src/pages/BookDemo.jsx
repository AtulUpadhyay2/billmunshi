import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { useBookDemoMutation } from '@/store/api/demo/demoApiSlice';
import { validateBusinessEmail } from '@/utils/businessEmail';
import Seo from '@/components/Seo';
import ReCaptcha from '@/components/ReCaptcha';
import { isRecaptchaConfigured } from '@/config/recaptcha';
import { PAGE_SEO } from '@/config/seo';

const BookDemo = () => {
    const navigate = useNavigate();
    const [bookDemo, { isLoading }] = useBookDemoMutation();
    const [formData, setFormData] = useState({
        fullName: '',
        organization: '',
        software: '',
        email: '',
        phone: '',
    });
    const [errors, setErrors] = useState({});
    const [captchaToken, setCaptchaToken] = useState('');
    const captchaRef = useRef(null);

    const handleCaptchaChange = (token) => {
        setCaptchaToken(token || '');
        // Passing the check clears the "tick the box" error immediately.
        if (token) setErrors((prev) => (prev.captcha ? { ...prev, captcha: '' } : prev));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear the field's error as soon as the user edits it.
        setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
    };

    // Validate the work email on blur so the "use a business address"
    // rule surfaces before the user reaches the submit button.
    const handleEmailBlur = () => {
        if (!formData.email) return;
        setErrors((prev) => ({ ...prev, email: validateBusinessEmail(formData.email) }));
    };

    const validate = () => {
        const next = {};
        if (formData.fullName.trim().length < 2) next.fullName = 'Please enter your full name.';
        if (formData.organization.trim().length < 2) next.organization = 'Please enter your organization name.';
        if (!formData.software) next.software = 'Please select your accounting software.';

        const emailError = validateBusinessEmail(formData.email);
        if (emailError) next.email = emailError;

        const digits = formData.phone.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 15) next.phone = 'Please enter a valid phone number.';

        // Only demanded when a site key is configured; without one the
        // widget isn't rendered and the backend isn't verifying either.
        if (isRecaptchaConfigured() && !captchaToken) {
            next.captcha = 'Please complete the “I’m not a robot” check.';
        }

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const response = await bookDemo({
                full_name: formData.fullName.trim(),
                organization: formData.organization.trim(),
                accounting_software: formData.software,
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                recaptcha_token: captchaToken,
            }).unwrap();

            toast.success(response?.message || 'Thank you! We will contact you shortly to schedule your demo.');
            setFormData({ fullName: '', organization: '', software: '', email: '', phone: '' });
            setErrors({});
            captchaRef.current?.reset();
            navigate('/');
        } catch (error) {
            const data = error?.data || {};

            // Google burns a token on the first siteverify call, so any
            // failed submit leaves the visitor holding a dead one. Clear
            // the widget before they try again.
            captchaRef.current?.reset();

            // 409 + already_booked — this email has a demo on file already.
            if (data.code === 'already_booked') {
                const message = data.message || 'Your demo is already booked with this email.';
                setErrors({ email: message });
                toast.info(message);
                return;
            }

            // Map DRF's per-field errors back onto the form.
            const fieldMap = {
                full_name: 'fullName',
                organization: 'organization',
                accounting_software: 'software',
                email: 'email',
                phone: 'phone',
                recaptcha_token: 'captcha',
            };
            const mapped = {};
            Object.entries(data.errors || {}).forEach(([key, messages]) => {
                const field = fieldMap[key];
                if (field) mapped[field] = Array.isArray(messages) ? messages[0] : String(messages);
            });

            if (Object.keys(mapped).length) {
                setErrors(mapped);
                toast.error(data.message || 'Please check the form and try again.');
            } else {
                toast.error(data.message || 'Something went wrong. Please try again later.');
            }
        }
    };

    const inputBase =
        'w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600';

    const inputErrorRing =
        'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-800';

    const fieldClass = (field) => `${inputBase} ${errors[field] ? inputErrorRing : ''}`;

    const FieldError = ({ field }) =>
        errors[field] ? (
            <p className="mt-1 flex items-start gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                <Icon icon="heroicons:exclamation-circle" className="text-xs shrink-0 mt-0.5" />
                <span>{errors[field]}</span>
            </p>
        ) : null;

    return (
        <div className="h-screen flex bg-white dark:bg-slate-950 antialiased text-slate-800 dark:text-slate-200 overflow-hidden">
            <Seo {...PAGE_SEO.bookDemo} />

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
                        to="/"
                        className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <Icon icon="heroicons:arrow-left" className="text-base" />
                        Back to home
                    </Link>
                </div>

                {/* Form */}
                <div className="flex-1 flex items-center justify-center py-6">
                    <div className="w-full max-w-xl">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 rounded-full text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-3">
                            <Icon icon="heroicons:calendar-days" className="text-xs" />
                            Schedule your demo
                        </span>

                        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                            Book a live demo
                        </h1>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 mb-5">
                            See Bill Munshi in action. Our team will walk you through every feature and answer your questions.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-3.5">
                            <div className="grid sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Full name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Icon icon="heroicons:user" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            required
                                            autoComplete="name"
                                            className={fieldClass('fullName')}
                                            placeholder="Your full name"
                                        />
                                    </div>
                                    <FieldError field="fullName" />
                                </div>

                                <div>
                                    <label htmlFor="organization" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Organization <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Icon icon="heroicons:building-office" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                                        <input
                                            type="text"
                                            id="organization"
                                            name="organization"
                                            value={formData.organization}
                                            onChange={handleInputChange}
                                            required
                                            autoComplete="organization"
                                            className={fieldClass('organization')}
                                            placeholder="Your organization"
                                        />
                                    </div>
                                    <FieldError field="organization" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="software" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Accounting software <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <Icon icon="heroicons:calculator" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                                    <select
                                        id="software"
                                        name="software"
                                        value={formData.software}
                                        onChange={handleInputChange}
                                        required
                                        className={`${fieldClass('software')} pr-10 cursor-pointer appearance-none`}
                                    >
                                        <option value="">Select your accounting software</option>
                                        <option value="zoho">Zoho Books</option>
                                        <option value="tally">Tally</option>
                                        <option value="both">Both (Zoho Books &amp; Tally)</option>
                                        <option value="other">Other / Not sure</option>
                                    </select>
                                    <Icon icon="heroicons:chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
                                </div>
                                <FieldError field="software" />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Work email <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Icon icon="heroicons:envelope" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onBlur={handleEmailBlur}
                                            required
                                            autoComplete="email"
                                            className={fieldClass('email')}
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                    {errors.email ? (
                                        <FieldError field="email" />
                                    ) : (
                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                            Use your company email — personal accounts aren&rsquo;t accepted.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Phone <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Icon icon="heroicons:phone" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            autoComplete="tel"
                                            className={fieldClass('phone')}
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                    <FieldError field="phone" />
                                </div>
                            </div>

                            <ReCaptcha
                                ref={captchaRef}
                                onChange={handleCaptchaChange}
                                error={errors.captcha}
                                className="pt-1"
                            />

                            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                                <Link
                                    to="/"
                                    className="sm:flex-1 inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group sm:flex-2 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-200 ring-1 ring-orange-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
                                >
                                    {isLoading ? (
                                        <>
                                            <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                                            <span>Scheduling…</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="heroicons:paper-airplane" className="text-base" />
                                            <span>Schedule my demo</span>
                                            <Icon icon="heroicons:arrow-right" className="text-base group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                <Icon icon="heroicons:lock-closed" className="text-blue-500 text-sm shrink-0 mt-0.5" />
                                <p>
                                    We respect your privacy. Your information is only used to contact you about the demo.
                                </p>
                            </div>
                        </form>
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

                <div className="relative z-10 flex flex-col justify-center w-full px-12 xl:px-16 text-white overflow-y-auto py-10">
                    <span className="self-start inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full text-xs font-semibold">
                        <Icon icon="heroicons:gift" className="text-sm text-orange-300" />
                        Limited time offer
                    </span>

                    <h2 className="mt-6 text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
                        See it for yourself in{" "}
                        <span className="bg-linear-to-r from-blue-400 to-orange-300 bg-clip-text text-transparent">
                            30 minutes.
                        </span>
                    </h2>
                    <p className="mt-5 text-lg text-slate-300 max-w-md leading-relaxed">
                        Process up to <span className="font-semibold text-orange-300">50 bills/month</span> for free with <span className="font-semibold text-orange-300">1GB</span> storage — for the first 100 users.
                    </p>

                    <ul className="mt-8 space-y-3.5 max-w-md">
                        {[
                            { icon: 'heroicons:user-group', t: 'Personalized walkthrough', d: '30-minute live demo with a product expert.' },
                            { icon: 'heroicons:chat-bubble-left-right', t: 'Live Q&A', d: 'Get every question answered in real time.' },
                            { icon: 'heroicons:cog-6-tooth', t: 'Custom setup advice', d: 'Recommendations tailored to your business.' },
                            { icon: 'heroicons:gift', t: 'Free trial after demo', d: 'Try BillMunshi end-to-end with no commitment.' },
                        ].map((b, i) => (
                            <li key={i} className="flex gap-3.5 items-start">
                                <span className="shrink-0 w-9 h-9 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                    <Icon icon={b.icon} className="text-base text-blue-300" />
                                </span>
                                <div>
                                    <div className="text-sm font-semibold text-white">{b.t}</div>
                                    <div className="text-xs text-slate-400">{b.d}</div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex items-center gap-x-5 gap-y-2 flex-wrap text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                            <Icon icon="heroicons:clock" className="text-emerald-400 text-sm" /> Reply within 24h
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Icon icon="heroicons:shield-check" className="text-emerald-400 text-sm" /> No commitment
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDemo;
