import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import Modal from "@/components/ui/Modal";
import TablePagination from "@/components/ui/TablePagination";
import UploadBillModal from "@/components/modals/UploadBillModal";
import FileViewerModal from "@/components/modals/FileViewerModal";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import { globalToast } from "@/utils/toast";
import { notifyUploadResult, notifyUploadError } from "@/utils/uploadFeedback";

const inputBase =
  "w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 dark:hover:border-slate-600";

const TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "analysed", label: "Analysed" },
  { key: "synced", label: "Synced" },
];

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const StatusBadge = ({ status }) => {
  const map = {
    Draft: { bg: "bg-amber-50 dark:bg-amber-950/40", txt: "text-amber-700 dark:text-amber-400", ring: "ring-amber-100 dark:ring-amber-900/60", dot: "bg-amber-500" },
    Analysed: { bg: "bg-blue-50 dark:bg-blue-950/40", txt: "text-blue-700 dark:text-blue-400", ring: "ring-blue-100 dark:ring-blue-900/60", dot: "bg-blue-500" },
    Verified: { bg: "bg-violet-50 dark:bg-violet-950/40", txt: "text-violet-700 dark:text-violet-400", ring: "ring-violet-100 dark:ring-violet-900/60", dot: "bg-violet-500" },
    Synced: { bg: "bg-emerald-50 dark:bg-emerald-950/40", txt: "text-emerald-700 dark:text-emerald-400", ring: "ring-emerald-100 dark:ring-emerald-900/60", dot: "bg-emerald-500" },
  };
  const c = map[status] || { bg: "bg-slate-100 dark:bg-slate-800", txt: "text-slate-600 dark:text-slate-400", ring: "ring-slate-200 dark:ring-slate-700", dot: "bg-slate-400" };
  const label = status === "Verified" ? "Verified · pending sync" : status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${c.bg} ${c.txt} ${c.ring}`}
      title={status}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
    </span>
  );
};

// Tally serializers expose `bill_munshi_name` (snake_case); Zoho serializers
// expose `billmunshiName` (camelCase). Read whichever the API returned.
const getBillName = (bill) =>
  bill?.bill_munshi_name || bill?.billmunshiName || "";

const getTallySyncState = (bill) => {
  if (bill.tally_synced) return "success";
  if (bill.tally_sync_message && !bill.tally_synced) return "failed";
  return null;
};

const BillsList = ({
  variant, // "vendor" | "expense"
  // "tally" | "zoho" — chooses which backend tree the scanner endpoint hits
  module = "tally",
  copy,    // labels: { title, subtitle, billLabel, moveTargetLabel, detailRoute, uploadTitle }
  // hooks (from the per-page service file)
  useGetBills,
  useUpdateBill,
  useDeleteBill,
  useUploadBills,
  useAnalyzeBill,
  useSyncBill,
  useMoveBills,
  // Optional: XLSX report download hook — when supplied, a "Download
  // Excel" button appears on the Analysed / Verified / Synced tabs.
  useDownloadReport,
  // direction args for the move endpoint
  moveFrom,
  moveTo,
}) => {
  const navigate = useNavigate();
  const { selectedOrganization } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setPage(1);
    setSearchQuery("");
  }, [activeTab]);

  const queryParams = useMemo(() => {
    const params = { organizationId: selectedOrganization?.id };
    if (activeTab !== "all") params.status = activeTab;
    return params;
  }, [activeTab, selectedOrganization?.id]);

  const {
    data: billsData,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetBills(queryParams, { enabled: !!selectedOrganization?.id });

  // Counts for tabs (these queries are cached, so no thrashing)
  const { data: allCountData } = useGetBills(
    { organizationId: selectedOrganization?.id },
    { enabled: !!selectedOrganization?.id }
  );
  const { data: draftCountData } = useGetBills(
    { organizationId: selectedOrganization?.id, status: "draft" },
    { enabled: !!selectedOrganization?.id }
  );
  const { data: analysedCountData } = useGetBills(
    { organizationId: selectedOrganization?.id, status: "analysed" },
    { enabled: !!selectedOrganization?.id }
  );
  const { data: syncedCountData } = useGetBills(
    { organizationId: selectedOrganization?.id, status: "synced" },
    { enabled: !!selectedOrganization?.id }
  );

  const counts = {
    all: allCountData?.count ?? 0,
    draft: draftCountData?.count ?? 0,
    analysed: analysedCountData?.count ?? 0,
    synced: syncedCountData?.count ?? 0,
  };

  const { mutateAsync: updateBill } = useUpdateBill();
  const { mutateAsync: deleteBill } = useDeleteBill();
  const { mutateAsync: uploadBills } = useUploadBills();
  const { mutateAsync: analyzeBill } = useAnalyzeBill();
  const { mutateAsync: syncBill } = useSyncBill();
  const { mutateAsync: moveBills } = useMoveBills();

  // Download-report hook is optional. When the parent page doesn't
  // pass one, ``downloadReport`` is a no-op and the button stays hidden.
  const downloadReportMutation = useDownloadReport ? useDownloadReport() : null;
  const canDownloadReport =
    Boolean(useDownloadReport) &&
    ["analysed", "synced"].includes(activeTab);
  const isDownloadingReport = downloadReportMutation?.isPending || false;

  const handleDownloadReport = async () => {
    if (!downloadReportMutation) return;
    // Analysed tab groups Analysed + Verified server-side (see
    // bills_list_base); mirror that here so the exported rows match
    // what the user is looking at.
    const statusFilter =
      activeTab === "synced"
        ? "Synced"
        : "Analysed,Verified";
    try {
      await downloadReportMutation.mutateAsync({
        organizationId: selectedOrganization?.id,
        status: statusFilter,
      });
      globalToast.success("Report downloaded");
    } catch (err) {
      globalToast.error(
        err?.response?.data?.message || err?.message || "Failed to download report",
      );
    }
  };

  // UI state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isExternalBillModalOpen, setIsExternalBillModalOpen] = useState(false);
  const [isSyncStatusModalOpen, setIsSyncStatusModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState({ url: "", name: "" });
  const [selectedDuplicateBill, setSelectedDuplicateBill] = useState(null);
  const [selectedExternalBill, setSelectedExternalBill] = useState(null);
  const [selectedSyncBill, setSelectedSyncBill] = useState(null);
  const [analyzingBills, setAnalyzingBills] = useState(new Set());
  const [syncingBills, setSyncingBills] = useState(new Set());
  const [deletingBills, setDeletingBills] = useState(new Set());
  const [selectedBills, setSelectedBills] = useState(new Set());
  const [deleteConfirmBillId, setDeleteConfirmBillId] = useState(null);
  // Bulk action modals
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkSyncOpen, setIsBulkSyncOpen] = useState(false);
  const [isBulkActing, setIsBulkActing] = useState(false);

  const bills = billsData?.results || [];

  // Filter on the client by search (across name, status, uploader)
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return bills;
    const q = searchQuery.toLowerCase();
    return bills.filter((b) =>
      [getBillName(b), b.status, b.uploaded_by_name, b.processing_error]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [bills, searchQuery]);

  const paged = useMemo(() => {
    const startIdx = (page - 1) * pageSize;
    return filtered.slice(startIdx, startIdx + pageSize);
  }, [filtered, page, pageSize]);

  // All bills on the current page are selectable — bulk actions
  // decide per-bill eligibility (Sync only fires on Verified, Delete
  // works on any status, Move keeps its original per-page semantics).
  const selectableIds = useMemo(() => paged.map((b) => b.id), [paged]);

  const selectedBillObjs = useMemo(
    () => bills.filter((b) => selectedBills.has(b.id)),
    [bills, selectedBills],
  );
  // Bulk-sync eligibility: any Verified bill, plus previously-Synced
  // bills whose backend flag (``tally_synced``) still says the sync
  // never actually landed in Tally.
  const bulkSyncableIds = useMemo(
    () =>
      selectedBillObjs
        .filter(
          (b) =>
            b.status === "Verified" ||
            (b.status === "Synced" && !b.tally_synced),
        )
        .map((b) => b.id),
    [selectedBillObjs],
  );
  const allSelectablePicked =
    selectableIds.length > 0 && selectableIds.every((id) => selectedBills.has(id));

  const toggleAll = () => {
    setSelectedBills((prev) => {
      const next = new Set(prev);
      if (allSelectablePicked) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id) =>
    setSelectedBills((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Handlers
  const handleAction = async (billId, action) => {
    try {
      if (action === "analyse") {
        if (analyzingBills.has(billId)) return;
        setAnalyzingBills((p) => new Set([...p, billId]));
        try {
          await analyzeBill({ organizationId: selectedOrganization?.id, billId });
          globalToast.success("Bill analysis started…");
          refetch();
        } finally {
          setAnalyzingBills((p) => {
            const n = new Set(p);
            n.delete(billId);
            return n;
          });
        }
      } else if (action === "sync") {
        if (syncingBills.has(billId)) return;
        setSyncingBills((p) => new Set([...p, billId]));
        try {
          await syncBill({ organizationId: selectedOrganization?.id, billId });
          globalToast.success("Bill synced to Tally");
          refetch();
        } finally {
          setSyncingBills((p) => {
            const n = new Set(p);
            n.delete(billId);
            return n;
          });
        }
      } else if (action === "verify") {
        await updateBill({ organizationId: selectedOrganization?.id, id: billId, status: "Verified" });
        globalToast.success("Bill verified");
        refetch();
      } else if (action === "delete") {
        setDeleteConfirmBillId(billId);
      }
    } catch (err) {
      globalToast.error(err?.response?.data?.message || err?.message || `Failed to ${action} bill`);
    }
  };

  const handleDeleteConfirm = async () => {
    const billId = deleteConfirmBillId;
    setDeleteConfirmBillId(null);
    if (!billId) return;
    setDeletingBills((p) => new Set([...p, billId]));
    try {
      await deleteBill({ organizationId: selectedOrganization?.id, id: billId });
      globalToast.success("Bill deleted");
      refetch();
    } catch (err) {
      globalToast.error(err?.response?.data?.message || err?.message || "Failed to delete bill");
    } finally {
      setDeletingBills((p) => {
        const n = new Set(p);
        n.delete(billId);
        return n;
      });
    }
  };

  const handleUpload = async (formData) => {
    try {
      const result = await uploadBills({
        organizationId: selectedOrganization?.id,
        formData,
      });
      notifyUploadResult(result, "Bills uploaded — processing in background…");
      setIsUploadModalOpen(false);
      refetch();
    } catch (err) {
      notifyUploadError(err, "Failed to upload");
    }
  };

  const handleMoveSelected = async () => {
    if (selectedBills.size === 0) return;
    try {
      await moveBills({
        organizationId: selectedOrganization?.id,
        from: moveFrom,
        to: moveTo,
        bill_ids: Array.from(selectedBills),
      });
      globalToast.success(`${selectedBills.size} bill(s) moved to ${copy.moveTargetLabel}`);
      setIsMoveModalOpen(false);
      setSelectedBills(new Set());
      refetch();
    } catch (err) {
      globalToast.error(err?.response?.data?.message || err?.message || "Move failed");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBills.size === 0) return;
    setIsBulkActing(true);
    const ids = Array.from(selectedBills);
    let ok = 0;
    let failed = 0;
    // No dedicated bulk-delete endpoint — fan out per-bill deletes in
    // parallel so a slow/failed one doesn't block the rest.
    const results = await Promise.allSettled(
      ids.map((id) =>
        deleteBill({ organizationId: selectedOrganization?.id, id }),
      ),
    );
    results.forEach((r) => (r.status === "fulfilled" ? ok++ : failed++));
    setIsBulkActing(false);
    setIsBulkDeleteOpen(false);
    setSelectedBills(new Set());
    if (ok) globalToast.success(`Deleted ${ok} bill${ok > 1 ? "s" : ""}`);
    if (failed) globalToast.error(`Failed to delete ${failed} bill${failed > 1 ? "s" : ""}`);
    refetch();
  };

  const handleBulkSync = async () => {
    if (bulkSyncableIds.length === 0) return;
    setIsBulkActing(true);
    let ok = 0;
    let failed = 0;
    const results = await Promise.allSettled(
      bulkSyncableIds.map((billId) =>
        syncBill({ organizationId: selectedOrganization?.id, billId }),
      ),
    );
    results.forEach((r) => (r.status === "fulfilled" ? ok++ : failed++));
    setIsBulkActing(false);
    setIsBulkSyncOpen(false);
    setSelectedBills(new Set());
    if (ok) globalToast.success(`Queued ${ok} bill${ok > 1 ? "s" : ""} for sync`);
    if (failed) globalToast.error(`Failed to sync ${failed} bill${failed > 1 ? "s" : ""}`);
    refetch();
  };

  // Action button cell
  const ActionCell = ({ bill }) => {
    const { status } = bill;
    if (status === "Synced" && bill.tally_synced) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/60">
          <Icon icon="heroicons:check-circle" className="text-sm" />
          Posted
        </span>
      );
    }
    if (status === "Synced" && !bill.tally_synced) {
      return (
        <button
          type="button"
          onClick={() => navigate(`${copy.detailRoute}/${bill.id}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/60 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer"
        >
          <Icon icon="heroicons:check-badge" className="text-sm" /> Re-verify
        </button>
      );
    }
    if (status === "Draft") {
      const isAnalyzing = analyzingBills.has(bill.id);
      return (
        <button
          type="button"
          onClick={() => handleAction(bill.id, "analyse")}
          disabled={isAnalyzing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 rounded-md hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-60 disabled:cursor-wait cursor-pointer"
        >
          {isAnalyzing ? (
            <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
          ) : (
            <Icon icon="heroicons:sparkles" className="text-sm" />
          )}
          {isAnalyzing ? "Analyzing…" : "Analyse"}
        </button>
      );
    }
    if (status === "Analysed") {
      return (
        <button
          type="button"
          onClick={() => navigate(`${copy.detailRoute}/${bill.id}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 ring-1 ring-violet-100 dark:ring-violet-900/60 rounded-md hover:bg-violet-100 dark:hover:bg-violet-950/60 cursor-pointer"
        >
          <Icon icon="heroicons:check-badge" className="text-sm" /> Verify
        </button>
      );
    }
    if (status === "Verified") {
      const isSyncing = syncingBills.has(bill.id);
      return (
        <button
          type="button"
          onClick={() => handleAction(bill.id, "sync")}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-wait cursor-pointer"
        >
          <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-sm ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing…" : "Sync"}
        </button>
      );
    }
    return <span className="text-xs text-slate-400">—</span>;
  };

  if (!selectedOrganization?.id) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
          <Icon icon="heroicons:building-office" className="text-2xl" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No workspace selected</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Please select a client to view {copy.billLabel}s.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {copy.title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedBills.size > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                <Icon icon="heroicons:arrow-right-circle" className="text-base" />
                Move ({selectedBills.size})
              </button>
              {bulkSyncableIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsBulkSyncOpen(true)}
                  disabled={isBulkActing}
                  title="Sync selected Verified bills to Tally"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  <Icon icon="heroicons:arrow-up-on-square" className="text-base" />
                  Sync ({bulkSyncableIds.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsBulkDeleteOpen(true)}
                disabled={isBulkActing}
                title="Delete selected bills"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                <Icon icon="heroicons:trash" className="text-base" />
                Delete ({selectedBills.size})
              </button>
            </>
          )}
          {canDownloadReport && (
            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={isDownloadingReport}
              title={`Download ${activeTab === "synced" ? "Synced" : "Analysed & Verified"} ${copy.billLabel}s as Excel`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <Icon
                icon={isDownloadingReport ? "heroicons:arrow-path" : "heroicons:arrow-down-tray"}
                className={`text-base ${isDownloadingReport ? "animate-spin" : ""}`}
              />
              {isDownloadingReport ? "Preparing…" : "Download Excel"}
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className={`text-base ${(isLoading || isFetching) ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-1 ring-orange-600/20 transition-all cursor-pointer"
          >
            <Icon icon="heroicons:arrow-up-tray" className="text-base" />
            Upload {copy.billLabel}
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-5 md:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="relative w-full md:max-w-sm">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, status, uploader…"
              className={inputBase}
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 self-start md:self-auto overflow-x-auto">
            {TABS.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60"
                        : "bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {counts[t.key] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading ? (
            <div className="px-5 md:px-6 py-4 space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
                <Icon icon="heroicons:exclamation-triangle" className="text-2xl" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Failed to load {copy.billLabel}s
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                {error?.data?.message || error?.message || "An error occurred while fetching bills."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Icon icon="heroicons:arrow-path" className="text-base" />
                Try again
              </button>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    {selectableIds.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allSelectablePicked}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 w-12">#</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Document</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden lg:table-cell">Uploaded by</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 hidden md:table-cell">Created</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Action</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 w-24">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
                        <Icon icon={searchQuery ? "heroicons:magnifying-glass" : "heroicons:document-text"} className="text-2xl" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery ? "No bills match your search" : `No ${copy.billLabel}s yet`}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery
                          ? "Try a different keyword or clear the search."
                          : `Upload your first ${copy.billLabel} to get started.`}
                      </p>
                      {!searchQuery && (
                        <button
                          type="button"
                          onClick={() => setIsUploadModalOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
                        >
                          <Icon icon="heroicons:arrow-up-tray" className="text-base" />
                          Upload {copy.billLabel}
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paged.map((bill, idx) => {
                    const serial = (page - 1) * pageSize + idx + 1;
                    // Any status is now selectable — bulk actions gate
                    // themselves by status (Sync only on Verified, etc.).
                    const canSelect = true;
                    const isSelected = selectedBills.has(bill.id);
                    const tallyState = getTallySyncState(bill);
                    return (
                      <tr
                        key={bill.id}
                        className={`group transition-colors ${
                          isSelected
                            ? "bg-blue-50/60 dark:bg-blue-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-4 py-3">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(bill.id)}
                              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-400 dark:text-slate-500">
                          {String(serial).padStart(3, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 flex items-center justify-center">
                              <Icon icon="heroicons:document-text" className="text-base" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {getBillName(bill) || "—"}
                              </div>
                              <div className="flex items-center flex-wrap gap-1.5 mt-1">
                                {bill.file && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedFile({ url: bill.file, name: getBillName(bill) || copy.billLabel });
                                      setIsFileViewerOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 cursor-pointer"
                                  >
                                    <Icon icon="heroicons:eye" className="text-[11px]" /> File
                                  </button>
                                )}
                                {bill.is_duplicate && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedDuplicateBill(bill);
                                      setIsDuplicateModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-100 dark:ring-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-950/60 cursor-pointer"
                                  >
                                    <Icon icon="heroicons:exclamation-triangle" className="text-[11px]" /> Duplicate
                                  </button>
                                )}
                                {bill.bill_belong_your_org === false &&
                                  ["Analysed", "Verified", "Synced"].includes(bill.status) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedExternalBill(bill);
                                      setIsExternalBillModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/60 cursor-pointer"
                                  >
                                    <Icon icon="heroicons:building-storefront" className="text-[11px]" /> External
                                  </button>
                                )}
                                {tallyState === "success" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSyncBill(bill);
                                      setIsSyncStatusModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer"
                                  >
                                    <Icon icon="heroicons:check" className="text-[11px]" /> Tally
                                  </button>
                                )}
                                {tallyState === "failed" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSyncBill(bill);
                                      setIsSyncStatusModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/60 cursor-pointer"
                                  >
                                    <Icon icon="heroicons:x-mark" className="text-[11px]" /> Tally
                                  </button>
                                )}
                                {bill.processing_error &&
                                  !["Analysed", "Verified", "Synced"].includes(
                                    bill.status,
                                  ) && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60">
                                      <Icon icon="heroicons:exclamation-circle" className="text-[11px]" /> Error
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={bill.status} /></td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm text-slate-700 dark:text-slate-300 truncate max-w-45">
                          {bill.uploaded_by_name || "—"}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <Icon icon="heroicons:calendar" className="text-base text-slate-400" />
                            {formatDate(bill.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3"><ActionCell bill={bill} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {["Analysed", "Verified", "Synced"].includes(bill.status) && (
                              <button
                                type="button"
                                onClick={() => navigate(`${copy.detailRoute}/${bill.id}`)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                title="View bill details"
                              >
                                <Icon icon="heroicons:eye" className="text-base" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAction(bill.id, "delete")}
                              disabled={deletingBills.has(bill.id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 disabled:opacity-50 transition-colors cursor-pointer"
                              title="Delete bill"
                            >
                              {deletingBills.has(bill.id) ? (
                                <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                              ) : (
                                <Icon icon="heroicons:trash" className="text-base" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !error && filtered.length > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 15, 25, 50, 100]}
          />
        )}
      </div>

      {/* Modals */}
      <UploadBillModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        title={copy.uploadTitle}
        module={module}
      />

      <FileViewerModal
        isOpen={isFileViewerOpen}
        onClose={() => setIsFileViewerOpen(false)}
        fileUrl={selectedFile.url}
        fileName={selectedFile.name}
      />

      {/* Move modal */}
      <Modal
        activeModal={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title={`Move to ${copy.moveTargetLabel}`}
        className="max-w-md"
      >
        <div className="space-y-4 p-1">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60">
            <Icon icon="heroicons:arrow-right-circle" className="text-blue-600 dark:text-blue-400 text-xl shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              You're about to move{" "}
              <span className="font-semibold">{selectedBills.size}</span> bill
              {selectedBills.size > 1 ? "s" : ""} to{" "}
              <span className="font-semibold">{copy.moveTargetLabel}</span>.
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsMoveModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMoveSelected}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
            >
              <Icon icon="heroicons:arrow-right" className="text-base" />
              Move {selectedBills.size} bill{selectedBills.size > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </Modal>

      {/* Duplicate modal */}
      <Modal
        activeModal={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title="Duplicate detected"
        className="max-w-2xl"
      >
        {selectedDuplicateBill && (
          <div className="space-y-4 p-1">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60">
              <Icon icon="heroicons:exclamation-triangle" className="text-amber-600 dark:text-amber-400 text-xl shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-amber-800 dark:text-amber-300">Possible duplicate</p>
                <p className="mt-1">
                  Bill{" "}
                  <span className="font-mono font-semibold">
                    {getBillName(selectedDuplicateBill)}
                  </span>{" "}
                  may match an existing bill in this workspace.
                </p>
                {selectedDuplicateBill.duplicate_score != null && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Similarity score: <span className="font-semibold">{selectedDuplicateBill.duplicate_score}%</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDuplicateModalOpen(false);
                  setDeleteConfirmBillId(selectedDuplicateBill.id);
                }}
                className="px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
              >
                Delete this bill
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDuplicateModalOpen(false);
                  navigate(`${copy.detailRoute}/${selectedDuplicateBill.id}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
              >
                Proceed anyway
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* External bill modal */}
      <Modal
        activeModal={isExternalBillModalOpen}
        onClose={() => setIsExternalBillModalOpen(false)}
        title="External bill"
        className="max-w-2xl"
      >
        {selectedExternalBill && (
          <div className="space-y-4 p-1">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60">
              <Icon icon="heroicons:building-storefront" className="text-rose-600 dark:text-rose-400 text-xl shrink-0 mt-0.5" />
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p className="font-semibold text-rose-800 dark:text-rose-300">
                  This bill wasn't issued to your organization
                </p>
                <p className="mt-1">
                  Issued to:{" "}
                  <span className="font-semibold">
                    {selectedExternalBill.analysed_data?.to?.name || "Unknown"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsExternalBillModalOpen(false);
                  setDeleteConfirmBillId(selectedExternalBill.id);
                }}
                className="px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
              >
                Delete this bill
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExternalBillModalOpen(false);
                  navigate(`${copy.detailRoute}/${selectedExternalBill.id}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
              >
                Proceed anyway
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sync status modal */}
      <Modal
        activeModal={isSyncStatusModalOpen}
        onClose={() => setIsSyncStatusModalOpen(false)}
        title="Tally sync status"
        className="max-w-xl"
      >
        {selectedSyncBill && (
          <div className="space-y-4 p-1">
            {getTallySyncState(selectedSyncBill) === "success" ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60">
                <Icon icon="heroicons:check-circle" className="text-emerald-600 dark:text-emerald-400 text-xl shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">Synced successfully</p>
                  {selectedSyncBill.tally_sync_message && (
                    <p className="mt-1 text-xs whitespace-pre-wrap">
                      {selectedSyncBill.tally_sync_message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60">
                <Icon icon="heroicons:x-circle" className="text-rose-600 dark:text-rose-400 text-xl shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-rose-800 dark:text-rose-300">Sync failed</p>
                  <p className="mt-1 text-xs whitespace-pre-wrap">
                    {selectedSyncBill.tally_sync_message || "No error message provided by Tally."}
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSyncStatusModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSyncStatusModalOpen(false);
                  navigate(`${copy.detailRoute}/${selectedSyncBill.id}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
              >
                Open bill
                <Icon icon="heroicons:arrow-right" className="text-base" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirmBillId}
        onClose={() => setDeleteConfirmBillId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this bill?"
        message="This action cannot be undone."
        confirmText="Yes, delete"
        variant="danger"
      />

      <ConfirmDialog
        open={isBulkDeleteOpen}
        onClose={() => (isBulkActing ? null : setIsBulkDeleteOpen(false))}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedBills.size} bill${selectedBills.size > 1 ? "s" : ""}?`}
        message={
          `You're about to permanently delete ${selectedBills.size} selected ` +
          `${copy.billLabel}${selectedBills.size > 1 ? "s" : ""}. This action ` +
          `cannot be undone.`
        }
        confirmText={isBulkActing ? "Deleting…" : `Yes, delete ${selectedBills.size}`}
        variant="danger"
      />

      <ConfirmDialog
        open={isBulkSyncOpen}
        onClose={() => (isBulkActing ? null : setIsBulkSyncOpen(false))}
        onConfirm={handleBulkSync}
        title={`Sync ${bulkSyncableIds.length} bill${bulkSyncableIds.length > 1 ? "s" : ""} to Tally?`}
        message={
          selectedBills.size > bulkSyncableIds.length
            ? `Only ${bulkSyncableIds.length} of the ${selectedBills.size} selected ` +
              `bills are eligible for sync (Verified, or Synced-but-not-posted). ` +
              `Ineligible bills will be skipped.`
            : `The ${bulkSyncableIds.length} selected bill${bulkSyncableIds.length > 1 ? "s" : ""} ` +
              `will be posted to Tally.`
        }
        confirmText={isBulkActing ? "Syncing…" : `Yes, sync ${bulkSyncableIds.length}`}
      />
    </div>
  );
};

export default BillsList;
