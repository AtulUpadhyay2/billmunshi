import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import TablePagination from "@/components/ui/TablePagination";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import FileViewerModal from "@/components/modals/FileViewerModal";
import { globalToast } from "@/utils/toast";
import {
  TRASH_TYPE_TABS,
  useGetTallyTrash,
  useRestoreTallyTrashItem,
  useDeleteTallyTrashItemForever,
  useEmptyTallyTrash,
} from "@/services/tally/tallyTrashService";
import { CONTROL_SEARCH } from "@/constants/ui";


const btnBase =
  "inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50";
const btnNeutral =
  `${btnBase} text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`;

const thBase =
  "px-3 py-2 ltr:text-left rtl:text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 whitespace-nowrap";
const tdBase = "px-3 py-1.5";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

/**
 * Countdown pill. Turns amber then rose as the purge date approaches, so a
 * document about to be destroyed is visually distinct from one with weeks
 * left rather than being just another grey number in the row.
 */
const RetentionBadge = ({ days }) => {
  if (days === null || days === undefined) return <span className="text-slate-400">—</span>;

  const tone =
    days <= 3
      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/60"
      : days <= 7
      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-900/60"
      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ring-1 whitespace-nowrap ${tone}`}>
      <Icon icon="heroicons:clock" className="text-[10px]" />
      {days === 0 ? "Deleting today" : `${days} day${days > 1 ? "s" : ""} left`}
    </span>
  );
};

const TypeBadge = ({ label }) => (
  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 whitespace-nowrap">
    {label}
  </span>
);

const TallyTrash = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const organizationId = selectedOrganization?.id;

  const [typeFilter, setTypeFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [restoringIds, setRestoringIds] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [isEmptyOpen, setIsEmptyOpen] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);
  const [viewerFile, setViewerFile] = useState({ url: "", name: "" });
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => setPage(1), [typeFilter]);

  const { data, isLoading, isFetching, error, refetch } = useGetTallyTrash(
    { organizationId, type: typeFilter, search, page, pageSize },
    { enabled: !!organizationId },
  );

  const { mutateAsync: restoreItem } = useRestoreTallyTrashItem();
  const { mutateAsync: deleteForever } = useDeleteTallyTrashItemForever();
  const { mutateAsync: emptyTrash } = useEmptyTallyTrash();

  const items = data?.results || [];
  const totalCount = data?.count ?? 0;
  const retentionDays = data?.retention_days ?? 30;
  // The tabs are built from the response, so on the first load — when there
  // is nothing cached yet — the row would collapse to just "All" until the
  // request finished. Fall back to the known set so the filters are there
  // from the first paint; the server's list wins the moment it arrives.
  const types = data?.types?.length ? data.types : TRASH_TYPE_TABS;
  const countsByType = data?.counts_by_type || {};

  // Permanent deletion is admin-only server-side; hiding the controls for
  // everyone else avoids offering a button that can only return a 403.
  // This is presentation only — the API is the actual gate.
  const isAdmin = useMemo(
    () => String(selectedOrganization?.role || "").toUpperCase() === "ADMIN",
    [selectedOrganization?.role],
  );

  const handleRestore = async (item) => {
    setRestoringIds((p) => new Set([...p, item.id]));
    try {
      await restoreItem({ organizationId, type: item.type, id: item.id });
      globalToast.success(`${item.type_label} restored`);
      refetch();
    } catch (err) {
      globalToast.error(
        err?.response?.data?.message || err?.message || "Failed to restore document",
      );
    } finally {
      setRestoringIds((p) => {
        const n = new Set(p);
        n.delete(item.id);
        return n;
      });
    }
  };

  const handleDeleteForever = async () => {
    const item = confirmDelete;
    setConfirmDelete(null);
    if (!item) return;
    try {
      await deleteForever({ organizationId, type: item.type, id: item.id });
      globalToast.success("Deleted permanently");
      refetch();
    } catch (err) {
      globalToast.error(
        err?.response?.data?.message || err?.message || "Failed to delete document",
      );
    }
  };

  const handleEmptyTrash = async () => {
    setIsEmptying(true);
    try {
      const res = await emptyTrash({ organizationId, type: typeFilter });
      globalToast.success(res?.message || "Trash emptied");
      refetch();
    } catch (err) {
      globalToast.error(
        err?.response?.data?.message || err?.message || "Failed to empty trash",
      );
    } finally {
      setIsEmptying(false);
      setIsEmptyOpen(false);
    }
  };

  const openFile = (item) => {
    if (!item.file) return;
    setViewerFile({ url: item.file, name: item.name || "Document" });
    setIsViewerOpen(true);
  };

  if (!organizationId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2.5">
          <Icon icon="heroicons:building-office" className="text-lg" />
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          No workspace selected
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Select an organization to view its trash.
        </p>
      </div>
    );
  }

  return (
    // Same shell as every other table section: the page itself never
    // scrolls, only the row area inside the card does.
    <div className="h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 shrink-0">
        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Trash
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Deleted documents stay here for {retentionDays} days, then are removed permanently.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className={btnNeutral}
          >
            <Icon
              icon="heroicons:arrow-path"
              className={`text-sm ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {isAdmin && totalCount > 0 && (
            <button
              type="button"
              onClick={() => setIsEmptyOpen(true)}
              className={`${btnBase} text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/60`}
            >
              <Icon icon="heroicons:trash" className="text-sm" />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Table card — the only thing on the page that scrolls */}
      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center gap-2 px-3 md:px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by document name…"
              className={CONTROL_SEARCH}
            />
          </div>

          <div className="flex flex-wrap items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => setTypeFilter(t.slug)}
                className={`inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  typeFilter === t.slug
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.label}
                {countsByType[t.slug] ? (
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                    {countsByType[t.slug]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Body — dimmed while a filter switch refetches, since the rows on
            screen are the previous filter's until the new page lands. */}
        <div
          className={`flex-1 min-h-0 overflow-auto ${
            isFetching && !isLoading ? "opacity-50 transition-opacity" : "transition-opacity"
          }`}
        >
        {isLoading ? (
          <div className="px-3 md:px-4 py-2.5 space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-2.5">
              <Icon icon="heroicons:exclamation-triangle" className="text-lg" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {error?.response?.data?.message || error?.message || "Failed to load trash"}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
              <Icon icon="heroicons:trash" className="text-lg" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Trash is empty
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {search
                ? "No deleted documents match your search."
                : "Documents you delete will appear here and stay recoverable."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10">
                <tr>
                  <th className={thBase}>Document</th>
                  <th className={thBase}>Type</th>
                  <th className={thBase}>Deleted by</th>
                  <th className={thBase}>Deleted on</th>
                  <th className={thBase}>Auto-delete</th>
                  <th className={`${thBase} ltr:text-right rtl:text-left`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="group border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className={tdBase}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Icon icon="heroicons:document" className="text-slate-500 text-sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {item.name || "Untitled"}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {item.status} · uploaded {formatDate(item.created_at)}
                            {item.uploaded_by?.name ? ` by ${item.uploaded_by.name}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={tdBase}>
                      <TypeBadge label={item.type_label} />
                    </td>
                    <td className={`${tdBase} text-[11px] text-slate-600 dark:text-slate-400`}>
                      {item.deleted_by?.name || "—"}
                    </td>
                    <td className={`${tdBase} text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap`}>
                      {formatDate(item.deleted_at)}
                    </td>
                    <td className={tdBase}>
                      <RetentionBadge days={item.days_until_purge} />
                    </td>
                    <td className={tdBase}>
                      <div className="flex items-center justify-end gap-0.5">
                        {item.file && (
                          <button
                            type="button"
                            onClick={() => openFile(item)}
                            title="Preview document"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Icon icon="heroicons:eye" className="text-sm" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRestore(item)}
                          disabled={restoringIds.has(item.id)}
                          title="Restore document"
                          className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          <Icon
                            icon={
                              restoringIds.has(item.id)
                                ? "heroicons:arrow-path"
                                : "heroicons:arrow-uturn-left"
                            }
                            className={`text-xs ${restoringIds.has(item.id) ? "animate-spin" : ""}`}
                          />
                          Restore
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(item)}
                            title="Delete permanently"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Icon icon="heroicons:trash" className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>

        {totalCount > 0 && (
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={totalCount}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        )}
      </div>

      <FileViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        fileUrl={viewerFile.url}
        fileName={viewerFile.name}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteForever}
        title="Delete permanently?"
        message={
          `"${confirmDelete?.name || "This document"}" and its uploaded file will ` +
          `be destroyed immediately. This cannot be undone.`
        }
        confirmText="Delete permanently"
        variant="danger"
      />

      <ConfirmDialog
        open={isEmptyOpen}
        onClose={() => (isEmptying ? null : setIsEmptyOpen(false))}
        onConfirm={handleEmptyTrash}
        title="Empty the trash?"
        message={
          typeFilter === "all"
            ? "Every document in the trash will be destroyed immediately, along with its uploaded file. This cannot be undone."
            : `Every ${
                types.find((t) => t.slug === typeFilter)?.label || "document"
              } in the trash will be destroyed immediately. This cannot be undone.`
        }
        confirmText={isEmptying ? "Emptying…" : "Empty Trash"}
        variant="danger"
      />
    </div>
  );
};

export default TallyTrash;
