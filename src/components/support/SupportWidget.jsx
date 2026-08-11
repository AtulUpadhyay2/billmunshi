// NOTE TO MAIN AGENT — this widget is not yet mounted anywhere.
// Add the following line inside frontend/src/layouts/Layout.jsx, right next
// to <Footer />` (e.g. just before the closing `</>` at the end of the
// returned JSX):
//
//   <SupportWidget />
//
// ...and import it at the top of that file:
//
//   import SupportWidget from "@/components/support/SupportWidget";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import Modal from "@/components/ui/Modal";
import { useCreateSupportTicket } from "@/services/support/supportService";

const inputBase =
  "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

const CATEGORY_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "question", label: "Question" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
];

const SupportWidget = () => {
  const isAuthenticated = useSelector((state) => !!state.auth?.accessToken || !!state.auth?.user);

  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("question");
  const [message, setMessage] = useState("");

  const createTicket = useCreateSupportTicket();

  const resetForm = () => {
    setSubject("");
    setCategory("question");
    setMessage("");
  };

  const handleClose = () => {
    if (createTicket.isPending) return;
    setIsOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || createTicket.isPending) return;

    try {
      await createTicket.mutateAsync({
        subject: subject.trim(),
        category,
        message: message.trim(),
        page_url: typeof window !== "undefined" ? window.location.href : "",
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
      });
      toast.success("Support ticket submitted — we'll get back to you soon.");
      resetForm();
      setIsOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to submit ticket");
    }
  };

  // Widget is only meaningful for signed-in users — the backend endpoint
  // requires IsAuthenticated, so hide the trigger for anonymous visitors.
  if (!isAuthenticated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-9999 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-lg shadow-orange-500/30 ring-1 ring-orange-600/20 transition-colors"
        aria-label="Open support form"
      >
        <Icon icon="heroicons:chat-bubble-left-right" className="text-lg" />
        <span className="hidden sm:inline">Support</span>
      </button>

      <Modal
        title="Contact Support"
        activeModal={isOpen}
        onClose={handleClose}
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe your issue"
              className={inputBase}
              maxLength={200}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputBase}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's going on…"
              rows={5}
              className={inputBase}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={createTicket.isPending}
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!subject.trim() || !message.trim() || createTicket.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20"
            >
              {createTicket.isPending ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Icon icon="heroicons:paper-airplane" className="text-base" />
                  Submit
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default SupportWidget;
