import React from "react";
import Card from "@/components/ui/Card";
import { useSelector } from "react-redux";
import {
  useGetZohoStatus,
  useInitiateZohoOAuth,
  useHandleOAuthCallback,
} from "@/hooks/api/zoho/zohoApiService";
import { toast } from "react-toastify";
import { useEffect } from "react";

const ZohoCredentials = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);

  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useGetZohoStatus(selectedOrganization?.id);

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
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state && selectedOrganization?.id) {
      handleOAuthCallback({
        organizationId: selectedOrganization.id,
        code,
        state,
      })
        .then((response) => {
          if (response.success) {
            toast.success("Successfully connected to Zoho Books!");
            refetch();
          } else {
            toast.error("Failed to complete OAuth flow");
          }
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        })
        .catch((error) => {
          console.error("OAuth callback error:", error);
          toast.error(error.response?.data?.detail || "OAuth flow failed");
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">
          Loading Zoho integration status...
        </span>
      </div>
    );
  }

  if (error) {
    return (
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
            Failed to load integration status
          </p>
          <p className="text-sm text-slate-500 mt-2">
            {error?.response?.data?.message ||
              error?.message ||
              "An error occurred"}
          </p>
        </div>
        <button
          onClick={refetch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!status?.client_configured) {
    return (
      <Card title="Zoho Books Integration" noBorder>
        <div className="p-6 text-center">
          <div className="text-yellow-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4"
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Server Configuration Required
            </h3>
            <p className="text-gray-600 mb-4">
              Zoho Books integration requires server-side configuration. Please
              contact your administrator to configure the following environment
              variables:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm text-left">
              <div>ZOHO_CLIENT_ID=your_client_id</div>
              <div>ZOHO_CLIENT_SECRET=your_client_secret</div>
              <div>ZOHO_REDIRECT_URL=your_redirect_url</div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card
        title="Zoho Books Integration"
        noBorder
        headerSlot={
          <div className="flex gap-3">
            {!status?.is_connected ? (
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
            ) : (
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
              {/* Connection Status Banner */}
              <div
                className={`p-4 mb-6 rounded-lg border-l-4 ${
                  status?.is_connected
                    ? "bg-green-50 border-green-500 dark:bg-green-900/20"
                    : "bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20"
                }`}
              >
                <div className="flex items-center">
                  {status?.is_connected ? (
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
                        {status.organization_id && (
                          <p className="text-green-600 text-xs mt-1">
                            Organization ID: {status.organization_id}
                          </p>
                        )}
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
                          Click "Connect to Zoho Books" to authenticate with
                          your Zoho account
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Integration Info */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Integration Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Connection Status
                      </h3>
                      <p
                        className={`text-lg font-semibold ${
                          status?.is_connected
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {status?.is_connected ? "Connected" : "Not Connected"}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Server Configuration
                      </h3>
                      <p
                        className={`text-lg font-semibold ${
                          status?.client_configured
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {status?.client_configured
                          ? "Configured"
                          : "Not Configured"}
                      </p>
                    </div>
                    {status?.organization_id && (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Zoho Organization ID
                        </h3>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white font-mono break-all">
                          {status.organization_id}
                        </p>
                      </div>
                    )}
                    {status?.token_expiry && (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Token Expires
                        </h3>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                          {formatDate(status.token_expiry)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Integration Features */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Available Features
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        name: "Vendors Sync",
                        desc: "Sync vendor information from Zoho Books",
                      },
                      {
                        name: "Chart of Accounts",
                        desc: "Import account structure",
                      },
                      {
                        name: "Tax Configuration",
                        desc: "Sync tax rates and settings",
                      },
                      {
                        name: "TDS/TCS Management",
                        desc: "Import TDS and TCS configurations",
                      },
                      {
                        name: "Bill Processing",
                        desc: "Process vendor and journal bills",
                      },
                      {
                        name: "Expense Management",
                        desc: "Handle expense bill workflows",
                      },
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${
                          status?.is_connected
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start">
                          <svg
                            className={`w-5 h-5 mt-0.5 mr-3 ${
                              status?.is_connected
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                status?.is_connected
                                  ? "M5 13l4 4L19 7"
                                  : "M12 8v4m0 4h.01"
                              }
                            />
                          </svg>
                          <div>
                            <h4
                              className={`font-medium ${
                                status?.is_connected
                                  ? "text-green-900"
                                  : "text-gray-900"
                              }`}
                            >
                              {feature.name}
                            </h4>
                            <p
                              className={`text-sm ${
                                status?.is_connected
                                  ? "text-green-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {feature.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ZohoCredentials;
