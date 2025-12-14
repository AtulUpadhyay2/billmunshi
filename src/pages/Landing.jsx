import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

const Landing = () => {
    const features = [
        {
            icon: 'heroicons:document-text',
            title: 'Bill Management',
            description: 'Efficiently manage vendor bills, expense bills, and journal entries in one centralized platform.',
        },
        {
            icon: 'heroicons:chart-bar',
            title: 'Zoho Integration',
            description: 'Seamlessly integrate with Zoho Books for comprehensive accounting and financial management.',
        },
        {
            icon: 'heroicons:calculator',
            title: 'Tally Support',
            description: 'Full support for Tally ERP with ledgers, masters, and automated setup configurations.',
        },
        {
            icon: 'heroicons:users',
            title: 'Team Collaboration',
            description: 'Manage team members, assign roles, and control permissions with granular access control.',
        },
        {
            icon: 'heroicons:key',
            title: 'API Integration',
            description: 'Secure API key management for seamless third-party integrations and automation.',
        },
        {
            icon: 'heroicons:shield-check',
            title: 'Secure & Reliable',
            description: 'Enterprise-grade security with role-based access control and data encryption.',
        }
    ];

    const stats = [
        { value: '100+', label: 'Organizations' },
        { value: '10K+', label: 'Bills Processed' },
        { value: '99.9%', label: 'Uptime' },
        { value: '24/7', label: 'Support' }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900">
            {/* Navigation */}
            <nav className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                                <Icon icon="heroicons:document-text" className="text-2xl text-white dark:text-slate-900" />
                            </div>
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                Bill Munshi
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Link
                                to="/auth/login"
                                className="px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/auth/register"
                                className="px-6 py-2.5 text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-6 pt-20 pb-24">
                <div className="text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-slate-900 dark:text-white">
                        Simplify Your Bill Management
                    </h1>
                    <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Streamline your accounting workflow with seamless Zoho and Tally integration.
                        Manage vendor bills, expenses, and journal entries with ease.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center space-x-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-semibold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300"
                        >
                            <span>Start Free Trial</span>
                            <Icon icon="heroicons:arrow-right" className="text-xl" />
                        </Link>
                        <Link
                            to="/auth/login"
                            className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                        >
                            Watch Demo
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-200 dark:border-slate-700">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-slate-50 dark:bg-slate-800/50 py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                            Powerful Features
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                            Everything you need to manage your bills and accounting in one place
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center mb-6">
                                    <Icon icon={feature.icon} className="text-3xl text-white dark:text-slate-900" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section className="container mx-auto px-6 py-20">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-12 border border-slate-200 dark:border-slate-700">
                    <div className="text-center max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
                            Seamless Integration
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
                            Connect with your favorite accounting platforms
                        </p>
                        <div className="flex items-center justify-center gap-12 flex-wrap">
                            <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <Icon icon="simple-icons:zoho" className="text-4xl text-slate-900 dark:text-white" />
                                <span className="text-2xl font-semibold text-slate-900 dark:text-white">Zoho Books</span>
                            </div>
                            <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 px-8 py-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <Icon icon="heroicons:calculator" className="text-4xl text-slate-900 dark:text-white" />
                                <span className="text-2xl font-semibold text-slate-900 dark:text-white">Tally ERP</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-slate-50 dark:bg-slate-800/50 py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
                            Ready to Get Started?
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                            Join hundreds of businesses streamlining their bill management today
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center space-x-2 px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all duration-300"
                        >
                            <span>Create Free Account</span>
                            <Icon icon="heroicons:arrow-right" className="text-xl" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-700 py-8 bg-white dark:bg-slate-900">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="flex items-center space-x-3 mb-4 md:mb-0">
                            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-lg flex items-center justify-center">
                                <Icon icon="heroicons:document-text" className="text-xl text-white dark:text-slate-900" />
                            </div>
                            <span className="text-lg font-semibold text-slate-900 dark:text-white">Bill Munshi</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            © 2024 Bill Munshi. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
