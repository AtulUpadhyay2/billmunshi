import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

const BookDemo = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        organization: '',
        software: '',
        email: '',
        phone: ''
    });

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Demo booking:', formData);
        
        // Show success message (you can integrate with your toast system)
        alert('Thank you! We will contact you shortly to schedule your demo.');
        
        // Reset form
        setFormData({
            fullName: '',
            organization: '',
            software: '',
            email: '',
            phone: ''
        });
        
        // Navigate back to home or another page
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            {/* Header */}
            <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
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

                        <Link
                            to="/"
                            className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <Icon icon="heroicons:arrow-left" className="text-lg" />
                            <span>Back to Home</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-700 rounded-full mb-6 backdrop-blur-sm shadow-lg">
                            <Icon icon="heroicons:calendar-days" className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Schedule Your Demo</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                            <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Book a Live Demo
                            </span>
                        </h1>

                        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
                            See Bill Munshi in action! Our team will walk you through all features and answer your questions.
                        </p>

                        {/* Special Offer Banner */}
                        <div className="max-w-3xl mx-auto mb-8">
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                            <Icon icon="heroicons:gift" className="text-xl text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left">
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
                    </div>

                    {/* Form Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-8 py-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                    <Icon icon="heroicons:document-text" className="text-2xl text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Request a Demo</h2>
                                    <p className="text-blue-100 text-sm">Fill out the form below and we'll get back to you shortly</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Icon icon="heroicons:user" className="text-slate-400 text-xl" />
                                        </div>
                                        <input
                                            type="text"
                                            id="fullName"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all text-base"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>

                                {/* Organization */}
                                <div>
                                    <label htmlFor="organization" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Name of Organization <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Icon icon="heroicons:building-office" className="text-slate-400 text-xl" />
                                        </div>
                                        <input
                                            type="text"
                                            id="organization"
                                            name="organization"
                                            value={formData.organization}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all text-base"
                                            placeholder="Enter your organization name"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Accounting Software */}
                            <div>
                                <label htmlFor="software" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Accounting Software <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                        <Icon icon="heroicons:calculator" className="text-slate-400 text-xl" />
                                    </div>
                                    <select
                                        id="software"
                                        name="software"
                                        value={formData.software}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all appearance-none cursor-pointer text-base"
                                    >
                                        <option value="">Select your accounting software</option>
                                        <option value="zoho">Zoho Books</option>
                                        <option value="tally">Tally</option>
                                        <option value="both">Both (Zoho Books & Tally)</option>
                                        <option value="other">Other / Not Sure</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <Icon icon="heroicons:chevron-down" className="text-slate-400 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Work Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Work Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Icon icon="heroicons:envelope" className="text-slate-400 text-xl" />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all text-base"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Icon icon="heroicons:phone" className="text-slate-400 text-xl" />
                                        </div>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 transition-all text-base"
                                            placeholder="+91 98765 43210"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Benefits List */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icon icon="heroicons:check-badge" className="text-blue-600 dark:text-blue-400 text-2xl" />
                                    What You'll Get:
                                </h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                        <Icon icon="heroicons:check-circle" className="text-green-500 text-xl flex-shrink-0 mt-0.5" />
                                        <span>Personalized 30-minute product walkthrough</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                        <Icon icon="heroicons:check-circle" className="text-green-500 text-xl flex-shrink-0 mt-0.5" />
                                        <span>Live Q&A with our product experts</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                        <Icon icon="heroicons:check-circle" className="text-green-500 text-xl flex-shrink-0 mt-0.5" />
                                        <span>Custom setup recommendations for your business</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                                        <Icon icon="heroicons:check-circle" className="text-green-500 text-xl flex-shrink-0 mt-0.5" />
                                        <span>Free trial access after the demo</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-4 pt-4">
                                <Link
                                    to="/"
                                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-base hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 text-center"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-base hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <Icon icon="heroicons:paper-airplane" className="text-xl" />
                                    <span>Schedule My Demo</span>
                                </button>
                            </div>

                            {/* Privacy Note */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                                    <Icon icon="heroicons:information-circle" className="text-blue-500 text-lg flex-shrink-0 mt-0.5" />
                                    <p>
                                        We respect your privacy. Your information will only be used to contact you about the demo and provide you with relevant product information.
                                    </p>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Additional Info Section */}
                    <div className="mt-12 grid md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg">
                                <Icon icon="heroicons:clock" className="text-2xl text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Quick Response</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">We'll get back to you within 24 hours</p>
                        </div>
                        <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg">
                                <Icon icon="heroicons:users" className="text-2xl text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Expert Guidance</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Learn from our product specialists</p>
                        </div>
                        <div className="text-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-lg">
                                <Icon icon="heroicons:shield-check" className="text-2xl text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Commitment</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Free demo with no obligations</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDemo;
