import React from 'react';
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";
import {
    BADGE,
    BTN_SECONDARY,
    SUBTLE_LABEL,
} from "@/constants/ui";

/**
 * What the duplicate check found, as a comparison rather than a list.
 *
 * The dialog used to stack a red banner, a grey summary card, and one
 * loose card per candidate, each repeating its own field labels — so the
 * one question an operator actually has ("is this the same bill, or a
 * different one from the same vendor?") had to be answered by reading
 * four unaligned paragraphs.
 *
 * Each candidate is now a two-column strip: the field on the left, the
 * candidate's value on the right, and the fields the matcher says agree
 * with the upload are muted and marked `same`. What is left dark is what
 * differs — which is the only thing that tells the two bills apart.
 */

const MATCH_LABELS = {
    'exact_invoice_number': 'Exact Invoice Number',
    'vendor_name_match': 'Vendor Name Match',
    'exact_amount': 'Exact Amount',
    'same_date': 'Same Date',
    'similar_invoice_number': 'Similar Invoice Number',
    'similar_amount': 'Similar Amount',
};

const MATCH_ICONS = {
    'exact_invoice_number': 'heroicons:document-duplicate',
    'vendor_name_match': 'heroicons:building-storefront',
    'exact_amount': 'heroicons:currency-rupee',
    'same_date': 'heroicons:calendar',
    'similar_invoice_number': 'heroicons:document-duplicate',
    'similar_amount': 'heroicons:currency-rupee',
};

/** Which bill field each match reason is a statement about. */
const REASON_FIELD = {
    'exact_invoice_number': 'invoice_number',
    'similar_invoice_number': 'invoice_number',
    'vendor_name_match': 'vendor_name',
    'exact_amount': 'total',
    'similar_amount': 'total',
    'same_date': 'date',
};

const DuplicateDetectionModal = ({ isOpen, onClose, duplicateData }) => {
    if (!duplicateData) return null;

    const {
        bill_name,
        duplicate_count,
        max_similarity,
        duplicate_bills = [],
        warning_message
    } = duplicateData;

    const getMatchReasonLabel = (reason) => MATCH_LABELS[reason] || reason;

    const getMatchReasonIcon = (reason) =>
        MATCH_ICONS[reason] || 'heroicons:exclamation-triangle';

    const getSimilarityColor = (score) => {
        if (score >= 90)
            return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60';
        if (score >= 70)
            return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-100 dark:ring-amber-900/60';
        return 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700';
    };

    const getStatusColor = (status) => {
        if (status === 'Synced')
            return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/60';
        if (status === 'Analysed')
            return 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60';
        return 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700';
    };

    /** The set of fields the matcher reported as agreeing with the upload. */
    const matchedFields = (reasons) => {
        const set = new Set();
        (reasons || []).forEach((r) => {
            if (REASON_FIELD[r]) set.add(REASON_FIELD[r]);
        });
        return set;
    };

    /**
     * One row of the comparison. A field the matcher agreed on is muted and
     * flagged `same`; a field it did not is left at full contrast, because
     * that is where the two bills part company.
     */
    const Row = ({ label, value, same, mono }) => (
        <div className="flex items-baseline gap-3 px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 first:border-t-0">
            <span className={`${SUBTLE_LABEL} w-24 shrink-0`}>{label}</span>
            <span
                className={`min-w-0 flex-1 text-[12px] ${
                    mono ? 'font-mono tabular-nums text-right' : 'break-words'
                } ${
                    same
                        ? 'text-slate-400 dark:text-slate-500'
                        : 'font-semibold text-slate-900 dark:text-white'
                }`}
            >
                {value}
            </span>
            <span className="w-10 shrink-0 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
                {same ? 'same' : ''}
            </span>
        </div>
    );

    return (
        <Modal
            title="Duplicate Detection"
            activeModal={isOpen}
            onClose={onClose}
            centered
            scrollContent
            className="max-w-3xl"
            footerContent={
                <button type="button" onClick={onClose} className={BTN_SECONDARY}>
                    Close
                </button>
            }
        >
            <div className="space-y-3">
                {/* What the check found */}
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 px-3 py-2 text-[12px]">
                    <div className="flex items-start gap-2">
                        <Icon
                            icon="heroicons:exclamation-triangle"
                            className="text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5"
                        />
                        <div className="min-w-0">
                            <p className="font-semibold text-amber-900 dark:text-amber-300">
                                This bill may already be in the books
                            </p>
                            <div className="text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                                {warning_message}
                            </div>
                        </div>
                    </div>
                </div>

                {/* The upload, and the shape of the finding */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
                        <div className="px-3 py-2 min-w-0">
                            <p className={SUBTLE_LABEL}>Uploaded bill</p>
                            <p className="mt-0.5 text-[12px] font-semibold text-slate-900 dark:text-white break-words">
                                {bill_name}
                            </p>
                        </div>
                        <div className="px-3 py-2">
                            <p className={SUBTLE_LABEL}>Duplicates found</p>
                            <p className="mt-0.5 text-[12px] font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                                {duplicate_count}
                            </p>
                        </div>
                        <div className="px-3 py-2">
                            <p className={SUBTLE_LABEL}>Max similarity</p>
                            <p className="mt-0.5 text-[12px] font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                                {max_similarity}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* The candidates, each as a field-by-field comparison */}
                <div>
                    <h4 className={`${SUBTLE_LABEL} mb-1.5`}>
                        Compared against
                    </h4>
                    <div className="space-y-2">
                        {duplicate_bills.map((duplicate, index) => {
                            const same = matchedFields(duplicate.match_reasons);
                            return (
                                <div
                                    key={duplicate.duplicate_bill_id || index}
                                    className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                                >
                                    {/* Which bill this is */}
                                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-3 py-2">
                                        <Icon
                                            icon="heroicons:document-duplicate"
                                            className="text-slate-400 dark:text-slate-500 text-sm shrink-0"
                                        />
                                        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-900 dark:text-white">
                                            {duplicate.duplicate_bill_name}
                                        </p>
                                        <span className={`${BADGE} ${getSimilarityColor(duplicate.similarity_score)} font-mono tabular-nums`}>
                                            {duplicate.similarity_score}% match
                                        </span>
                                        <span className={`${BADGE} ${getStatusColor(duplicate.status)}`}>
                                            {duplicate.status}
                                        </span>
                                    </div>

                                    {/* Field by field */}
                                    <div>
                                        <Row
                                            label="Invoice no."
                                            value={duplicate.invoice_number || 'N/A'}
                                            same={same.has('invoice_number')}
                                            mono
                                        />
                                        <Row
                                            label="Vendor"
                                            value={duplicate.vendor_name || 'N/A'}
                                            same={same.has('vendor_name')}
                                        />
                                        <Row
                                            label="Amount"
                                            value={
                                                duplicate.total != null
                                                    ? `₹${duplicate.total?.toLocaleString()}`
                                                    : 'N/A'
                                            }
                                            same={same.has('total')}
                                            mono
                                        />
                                        <Row
                                            label="Date"
                                            value={
                                                duplicate.date
                                                    ? new Date(duplicate.date).toLocaleDateString()
                                                    : 'N/A'
                                            }
                                            same={same.has('date')}
                                            mono
                                        />
                                    </div>

                                    {/* Why the matcher flagged it */}
                                    {duplicate.match_reasons?.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-200 dark:border-slate-800 px-3 py-2">
                                            <span className={`${SUBTLE_LABEL} mr-0.5`}>
                                                Matched on
                                            </span>
                                            {duplicate.match_reasons.map((reason, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`${BADGE} text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800`}
                                                >
                                                    <Icon
                                                        icon={getMatchReasonIcon(reason)}
                                                        className="text-[11px] text-slate-400 dark:text-slate-500"
                                                    />
                                                    {getMatchReasonLabel(reason)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* What happens next */}
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-2 text-[12px]">
                    <div className="flex items-start gap-2">
                        <Icon
                            icon="heroicons:information-circle"
                            className="text-slate-500 dark:text-slate-400 text-sm shrink-0 mt-0.5"
                        />
                        <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            The bill was uploaded successfully. Review the bills above
                            and take action if it is the same one.
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default DuplicateDetectionModal;
