import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Modal from "@/components/ui/Modal";
import TablePagination from "@/components/ui/TablePagination";
import UploadBillModal from "@/components/modals/UploadBillModal";
import FileViewerModal from "@/components/modals/FileViewerModal";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import { globalToast } from "@/utils/toast";
import { notifyUploadResult, notifyUploadError } from "@/utils/uploadFeedback";
import { CONTROL_SEARCH } from "@/constants/ui";


// One shared button scale for every toolbar in the app: a 28px control row
// that lines up with the 28px icon buttons and the table's 32px rows.
const btnBase =
  "inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50";
const btnNeutral =
  `${btnBase} text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`;
const btnPrimary =
  `${btnBase} text-white bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-500/30 ring-1 ring-orange-600/20`;
// In-row action chips — one step down from the toolbar scale so a table row
// stays 32px tall.
const chipBase =
  "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold";
// Table head / body cell padding, shared so a column can never drift out of
// alignment with its header.
const thBase =
  "px-3 py-2 ltr:text-left rtl:text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 whitespace-nowrap";
const tdBase = "px-3 py-1.5";

const TABS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "analysed", label: "Analysed" },
  { key: "synced", label: "Synced" },
];

// Mirrors TRASH_RETENTION_DAYS on the backend. Only used for confirmation
// copy — the Trash page reads the authoritative value off the API response.
const TRASH_RETENTION_DAYS = 30;

// Whether a bill may be moved to Trash. The Tally serializers send
// `can_delete`; the server is the real gate (it answers 409) and this only
// decides whether the control is offered. Zoho serializers don't send the
// field at all, so an undefined value must mean "allowed" — otherwise this
// shared component would silently disable delete across the Zoho pages.
const canTrashBill = (bill) => bill?.can_delete !== false;

const trashBlockedReason = (bill) =>
  bill?.delete_blocked_reason ||
  "This bill has already been posted to Tally and can no longer be deleted.";

// Only analysed bills produce report rows — a Draft has nothing to export.
// Mirrors the server, which skips bills with no analysed header.
const EXPORTABLE_STATUSES = new Set(["Analysed", "Verified", "Synced"]);

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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 ${c.bg} ${c.txt} ${c.ring}`}
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

  // Debounced copy of the search box. The server does the filtering now, so
  // this throttles requests instead of re-filtering an in-memory array.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // A narrower search can leave the current page past the end of the new
  // result set, which would render an empty table on e.g. page 7 of 2.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const queryParams = useMemo(() => {
    const params = {
      organizationId: selectedOrganization?.id,
      page,
      pageSize,
    };
    if (activeTab !== "all") params.status = activeTab;
    if (debouncedSearch) params.search = debouncedSearch;
    return params;
  }, [activeTab, selectedOrganization?.id, page, pageSize, debouncedSearch]);

  const {
    data: billsData,
    error,
    isLoading,
    refetch,
    isFetching,
  } = useGetBills(queryParams, {
    enabled: !!selectedOrganization?.id,
    // Auto-poll while any row on the current page is still being
    // processed in the background (Draft / is_processing / Analysed but
    // waiting on Tally confirmation). Otherwise a user just uploaded a
    // bill and stares at "Draft" until they hit Refresh — the client
    // reported that as confusing and hit the Analyse button instead.
    refetchInterval: (q) => {
      const rows = q?.state?.data?.results || [];
      const stillProcessing = rows.some(
        (b) =>
          b?.is_processing === true ||
          b?.status === "Draft" ||
          (b?.status === "Synced" && b?.tally_synced === false),
      );
      return stillProcessing ? 5000 : false;
    },
    // Don't pause the poll when the tab is backgrounded — a photo can
    // take 20-40s to process and the user is likely looking at another
    // tab in the meantime.
    refetchIntervalInBackground: true,
  });

  // Counts for the tab badges. Only `count` is read, so ask for a single row
  // per status instead of pulling four full pages of bills on every render.
  const countQuery = { organizationId: selectedOrganization?.id, pageSize: 1 };
  // Also poll counts while anything is still processing so the tab
  // badges (Draft / Analysed / Synced) update in-place.
  const anyRowProcessing = (billsData?.results || []).some(
    (b) =>
      b?.is_processing === true ||
      b?.status === "Draft" ||
      (b?.status === "Synced" && b?.tally_synced === false),
  );
  const countOpts = {
    enabled: !!selectedOrganization?.id,
    refetchInterval: anyRowProcessing ? 5000 : false,
    refetchIntervalInBackground: true,
  };

  const { data: allCountData } = useGetBills(countQuery, countOpts);
  const { data: draftCountData } = useGetBills(
    { ...countQuery, status: "draft" }, countOpts
  );
  const { data: analysedCountData } = useGetBills(
    { ...countQuery, status: "analysed" }, countOpts
  );
  const { data: syncedCountData } = useGetBills(
    { ...countQuery, status: "synced" }, countOpts
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
  // Export lives on the Analysed tab only. Elsewhere the button would be
  // permanently disabled anyway — Draft rows have no analysed data to
  // export, so offering it there is just noise.
  const canDownloadReport =
    Boolean(useDownloadReport) && activeTab === "analysed";
  const isDownloadingReport = downloadReportMutation?.isPending || false;

  const handleDownloadReport = async () => {
    if (!downloadReportMutation || exportableIds.length === 0) return;
    try {
      const filename = await downloadReportMutation.mutateAsync({
        organizationId: selectedOrganization?.id,
        ids: exportableIds,
      });
      globalToast.success(
        `Exported ${exportableIds.length} ${copy.billLabel}${exportableIds.length > 1 ? "s" : ""}` +
          (filename ? ` to ${filename}` : ""),
      );
    } catch (err) {
      globalToast.error(
        err?.message || err?.response?.data?.message || "Failed to download report",
      );
    }
  };

  // UI state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  // Was a boolean toggle. Now an object `{to: 'vendor'|'expense'|'payment'}`
  // so the shared MoveModal can send bills to any of the three voucher
  // types (per the client-requested Move dropdown).
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

  // `results` is already the requested page, filtered and sized by the
  // server — no client-side slicing. Slicing here was the reason a 118-bill
  // list only ever showed the paginator's first 25 rows.
  const paged = billsData?.results || [];

  // Total across the whole result set, not just this page. Falls back to the
  // page length so a non-paginated response still renders sensibly.
  const totalCount = billsData?.count ?? paged.length;

  // Selection only ever covers rows currently on screen, so drop it when the
  // visible set changes — otherwise the bulk-action counter keeps totalling
  // bills the user can no longer see.
  useEffect(() => {
    setSelectedBills(new Set());
  }, [page, pageSize, debouncedSearch, activeTab]);

  // All bills on the current page are selectable — bulk actions
  // decide per-bill eligibility (Sync only fires on Verified, Delete
  // works on any status, Move keeps its original per-page semantics).
  const selectableIds = useMemo(() => paged.map((b) => b.id), [paged]);

  // Selection is scoped to the visible page. Bills on other pages aren't in
  // memory, so a stale id from a previous page simply drops out here rather
  // than being acted on blind.
  const selectedBillObjs = useMemo(
    () => paged.filter((b) => selectedBills.has(b.id)),
    [paged, selectedBills],
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
  // Bulk-delete eligibility: bills already posted to Tally are excluded, so
  // selecting a whole page and hitting delete quietly skips them instead of
  // firing requests the server will refuse with 409.
  const bulkTrashableIds = useMemo(
    () => selectedBillObjs.filter(canTrashBill).map((b) => b.id),
    [selectedBillObjs],
  );
  const bulkBlockedCount = selectedBillObjs.length - bulkTrashableIds.length;

  // Excel export covers exactly the ticked rows. Un-analysed selections are
  // dropped here so the user never receives a spreadsheet with fewer rows
  // than they selected without being told why.
  const exportableIds = useMemo(
    () =>
      selectedBillObjs
        .filter((b) => EXPORTABLE_STATUSES.has(b.status))
        .map((b) => b.id),
    [selectedBillObjs],
  );
  const unexportableCount = selectedBillObjs.length - exportableIds.length;

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
      globalToast.success("Moved to Trash");
      refetch();
    } catch (err) {
      globalToast.error(err?.response?.data?.message || err?.message || "Failed to move bill to Trash");
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
    // The dropdown now carries the chosen destination on the modal state
    // object (`{to: 'vendor'|'expense'|'payment'}`); fall back to legacy
    // `moveTo` prop when the modal was opened without an explicit choice.
    const targetTo =
      (isMoveModalOpen && typeof isMoveModalOpen === "object" && isMoveModalOpen.to) ||
      moveTo;
    const TARGET_LABELS = {
      vendor: "Purchase Voucher",
      expense: "Journal Voucher",
      payment: "Payment Voucher",
    };
    try {
      await moveBills({
        organizationId: selectedOrganization?.id,
        from: moveFrom,
        to: targetTo,
        bill_ids: Array.from(selectedBills),
      });
      globalToast.success(
        `${selectedBills.size} bill(s) moved to ${TARGET_LABELS[targetTo] || copy.moveTargetLabel}`,
      );
      setIsMoveModalOpen(false);
      setSelectedBills(new Set());
      refetch();
    } catch (err) {
      globalToast.error(err?.response?.data?.message || err?.message || "Move failed");
    }
  };

  const handleBulkDelete = async () => {
    const ids = bulkTrashableIds;
    const skipped = bulkBlockedCount;
    if (ids.length === 0) return;
    setIsBulkActing(true);
    let ok = 0;
    let failed = 0;
    // No dedicated bulk endpoint — fan out per-bill trash calls in
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
    if (ok) globalToast.success(`Moved ${ok} bill${ok > 1 ? "s" : ""} to Trash`);
    if (failed) globalToast.error(`Failed to move ${failed} bill${failed > 1 ? "s" : ""} to Trash`);
    // Say what was left behind rather than letting the count quietly differ
    // from what the user selected.
    if (skipped)
      globalToast.warning(
        `Skipped ${skipped} synced bill${skipped > 1 ? "s" : ""} — already posted to Tally`,
      );
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
        <span className={`${chipBase} text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/60`}>
          <Icon icon="heroicons:check-circle" className="text-xs" />
          Posted
        </span>
      );
    }
    if (status === "Synced" && !bill.tally_synced) {
      return (
        <button
          type="button"
          onClick={() => navigate(`${copy.detailRoute}/${bill.id}`)}
          className={`${chipBase} text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer`}
        >
          <Icon icon="heroicons:check-badge" className="text-xs" /> Re-verify
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
          className={`${chipBase} text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-100 dark:ring-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-60 disabled:cursor-wait cursor-pointer`}
        >
          {isAnalyzing ? (
            <Icon icon="heroicons:arrow-path" className="text-xs animate-spin" />
          ) : (
            <Icon icon="heroicons:sparkles" className="text-xs" />
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
          className={`${chipBase} text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 ring-1 ring-violet-100 dark:ring-violet-900/60 hover:bg-violet-100 dark:hover:bg-violet-950/60 cursor-pointer`}
        >
          <Icon icon="heroicons:check-badge" className="text-xs" /> Verify
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
          className={`${chipBase} text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-wait cursor-pointer`}
        >
          <Icon icon={isSyncing ? "heroicons:arrow-path" : "heroicons:arrow-path-rounded-square"} className={`text-xs ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing…" : "Sync"}
        </button>
      );
    }
    return <span className="text-[11px] text-slate-400">—</span>;
  };

  if (!selectedOrganization?.id) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
          <Icon icon="heroicons:building-office" className="text-lg" />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No workspace selected</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Please select a client to view {copy.billLabel}s.</p>
      </div>
    );
  }

  return (
    // Plain `h-full`, not a `calc(100dvh - chrome)` guess: the Layout shell is
    // now viewport-locked and hands this page a definite height, so measuring
    // the chrome here would subtract it twice and leave a dead gap under the
    // card. The card body below is the only scroller.
    <div className="h-full flex flex-col gap-3">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {copy.title}
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {selectedBills.size > 0 && (
            <>
              {/* Single Move dropdown — Journal / Payment / Trash — replaces
                  the two-button pair per the client spec. Sync stays a
                  standalone action alongside. Options shown depend on the
                  current voucher (can't move to yourself).

                  Styled through `btnNeutral` so it keeps the same 32px box as
                  every other toolbar button instead of the 38px it shipped
                  with. */}
              <Menu as="div" className="relative">
                <MenuButton className={btnNeutral}>
                  <Icon icon="heroicons:arrow-right-circle" className="text-sm" />
                  Move ({selectedBills.size})
                  <Icon icon="heroicons:chevron-down" className="text-[10px] opacity-70" />
                </MenuButton>
                <MenuItems
                  anchor="bottom end"
                  className="mt-1 w-52 z-50 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg dark:shadow-black/40 focus:outline-none py-1"
                >
                  {moveFrom !== "vendor" && (
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          type="button"
                          onClick={() => setIsMoveModalOpen({ to: "vendor" })}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-medium flex items-center gap-2 ${focus ? "bg-slate-50 dark:bg-slate-800" : ""} text-slate-900 dark:text-white`}
                        >
                          <Icon icon="heroicons:receipt-refund" className="text-sm text-blue-600" />
                          Move to Purchase Voucher
                        </button>
                      )}
                    </MenuItem>
                  )}
                  {moveFrom !== "expense" && (
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          type="button"
                          onClick={() => setIsMoveModalOpen({ to: "expense" })}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-medium flex items-center gap-2 ${focus ? "bg-slate-50 dark:bg-slate-800" : ""} text-slate-900 dark:text-white`}
                        >
                          <Icon icon="heroicons:book-open" className="text-sm text-blue-600" />
                          Move to Journal Voucher
                        </button>
                      )}
                    </MenuItem>
                  )}
                  {moveFrom !== "payment" && (
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          type="button"
                          onClick={() => setIsMoveModalOpen({ to: "payment" })}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-medium flex items-center gap-2 ${focus ? "bg-slate-50 dark:bg-slate-800" : ""} text-slate-900 dark:text-white`}
                        >
                          <Icon icon="heroicons:banknotes" className="text-sm text-blue-600" />
                          Move to Payment Voucher
                        </button>
                      )}
                    </MenuItem>
                  )}
                  {bulkTrashableIds.length > 0 && (
                    <>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            type="button"
                            onClick={() => setIsBulkDeleteOpen(true)}
                            disabled={isBulkActing}
                            title={
                              bulkBlockedCount > 0
                                ? `${bulkBlockedCount} selected bill(s) already posted to Tally will be skipped`
                                : "Move selected bills to Trash"
                            }
                            className={`w-full text-left px-2.5 py-1.5 text-xs font-medium flex items-center gap-2 ${focus ? "bg-rose-50 dark:bg-rose-950/40" : ""} text-rose-700 dark:text-rose-400`}
                          >
                            <Icon icon="heroicons:trash" className="text-sm" />
                            Move to Trash ({bulkTrashableIds.length})
                          </button>
                        )}
                      </MenuItem>
                    </>
                  )}
                </MenuItems>
              </Menu>
              {bulkSyncableIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsBulkSyncOpen(true)}
                  disabled={isBulkActing}
                  title="Sync selected Verified bills to Tally"
                  className={`${btnBase} text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:cursor-wait`}
                >
                  <Icon icon="heroicons:arrow-up-on-square" className="text-sm" />
                  Sync ({bulkSyncableIds.length})
                </button>
              )}
              {/* No standalone Trash button any more — Move to Trash lives in
                  the Move dropdown above. */}
            </>
          )}
          {canDownloadReport && (
            <button
              type="button"
              onClick={handleDownloadReport}
              disabled={isDownloadingReport || exportableIds.length === 0}
              title={
                selectedBillObjs.length === 0
                  ? `Select ${copy.billLabel}s to export`
                  : exportableIds.length === 0
                  ? `Selected ${copy.billLabel}s have no analysed data to export yet`
                  : unexportableCount > 0
                  ? `Export ${exportableIds.length} selected — ${unexportableCount} un-analysed will be skipped`
                  : `Export ${exportableIds.length} selected ${copy.billLabel}${exportableIds.length > 1 ? "s" : ""} as Excel`
              }
              className={`${btnBase} text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 disabled:cursor-not-allowed disabled:hover:bg-emerald-50 dark:disabled:hover:bg-emerald-950/40`}
            >
              <Icon
                icon={isDownloadingReport ? "heroicons:arrow-path" : "heroicons:arrow-down-tray"}
                className={`text-sm ${isDownloadingReport ? "animate-spin" : ""}`}
              />
              {isDownloadingReport
                ? "Preparing…"
                : exportableIds.length > 0
                ? `Download Excel (${exportableIds.length})`
                : "Download Excel"}
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className={btnNeutral}
          >
            <Icon icon="heroicons:arrow-path" className={`text-sm ${(isLoading || isFetching) ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className={btnPrimary}
          >
            <Icon icon="heroicons:arrow-up-tray" className="text-sm" />
            Upload {copy.billLabel}
          </button>
        </div>
      </div>

      {/* Table card — the only thing on the page that scrolls */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-3 md:px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
          <div className="relative w-full md:max-w-xs">
            <Icon icon="heroicons:magnifying-glass" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, status, uploader…"
              className={CONTROL_SEARCH}
            />
          </div>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 self-start md:self-auto overflow-x-auto">
            {TABS.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold ${
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
            <div className="px-3 md:px-4 py-2.5 space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2.5">
                <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                Failed to load {copy.billLabel}s
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
                {error?.data?.message || error?.message || "An error occurred while fetching bills."}
              </p>
              <button type="button" onClick={() => refetch()} className={btnNeutral}>
                <Icon icon="heroicons:arrow-path" className="text-sm" />
                Try again
              </button>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className={`${thBase} w-8`}>
                    {selectableIds.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allSelectablePicked}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                    )}
                  </th>
                  <th className={`${thBase} w-10`}>#</th>
                  <th className={thBase}>Document</th>
                  <th className={thBase}>Status</th>
                  <th className={`${thBase} hidden lg:table-cell`}>Uploaded by</th>
                  <th className={`${thBase} hidden md:table-cell`}>Created</th>
                  <th className={thBase}>Action</th>
                  <th className={`${thBase} ltr:text-right rtl:text-left w-20`}>Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
                        <Icon icon={searchQuery ? "heroicons:magnifying-glass" : "heroicons:document-text"} className="text-lg" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {searchQuery ? "No bills match your search" : `No ${copy.billLabel}s yet`}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {searchQuery
                          ? "Try a different keyword or clear the search."
                          : `Upload your first ${copy.billLabel} to get started.`}
                      </p>
                      {!searchQuery && (
                        <button
                          type="button"
                          onClick={() => setIsUploadModalOpen(true)}
                          className={`mt-3 ${btnPrimary}`}
                        >
                          <Icon icon="heroicons:arrow-up-tray" className="text-sm" />
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
                        <td className={tdBase}>
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(bill.id)}
                              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className={`${tdBase} text-[11px] font-mono text-slate-400 dark:text-slate-500`}>
                          {String(serial).padStart(3, "0")}
                        </td>
                        <td className={tdBase}>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 flex items-center justify-center">
                              <Icon icon="heroicons:document-text" className="text-sm" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {getBillName(bill) || "—"}
                              </div>
                              <div className="flex items-center flex-wrap gap-1 mt-0.5">
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
                        <td className={tdBase}><StatusBadge status={bill.status} /></td>
                        <td className={`${tdBase} hidden lg:table-cell text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-40`}>
                          {bill.uploaded_by_name || "—"}
                        </td>
                        <td className={`${tdBase} hidden md:table-cell`}>
                          <div className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <Icon icon="heroicons:calendar" className="text-xs text-slate-400" />
                            {formatDate(bill.created_at)}
                          </div>
                        </td>
                        <td className={tdBase}><ActionCell bill={bill} /></td>
                        <td className={`${tdBase} ltr:text-right rtl:text-left`}>
                          <div className="inline-flex items-center gap-0.5">
                            {["Analysed", "Verified", "Synced"].includes(bill.status) && (
                              <button
                                type="button"
                                onClick={() => navigate(`${copy.detailRoute}/${bill.id}`)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                title="View bill details"
                              >
                                <Icon icon="heroicons:eye" className="text-sm" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAction(bill.id, "delete")}
                              disabled={
                                deletingBills.has(bill.id) || !canTrashBill(bill)
                              }
                              className={
                                canTrashBill(bill)
                                  ? "inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 disabled:opacity-50 transition-colors cursor-pointer"
                                  : "inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-300 dark:text-slate-700 cursor-not-allowed"
                              }
                              title={
                                canTrashBill(bill)
                                  ? "Move to Trash"
                                  : trashBlockedReason(bill)
                              }
                            >
                              {deletingBills.has(bill.id) ? (
                                <Icon icon="heroicons:arrow-path" className="text-sm animate-spin" />
                              ) : canTrashBill(bill) ? (
                                <Icon icon="heroicons:trash" className="text-sm" />
                              ) : (
                                <Icon icon="heroicons:lock-closed" className="text-sm" />
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
        {!isLoading && !error && totalCount > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
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

      {/* Move modal — target label reflects the destination chosen from
          the dropdown ({to: 'vendor'|'expense'|'payment'}). */}
      {(() => {
        const TARGET_LABELS = {
          vendor: "Purchase Voucher",
          expense: "Journal Voucher",
          payment: "Payment Voucher",
        };
        const chosenTo =
          (isMoveModalOpen && typeof isMoveModalOpen === "object" && isMoveModalOpen.to) ||
          moveTo;
        const chosenLabel = TARGET_LABELS[chosenTo] || copy.moveTargetLabel;
        return (
      <Modal
        activeModal={!!isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        title={`Move to ${chosenLabel}`}
        className="max-w-md"
      >
        <div className="space-y-3 p-1">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/60">
            <Icon icon="heroicons:arrow-right-circle" className="text-blue-600 dark:text-blue-400 text-base shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              You're about to move{" "}
              <span className="font-semibold">{selectedBills.size}</span> bill
              {selectedBills.size > 1 ? "s" : ""} to{" "}
              <span className="font-semibold">{chosenLabel}</span>.
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsMoveModalOpen(false)}
              className={btnNeutral}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMoveSelected}
              className={btnPrimary}
            >
              <Icon icon="heroicons:arrow-right" className="text-sm" />
              Move {selectedBills.size} bill{selectedBills.size > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </Modal>
        );
      })()}

      {/* Duplicate modal */}
      <Modal
        activeModal={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title="Duplicate detected"
        className="max-w-2xl"
      >
        {selectedDuplicateBill && (
          <div className="space-y-3 p-1">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60">
              <Icon icon="heroicons:exclamation-triangle" className="text-amber-600 dark:text-amber-400 text-base shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
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
            <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
              {canTrashBill(selectedDuplicateBill) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDuplicateModalOpen(false);
                    setDeleteConfirmBillId(selectedDuplicateBill.id);
                  }}
                  className={`${btnBase} text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40`}
                >
                  Move to Trash
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsDuplicateModalOpen(false);
                  navigate(`${copy.detailRoute}/${selectedDuplicateBill.id}`);
                }}
                className={btnPrimary}
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
          <div className="space-y-3 p-1">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60">
              <Icon icon="heroicons:building-storefront" className="text-rose-600 dark:text-rose-400 text-base shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
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
            <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
              {canTrashBill(selectedExternalBill) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsExternalBillModalOpen(false);
                    setDeleteConfirmBillId(selectedExternalBill.id);
                  }}
                  className={`${btnBase} text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40`}
                >
                  Move to Trash
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsExternalBillModalOpen(false);
                  navigate(`${copy.detailRoute}/${selectedExternalBill.id}`);
                }}
                className={btnPrimary}
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
        onClose={() => {
          setIsSyncStatusModalOpen(false);
          // Clear the payload so the next open on a different bill
          // never flashes the previous bill's error message.
          setSelectedSyncBill(null);
        }}
        title="Tally sync status"
        className="max-w-xl"
      >
        {selectedSyncBill && (
          <div className="space-y-3 p-1">
            {getTallySyncState(selectedSyncBill) === "success" ? (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/60">
                <Icon icon="heroicons:check-circle" className="text-emerald-600 dark:text-emerald-400 text-base shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">Synced successfully</p>
                  {selectedSyncBill.tally_sync_message && (
                    <p className="mt-1 text-xs whitespace-pre-wrap">
                      {selectedSyncBill.tally_sync_message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60">
                <Icon icon="heroicons:x-circle" className="text-rose-600 dark:text-rose-400 text-base shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-rose-800 dark:text-rose-300">Sync failed</p>
                  {/* Tally callback often echoes the same error message
                      multiple times when one ledger is referenced from
                      several rows. Split → trim → dedupe so the user
                      sees each distinct reason once. */}
                  {(() => {
                    const raw = selectedSyncBill.tally_sync_message || "";
                    const seen = new Set();
                    const lines = raw
                      .split(/\r?\n/)
                      .map((l) => l.trim())
                      .filter((l) => {
                        if (!l || seen.has(l)) return false;
                        seen.add(l);
                        return true;
                      });
                    if (lines.length === 0) {
                      return (
                        <p className="mt-1 text-xs">
                          No error message provided by Tally.
                        </p>
                      );
                    }
                    return (
                      <ul className="mt-1 text-xs list-disc pl-4 space-y-0.5">
                        {lines.map((l, i) => (
                          <li key={i}>{l}</li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsSyncStatusModalOpen(false);
                  setSelectedSyncBill(null);
                }}
                className={btnNeutral}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = `${copy.detailRoute}/${selectedSyncBill.id}`;
                  setIsSyncStatusModalOpen(false);
                  setSelectedSyncBill(null);
                  navigate(target);
                }}
                className={btnPrimary}
              >
                Open bill
                <Icon icon="heroicons:arrow-right" className="text-sm" />
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirmBillId}
        onClose={() => setDeleteConfirmBillId(null)}
        onConfirm={handleDeleteConfirm}
        title="Move this bill to Trash?"
        message={
          `This ${copy.billLabel} will be moved to Trash. You can restore it ` +
          `from there within ${TRASH_RETENTION_DAYS} days, after which it is ` +
          `deleted permanently.`
        }
        confirmText="Move to Trash"
        variant="danger"
      />

      <ConfirmDialog
        open={isBulkDeleteOpen}
        onClose={() => (isBulkActing ? null : setIsBulkDeleteOpen(false))}
        onConfirm={handleBulkDelete}
        title={`Move ${bulkTrashableIds.length} bill${bulkTrashableIds.length > 1 ? "s" : ""} to Trash?`}
        message={
          `You're about to move ${bulkTrashableIds.length} ` +
          `${copy.billLabel}${bulkTrashableIds.length > 1 ? "s" : ""} to Trash. You ` +
          `can restore them from there within ${TRASH_RETENTION_DAYS} days, ` +
          `after which they are deleted permanently.` +
          (bulkBlockedCount > 0
            ? ` ${bulkBlockedCount} selected bill${bulkBlockedCount > 1 ? "s are" : " is"} ` +
              `already posted to Tally and will be skipped.`
            : "")
        }
        confirmText={isBulkActing ? "Moving…" : `Move ${bulkTrashableIds.length} to Trash`}
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
