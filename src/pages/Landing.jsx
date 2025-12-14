import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const Landing = () => {
    const [scrolled, setScrolled] = useState(false);

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white dark:bg-slate-900 shadow-md' : 'bg-white dark:bg-slate-900'}`}>
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                                <Icon icon="heroicons:document-text" className="text-xl text-white dark:text-slate-900" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                Bill Munshi
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link
                                to="/auth/login"
                                className="px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/auth/register"
                                className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative container mx-auto px-6 pt-32 pb-20">
                <div className="text-center max-w-5xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full mb-8">
                        <Icon icon="heroicons:sparkles" className="text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Trusted by 100+ Organizations</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-slate-900 dark:text-white">
                        Streamline Your <span className="text-blue-600">Billing</span> Management
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Efficiently manage vendor bills, expense bills, and journal entries with seamless <span className="font-semibold text-blue-600">Zoho</span> and <span className="font-semibold text-green-600">Tally</span> integration.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-base hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            <span>Start Free Trial</span>
                            <Icon icon="heroicons:arrow-right" className="text-xl" />
                        </Link>
                        <Link
                            to="/auth/login"
                            className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-base hover:border-blue-600 dark:hover:border-blue-600 transition-all duration-300"
                        >
                            Sign In
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
                            >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto ${stat.color === 'blue' ? 'bg-blue-500' :
                                    stat.color === 'green' ? 'bg-green-500' :
                                        stat.color === 'purple' ? 'bg-purple-500' :
                                            'bg-orange-500'
                                    }`}>
                                    <Icon icon={stat.icon} className="text-2xl text-white" />
                                </div>
                                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white dark:bg-slate-800">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full mb-6">
                            <Icon icon="heroicons:star" className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Powerful Features</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                            Everything You Need
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            Comprehensive tools to manage your bills and accounting in one unified platform
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
                            >
                                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon icon={feature.icon} className="text-3xl text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section className="py-20 bg-gray-50 dark:bg-slate-900">
                <div className="container mx-auto px-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-12 md:p-16 text-center">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                            <Icon icon="heroicons:link" className="text-white" />
                            <span className="text-sm font-medium text-white">Seamless Integration</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                            Connect Your Tools
                        </h2>
                        <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
                            Integrate with your favorite accounting platforms in just a few clicks
                        </p>

                        <div className="flex items-center justify-center gap-6 flex-wrap">
                            <div className="flex items-center space-x-3 bg-white px-8 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <Icon icon="simple-icons:zoho" className="text-4xl text-blue-600" />
                                <span className="text-2xl font-bold text-slate-900">Zoho Books</span>
                            </div>
                            <div className="flex items-center space-x-3 bg-white px-8 py-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <Icon icon="heroicons:calculator" className="text-4xl text-green-600" />
                                <span className="text-2xl font-bold text-slate-900">Tally ERP</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white dark:bg-slate-800">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full mb-6">
                            <Icon icon="heroicons:rocket-launch" className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Get Started Today</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                            Ready to Get Started?
                        </h2>

                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                            Join hundreds of businesses streamlining their bill management today
                        </p>

                        <Link
                            to="/auth/register"
                            className="inline-flex items-center space-x-2 px-10 py-5 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl"
                        >
                            <span>Create Free Account</span>
                            <Icon icon="heroicons:arrow-right" className="text-xl" />
                        </Link>

                        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                            No credit card required • 14-day free trial • Cancel anytime
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-700 py-10 bg-gray-50 dark:bg-slate-900">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="flex items-center space-x-3 mb-4 md:mb-0">
                            <div className="w-9 h-9 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                                <Icon icon="heroicons:document-text" className="text-lg text-white dark:text-slate-900" />
                            </div>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">Bill Munshi</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            © {new Date().getFullYear()} Bill Munshi. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
