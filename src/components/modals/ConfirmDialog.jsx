import React from "react";
import { BACKDROP, BTN_BASE_SHAPE, BTN_SECONDARY } from "@/constants/ui";

/**
 * Reusable confirmation dialog component.
 * Replaces SweetAlert2 with a native modal approach.
 *
 * Laid out the way the shared `<Modal>` shell lays a dialog out — a body on
 * `px-4 py-4` and a slim hairline footer — but it keeps its own panel,
 * because it is thrown in front of someone mid-action and must not wait on
 * HeadlessUI's transitions. It stays two lines tall: a tinted glyph, the
 * question, and the one sentence of consequence. Anything longer belongs in
 * the page that opened it.
 *
 * @param {boolean} open - Whether the dialog is visible
 * @param {function} onClose - Called when dialog is dismissed
 * @param {function} onConfirm - Called when user confirms
 * @param {string} title - Dialog title
 * @param {string} message - Dialog body message
 * @param {string} confirmText - Confirm button label (default: "Yes, delete it!")
 * @param {string} cancelText - Cancel button label (default: "Cancel")
 * @param {string} variant - Style variant: "danger" | "warning" | "info" (default: "danger")
 * @param {boolean} isLoading - Show loading state on confirm button
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "You won't be able to revert this!",
  confirmText = "Yes, delete it!",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const iconColors = {
    danger:
      "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60",
    warning:
      "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-100 dark:ring-amber-900/60",
    info:
      "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60",
  };

  const buttonColors = {
    danger: "text-white bg-rose-600 hover:bg-rose-700 ring-1 ring-rose-700/20",
    warning: "text-white bg-amber-600 hover:bg-amber-700 ring-1 ring-amber-700/20",
    info: "text-white bg-blue-600 hover:bg-blue-700 ring-1 ring-blue-700/20",
  };

  const icons = {
    danger: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    ),
  };

  if (!open) return null;

  const tint = iconColors[variant] || iconColors.info;
  const confirmSkin = buttonColors[variant] || buttonColors.info;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={BACKDROP}
        onClick={onClose}
      />

      {/* Dialog. role/aria are not decoration here: this one does not go
          through Headless UI's Dialog, so without them a screen reader
          reads it as a div and nothing announces that the page is
          blocked. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 animate-in fade-in zoom-in duration-200"
      >
        <div className="flex items-start gap-3 px-4 py-4">
          {/* Icon */}
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tint}`}
          >
            {icons[variant]}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            {/* Title */}
            <h3 className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h3>

            {/* Message */}
            <p className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={BTN_SECONDARY}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`${BTN_BASE_SHAPE} ${confirmSkin}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
