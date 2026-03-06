import React, { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import {
  useGetZohoCredentials,
  useInitiateZohoOAuth,
  useHandleOAuthCallback,
  useSyncChartOfAccounts,
  useSyncTaxes,
  useSyncTdsTcs,
  useSyncVendors,
} from "@/services/zoho/zohoApiService";
import { toast } from "sonner";

const ZohoCredentials = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const [copiedField, setCopiedField] = useState(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);

  const {
    data: credentials,
    isLoading,
    error,
    refetch,
  } = useGetZohoCredentials(selectedOrganization?.id);

  const { mutateAsync: initiateOAuth, isPending: isInitiating } =
    useInitiateZohoOAuth();
  const { mutateAsync: handleOAuthCallback, isPending: isHandlingCallback } =
    useHandleOAuthCallback();

  // Sync hooks for automatic syncing after connection
  const { mutateAsync: syncChartOfAccounts } = useSyncChartOfAccounts();
  const { mutateAsync: syncTaxes } = useSyncTaxes();
  const { mutateAsync: syncTdsTcs } = useSyncTdsTcs();
  const { mutateAsync: syncVendors } = useSyncVendors();

  // Copy to clipboard function
  const copyToClipboard = (text, fieldName) => {
    if (!text || text === "N/A") {
      toast.error("Nothing to copy");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Check if user is returning from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    if (error) {
      toast.error(`OAuth authorization failed: ${error}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state && selectedOrganization?.id) {
      handleOAuthCallback({
        organizationId: selectedOrganization.id,
        code,
        state,
      })
        .then(async (response) => {
          if (response.success) {
            toast.success("Successfully connected to Zoho Books!");
            refetch();

            // Start auto-sync process
            setIsAutoSyncing(true);
            toast.info("Syncing your Zoho data automatically...");

            const startTime = Date.now();

            try {
              // Trigger all syncs in parallel for faster execution
              await Promise.all([
                syncChartOfAccounts(selectedOrganization.id).catch((err) =>
                  console.error("Chart of Accounts sync failed:", err),
                ),
                syncTaxes(selectedOrganization.id).catch((err) =>
                  console.error("GST Ledgers sync failed:", err),
                ),
                syncTdsTcs(selectedOrganization.id).catch((err) =>
                  console.error("TDS/TCS sync failed:", err),
                ),
                syncVendors(selectedOrganization.id).catch((err) =>
                  console.error("Vendors sync failed:", err),
                ),
              ]);

              // Ensure minimum 10 seconds loader display
              const elapsedTime = Date.now() - startTime;
              const remainingTime = Math.max(0, 10000 - elapsedTime);

              if (remainingTime > 0) {
                await new Promise((resolve) =>
                  setTimeout(resolve, remainingTime),
                );
              }

              toast.success("All Zoho data synced successfully!");
            } catch (error) {
              console.error("Auto-sync error:", error);
              toast.warning("Some data may not have synced completely");
            } finally {
              setIsAutoSyncing(false);
            }
          } else {
            toast.error(response.detail || "Failed to complete OAuth flow");
          }
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        })
        .catch((error) => {
          const errorMessage =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            error.message ||
            "OAuth flow failed";
          toast.error(errorMessage);

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        });
    }
  }, [
    selectedOrganization?.id,
    handleOAuthCallback,
    refetch,
    syncChartOfAccounts,
    syncTaxes,
    syncTdsTcs,
    syncVendors,
  ]);

  const handleConnectToZoho = async () => {
    if (!selectedOrganization?.id) {
      toast.error("No organization selected");
      return;
    }

    try {
      const response = await initiateOAuth(selectedOrganization.id);
      if (response.authorization_url) {
        window.location.href = response.authorization_url;
      } else {
        toast.error("Failed to initiate OAuth flow");
      }
    } catch (error) {
      console.error("OAuth initiate error:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to initiate OAuth flow";
      toast.error(errorMessage);
    }
  };

  const isConnected =
    credentials && credentials.accessToken && credentials.refreshToken;
  const hasBasicCredentials =
    credentials &&
    credentials.clientId &&
    credentials.clientSecret &&
    credentials.redirectUrl;

  const showConnectButton =
    !credentials ||
    Object.keys(credentials).length === 0 ||
    (credentials && !isConnected);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const maskSensitiveData = (data, startChars = 6, endChars = 6) => {
    if (!data) return "N/A";
    if (data.length <= startChars + endChars) return data;
    const start = data.slice(0, startChars);
    const end = data.slice(-endChars);
    const middleLength = data.length - startChars - endChars;
    return start + "*".repeat(middleLength) + end;
  };

  return (
    <div className="space-y-6">
      <Card
        title="Zoho Books Integration"
        noBorder
        headerSlot={
          showConnectButton && (
            <button
              onClick={handleConnectToZoho}
              disabled={
                isInitiating || isHandlingCallback || !selectedOrganization?.id
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              {isInitiating || isHandlingCallback
                ? "Connecting..."
                : isConnected
                  ? "Reconnect"
                  : "Connect to Zoho Books"}
            </button>
          )
        }
      >
        <div className="p-6">
          {isLoading || isAutoSyncing ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isAutoSyncing
                  ? "Syncing your Zoho data..."
                  : "Loading credentials..."}
              </p>
              {isAutoSyncing && (
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                  Fetching Chart of Accounts, GST Ledgers, TDS/TCS, and Vendors
                </p>
              )}
            </div>
          ) : error?.response?.status === 404 || !credentials ? (
            // Not Connected State - Simple and Clean
            <div className="py-12 text-center max-w-2xl mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
                  Connect Your Zoho Books Account
                </h3>
                <p className="text-base text-slate-600 dark:text-slate-400 mb-8">
                  Sync vendors, bills, and financial data seamlessly with secure
                  OAuth authentication.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Sync Vendors
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <svg
                    className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Chart of Accounts
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <svg
                    className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Process Bills
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Click the "Connect to Zoho Books" button above to get started
              </p>
            </div>
          ) : error ? (
            // Error State
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl mb-4">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Unable to Load Credentials
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                {error?.response?.data?.message ||
                  error?.message ||
                  "An error occurred"}
              </p>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>
            </div>
          ) : (
            // Connected State - Bento Grid Layout
            <>
              {/* Status Banner */}
              <div
                className={`mb-6 p-4 rounded-xl border-2 ${
                  isConnected
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isConnected
                        ? "bg-green-100 dark:bg-green-800/50"
                        : "bg-amber-100 dark:bg-amber-800/50"
                    }`}
                  >
                    {isConnected ? (
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-amber-600 dark:text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-sm font-semibold ${
                        isConnected
                          ? "text-green-900 dark:text-green-100"
                          : "text-amber-900 dark:text-amber-100"
                      }`}
                    >
                      {isConnected
                        ? "Connected to Zoho Books"
                        : "Not Connected"}
                    </h3>
                    <p
                      className={`text-xs ${
                        isConnected
                          ? "text-green-700 dark:text-green-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {isConnected
                        ? "Integration active and ready to sync"
                        : "Click Connect to authenticate"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* OAuth Configuration - Takes 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    OAuth Configuration
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoCard
                      label="Client ID"
                      value={credentials.clientId}
                      icon="code"
                      onCopy={() =>
                        copyToClipboard(credentials.clientId, "Client ID")
                      }
                      isCopied={copiedField === "Client ID"}
                    />
                    <InfoCard
                      label="Organisation ID"
                      value={credentials.organisationId}
                      icon="building"
                      onCopy={() =>
                        copyToClipboard(
                          credentials.organisationId,
                          "Organisation ID",
                        )
                      }
                      isCopied={copiedField === "Organisation ID"}
                    />
                  </div>
                  <InfoCard
                    label="Redirect URL"
                    value={credentials.redirectUrl}
                    icon="link"
                    onCopy={() =>
                      copyToClipboard(credentials.redirectUrl, "Redirect URL")
                    }
                    isCopied={copiedField === "Redirect URL"}
                  />
                </div>

                {/* Connection Details - Takes 1 column */}
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                    Connection Details
                  </h2>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 h-full">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                          <svg
                            className="w-5 h-5 text-slate-600 dark:text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            First Connected
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {formatDate(credentials.created_at)}
                          </p>
                        </div>
                      </div>
                      {isConnected && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Active Connection
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sensitive Credentials - Full width */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Sensitive Credentials
                    </h2>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Protected
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SecretCard
                      label="Client Secret"
                      value={credentials.clientSecret}
                      maskedValue={maskSensitiveData(credentials.clientSecret)}
                      onCopy={() =>
                        copyToClipboard(
                          credentials.clientSecret,
                          "Client Secret",
                        )
                      }
                      isCopied={copiedField === "Client Secret"}
                    />
                    <SecretCard
                      label="Access Code"
                      value={credentials.accessCode}
                      maskedValue={maskSensitiveData(credentials.accessCode)}
                      onCopy={() =>
                        copyToClipboard(credentials.accessCode, "Access Code")
                      }
                      isCopied={copiedField === "Access Code"}
                    />
                    <SecretCard
                      label="Access Token"
                      value={credentials.accessToken}
                      maskedValue={maskSensitiveData(credentials.accessToken)}
                      onCopy={() =>
                        copyToClipboard(credentials.accessToken, "Access Token")
                      }
                      isCopied={copiedField === "Access Token"}
                      status={isConnected ? "active" : "inactive"}
                    />
                    <SecretCard
                      label="Refresh Token"
                      value={credentials.refreshToken}
                      maskedValue={maskSensitiveData(credentials.refreshToken)}
                      onCopy={() =>
                        copyToClipboard(
                          credentials.refreshToken,
                          "Refresh Token",
                        )
                      }
                      isCopied={copiedField === "Refresh Token"}
                      status={isConnected ? "active" : "inactive"}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

// Info Card Component
const InfoCard = ({ label, value, icon, onCopy, isCopied }) => {
  const icons = {
    code: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
    building: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
    link: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 group relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          {icons[icon]}
          <span className="text-xs font-medium uppercase tracking-wide">
            {label}
          </span>
        </div>
        <button
          onClick={onCopy}
          className={`p-1.5 rounded-md transition-all ${
            isCopied
              ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
              : "opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          }`}
        >
          {isCopied ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
      <p
        className={`text-sm font-mono text-slate-900 dark:text-white break-all ${!value || value === "N/A" ? "text-slate-400 dark:text-slate-600" : ""}`}
      >
        {value || "N/A"}
      </p>
    </div>
  );
};

// Secret Card Component
const SecretCard = ({
  label,
  value,
  maskedValue,
  onCopy,
  isCopied,
  status,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 relative">
      {status && (
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              status === "active"
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1 ${
                status === "active"
                  ? "bg-green-500 animate-pulse"
                  : "bg-slate-400"
              }`}
            ></span>
            {status}
          </span>
        </div>
      )}

      <div className="mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-200">
          {label}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-sm font-mono text-amber-900 dark:text-amber-100 break-all">
          {isRevealed ? value || "N/A" : maskedValue || "N/A"}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsRevealed(!isRevealed)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/50 rounded-md hover:bg-amber-200 dark:hover:bg-amber-700/50 transition-colors"
        >
          {isRevealed ? (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
              Hide
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Show
            </>
          )}
        </button>

        <button
          onClick={onCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
            isCopied
              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
              : "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-700/50"
          }`}
        >
          {isCopied ? (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ZohoCredentials;
