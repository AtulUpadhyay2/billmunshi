import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  useLoginMutation,
  useLazyGetProfileQuery,
} from "@/store/api/auth/authApiSlice";
import { toast } from "sonner";
import { handleApiError } from "@/utils/apiErrorHandler";
import VerifyEmailNotice from "@/components/auth/VerifyEmailNotice";
import { BTN_PRIMARY_CTA, CONTROL_SEARCH_VALIDATED, FIELD_LABEL } from "@/constants/ui";

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
  })
  .required();

const inputBase =
  `${CONTROL_SEARCH_VALIDATED} border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20`;

const inputError =
  `${CONTROL_SEARCH_VALIDATED} border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20`;

const LoginForm = () => {
  const [login, { isLoading }] = useLoginMutation();
  const [triggerGetProfile, { isLoading: isProfileLoading }] = useLazyGetProfileQuery();
  const dispatch = useDispatch();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({ resolver: yupResolver(schema), mode: "all" });

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  // Correction 57: set when the server refuses login until the signup
  // email is verified — shows the resend panel instead of a bare error.
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const onSubmit = async (data) => {
    setUnverifiedEmail("");
    try {
      const response = await login(data);
      if (response.error?.data?.code === "email_not_verified") {
        setUnverifiedEmail(response.error.data.email || data.email);
        toast.warning(response.error.data.message || "Please verify your email before logging in.");
        return;
      }
      if (response.error) {
        handleApiError(response.error, "Login failed. Please check your credentials.");
        return;
      }
      if (response.data?.error) throw new Error(response.data.error);
      if (!response.data?.access || !response.data?.user) {
        throw new Error("Invalid response from server");
      }

      const loginTokens = {
        access: response.data.access,
        refresh: response.data.refresh,
      };

      localStorage.setItem("access_token", loginTokens.access);
      // The refresh token is NOT stored. The login response set it as an
      // httpOnly cookie, which JavaScript cannot read — so an XSS can at
      // worst steal a short-lived access token instead of the ability to
      // mint new ones for as long as the refresh token lives.
      toast.success("Login Successful");

      const profileResult = await triggerGetProfile();
      const userData = profileResult.error ? response.data.user : profileResult.data;

      navigate("/auth/select-organization", {
        state: {
          loginData: { user: userData, access: loginTokens.access, refresh: loginTokens.refresh },
        },
      });
    } catch (error) {
      handleApiError(error, "Login failed. Please try again.");
    }
  };

  const loading = isLoading || isProfileLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {unverifiedEmail && (
        <VerifyEmailNotice email={unverifiedEmail} title="Please verify your email to log in" />
      )}
      <div>
        <label htmlFor="email" className={FIELD_LABEL}>
          Email <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Icon icon="heroicons:envelope" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
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

      <div>
        <label htmlFor="password" className={FIELD_LABEL}>
          Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Icon icon="heroicons:lock-closed" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register("password")}
            className={`${errors.password ? inputError : inputBase} pr-8`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Icon icon={showPassword ? "heroicons:eye-slash" : "heroicons:eye"} className="text-sm" />
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* "Keep me signed in" was removed: it was never wired to anything —
          tokens always went to localStorage, so unticking it still kept the
          session across browser restarts. A security control that lies is
          worse than no control. Re-add it only together with a real
          session-vs-local token store. */}
      <div className="flex items-center justify-end">
        <Link
          to="/auth/forgot-password"
          className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`group w-full ${BTN_PRIMARY_CTA}`}
      >
        {loading ? (
          <>
            <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <Icon icon="heroicons:arrow-right" className="text-base group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;
