import React, { useId, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useCreateSupportTicket } from "@/services/support/supportService";
import { BTN_PRIMARY, BTN_SECONDARY, CONTROL_SELECT_ARROW } from "@/constants/ui";

/**
 * NewTicketModal — raise a support ticket.
 *
 * This used to be `SupportWidget`, which owned its own floating trigger and
 * mounted itself in the app shell, so the badge sat over the corner of every
 * page (and over the pagination row on the list pages). The trigger now lives
 * on the Support Tickets page, which is also the only place the result of
 * submitting is visible — so the modal is controlled from outside.
 *
 * The fields are on the dialog scale (36px boxes, 13px text) rather than the
 * 32px toolbar scale: a dialog is a form being filled in, not a row of
 * controls lining up with a table. Subject and Category share a row, since
 * neither needs the full width, and the buttons sit in the shell's footer
 * instead of on a hand-drawn rule inside the body.
 */
const CATEGORY_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "question", label: "Question" },
  { value: "billing", label: "Billing" },
  { value: "other", label: "Other" },
];

/** Label over a field. */
const LABEL =
  "block text-[11px] font-bold uppercase tracking-[0.14em] " +
  "text-slate-500 dark:text-slate-400 mb-1.5";

/** Shared field skin — border colour included; these fields have no error state. */
const FIELD =
  "w-full text-[13px] rounded-md border transition-colors " +
  "bg-white dark:bg-slate-900 text-slate-900 dark:text-white " +
  "placeholder:text-slate-400 dark:placeholder:text-slate-500 " +
  "border-slate-200 dark:border-slate-700 " +
  "hover:border-slate-300 dark:hover:border-slate-600 " +
  "focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const FIELD_INPUT = `${FIELD} h-9 px-2.5`;
const FIELD_SELECT = `${FIELD} h-9 pl-2.5 pr-8 appearance-none cursor-pointer`;
const FIELD_TEXTAREA = `${FIELD} px-2.5 py-2 leading-relaxed resize-none`;

const NewTicketModal = ({ isOpen, onClose, onCreated }) => {
  // The submit button sits in the dialog footer, outside the <form>, so
  // it is tied back to it by id. Generated rather than hard-coded so two
  // of these mounted at once cannot share one.
  const formId = useId();
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
      footerContent={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={createTicket.isPending}
            className={BTN_SECONDARY}
          >
            Cancel
          </button>
          {/* Submit lives in the dialog footer, outside the <form>, so
              it is associated by id instead. Without this, Enter in a
              field stopped submitting the ticket. */}
          <button
            type="submit"
            form={formId}
            disabled={!subject.trim() || !message.trim() || createTicket.isPending}
            className={BTN_PRIMARY}
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
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_9rem] gap-3">
          <div className="min-w-0">
            <label className={LABEL} htmlFor="ticket-subject">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="ticket-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly describe your issue"
              className={FIELD_INPUT}
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="min-w-0">
            <label className={LABEL} htmlFor="ticket-category">
              Category
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={FIELD_SELECT}
              style={CONTROL_SELECT_ARROW}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="ticket-message">
            Message <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="ticket-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's going on…"
            rows={6}
            className={FIELD_TEXTAREA}
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            The page you are on and your browser are attached automatically.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default NewTicketModal;
