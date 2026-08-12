import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useGetHelpData, useGetTallySetupGuide } from "@/services/tally/tallyApiService";

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CopyButton = ({ value, label = "value" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 inline-flex items-center gap-1 px-2 h-7 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
    >
      <Icon icon={copied ? "heroicons:check" : "heroicons:document-duplicate"} className={`text-sm ${copied ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

const TallyAccountInfo = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);

  const {
    data: helpData,
    isLoading,
    error,
    refetch,
  } = useGetHelpData(selectedOrganization?.id, {
    enabled: !!selectedOrganization?.id,
  });

  const {
    data: setupGuideData,
    isLoading: isLoadingGuide,
    isError: isErrorGuide,
    refetch: refetchGuide,
  } = useGetTallySetupGuide();

  const setupSteps = setupGuideData?.steps || [];

  // Derive the canonical Tally API base URL from the backend response.
  // - Prefer an explicit `base_url` field if the backend provides one.
  // - Otherwise trim any existing endpoint URL (.../org/<id>/<resource>/) back to .../org/<id>/.
  const apiBaseUrl = useMemo(() => {
    if (!helpData) return "";
    if (helpData.base_url) return helpData.base_url;
    const sample =
      helpData.ledgers ||
      helpData.masters ||
      helpData.vendor_bills_sync_external ||
      helpData.expense_bills_sync_external;
    if (!sample) return "";
    const match = String(sample).match(/^(.*\/org\/[^/]+\/)/);
    return match ? match[1] : sample;
  }, [helpData]);

  // Same logic for the TCP download — use backend-provided URL when available.
  const tcpDownloadUrl = useMemo(() => {
    if (!helpData) return "";
    if (helpData.tcp_download_url) return helpData.tcp_download_url;
    if (apiBaseUrl) return `${apiBaseUrl}download-tcp/`;
    return "";
  }, [helpData, apiBaseUrl]);

  const handleDownloadTcp = () => {
    if (!tcpDownloadUrl) {
      toast.error("Download URL not available yet");
      return;
    }
    const a = document.createElement("a");
    a.href = tcpDownloadUrl;
    const versionTag = helpData?.tcp_version ? `-v${helpData.tcp_version}` : "";
    a.download = `billmunshi-tally${versionTag}.tcp`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(
      helpData?.tcp_version
        ? `Downloading Tally TCP v${helpData.tcp_version}…`
        : "Downloading Tally TCP…"
    );
  };

  if (!selectedOrganization) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
          <Icon icon="heroicons:building-office" className="text-lg" />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Please select a client to view account information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Account information
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Your Tally integration key, API base URL, and account details.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Icon icon="heroicons:arrow-path" className={`text-sm ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDownloadTcp}
            disabled={!tcpDownloadUrl || isLoading}
            title={
              !tcpDownloadUrl
                ? "No active TCP release yet — upload one in Django admin"
                : helpData?.tcp_version
                  ? `Tally TCP v${helpData.tcp_version}`
                  : "Download Tally TCP"
            }
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20 transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-down-tray" className="text-sm" />
            Download TCP
            {helpData?.tcp_version && (
              <span className="inline-flex items-center px-1.5 py-0.5 -mr-1 ml-0.5 rounded-md bg-white/20 text-white text-[9px] font-bold tracking-wide">
                v{helpData.tcp_version}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2.5">
            <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
          </div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            Failed to load account information
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
            {error?.data?.message || error?.message || "An error occurred while fetching account data."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className="text-sm" />
            Try again
          </button>
        </div>
      ) : !helpData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Icon icon="heroicons:document-text" className="text-xl" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            No account information yet
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Account data has not been set up for this workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Row 1 — Organization details + Tally integration (50:50) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Organization details */}
            {helpData.organization && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col">
                <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:building-office-2" className="text-sm" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Organization details
                  </h3>
                </div>
                <dl className="space-y-2.5 flex-1">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Organization name
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900 dark:text-white">
                      {helpData.organization.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Organization ID
                    </dt>
                    <dd className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 px-2 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 break-all select-all">
                        {helpData.organization.id}
                      </code>
                      <CopyButton value={helpData.organization.id} label="Org ID" />
                    </dd>
                  </div>
                  {helpData.created_by && (
                    <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Created by
                        </dt>
                        <dd className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {helpData.created_by.full_name || "—"}
                        </dd>
                        <dd className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {helpData.created_by.email || ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Created at
                        </dt>
                        <dd className="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                          <Icon icon="heroicons:calendar" className="text-slate-400 text-base" />
                          {formatDate(helpData.created_at)}
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Tally integration (key + base URL combined) */}
            {(helpData.api_key || apiBaseUrl) && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col">
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                      <Icon icon="heroicons:cog-6-tooth" className="text-sm" />
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                      Tally integration
                    </h3>
                  </div>
                  {helpData.api_key && (
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 flex-1">
                  {helpData.api_key && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Icon icon="heroicons:key" className="text-blue-600 dark:text-blue-400 text-sm" />
                        Integration key
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <Icon icon="heroicons:lock-closed" className="text-slate-400 text-base shrink-0" />
                        <code className="flex-1 text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all">
                          {helpData.api_key}
                        </code>
                        <CopyButton value={helpData.api_key} label="API key" />
                      </div>
                    </div>
                  )}

                  {apiBaseUrl && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Icon icon="heroicons:globe-alt" className="text-blue-600 dark:text-blue-400 text-sm" />
                        API base URL
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <Icon icon="heroicons:link" className="text-slate-400 text-base shrink-0" />
                        <code className="flex-1 text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all">
                          {apiBaseUrl}
                        </code>
                        <CopyButton value={apiBaseUrl} label="Base URL" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Row 2 — Tally setup guide (admin-managed timeline) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                  <Icon icon="heroicons:book-open" className="text-sm" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Tally setup guide
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Step-by-step walkthrough to connect Tally with BillMunshi.
                  </p>
                </div>
              </div>
              {setupSteps.length > 0 && (
                <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700">
                  {setupSteps.length} {setupSteps.length === 1 ? "step" : "steps"}
                </span>
              )}
            </div>

            {isLoadingGuide ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
                ))}
              </div>
            ) : isErrorGuide ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <Icon icon="heroicons:exclamation-triangle" className="text-xl" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Failed to load setup guide</p>
                <button
                  type="button"
                  onClick={() => refetchGuide()}
                  className="mt-3 inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <Icon icon="heroicons:arrow-path" className="text-sm" />
                  Try again
                </button>
              </div>
            ) : setupSteps.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <Icon icon="heroicons:book-open" className="text-xl" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Setup guide coming soon
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Detailed steps will be published here.
                </p>
              </div>
            ) : (
              <ol className="relative space-y-4">
                {/* vertical timeline line — sits behind the badges */}
                <span
                  aria-hidden="true"
                  className="absolute left-3.25 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800"
                />
                {setupSteps.map((step, i) => (
                  <li key={step.id || i} className="relative flex gap-3">
                    <span className="relative z-10 shrink-0 w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center text-[11px] font-bold">
                      {step.step_number}
                    </span>
                    <div className="flex-1 min-w-0 pb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                        {step.title}
                      </h4>
                      {step.description && (
                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                          {step.description}
                        </p>
                      )}
                      {step.image_url && (
                        <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                          <img
                            src={step.image_url}
                            alt={step.image_alt || step.title}
                            loading="lazy"
                            className="w-full h-auto max-h-96 object-contain bg-white dark:bg-slate-950"
                          />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TallyAccountInfo;
