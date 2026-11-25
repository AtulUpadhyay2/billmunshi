import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Modal from "@/components/ui/Modal";
import BillScanner from "@/components/scanner/BillScanner";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  BTN_SECONDARY_SM,
  CONTROL_SELECT_ARROW,
} from "@/constants/ui";

/** Field label — the app's small-caps label, muted. */
const LABEL =
  "text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400";

/**
 * The target `<select>`. Same skin as `CONTROL_SELECT` in `constants/ui`,
 * on the 36px dialog tier rather than the 32px toolbar tier, so it sits
 * with the dialog's 13px body text instead of the table scale.
 */
const SELECT =
  "w-full h-9 pl-2.5 pr-8 text-[13px] appearance-none cursor-pointer " +
  "bg-white dark:bg-slate-900 text-slate-900 dark:text-white " +
  "border border-slate-200 dark:border-slate-700 rounded-md transition-colors " +
  "hover:border-slate-300 dark:hover:border-slate-600 " +
  "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "disabled:bg-slate-50 dark:disabled:bg-slate-800/60";

/**
 * UploadBillModal — 2-click upload flow.
 *
 *   Click 1: Drop / browse files.
 *   Click 2: Upload — safely auto-enhances images (grayscale + contrast)
 *            client-side BEFORE upload. NEVER auto-crops, so no bill can
 *            ever accidentally lose content.
 *
 * PDFs skip enhancement (backend renders + OCRs them).
 *
 * The old 3-step "Pick → Scan → Review" flow is still reachable per-file
 * via the "Fine-tune scan" button that opens ``BillScanner`` for manual
 * perspective correction. Users who want CamScanner-style crop still
 * have it — but it isn't in the default path.
 */

const ACCEPTED_IMAGE_MIME = ["image/jpeg", "image/jpg", "image/png"];
const ACCEPTED_IMAGE_EXT = [".jpg", ".jpeg", ".png"];
const ACCEPTED_PDF_MIME = ["application/pdf"];
const ACCEPTED_PDF_EXT = [".pdf"];

function isAcceptedImage(file) {
  if (file.type && ACCEPTED_IMAGE_MIME.includes(file.type)) return true;
  const ext = "." + file.name.split(".").pop().toLowerCase();
  return ACCEPTED_IMAGE_EXT.includes(ext);
}

function isAcceptedPdf(file) {
  if (file.type && ACCEPTED_PDF_MIME.includes(file.type)) return true;
  const ext = "." + file.name.split(".").pop().toLowerCase();
  return ACCEPTED_PDF_EXT.includes(ext);
}

function isAcceptedFile(file) {
  return isAcceptedImage(file) || isAcceptedPdf(file);
}

function bytesToMb(n) {
  return (n / 1024 / 1024).toFixed(2);
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ img, url });
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Safe auto-enhance: grayscale + gentle contrast boost.
 *
 * Deliberately does NOT run jscanify or any quad-detection crop —
 * automatic cropping is the #1 cause of "the scanner ate half the bill"
 * complaints. The tradeoff is a slightly larger upload, but OCR quality
 * is still meaningfully improved by the contrast stretch.
 *
 * Performance notes (upload was blocking the UI for seconds on real
 * phone photos):
 *  - Skip enhance entirely for files < 400 KB — those come out of the
 *    server-side pipeline just fine as-is, and running the pixel loop
 *    on them costs more than the marginal OCR win.
 *  - Downscale to max 2000 px on the long edge before touching pixels.
 *    A 3024×4032 phone photo is 12M pixels = 48M loop iterations = ~2s
 *    of main-thread block; scaled to 1500×2000 it's 12M iterations
 *    (~500 ms), and OCR quality on a 2000 px scan is essentially
 *    indistinguishable.
 *  - Drop JPEG quality to 0.85 (from 0.92). Cuts upload payload by
 *    ~35% for typical bills; DPI, not JPEG quality, drives OCR
 *    accuracy above that threshold.
 *
 * Any error → returns the original file untouched.
 */
const MAX_DIMENSION = 2000;
const SKIP_ENHANCE_BELOW_BYTES = 400 * 1024;

/*
 * Upload limits. These mirror BILL_MAX_UPLOAD_* in the backend settings —
 * the server is the authority and rejects anything over, but catching it
 * here means the operator finds out immediately instead of after pushing
 * 240 MB up a slow line and getting a 413 back.
 *
 * Keep in sync with config/settings/base.py.
 */
const MAX_FILES = 15;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_TOTAL_BYTES = 60 * 1024 * 1024;

async function safeAutoEnhance(file) {
  if (!isAcceptedImage(file)) return file;
  // Small files: skip the whole enhance pass.
  if (file.size < SKIP_ENHANCE_BELOW_BYTES) return file;

  try {
    const { img, url } = await loadImageFromFile(file);

    // Compute downscale factor.
    const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = longEdge > MAX_DIMENSION ? MAX_DIMENSION / longEdge : 1;
    const targetW = Math.round(img.naturalWidth * scale);
    const targetH = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const imageData = ctx.getImageData(0, 0, targetW, targetH);
    const px = imageData.data;
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const v = Math.max(0, Math.min(255, (g - 128) * 1.2 + 128));
      px[i] = px[i + 1] = px[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    URL.revokeObjectURL(url);
    if (!blob) return file;
    const enhancedName = file.name.replace(/\.(png|jpg|jpeg)$/i, ".jpg");
    return new File([blob], enhancedName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

const UploadBillModal = ({
  isOpen,
  onClose,
  onUpload,
  title = "Upload Bills",
  module = "tally",
  // Voucher types this upload can go into: [{ value, label, group }].
  // Empty means the caller has only one destination and no picker is shown.
  targets = [],
  defaultTarget = null,
}) => {
  // each item: { id, originalFile, tunedFile: null | File, kind: "image"|"pdf" }
  const [items, setItems] = useState([]);

  // Bytes actually going up: the auto-enhanced copy when there is one,
  // since that is what gets sent, not the original the user picked.
  const stagedBytes = items.reduce(
    (sum, it) => sum + (it.tunedFile || it.originalFile).size,
    0,
  );
  // The "Multiple Invoice/File" MODE (one PDF split per page into many
  // bills) is hidden per client spec — fileType is hard-locked to SINGLE.
  // Multi-FILE SELECTION (browse or drop several files at once, each one
  // becomes its own SINGLE-mode bill) stays enabled.
  const fileType = "Single Invoice/File";
  // Targets in sidebar order, bucketed by their group, preserving the
  // order they were declared in rather than sorting the labels.
  const groupedTargets = useMemo(() => {
    const order = [];
    const byGroup = new Map();
    targets.forEach((t) => {
      const g = t.group || "";
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        order.push(g);
      }
      byGroup.get(g).push(t);
    });
    return order.map((g) => [g, byGroup.get(g)]);
  }, [targets]);

  // Which voucher type the files become. Defaults to the page the user
  // opened the dialog from, so the common case is still one click.
  const [target, setTarget] = useState(defaultTarget);
  const [isUploading, setIsUploading] = useState(false);
  // What the spinner is actually waiting on. A bare "Uploading…" for the
  // whole wait is misleading: the first stretch is main-thread canvas work
  // downscaling photos, before a single byte leaves the browser.
  const [uploadStage, setUploadStage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [rejected, setRejected] = useState([]);
  // per-item id currently open in the advanced scanner (or null)
  const [tuningId, setTuningId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setIsUploading(false);
      setUploadStage("");
      setIsDragOver(false);
      setRejected([]);
      setTuningId(null);
      setTarget(defaultTarget);
    }
  }, [isOpen, defaultTarget]);

  const addFiles = (incoming) => {
    const list = Array.from(incoming);
    const accepted = [];
    const rejectedNow = [];

    // Running totals start from what is already staged, so the limits hold
    // across several drops rather than per drop.
    let runningCount = items.length;
    let runningBytes = items.reduce(
      (sum, it) => sum + (it.tunedFile || it.originalFile).size,
      0,
    );

    list.forEach((f) => {
      const mk = (kind) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        originalFile: f,
        tunedFile: null,
        kind,
      });

      if (!isAcceptedImage(f) && !isAcceptedPdf(f)) {
        rejectedNow.push(`${f.name} — not a PDF or image`);
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        rejectedNow.push(
          `${f.name} — ${bytesToMb(f.size)} MB, over the ${bytesToMb(MAX_FILE_BYTES)} MB per-file limit`,
        );
        return;
      }
      if (runningCount >= MAX_FILES) {
        rejectedNow.push(`${f.name} — more than ${MAX_FILES} files in one upload`);
        return;
      }
      if (runningBytes + f.size > MAX_TOTAL_BYTES) {
        rejectedNow.push(
          `${f.name} — would take this batch over the ${bytesToMb(MAX_TOTAL_BYTES)} MB total`,
        );
        return;
      }

      accepted.push(mk(isAcceptedImage(f) ? "image" : "pdf"));
      runningCount += 1;
      runningBytes += f.size;
    });

    if (accepted.length) setItems((prev) => [...prev, ...accepted]);
    if (rejectedNow.length) setRejected((prev) => [...prev, ...rejectedNow]);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (tuningId === id) setTuningId(null);
  };

  const applyTuned = (id, tunedFile) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, tunedFile } : it)),
    );
    setTuningId(null);
  };

  const cancelTuning = () => setTuningId(null);

  const activeTuneItem = useMemo(
    () => (tuningId ? items.find((it) => it.id === tuningId) : null),
    [tuningId, items],
  );

  const handleUpload = async () => {
    if (items.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();

      // Safe auto-enhance every image that the user didn't manually
      // fine-tune. PDFs and already-tuned files are sent as-is.
      //
      // This is canvas work on the main thread and runs BEFORE the
      // request — on a few phone photos it is seconds of apparently
      // nothing happening, so say what it is.
      const needsEnhance = items.some(
        (it) => !it.tunedFile && it.kind !== "pdf",
      );
      if (needsEnhance) {
        setUploadStage("Preparing images…");
        // Let the browser paint the label before the canvas work blocks
        // the thread, otherwise it never appears.
        await new Promise((r) => setTimeout(r, 0));
      }

      const prepared = await Promise.all(
        items.map(async (it) => {
          if (it.tunedFile) return it.tunedFile;
          if (it.kind === "pdf") return it.originalFile;
          return safeAutoEnhance(it.originalFile);
        }),
      );
      prepared.forEach((f) => formData.append("files", f));
      formData.append("fileType", fileType);

      setUploadStage(
        items.length === 1 ? "Uploading file…" : `Uploading ${items.length} files…`,
      );
      // `false` means the caller already surfaced the error. Anything else
      // (including a handler that returns nothing) is treated as success so
      // other callers keep their existing behaviour.
      const ok = await onUpload(formData, target);
      if (ok !== false) onClose();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      setUploadStage("");
    }
  };

  const handleClose = () => {
    if (!isUploading) onClose();
  };

  const scanning = Boolean(activeTuneItem && activeTuneItem.kind === "image");

  return (
    <Modal
      title={title}
      labelClass="btn-outline-dark"
      activeModal={isOpen}
      onClose={handleClose}
      className="max-w-3xl"
      footerContent={
        scanning ? null : (
          <>
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className={BTN_SECONDARY}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={items.length === 0 || isUploading}
              className={BTN_PRIMARY}
            >
              {isUploading ? (
                <>
                  <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                  {uploadStage || "Uploading…"}
                </>
              ) : (
                <>
                  <Icon icon="heroicons:cloud-arrow-up" className="text-sm" />
                  Upload {items.length || ""} {items.length === 1 ? "file" : items.length > 1 ? "files" : ""}
                </>
              )}
            </button>
          </>
        )
      }
    >
      {/* Advanced per-file scanner (opens only when user asks to fine-tune) */}
      {scanning ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className={LABEL}>Fine-tune scan</p>
              <p className="mt-0.5 truncate text-[13px] font-medium text-slate-900 dark:text-white">
                {activeTuneItem.originalFile.name}
              </p>
            </div>
            <button
              type="button"
              onClick={cancelTuning}
              className={`${BTN_SECONDARY_SM} shrink-0`}
            >
              <Icon icon="heroicons:x-mark" className="text-sm" />
              Cancel
            </button>
          </div>
          <BillScanner
            key={activeTuneItem.id}
            file={activeTuneItem.originalFile}
            module={module}
            onScanned={(tunedFile) => applyTuned(activeTuneItem.id, tunedFile)}
            onSkip={cancelTuning}
            onCancel={cancelTuning}
          />
        </div>
      ) : (
        /* No file-type toggle here any more — uploads are always
           "Single Invoice/File" (see the `fileType` const above), so the
           two-way switch was removed upstream along with FILE_TYPES. */
        <div className="space-y-4">
          {/* Drop zone — the focus of the dialog. */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={[...ACCEPTED_IMAGE_EXT, ...ACCEPTED_PDF_EXT].join(",")}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-7 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/30"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Icon
                icon="heroicons:cloud-arrow-up"
                className={`text-xl ${
                  isDragOver
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <p className="text-[13px] text-slate-700 dark:text-slate-300">
                {isDragOver ? (
                  <span className="font-semibold text-blue-700 dark:text-blue-400">
                    Drop files here
                  </span>
                ) : (
                  <>
                    Drag bills here, or{" "}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      browse
                    </span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                JPG · JPEG · PNG · PDF · up to {MAX_FILES} files, {bytesToMb(MAX_FILE_BYTES)} MB each
              </p>
            </div>

            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              <Icon
                icon="heroicons:shield-check"
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400 text-sm"
              />
              <span>
                Images are auto-enhanced for OCR before upload — no
                auto-cropping, so nothing gets cut off. Use
                <span className="mx-1 font-semibold">Fine-tune scan</span>
                per file if you want CamScanner-style perspective correction.
              </span>
            </p>
          </div>

          {rejected.length > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-2">
              <Icon
                icon="heroicons:exclamation-triangle"
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400 text-sm"
              />
              {/* Each entry now carries its own reason — unsupported
                  type, over the per-file size, or past the batch
                  count/total. A single blanket line would be wrong for
                  most of them. */}
              <div className="min-w-0 text-[11px] text-amber-800 dark:text-amber-300">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em]">
                  {rejected.length} file{rejected.length > 1 ? "s" : ""} skipped
                </span>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {rejected.slice(0, 5).map((r, i) => (
                    <li key={i} className="break-words">
                      {r}
                    </li>
                  ))}
                  {rejected.length > 5 && (
                    <li className="list-none opacity-80">
                      …and {rejected.length - 5} more
                    </li>
                  )}
                </ul>
                <button
                  type="button"
                  onClick={() => setRejected([])}
                  className="mt-1 font-semibold underline hover:no-underline cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Selected files — compact rows, not cards. */}
          {items.length > 0 && (
            <div className="rounded-md border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 px-3 py-2">
                {/* Show the batch against its budget. Without this the
                    only way to discover the limit is to hit it. */}
                <p className={LABEL}>
                  {items.length} of {MAX_FILES} files
                  <span
                    className={`ml-2 font-semibold normal-case tracking-normal ${
                      stagedBytes > MAX_TOTAL_BYTES * 0.8
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {bytesToMb(stagedBytes)} / {bytesToMb(MAX_TOTAL_BYTES)} MB
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-56 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
                {items.map((it) => {
                  const tuned = Boolean(it.tunedFile);
                  return (
                    <div
                      key={it.id}
                      className="flex items-center gap-2.5 px-3 py-1.5"
                    >
                      <Icon
                        icon={
                          tuned
                            ? "heroicons:check-badge"
                            : it.kind === "pdf"
                              ? "heroicons:document-text"
                              : "heroicons:photo"
                        }
                        className={`shrink-0 text-base ${
                          tuned
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-slate-900 dark:text-white">
                        {it.originalFile.name}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {tuned
                          ? `Fine-tuned · ${bytesToMb(it.tunedFile.size)} MB`
                          : it.kind === "pdf"
                            ? `PDF · ${bytesToMb(it.originalFile.size)} MB`
                            : `${bytesToMb(it.originalFile.size)} MB`}
                      </span>
                      {it.kind === "image" && (
                        <button
                          type="button"
                          onClick={() => setTuningId(it.id)}
                          className="shrink-0 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          title="Open CamScanner-style perspective correction"
                        >
                          {tuned ? "Re-tune" : "Fine-tune scan"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Icon icon="heroicons:x-mark" className="text-sm" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Voucher type. One upload button serves every voucher, so the
              destination is chosen here rather than by which page you
              happened to be on. Grouped exactly like the sidebar. */}
          {targets.length > 1 && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <label htmlFor="upload-bill-target" className={`${LABEL} block mb-1.5`}>
                Create as
              </label>
              <div className="relative sm:max-w-xs">
                <select
                  id="upload-bill-target"
                  value={target ?? ""}
                  disabled={isUploading}
                  onChange={(e) => setTarget(e.target.value)}
                  style={CONTROL_SELECT_ARROW}
                  className={SELECT}
                >
                  {/* Only when the caller gave no default: without it the
                      select would *show* the first option while `target`
                      is still null. */}
                  {!target && (
                    <option value="" disabled>
                      Choose a voucher type…
                    </option>
                  )}
                  {groupedTargets.map(([groupName, groupTargets]) =>
                    groupName ? (
                      <optgroup key={groupName} label={groupName}>
                        {groupTargets.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      groupTargets.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))
                    ),
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default UploadBillModal;
