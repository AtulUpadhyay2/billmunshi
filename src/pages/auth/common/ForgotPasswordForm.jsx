import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { apiFetch } from "@/utils/apiClient";
import { handleApiError } from "@/utils/apiErrorHandler";
import { BTN_PRIMARY_CTA, CONTROL_SEARCH_VALIDATED, FIELD_LABEL } from "@/constants/ui";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
  })
  .required();

const inputBase =
  `${CONTROL_SEARCH_VALIDATED} border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20`;

const inputError =
  `${CONTROL_SEARCH_VALIDATED} border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20`;

const ForgotPass = () => {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async ({ email }) => {
    try {
      await apiFetch("auth/password/reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      setSentEmail(email);
      reset();
      toast.success("If that email exists, we've sent reset instructions.");
    } catch (err) {
      handleApiError(err, "Could not send reset email. Please try again.");
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 flex gap-3">
        <Icon
          icon="heroicons:check-badge"
          className="text-emerald-600 dark:text-emerald-400 text-2xl shrink-0 mt-0.5"
        />
        <div className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
          <p className="font-semibold mb-1">Check your inbox</p>
          <p>
            If an account exists for <strong>{sentEmail}</strong>, you&rsquo;ll
            receive a password reset link in the next few minutes. Don&rsquo;t
            forget to check your spam folder.
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setSentEmail("");
            }}
            className="mt-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline hover:no-underline"
          >
            Send to a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className={FIELD_LABEL}
        >
          Email <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Icon
            icon="heroicons:envelope"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
          />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
            className={`${errors.email ? inputError : inputBase}`}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`group w-full ${BTN_PRIMARY_CTA}`}
      >
        {isSubmitting ? (
          <>
            <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
            Sending…
          </>
        ) : (
          <>
            Send recovery email
            <Icon
              icon="heroicons:arrow-right"
              className="text-base group-hover:translate-x-0.5 transition-transform"
            />
          </>
        )}
      </button>
    </form>
  );
};

export default ForgotPass;
