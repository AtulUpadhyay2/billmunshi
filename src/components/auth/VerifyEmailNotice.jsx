import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";

/**
 * Client Correction 57 — "check your inbox" panel shown after signup and
 * when a login is refused because the email isn't verified yet. Offers a
 * one-click resend of the verification link.
 *
 * `sent` reflects whether the server actually managed to hand the message
 * to the mail provider. The panel used to say "We've sent a verification
 * link to <email>" unconditionally, so when SendGrid rejected the send
 * ("Maximum credits exceeded") the user sat waiting on a mail that was
 * never dispatched — and since an unverified account cannot log in, there
 * was no way forward and no clue why.
 */
const VerifyEmailNotice = ({
  email,
  title = "Verify your email",
  sent = true,
  children,
}) => {
  const [sending, setSending] = useState(false);
  // Starts from what the signup response reported, then tracks each
  // resend attempt.
  const [delivered, setDelivered] = useState(sent);

  const resend = async () => {
    if (!email || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("auth/verify-email/resend/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setDelivered(true);
      toast.success(res?.detail || "Verification link sent. Please check your inbox.");
    } catch (err) {
      // A 503 here means our mail provider refused it — not that the
      // address is wrong. Keep the panel in its failed state so the copy
      // stops claiming a link is on its way.
      setDelivered(false);
      toast.error(
        err?.data?.detail || err?.message || "Could not resend the link. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const tone = delivered
    ? {
        wrap: "border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30",
        icon: "heroicons:envelope-open",
        iconColor: "text-amber-600 dark:text-amber-400",
      }
    : {
        wrap: "border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30",
        icon: "heroicons:exclamation-triangle",
        iconColor: "text-rose-600 dark:text-rose-400",
      };

  return (
    <div className={`rounded-xl border p-4 flex gap-3 ${tone.wrap}`}>
      <Icon icon={tone.icon} className={`text-xl shrink-0 mt-0.5 ${tone.iconColor}`} />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-slate-900 dark:text-white">
          {delivered ? title : "We couldn't send the verification email"}
        </p>

        {delivered ? (
          <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            We&apos;ve sent a verification link to{" "}
            <span className="font-semibold break-all">{email}</span>. Click the
            link in that email to activate your account, then log in.
          </p>
        ) : (
          <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            Your account for{" "}
            <span className="font-semibold break-all">{email}</span> was
            created, but our email service rejected the message, so no link
            has gone out yet. Your account stays locked until the address is
            verified — try the resend below in a few minutes, and contact
            support if it keeps failing.
          </p>
        )}

        {children}

        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline disabled:opacity-60 cursor-pointer"
        >
          <Icon
            icon={sending ? "heroicons:arrow-path" : "heroicons:paper-airplane"}
            className={`text-sm ${sending ? "animate-spin" : ""}`}
          />
          {sending ? "Sending…" : "Resend verification email"}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailNotice;
