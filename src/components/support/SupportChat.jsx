import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";
import ReCaptcha from "@/components/ReCaptcha";
import { isRecaptchaConfigured } from "@/config/recaptcha";

/**
 * Client Correction 51 — simple support chat: Name, Email, Message, Send.
 * Posts to `support/chat/`, which emails the support inbox (Reply-To = the
 * visitor) and logs it as a ticket in admin.
 *
 * Two entry points:
 *   - <SupportChatHeaderButton/>: icon in the app header (a floating badge
 *     used to sit on top of list pagination, so the app uses the header).
 *   - <SupportChatLauncher/>: floating button for the public website.
 */

const inputCls =
  "w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isLoggedIn = () => {
  try {
    return !!localStorage.getItem("access_token");
  } catch {
    return false;
  }
};

export const SupportChatPanel = ({ open, onClose }) => {
  const user = useSelector((state) => state.auth?.user);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);
  // Set when the server says a captcha is needed after all (e.g. a stale
  // login token in storage made us think the visitor was signed in).
  const [forceCaptcha, setForceCaptcha] = useState(false);
  const loggedIn = isLoggedIn();
  const needsCaptcha = (!loggedIn || forceCaptcha) && isRecaptchaConfigured();

  // Pre-fill from the signed-in user each time the panel opens.
  useEffect(() => {
    if (!open) return;
    const fullName =
      user?.full_name ||
      [user?.first_name, user?.last_name].filter(Boolean).join(" ");
    setForm((prev) => ({
      ...prev,
      name: prev.name || fullName || "",
      email: prev.email || user?.email || "",
    }));
  }, [open, user]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your name";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Please enter a valid email";
    if (!form.message.trim()) next.message = "Please type your message";
    if (needsCaptcha && !captchaToken) next.captcha = "Please complete the “I’m not a robot” check.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending || !validate()) return;
    setSending(true);
    try {
      await apiFetch("support/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          page_url: window.location.href.slice(0, 500),
          recaptcha_token: captchaToken,
        }),
      });
      setSent(true);
      setForm((prev) => ({ ...prev, message: "" }));
      toast.success("Message sent — our support team will reach out soon.");
    } catch (err) {
      const data = err?.data || {};
      const fieldErrors = {};
      ["name", "email", "message"].forEach((k) => {
        if (data[k]) fieldErrors[k] = Array.isArray(data[k]) ? data[k][0] : String(data[k]);
      });
      if (data.recaptcha_token) {
        setForceCaptcha(true);
        fieldErrors.captcha = Array.isArray(data.recaptcha_token)
          ? data.recaptcha_token[0]
          : String(data.recaptcha_token);
      }
      setErrors(fieldErrors);
      toast.error(data.message || data.detail || err?.message || "Could not send your message. Please try again.");
    } finally {
      captchaRef.current?.reset();
      setCaptchaToken("");
      setSending(false);
    }
  };

  // Portal to <body>: the app header uses backdrop-blur, which would make
  // it the containing block for this `position: fixed` panel.
  return createPortal(
    <div
      role="dialog"
      aria-label="Chat with support"
      className="fixed z-[99990] bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-orange-500 text-white rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          <Icon icon="heroicons:chat-bubble-left-right" className="text-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Chat with support</p>
            <p className="text-[11px] text-orange-50/90 leading-tight">We usually reply within a few hours</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-white/15 cursor-pointer"
        >
          <Icon icon="heroicons:x-mark" className="text-lg" />
        </button>
      </div>

      {sent ? (
        <div className="p-5 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-100 dark:ring-emerald-900/60 mb-3">
            <Icon icon="heroicons:check" className="text-2xl" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Thanks, {form.name.split(" ")[0] || "there"}!</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Your message reached our support team. We&apos;ll reply to <span className="font-semibold break-all">{form.email}</span>.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-4 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-3" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Name <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={form.name} onChange={set("name")} maxLength={120} autoComplete="name" placeholder="Your name" className={inputCls} />
            {errors.name && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <input type="email" value={form.email} onChange={set("email")} maxLength={254} autoComplete="email" placeholder="you@company.com" className={inputCls} />
            {errors.email && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea value={form.message} onChange={set("message")} maxLength={5000} rows={4} placeholder="How can we help?" className={`${inputCls} resize-none`} />
            {errors.message && <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">{errors.message}</p>}
          </div>
          {needsCaptcha && (
            <ReCaptcha
              ref={captchaRef}
              onChange={(token) => {
                setCaptchaToken(token || "");
                if (token) setErrors((prev) => ({ ...prev, captcha: "" }));
              }}
              error={errors.captcha}
            />
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
          >
            <Icon icon={sending ? "heroicons:arrow-path" : "heroicons:paper-airplane"} className={`text-base ${sending ? "animate-spin" : ""}`} />
            {sending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>,
    document.body,
  );
};

export const SupportChatHeaderButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with support"
        title="Chat with support"
        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <Icon icon="heroicons:chat-bubble-left-right" className="text-lg" />
      </button>
      <SupportChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export const SupportChatLauncher = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with support"
          className="fixed z-[99990] bottom-5 right-5 inline-flex items-center gap-2 h-12 pl-4 pr-5 rounded-full text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/40 ring-1 ring-orange-600/20 cursor-pointer"
        >
          <Icon icon="heroicons:chat-bubble-left-right" className="text-xl" />
          Chat with us
        </button>
      )}
      <SupportChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default SupportChatPanel;
