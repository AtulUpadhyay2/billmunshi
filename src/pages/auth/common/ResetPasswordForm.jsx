import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "@/utils/apiClient";
import { handleApiError } from "@/utils/apiErrorHandler";

const schema = yup
  .object({
    new_password: yup
      .string()
      .min(8, "Use at least 8 characters")
      .required("Password is required"),
    confirm_password: yup
      .string()
      .oneOf([yup.ref("new_password")], "Passwords do not match")
      .required("Please confirm your password"),
  })
  .required();

const inputBase =
  "w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600";

const inputError =
  "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-800";

const ResetPasswordForm = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const uidb64 = params.get("uidb64");
  const token = params.get("token");
  const linkValid = useMemo(() => Boolean(uidb64 && token), [uidb64, token]);

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm({ resolver: yupResolver(schema) });

  if (!linkValid) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 p-4 flex gap-3">
        <Icon
          icon="heroicons:exclamation-triangle"
          className="text-rose-600 dark:text-rose-400 text-2xl shrink-0 mt-0.5"
        />
        <div className="text-sm text-rose-900 dark:text-rose-200 leading-relaxed">
          <p className="font-semibold mb-1">Reset link looks invalid</p>
          <p>
            The link is missing required information. Please request a fresh
            reset email.
          </p>
          <Link
            to="/auth/forgot-password"
            className="mt-3 inline-block text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async ({ new_password }) => {
    try {
      await apiFetch("auth/password/confirm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uidb64, token, new_password }),
      });
      toast.success("Password reset successful. Please sign in.");
      navigate("/auth/login", { replace: true });
    } catch (err) {
      handleApiError(
        err,
        "This reset link is invalid or has expired. Please request a new one.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="new_password"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          New password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Icon
            icon="heroicons:lock-closed"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"
          />
          <input
            id="new_password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register("new_password")}
            className={`${inputBase} ${errors.new_password ? inputError : ""}`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label={show ? "Hide password" : "Show password"}
          >
            <Icon icon={show ? "heroicons:eye-slash" : "heroicons:eye"} className="text-lg" />
          </button>
        </div>
        {errors.new_password && (
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {errors.new_password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirm_password"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Confirm password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Icon
            icon="heroicons:lock-closed"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"
          />
          <input
            id="confirm_password"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            {...register("confirm_password")}
            className={`${inputBase} ${errors.confirm_password ? inputError : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            <Icon icon={showConfirm ? "heroicons:eye-slash" : "heroicons:eye"} className="text-lg" />
          </button>
        </div>
        {errors.confirm_password && (
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-200 ring-1 ring-orange-600/20 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
            Resetting…
          </>
        ) : (
          <>
            Reset password
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

export default ResetPasswordForm;
