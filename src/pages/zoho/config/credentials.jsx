import React from "react";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import {
  useGetZohoCredentials,
  useInitiateZohoOAuth,
  useHandleOAuthCallback,
} from "@/hooks/api/zoho/zohoApiService";
import { toast } from "react-toastify";
import { useEffect } from "react";

const ZohoCredentials = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);

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

  // Check if user is returning from OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    if (error) {
      toast.error(`OAuth authorization failed: ${error}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state && selectedOrganization?.id) {
      toast.info("Processing OAuth callback...");
      handleOAuthCallback({
        organizationId: selectedOrganization.id,
        code,
        state,
      })
        .then((response) => {
          if (response.success) {
            toast.success("Successfully connected to Zoho Books!");
            refetch(); // Refresh the credentials data
          } else {
            toast.error("Failed to complete OAuth flow");
          }
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        })
        .catch((error) => {
          console.error("OAuth callback error:", error);
          toast.error(error.response?.data?.detail || "OAuth flow failed");
          // Clean up URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        });
    }
  }, [selectedOrganization?.id, handleOAuthCallback, refetch]);

  const handleConnectToZoho = async () => {
    if (!selectedOrganization?.id) {
      toast.error("No organization selected");
      return;
    }

    try {
      const response = await initiateOAuth(selectedOrganization.id);

      if (response.authorization_url) {
        // Redirect user to Zoho OAuth page
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

  const handleSync = async () => {
    if (!selectedOrganization?.id) {
      toast.error("No organization selected");
      return;
    }

    try {
      const response = await generateToken(selectedOrganization.id);

      if (response.success && response.accessToken && response.refreshToken) {
        toast.success("Token generated successfully");
        refetch(); // Refresh the credentials data
      } else {
        toast.error("Failed to generate token - Invalid response");
      }
    } catch (error) {
      console.error("Generate token error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to generate token";
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

  // Show connect button if no credentials (empty object) or if credentials exist but not connected
  const showConnectButton =
    !credentials || Object.keys(credentials).length === 0 || (credentials && !isConnected);

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
    <div className="space-y-5">
      <Card
        title="Zoho Books Integration"
        noBorder
        headerSlot={
          <div className="flex gap-3">
            {/* Always show connect button for 404 errors or when not connected */}
            {(error?.response?.status === 404 ||
              (credentials && !isConnected)) && (
              <button
                onClick={handleConnectToZoho}
                disabled={
                  isInitiating ||
                  isHandlingCallback ||
                  !selectedOrganization?.id
                }
                className="group relative inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Connect to Zoho Books via OAuth2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isInitiating || isHandlingCallback
                      ? "animate-pulse"
                      : "group-hover:scale-110"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                  />
                </svg>
                {isInitiating || isHandlingCallback
                  ? "Connecting..."
                  : "Connect to Zoho Books"}
              </button>
            )}

            {isConnected && (
              <button
                onClick={handleConnectToZoho}
                disabled={
                  isInitiating ||
                  isHandlingCallback ||
                  !selectedOrganization?.id
                }
                className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reconnect to Zoho Books"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isInitiating || isHandlingCallback
                      ? "animate-spin"
                      : "group-hover:rotate-180"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                {isInitiating || isHandlingCallback
                  ? "Reconnecting..."
                  : "Reconnect"}
              </button>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-slate-600">
                    Loading credentials...
                  </span>
                </div>
              ) : error ? (
                // Check if it's a 404 error (credentials not found)
                error?.response?.status === 404 ? (
                  <div className="text-center py-12">
                    <div className="text-slate-500">
                      <svg
                        className="w-16 h-16 mx-auto mb-6 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                        />
                      </svg>
                      <h3 className="text-xl font-semibold text-slate-900 mb-3">
                        Ready to Connect Zoho Books
                      </h3>
                      <p className="text-slate-600 mb-2">
                        Get started by connecting your Zoho Books account to
                        sync your financial data.
                      </p>
                      <p className="text-sm text-slate-500 mb-8">
                        Click the "Connect to Zoho Books" button above to begin
                        the secure OAuth authentication.
                      </p>

                      {/* Features Preview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <div className="flex items-center justify-center bg-green-50 rounded-lg p-4">
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 text-green-600 mx-auto mb-2"
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
                            <h4 className="font-medium text-green-900 text-sm">
                              Sync Vendors
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center justify-center bg-blue-50 rounded-lg p-4">
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 text-blue-600 mx-auto mb-2"
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
                            <h4 className="font-medium text-blue-900 text-sm">
                              Chart of Accounts
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center justify-center bg-purple-50 rounded-lg p-4">
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 text-purple-600 mx-auto mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <h4 className="font-medium text-purple-900 text-sm">
                              Process Bills
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show generic error for other types of errors
                  <div className="text-center py-8">
                    <div className="text-red-600 mb-4">
                      <svg
                        className="w-12 h-12 mx-auto mb-4"
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
                      <p className="text-lg font-medium">
                        Failed to load credentials
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        {error?.response?.data?.message ||
                          error?.message ||
                          "An error occurred while fetching credentials"}
                      </p>
                    </div>
                    <button
                      onClick={refetch}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )
              ) : !credentials ? (
                <div className="text-center py-8">
                  <div className="text-slate-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-lg font-medium">No credentials found</p>
                    <p className="text-sm mt-2">
                      Please configure your Zoho Books credentials first
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Connection Status Banner */}
                  <div
                    className={`p-4 mb-6 rounded-lg border-l-4 ${
                      isConnected
                        ? "bg-green-50 border-green-500 dark:bg-green-900/20"
                        : "bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20"
                    }`}
                  >
                    <div className="flex items-center">
                      {isConnected ? (
                        <>
                          <svg
                            className="w-6 h-6 text-green-600 mr-3"
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
                          <div>
                            <h3 className="text-green-800 font-medium">
                              Connected to Zoho Books
                            </h3>
                            <p className="text-green-700 text-sm">
                              Your integration is active and ready to sync data
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-6 h-6 text-yellow-600 mr-3"
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
                          <div>
                            <h3 className="text-yellow-800 font-medium">
                              Not Connected to Zoho Books
                            </h3>
                            <p className="text-yellow-700 text-sm">
                              {hasBasicCredentials
                                ? 'Click "Connect to Zoho Books" to authenticate with your Zoho account'
                                : "Please configure Client ID, Client Secret, and Redirect URL first"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Client ID
                        </h3>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono break-all">
                          {credentials.clientId || "N/A"}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Organisation ID
                        </h3>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white break-words">
                          {credentials.organisationId || "N/A"}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Redirect URL
                        </h3>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white break-all word-wrap overflow-hidden">
                          {credentials.redirectUrl || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Sensitive Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Client Secret
                          </h3>
                          <p className="text-sm font-mono text-amber-900 dark:text-amber-100 break-all overflow-hidden">
                            {maskSensitiveData(credentials.clientSecret)}
                          </p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Access Code
                          </h3>
                          <p className="text-sm font-mono text-amber-900 dark:text-amber-100 break-all overflow-hidden">
                            {maskSensitiveData(credentials.accessCode)}
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                            Access Token
                          </h3>
                          <p className="text-sm font-mono text-green-900 dark:text-green-100 break-all overflow-hidden">
                            {maskSensitiveData(credentials.accessToken)}
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                            Refresh Token
                          </h3>
                          <p className="text-sm font-mono text-green-900 dark:text-green-100 break-all overflow-hidden">
                            {maskSensitiveData(credentials.refreshToken)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Timestamps
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Created At
                          </h3>
                          <p className="text-sm text-blue-900 dark:text-blue-100 break-words">
                            {formatDate(credentials.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ZohoCredentials;
