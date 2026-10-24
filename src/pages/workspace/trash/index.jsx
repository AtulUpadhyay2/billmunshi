import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react";
import TablePagination from "@/components/ui/TablePagination";
import ConfirmDialog from "@/components/modals/ConfirmDialog";
import FileViewerModal from "@/components/modals/FileViewerModal";
import { globalToast } from "@/utils/toast";
import { useUnifiedTrash, useTrashActions, MODULES, rowKey } from "./useUnifiedTrash";
import { CONTROL_SEARCH } from "@/constants/ui";

/**
 * Trash, across both modules.
 *
 * Tally and Zoho each keep their own trash (same mechanism, separate
 * registries and endpoints); this screen is the single place a user goes
 * to get a deleted document back, whichever module it came from.
 *
 * Both modules name some document types identically — a purchase voucher
 * is a purchase voucher in either — so every row shows its module and
 * every filter key is `module:slug`. The Approvals queue solved the same
 * ambiguity the same way.
 */

const btnBase =
  "inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50";
const btnNeutral =
  `${btnBase} text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800`;

const thBase =
  "px-3 py-2 ltr:text-left rtl:text-right text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 whitespace-nowrap";
const tdBase = "px-3 py-1.5";

const tabBase =
  "inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap";
const tabOn =
  "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm";
const tabOff =
  "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";

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

/**
 * Which module a row came from. Tinted differently per module so the eye
 * can separate the two at a glance without reading the word.
 */
const ModuleBadge = ({ module, label }) => {
  const tone =
    module === "zoho"
      ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 ring-violet-100 dark:ring-violet-900/60"
      : "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 ring-sky-100 dark:ring-sky-900/60";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ring-1 whitespace-nowrap ${tone}`}>
      {label || module}
    </span>
  );
};

const Trash = () => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const organizationId = selectedOrganization?.id;

  // `all` | a module key (`tally`) | a `module:slug` pair.
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

  const { data, isLoading, isFetching, error, refetch } = useUnifiedTrash(
    { organizationId, search },
    { enabled: !!organizationId },
  );

  const actions = useTrashActions(organizationId);

  const allRows = data?.rows || [];
  const retentionDays = data?.retentionDays ?? 30;
  const types = data?.types || [];
  const countsByKey = data?.countsByKey || {};
  const countsByModule = data?.countsByModule || {};
  const moduleErrors = data?.moduleErrors || [];

  // Filtering happens here, not on the server: the two modules paginate
  // independently, so a merged page can only be cut once both feeds are
  // in hand. See useUnifiedTrash for why that is cheap.
  const rows = useMemo(() => {
    if (typeFilter === "all") return allRows;
    const [scope, slug] = typeFilter.split(":");
    return allRows.filter((r) =>
      slug ? r.module === scope && r.type === slug : r.module === scope,
    );
  }, [allRows, typeFilter]);

  const totalCount = rows.length;
  const pageRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  // Permanent deletion is admin-only server-side; hiding the controls for
  // everyone else avoids offering a button that can only return a 403.
  // This is presentation only — the API is the actual gate.
  const isAdmin = useMemo(
    () => String(selectedOrganization?.role || "").toUpperCase() === "ADMIN",
    [selectedOrganization?.role],
  );

  const typesByModule = useMemo(() => {
    const out = {};
    types.forEach((t) => {
      (out[t.module] = out[t.module] || []).push(t);
    });
    return out;
  }, [types]);

  const activeFilterLabel = useMemo(() => {
    if (typeFilter === "all") return null;
    const [scope, slug] = typeFilter.split(":");
    if (!slug) return MODULES.find((m) => m.key === scope)?.label || scope;
    const t = types.find((x) => x.module === scope && x.slug === slug);
    return t ? `${t.module_label} ${t.label}` : slug;
  }, [typeFilter, types]);

  const handleRestore = async (item) => {
    setRestoringIds((p) => new Set([...p, item.id]));
    try {
      await actions.restore(item);
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
      await actions.deleteForever(item);
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
      const res = await actions.empty(typeFilter);
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
            Deleted Tally and Zoho documents stay here for {retentionDays} days, then are
            removed permanently.
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

      {/* A module that failed to load is called out rather than silently
          showing as an empty trash — "nothing here" and "we could not
          ask" are very different answers when someone is hunting for a
          document they deleted. */}
      {moduleErrors.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-100 dark:ring-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300">
          <Icon icon="heroicons:exclamation-triangle" className="text-sm shrink-0" />
          <span>
            Could not load the{" "}
            {moduleErrors.map((m) => m.module).join(" and ")} trash. The rows below may be
            incomplete.
          </span>
        </div>
      )}

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

          {/* Module first, then that module's types. Two rows of tabs
              rather than one flat list of twelve: the slugs repeat across
              modules, so a flat list would show "Purchase Voucher" twice
              with nothing to tell them apart. */}
          <div className="flex flex-wrap items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/60">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`${tabBase} ${typeFilter === "all" ? tabOn : tabOff}`}
            >
              All
              {allRows.length ? (
                <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                  {allRows.length}
                </span>
              ) : null}
            </button>
            {MODULES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setTypeFilter(m.key)}
                className={`${tabBase} ${typeFilter.split(":")[0] === m.key ? tabOn : tabOff}`}
              >
                {m.label}
                {countsByModule[m.key] ? (
                  <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                    {countsByModule[m.key]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Type tabs for the chosen module. Hidden on "All", where twelve
            type buttons would crowd out the table. */}
        {typeFilter !== "all" && (
          <div className="flex flex-wrap items-center gap-0.5 px-3 md:px-4 py-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 mr-1.5">
              {MODULES.find((m) => m.key === typeFilter.split(":")[0])?.label}
            </span>
            <button
              type="button"
              onClick={() => setTypeFilter(typeFilter.split(":")[0])}
              className={`${tabBase} ${typeFilter.includes(":") ? tabOff : tabOn}`}
            >
              All types
            </button>
            {(typesByModule[typeFilter.split(":")[0]] || []).map((t) => {
              const key = `${t.module}:${t.slug}`;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTypeFilter(key)}
                  className={`${tabBase} ${typeFilter === key ? tabOn : tabOff}`}
                >
                  {t.label}
                  {countsByKey[key] ? (
                    <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px] font-bold bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                      {countsByKey[key]}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {/* Body — dimmed while a refetch is in flight, since the rows on
            screen are the previous response's until the new one lands. */}
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
        ) : pageRows.length === 0 ? (
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
                  <th className={thBase}>Module</th>
                  <th className={thBase}>Type</th>
                  <th className={thBase}>Deleted by</th>
                  <th className={thBase}>Deleted on</th>
                  <th className={thBase}>Auto-delete</th>
                  <th className={`${thBase} ltr:text-right rtl:text-left`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((item) => (
                  <tr
                    // Keyed on module too: a Tally and a Zoho bill could
                    // in principle carry the same type slug, and React
                    // needs the pair to stay unique.
                    key={`${rowKey(item)}-${item.id}`}
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
                      <ModuleBadge module={item.module} label={item.module_label} />
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
          `"${confirmDelete?.name || "This document"}" (${
            confirmDelete?.module_label || confirmDelete?.module || ""
          } ${confirmDelete?.type_label || "document"}) and its uploaded file will ` +
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
            ? "Every Tally and Zoho document in the trash will be destroyed immediately, along with its uploaded file. This cannot be undone."
            : `Every ${activeFilterLabel || "document"} in the trash will be destroyed immediately. This cannot be undone.`
        }
        confirmText={isEmptying ? "Emptying…" : "Empty Trash"}
        variant="danger"
      />
    </div>
  );
};

export default Trash;
