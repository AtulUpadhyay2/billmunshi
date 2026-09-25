import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";

/**
 * Client Correction 57 — "check your inbox" panel shown after signup and
 * when a login is refused because the email isn't verified yet. Offers a
 * one-click resend of the verification link.
 */
const VerifyEmailNotice = ({ email, title = "Verify your email", children }) => {
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!email || sending) return;
    setSending(true);
    try {
      const res = await apiFetch("auth/verify-email/resend/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success(res?.detail || "Verification link sent. Please check your inbox.");
    } catch (err) {
      toast.error(
        err?.data?.detail || err?.message || "Could not resend the link. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 flex gap-3">
      <Icon
        icon="heroicons:envelope-open"
        className="text-xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
      />
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
          We&apos;ve sent a verification link to{" "}
          <span className="font-semibold break-all">{email}</span>. Click the
          link in that email to activate your account, then log in.
        </p>
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
