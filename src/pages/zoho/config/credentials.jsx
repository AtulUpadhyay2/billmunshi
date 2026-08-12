import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import {
  useGetZohoCredentials,
  useInitiateZohoOAuth,
  useHandleOAuthCallback,
  useSyncChartOfAccounts,
  useSyncTaxes,
  useSyncTdsTcs,
  useSyncVendors,
} from "@/services/zoho/zohoApiService";

const formatDateTime = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const maskValue = (value, startChars = 4, endChars = 4) => {
  if (!value) return "—";
  if (value.length <= startChars + endChars) return value;
  return `${value.slice(0, startChars)}${"•".repeat(8)}${value.slice(-endChars)}`;
};

const CredentialField = ({ label, value, mask = false, mono = true }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const display = !value
    ? "—"
    : mask && !revealed
      ? maskValue(value)
      : value;

  const handleCopy = async () => {
    if (!value) {
      toast.error("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
        <code
          className={`flex-1 text-sm ${mono ? "font-mono" : ""} text-slate-800 dark:text-slate-200 truncate select-all`}
        >
          {display}
        </code>
        {mask && value && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label={revealed ? "Hide" : "Show"}
            title={revealed ? "Hide" : "Show"}
          >
            <Icon icon={revealed ? "heroicons:eye-slash" : "heroicons:eye"} className="text-sm" />
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!value}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <Icon
            icon={copied ? "heroicons:check" : "heroicons:document-duplicate"}
            className={`text-xs ${copied ? "text-emerald-600 dark:text-emerald-400" : ""}`}
          />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};

const ZohoCredentials = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const orgId = selectedOrganization?.id;

  const {
    data: credentials,
    isLoading,
    error,
    refetch,
  } = useGetZohoCredentials(orgId);

  const { mutateAsync: initiateOAuth, isPending: isInitiating } = useInitiateZohoOAuth();
  const { mutateAsync: handleOAuthCallback, isPending: isHandlingCallback } = useHandleOAuthCallback();
  const { mutateAsync: syncChartOfAccounts } = useSyncChartOfAccounts();
  const { mutateAsync: syncTaxes } = useSyncTaxes();
  const { mutateAsync: syncTdsTcs } = useSyncTdsTcs();
  const { mutateAsync: syncVendors } = useSyncVendors();

  // OAuth callback handling — when redirected back from Zoho with ?code=...&state=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    if (oauthError) {
      toast.error(`OAuth authorization failed: ${oauthError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state && orgId) {
      handleOAuthCallback({ organizationId: orgId, code, state })
        .then(async (response) => {
          if (response.success) {
            toast.success("Successfully connected to Zoho Books!");
            refetch();
            setIsAutoSyncing(true);
            toast.info("Syncing your Zoho data automatically…");
            const startTime = Date.now();
            try {
              await Promise.all([
                syncChartOfAccounts(orgId).catch(() => null),
                syncTaxes(orgId).catch(() => null),
                syncTdsTcs(orgId).catch(() => null),
                syncVendors(orgId).catch(() => null),
              ]);
              const elapsed = Date.now() - startTime;
              const remaining = Math.max(0, 6000 - elapsed);
              if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
              toast.success("All Zoho data synced");
            } catch {
              toast.warning("Some data may not have synced completely");
            } finally {
              setIsAutoSyncing(false);
            }
          } else {
            toast.error(response.detail || "Failed to complete OAuth flow");
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err) => {
          const msg =
            err.response?.data?.detail ||
            err.response?.data?.message ||
            err.message ||
            "OAuth flow failed";
          toast.error(msg);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [orgId, handleOAuthCallback, refetch, syncChartOfAccounts, syncTaxes, syncTdsTcs, syncVendors]);

  const handleConnect = async () => {
    if (!orgId) {
      toast.error("No workspace selected");
      return;
    }
    try {
      const response = await initiateOAuth(orgId);
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        toast.error("Failed to initiate OAuth flow");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to start OAuth");
    }
  };

  const isConnected = !!(credentials?.accessToken && credentials?.refreshToken);
  const showConnect = !isConnected;

  if (!orgId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
          <Icon icon="heroicons:building-office" className="text-lg" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Please select a client to manage Zoho credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Zoho Books integration
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Connect this workspace to Zoho Books with secure OAuth.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-sm ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {showConnect && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={isInitiating || isHandlingCallback}
              className="group inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
            >
              <Icon icon={isInitiating || isHandlingCallback ? "heroicons:arrow-path" : "heroicons:link"} className={`text-sm ${isInitiating || isHandlingCallback ? "animate-spin" : ""}`} />
              {isInitiating || isHandlingCallback
                ? "Connecting…"
                : credentials
                  ? "Reconnect"
                  : "Connect to Zoho Books"}
            </button>
          )}
        </div>
      </div>

      {isLoading || isAutoSyncing ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Icon icon="heroicons:arrow-path" className="text-2xl animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {isAutoSyncing ? "Syncing your Zoho data…" : "Loading credentials…"}
          </p>
          {isAutoSyncing && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fetching Chart of Accounts, taxes, TDS/TCS, and vendors.
            </p>
          )}
        </div>
      ) : error?.response?.status === 404 || !credentials ? (
        // Not connected — connect-to-Zoho onboarding card
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 md:p-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <Icon icon="heroicons:link" className="text-lg" />
            </div>
            <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Connect your Zoho Books account
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Sync vendors, bills, and financial data seamlessly using secure OAuth authentication.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7">
              {[
                { icon: "heroicons:user-group", label: "Vendors" },
                { icon: "heroicons:rectangle-stack", label: "Chart of accounts" },
                { icon: "heroicons:receipt-percent", label: "Tax codes" },
                { icon: "heroicons:document-currency-rupee", label: "TDS / TCS" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center gap-2"
                >
                  <span className="w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon={f.icon} className="text-sm" />
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleConnect}
              disabled={isInitiating || isHandlingCallback}
              className="group mt-7 inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
            >
              <Icon icon={isInitiating || isHandlingCallback ? "heroicons:arrow-path" : "heroicons:link"} className={`text-sm ${isInitiating || isHandlingCallback ? "animate-spin" : ""}`} />
              {isInitiating || isHandlingCallback ? "Connecting…" : "Connect to Zoho Books"}
            </button>

            <div className="mt-5 flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 text-left">
              <Icon icon="heroicons:lock-closed" className="text-blue-600 dark:text-blue-400 text-base shrink-0 mt-0.5" />
              <p>
                You'll be redirected to Zoho to authorize this workspace. We never see your password — only the access token returned by Zoho is stored.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Connected state — show credentials grid
        <div className="space-y-3">
          {/* Connection summary card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Icon icon="heroicons:check-badge" className="text-lg" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    Connected to Zoho Books
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Last updated: {formatDateTime(credentials.updated_at || credentials.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Credentials */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                <Icon icon="heroicons:key" className="text-sm" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  OAuth credentials
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Sensitive values are masked — click the eye to reveal.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CredentialField label="Client ID" value={credentials.clientId} mask mono />
              <CredentialField label="Client secret" value={credentials.clientSecret} mask mono />
              <CredentialField label="Redirect URL" value={credentials.redirectUrl} mono />
              <CredentialField label="Access token" value={credentials.accessToken} mask mono />
              <CredentialField label="Refresh token" value={credentials.refreshToken} mask mono />
              {credentials.organizationId && (
                <CredentialField label="Zoho organization ID" value={credentials.organizationId} mono />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Need to refresh the connection?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Reconnecting will re-authorize this workspace with Zoho and re-issue tokens.
              </p>
            </div>
            <button
              type="button"
              onClick={handleConnect}
              disabled={isInitiating || isHandlingCallback}
              className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
            >
              <Icon icon={isInitiating || isHandlingCallback ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-sm ${isInitiating || isHandlingCallback ? "animate-spin" : ""}`} />
              {isInitiating || isHandlingCallback ? "Reconnecting…" : "Reconnect"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZohoCredentials;
