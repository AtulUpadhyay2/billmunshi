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

const schema = yup
  .object({
    email: yup.string().email("Invalid email").required("Email is Required"),
    password: yup.string().required("Password is Required"),
  })
  .required();

const inputBase =
  "w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600";

const inputError =
  "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-800";

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
  const [checked, setChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    try {
      const response = await login(data);
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
      localStorage.setItem("refresh_token", loginTokens.refresh);
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
      <div>
        <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Email <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Icon icon="heroicons:envelope" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
            className={`${inputBase} ${errors.email ? inputError : ""}`}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Password <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Icon icon="heroicons:lock-closed" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            {...register("password")}
            className={`${inputBase} pr-10 ${errors.password ? inputError : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Icon icon={showPassword ? "heroicons:eye-slash" : "heroicons:eye"} className="text-lg" />
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => setChecked(!checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Keep me signed in
          </span>
        </label>
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
        className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-200 ring-1 ring-orange-600/20 cursor-pointer"
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
