// NOTE TO MAIN AGENT — this page is not yet wired in.
//
// 1) frontend/src/App.jsx — add near the other lazy page imports:
//      const SupportTicketList = lazy(() => import("./pages/support/TicketList"));
//    ...and a route inside the authenticated <Layout> route tree, e.g.:
//      <Route path="support/tickets" element={<SupportTicketList />} />
//
// 2) frontend/src/constants/data.js — add a sidebar entry, e.g. next to
//    other utility/account items:
//      {
//        title: "Support",
//        icon: "heroicons:chat-bubble-left-right",
//        link: "/support/tickets",
//      }

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  useMySupportTickets,
  useReplyToTicket,
} from "@/services/support/supportService";

const inputBase =
  "w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";

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
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
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
        className={`${inputBase} flex-1`}
      />
      <button
        type="submit"
        disabled={!body.trim() || reply.isPending}
        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 shrink-0"
      >
        {reply.isPending ? (
          <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
        ) : (
          <Icon icon="heroicons:paper-airplane" className="text-base" />
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
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {ticket.subject}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {ticket.category} &middot;{" "}
            {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>
        <Icon
          icon={expanded ? "heroicons:chevron-up" : "heroicons:chevron-down"}
          className="text-lg text-slate-400 shrink-0"
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {ticket.message}
          </p>

          {ticket.messages?.length > 0 && (
            <div className="mt-4 space-y-3">
              {ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="font-semibold">{msg.author_email || "Support"}</span>
                    <span>{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          My Support Tickets
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track and reply to tickets you've raised with the support team.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-8 justify-center">
          <Icon icon="heroicons:arrow-path" className="text-lg animate-spin" />
          Loading tickets…
        </div>
      )}

      {isError && (
        <div className="text-sm text-rose-600 dark:text-rose-400 py-8 text-center">
          Failed to load your tickets. Please try again.
        </div>
      )}

      {!isLoading && !isError && (!tickets || tickets.length === 0) && (
        <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
          You haven't raised any support tickets yet.
        </div>
      )}

      <div className="space-y-3">
        {tickets?.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
};

export default TicketList;
