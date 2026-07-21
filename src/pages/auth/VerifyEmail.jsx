import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "@/utils/apiClient";

/**
 * VerifyEmail landing page — user arrives here via the link in the
 * welcome / verification email:
 *   /verify-email?uidb64=<b64>&token=<token>
 *
 * On mount it POSTs (once) to the backend verify endpoint. Three
 * terminal states: verifying / success / error.
 */
const VerifyEmail = () => {
  const [params] = useSearchParams();
  const uidb64 = params.get("uidb64");
  const token = params.get("token");
  const [state, setState] = useState(uidb64 && token ? "verifying" : "error");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!uidb64 || !token) return;
    let cancelled = false;
    (async () => {
      try {
        await apiFetch(`auth/verify-email/${uidb64}/${token}/`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!cancelled) setState("success");
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(
          err?.response?.data?.detail ||
            "This verification link is invalid or has expired.",
        );
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uidb64, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 p-8 text-center">
        <div className="flex justify-center mb-5">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md ring-1 ring-orange-600/20">
              <span className="text-white font-extrabold text-sm">BM</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bill Munshi
            </span>
          </Link>
        </div>

        {state === "verifying" && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center ring-1 ring-blue-100 dark:ring-blue-900/60 mb-4">
              <Icon icon="heroicons:arrow-path" className="text-2xl animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Verifying your email…
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Hang tight — this only takes a second.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-100 dark:ring-emerald-900/60 mb-4">
              <Icon icon="heroicons:check-badge" className="text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Email verified 🎉
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Your Bill Munshi account is fully set up. You can sign in and
              start scanning bills right away.
            </p>
            <Link
              to="/auth/login"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20"
            >
              Sign in
              <Icon icon="heroicons:arrow-right" className="text-base" />
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center ring-1 ring-rose-100 dark:ring-rose-900/60 mb-4">
              <Icon icon="heroicons:exclamation-triangle" className="text-2xl" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Verification failed
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {errorMsg || "This verification link is invalid or has expired."}
            </p>
            <Link
              to="/auth/login"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
