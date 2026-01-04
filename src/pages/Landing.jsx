import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const Landing = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: 'heroicons:document-text',
            title: 'Bill Management',
            description: 'Efficiently manage vendor bills, expense bills, and journal entries in one centralized platform.',
            color: 'blue',
            bgColor: 'bg-blue-500',
        },
        {
            icon: 'heroicons:chart-bar',
            title: 'Zoho Integration',
            description: 'Seamlessly integrate with Zoho Books for comprehensive accounting and financial management.',
            color: 'purple',
            bgColor: 'bg-purple-500',
        },
        {
            icon: 'heroicons:calculator',
            title: 'Tally Support',
            description: 'Full support for Tally ERP with ledgers, masters, and automated setup configurations.',
            color: 'green',
            bgColor: 'bg-green-500',
        },
        {
            icon: 'heroicons:users',
            title: 'Team Collaboration',
            description: 'Manage team members, assign roles, and control permissions with granular access control.',
            color: 'orange',
            bgColor: 'bg-orange-500',
        },
        {
            icon: 'heroicons:key',
            title: 'API Integration',
            description: 'Secure API key management for seamless third-party integrations and automation.',
            color: 'blue',
            bgColor: 'bg-blue-600',
        },
        {
            icon: 'heroicons:shield-check',
            title: 'Secure & Reliable',
            description: 'Enterprise-grade security with role-based access control and data encryption.',
            color: 'indigo',
            bgColor: 'bg-indigo-600',
        }
    ];

    const stats = [
        { value: '100+', label: 'Organizations', icon: 'heroicons:building-office', color: 'blue' },
        { value: '10K+', label: 'Bills Processed', icon: 'heroicons:document-check', color: 'green' },
        { value: '99.9%', label: 'Uptime', icon: 'heroicons:arrow-trending-up', color: 'purple' },
        { value: '24/7', label: 'Support', icon: 'heroicons:chat-bubble-left-right', color: 'orange' }
    ];

    const testimonials = [
        {
            name: 'Rajesh Kumar',
            role: 'CFO, Tech Solutions Inc.',
            image: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=3b82f6&color=fff',
            content: 'Bill Munshi has transformed how we handle our accounting. The Zoho integration is seamless and saves us hours every week.',
            rating: 5
        },
        {
            name: 'Priya Sharma',
            role: 'Accountant, Global Enterprises',
            image: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=8b5cf6&color=fff',
            content: 'The best billing management system we have used. The Tally integration works flawlessly and the support team is amazing.',
            rating: 5
        },
        {
            name: 'Amit Patel',
            role: 'Finance Manager, Startup Hub',
            image: 'https://ui-avatars.com/api/?name=Amit+Patel&background=10b981&color=fff',
            content: 'Incredibly user-friendly platform. Our team was up and running in no time. Highly recommend for any business!',
            rating: 5
        }
    ];

    const benefits = [
        {
            icon: 'heroicons:clock',
            title: 'Save Time',
            description: 'Automate repetitive tasks and reduce manual data entry by up to 80%'
        },
        {
            icon: 'heroicons:currency-rupee',
            title: 'Reduce Costs',
            description: 'Cut operational costs with streamlined workflows and automation'
        },
        {
            icon: 'heroicons:chart-bar-square',
            title: 'Better Insights',
            description: 'Get real-time analytics and reports for informed decision making'
        },
        {
            icon: 'heroicons:shield-check',
            title: 'Stay Compliant',
            description: 'Ensure compliance with automated tax calculations and audit trails'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-800">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg' : 'bg-white dark:bg-slate-900'}`}>
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                <Icon icon="heroicons:document-text" className="text-xl text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Bill Munshi
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-2">
                            <Link
                                to="/book-demo"
                                className="px-6 py-2.5 text-sm font-medium bg-slate-500 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                                Book a Demo
                            </Link>
                            <Link
                                to="/auth/login"
                                className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all duration-300 rounded-lg"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/auth/register"
                                className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                                Get Started Free
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Icon icon={mobileMenuOpen ? "heroicons:x-mark" : "heroicons:bars-3"} className="text-2xl text-slate-900 dark:text-white" />
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                            <Link
                                to="/book-demo"
                                className="block px-4 py-2.5 text-sm font-medium text-center bg-slate-500 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-all duration-300"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Book a Demo
                            </Link>
                            <Link
                                to="/auth/login"
                                className="block px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 text-center border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 rounded-lg transition-all duration-300"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/auth/register"
                                className="block px-4 py-2.5 text-sm font-medium text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Get Started Free
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative container mx-auto px-6 pt-32 pb-20 overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-40 left-10 w-72 h-72 bg-purple-200 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

                <div className="relative text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-full mb-8 backdrop-blur-sm shadow-lg animate-fade-in-down">
                        <Icon icon="heroicons:sparkles" className="text-blue-600 dark:text-blue-400 animate-pulse" />
                        <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Trusted by 100+ Organizations</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight animate-fade-in-up">
                        <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-white dark:via-blue-300 dark:to-white bg-clip-text text-transparent">
                            Streamline Your
                        </span>
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Billing Management
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-6 max-w-3xl mx-auto leading-relaxed animate-fade-in">
                        Efficiently manage vendor bills, expense bills, and journal entries with seamless{' '}
                        <span className="font-bold text-blue-600 dark:text-blue-400">Zoho</span> and{' '}
                        <span className="font-bold text-green-600 dark:text-green-400">Tally</span> integration.
                    </p>

                    {/* Special Offer Banner */}
                    <div className="mb-10 max-w-3xl mx-auto animate-fade-in">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-6 shadow-lg">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Icon icon="heroicons:gift" className="text-xl text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="inline-flex items-center gap-2 mb-2">
                                        <Icon icon="heroicons:sparkles" className="text-amber-600 dark:text-amber-400 animate-pulse" />
                                        <span className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">Limited Time Offer</span>
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                                        Process upto <span className="font-bold text-amber-700 dark:text-amber-400">50 bills/receipts per month</span> for free and get total storage of <span className="font-bold text-amber-700 dark:text-amber-400">1GB</span>. Offer available for first <span className="font-bold text-amber-700 dark:text-amber-400">100 users</span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up">
                        <Link
                            to="/auth/register"
                            className="group inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-base hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                        >
                            <span>Start Free Trial</span>
                            <Icon icon="heroicons:arrow-right" className="text-xl group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/auth/login"
                            className="group inline-flex items-center space-x-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-base hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                        >
                            <Icon icon="heroicons:play-circle" className="text-xl" />
                            <span>Watch Demo</span>
                        </Link>
                    </div>

                    <div className="flex items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-400 mb-16">
                        <div className="flex items-center gap-2">
                            <Icon icon="heroicons:check-circle" className="text-green-500 text-lg" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Icon icon="heroicons:check-circle" className="text-green-500 text-lg" />
                            <span>14-day free trial</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <Icon icon="heroicons:check-circle" className="text-green-500 text-lg" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 transform hover:scale-105"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 mx-auto transition-transform group-hover:scale-110 ${stat.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                                    stat.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                                        stat.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                                            'bg-gradient-to-br from-orange-500 to-orange-600'
                                    } shadow-lg`}>
                                    <Icon icon={stat.icon} className="text-2xl text-white" />
                                </div>
                                <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 text-sm font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white dark:bg-slate-800/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-full mb-6 backdrop-blur-sm shadow-lg">
                            <Icon icon="heroicons:star" className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Powerful Features</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                            <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Everything You Need
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            Comprehensive tools to manage your bills and accounting in one unified platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-2xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                    <Icon icon={feature.icon} className="text-3xl text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Benefits Section */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="text-center p-6 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg">
                                    <Icon icon={benefit.icon} className="text-2xl text-white" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                    {benefit.title}
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {benefit.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <div className="container mx-auto px-6">
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 dark:from-blue-700 dark:via-blue-800 dark:to-purple-800 rounded-3xl p-12 md:p-16 text-center shadow-2xl relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10">
                            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-full mb-6 shadow-lg">
                                <Icon icon="heroicons:link" className="text-white text-lg" />
                                <span className="text-sm font-semibold text-white">Seamless Integration</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
                                Connect Your Tools
                            </h2>
                            <p className="text-lg text-blue-100 mb-12 max-w-2xl mx-auto">
                                Integrate with your favorite accounting platforms in just a few clicks
                            </p>

                            <div className="flex items-center justify-center gap-6 flex-wrap">
                                <div className="flex items-center space-x-4 bg-white px-10 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 transform">
                                    <Icon icon="simple-icons:zoho" className="text-5xl text-blue-600" />
                                    <div className="text-left">
                                        <span className="text-2xl font-bold text-slate-900 block">Zoho Books</span>
                                        <span className="text-sm text-slate-600">Full Integration</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 bg-white px-10 py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 transform">
                                    <Icon icon="heroicons:calculator" className="text-5xl text-green-600" />
                                    <div className="text-left">
                                        <span className="text-2xl font-bold text-slate-900 block">Tally ERP</span>
                                        <span className="text-sm text-slate-600">Complete Support</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex items-center justify-center gap-8 text-white/90">
                                <div className="flex items-center gap-2">
                                    <Icon icon="heroicons:check-circle" className="text-2xl" />
                                    <span className="text-sm font-medium">Real-time Sync</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="heroicons:check-circle" className="text-2xl" />
                                    <span className="text-sm font-medium">Automated Workflows</span>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <Icon icon="heroicons:check-circle" className="text-2xl" />
                                    <span className="text-sm font-medium">Secure Connection</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white dark:bg-slate-800">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-full mb-6 backdrop-blur-sm shadow-lg">
                            <Icon icon="heroicons:chat-bubble-left-right" className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Client Success Stories</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                            <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                What Our Clients Say
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            Hear from businesses that have transformed their billing management with Bill Munshi
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="flex items-center mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Icon key={i} icon="heroicons:star-solid" className="text-yellow-400 text-lg" />
                                    ))}
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 mb-6 italic leading-relaxed">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full border-2 border-blue-500 shadow-lg"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {testimonial.name}
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-400">
                                            {testimonial.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <div className="container mx-auto px-6">
                    <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-12 md:p-16 text-center overflow-hidden shadow-2xl">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10 max-w-3xl mx-auto">
                            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-6 shadow-lg">
                                <Icon icon="heroicons:rocket-launch" className="text-blue-400" />
                                <span className="text-sm font-semibold text-blue-300">Get Started Today</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
                                Ready to Transform Your Billing?
                            </h2>

                            <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                                Join hundreds of businesses streamlining their bill management today and experience the difference
                            </p>

                            <Link
                                to="/auth/register"
                                className="group inline-flex items-center space-x-2 px-12 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
                            >
                                <span>Create Free Account</span>
                                <Icon icon="heroicons:arrow-right" className="text-xl group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Icon icon="heroicons:check-badge" className="text-green-400 text-xl" />
                                    <span className="text-sm">No credit card required</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="heroicons:check-badge" className="text-green-400 text-xl" />
                                    <span className="text-sm">14-day free trial</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="heroicons:check-badge" className="text-green-400 text-xl" />
                                    <span className="text-sm">Cancel anytime</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-700 py-12 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-2 md:col-span-1">
                            <Link to="/" className="flex items-center space-x-3 mb-4 group">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                    <Icon icon="heroicons:document-text" className="text-xl text-white" />
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-white">Bill Munshi</span>
                            </Link>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Streamline your billing management with seamless Zoho and Tally integration.
                            </p>
                            <div className="flex space-x-3">
                                <a href="#" className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all duration-300">
                                    <Icon icon="heroicons:envelope" className="text-lg" />
                                </a>
                                <a href="#" className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all duration-300">
                                    <Icon icon="heroicons:phone" className="text-lg" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Product</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/auth/register" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</Link></li>
                                <li><Link to="/auth/register" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Integrations</Link></li>
                                <li><Link to="/auth/register" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link></li>
                                <li><Link to="/auth/register" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">API</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Company</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About</Link></li>
                                <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</Link></li>
                                <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Careers</Link></li>
                                <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/privacy-policy" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                                <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Security</Link></li>
                                <li><Link to="/" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Compliance</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                © {new Date().getFullYear()} Bill Munshi. All rights reserved.
                            </p>
                            <div className="flex items-center gap-6">
                                <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors">
                                    support@billmunshi.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
