import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  useMySupportTickets,
  useReplyToTicket,
} from "@/services/support/supportService";
import NewTicketModal from "@/components/support/NewTicketModal";
import { CONTROL_TEXTAREA } from "@/constants/ui";

const STATUS_STYLES = {
  open: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-900",
  in_progress:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-900",
  resolved:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-900",
  closed:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-700",
};

const STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold ${
      STATUS_STYLES[status] || STATUS_STYLES.open
    }`}
  >
    {STATUS_LABELS[status] || status}
  </span>
);

const TicketReplyForm = ({ ticketId }) => {
  const [body, setBody] = useState("");
  const reply = useReplyToTicket({
    onSuccess: () => {
      toast.success("Reply sent");
      setBody("");
    },
    onError: (err) => {
      toast.error(err?.data?.message || err?.message || "Failed to send reply");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!body.trim() || reply.isPending) return;
    reply.mutate({ ticketId, body: body.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 pt-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply…"
        rows={2}
        className={`${CONTROL_TEXTAREA} flex-1`}
      />
      <button
        type="submit"
        disabled={!body.trim() || reply.isPending}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20 shrink-0"
      >
        {reply.isPending ? (
          <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
        ) : (
          <Icon icon="heroicons:paper-airplane" className="text-sm" />
        )}
        Reply
      </button>
    </form>
  );
};

const TicketCard = ({ ticket }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
              {ticket.subject}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {ticket.category} &middot;{" "}
            {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>
        <Icon
          icon={expanded ? "heroicons:chevron-up" : "heroicons:chevron-down"}
          className="text-sm text-slate-400 shrink-0"
        />
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-800">
          <p className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {ticket.message}
          </p>

          {ticket.messages?.length > 0 && (
            <div className="mt-3 space-y-2">
              {ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-semibold">{msg.author_email || "Support"}</span>
                    <span>{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {msg.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          <TicketReplyForm ticketId={ticket.id} />
        </div>
      )}
    </div>
  );
};

const TicketList = () => {
  const { data: tickets, isLoading, isError } = useMySupportTickets();
  // This page is the only entry point for raising a ticket now — the old
  // floating badge in the app shell was removed because it overlapped the
  // pagination row on every list page.
  const [isNewOpen, setIsNewOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            My Support Tickets
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Track and reply to tickets you've raised with the support team.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewOpen(true)}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20 transition-all cursor-pointer shrink-0"
        >
          <Icon icon="heroicons:chat-bubble-left-right" className="text-sm" />
          Contact Support
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-8 justify-center">
          <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
          Loading tickets…
        </div>
      )}

      {isError && (
        <div className="text-xs text-rose-600 dark:text-rose-400 py-8 text-center">
          Failed to load your tickets. Please try again.
        </div>
      )}

      {!isLoading && !isError && (!tickets || tickets.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
            <Icon icon="heroicons:chat-bubble-left-right" className="text-lg" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No tickets yet
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Raise one with “Contact Support” above and we'll get back to you.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {tickets?.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>

      <NewTicketModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
      />
    </div>
  );
};

export default TicketList;
