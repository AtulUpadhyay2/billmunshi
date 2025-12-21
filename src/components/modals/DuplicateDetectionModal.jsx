import React from 'react';
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

const DuplicateDetectionModal = ({ isOpen, onClose, duplicateData }) => {
    if (!duplicateData) return null;

    const {
        bill_name,
        duplicate_count,
        max_similarity,
        duplicate_bills = [],
        warning_message
    } = duplicateData;

    const getMatchReasonLabel = (reason) => {
        const labels = {
            'exact_invoice_number': 'Exact Invoice Number',
            'vendor_name_match': 'Vendor Name Match',
            'exact_amount': 'Exact Amount',
            'same_date': 'Same Date',
            'similar_invoice_number': 'Similar Invoice Number',
            'similar_amount': 'Similar Amount'
        };
        return labels[reason] || reason;
    };

    const getMatchReasonIcon = (reason) => {
        const icons = {
            'exact_invoice_number': 'heroicons:document-duplicate',
            'vendor_name_match': 'heroicons:building-storefront',
            'exact_amount': 'heroicons:currency-dollar',
            'same_date': 'heroicons:calendar',
            'similar_invoice_number': 'heroicons:document-duplicate',
            'similar_amount': 'heroicons:currency-dollar'
        };
        return icons[reason] || 'heroicons:exclamation-triangle';
    };

    const getSimilarityColor = (score) => {
        if (score >= 90) return 'text-red-600 bg-red-50 border-red-200';
        if (score >= 70) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <Icon 
                        icon="heroicons:exclamation-triangle" 
                        className="text-yellow-400"
                        width={20}
                    />
                    <span className="font-semibold tracking-wide">
                        Duplicate Detection Warning
                    </span>
                </div>
            }
            activeModal={isOpen}
            onClose={onClose}
            centered
            scrollContent
            themeClass="bg-slate-900 dark:bg-slate-800 dark:border-b dark:border-slate-700"
            className="max-w-4xl"
        >
            <div className="space-y-6">
                {/* Warning Banner */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Icon 
                            icon="heroicons:exclamation-triangle" 
                            className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" 
                            width={24}
                        />
                        <div className="flex-1">
                            <h4 className="text-base font-bold text-red-800 dark:text-red-300 mb-1">
                                Duplicate Detection Warning
                            </h4>
                            <p className="text-sm text-red-700 dark:text-red-400">
                                {warning_message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Uploaded Bill</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{bill_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Duplicates Found</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{duplicate_count}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Max Similarity</p>
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">{max_similarity}%</p>
                        </div>
                    </div>
                </div>

                {/* Duplicate Bills List */}
                <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                        Similar Bills Found
                    </h4>
                    <div className="space-y-3">
                        {duplicate_bills.map((duplicate, index) => (
                            <div 
                                key={duplicate.duplicate_bill_id || index}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                            >
                                {/* Duplicate Bill Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <Icon 
                                            icon="heroicons:document-duplicate" 
                                            className="text-slate-400" 
                                            width={20}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {duplicate.duplicate_bill_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Invoice: {duplicate.invoice_number}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getSimilarityColor(duplicate.similarity_score)}`}>
                                            {duplicate.similarity_score}% Match
                                        </span>
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                            duplicate.status === 'Synced' 
                                                ? 'text-purple-700 bg-purple-100 border border-purple-200 dark:bg-purple-900/30 dark:border-purple-800' 
                                                : duplicate.status === 'Analysed'
                                                ? 'text-blue-700 bg-blue-100 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
                                                : 'text-slate-700 bg-slate-100 border border-slate-200 dark:bg-slate-900/30 dark:border-slate-700'
                                        }`}>
                                            {duplicate.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Bill Details Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Vendor</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                                            {duplicate.vendor_name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Amount</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                                            ₹{duplicate.total?.toLocaleString() || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Date</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                                            {duplicate.date ? new Date(duplicate.date).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Match Reasons */}
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Match Reasons:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {duplicate.match_reasons?.map((reason, idx) => (
                                            <span 
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full"
                                            >
                                                <Icon 
                                                    icon={getMatchReasonIcon(reason)} 
                                                    className="text-slate-500 dark:text-slate-400" 
                                                    width={14}
                                                />
                                                {getMatchReasonLabel(reason)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Icon 
                            icon="heroicons:information-circle" 
                            className="text-blue-600 dark:text-blue-400 mt-0.5" 
                            width={20}
                        />
                        <div className="flex-1">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                The bill has been uploaded successfully. Please review the duplicate bills above and take appropriate action if needed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        text="Close"
                        className="btn-dark"
                        onClick={onClose}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default DuplicateDetectionModal;
