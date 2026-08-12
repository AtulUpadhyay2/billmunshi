import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useCreateSupportTicket } from "@/services/support/supportService";
import {
  CONTROL,
  CONTROL_SELECT,
  CONTROL_SELECT_ARROW,
  CONTROL_TEXTAREA,
  FIELD_LABEL,
} from "@/constants/ui";

/**
 * NewTicketModal — raise a support ticket.
 *
 * This used to be `SupportWidget`, which owned its own floating trigger and
 * mounted itself in the app shell, so the badge sat over the corner of every
 * page (and over the pagination row on the list pages). The trigger now lives
 * on the Support Tickets page, which is also the only place the result of
 * submitting is visible — so the modal is controlled from outside.
 */
const CATEGORY_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "question", label: "Question" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
];

const NewTicketModal = ({ isOpen, onClose, onCreated }) => {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("question");
  const [message, setMessage] = useState("");

  const createTicket = useCreateSupportTicket();

  const handleClose = () => {
    if (createTicket.isPending) return;
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim() || createTicket.isPending) return;

    try {
      const ticket = await createTicket.mutateAsync({
        subject: subject.trim(),
        category,
        message: message.trim(),
        page_url: typeof window !== "undefined" ? window.location.href : "",
        browser: typeof navigator !== "undefined" ? navigator.userAgent : "",
      });
      toast.success("Support ticket submitted — we'll get back to you soon.");
      setSubject("");
      setCategory("question");
      setMessage("");
      onCreated?.(ticket);
      onClose?.();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to submit ticket");
    }
  };

  return (
    <Modal
      title="Contact Support"
      activeModal={isOpen}
      // Never pass undefined — HeadlessUI Dialog requires a function. The
      // no-op while submitting blocks backdrop/ESC close without crashing.
      onClose={handleClose}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className={FIELD_LABEL}>
            Subject <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Briefly describe your issue"
            className={CONTROL}
            maxLength={200}
            autoFocus
          />
        </div>

        <div>
          <label className={FIELD_LABEL}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={CONTROL_SELECT}
            style={CONTROL_SELECT_ARROW}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={FIELD_LABEL}>
            Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's going on…"
            rows={5}
            className={CONTROL_TEXTAREA}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={createTicket.isPending}
            className="inline-flex items-center h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!subject.trim() || !message.trim() || createTicket.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20"
          >
            {createTicket.isPending ? (
              <>
                <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Icon icon="heroicons:paper-airplane" className="text-sm" />
                Submit
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NewTicketModal;
