import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Modal from "@/components/ui/Modal";
import BillScanner from "@/components/scanner/BillScanner";

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
 * Any error → returns the original file untouched.
 */
async function safeAutoEnhance(file) {
  if (!isAcceptedImage(file)) return file;
  try {
    const { img, url } = await loadImageFromFile(file);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = imageData.data;
    for (let i = 0; i < px.length; i += 4) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      // contrast around midpoint 128, factor ~1.2
      const v = Math.max(0, Math.min(255, (g - 128) * 1.2 + 128));
      px[i] = px[i + 1] = px[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
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
}) => {
  // each item: { id, originalFile, tunedFile: null | File, kind: "image"|"pdf" }
  const [items, setItems] = useState([]);
  // Only single-invoice uploads are supported; the old "Multiple
  // Invoice/File" batch mode has been removed.
  const fileType = "Single Invoice/File";
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [rejected, setRejected] = useState([]);
  // per-item id currently open in the advanced scanner (or null)
  const [tuningId, setTuningId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setIsUploading(false);
      setIsDragOver(false);
      setRejected([]);
      setTuningId(null);
    }
  }, [isOpen]);

  const addFiles = (incoming) => {
    const list = Array.from(incoming);
    const accepted = [];
    const rejectedNow = [];
    list.forEach((f) => {
      if (isAcceptedImage(f)) {
        accepted.push({
          id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          originalFile: f,
          tunedFile: null,
          kind: "image",
        });
      } else if (isAcceptedPdf(f)) {
        accepted.push({
          id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          originalFile: f,
          tunedFile: null,
          kind: "pdf",
        });
      } else {
        rejectedNow.push(f.name);
      }
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
      const prepared = await Promise.all(
        items.map(async (it) => {
          if (it.tunedFile) return it.tunedFile;
          if (it.kind === "pdf") return it.originalFile;
          return safeAutoEnhance(it.originalFile);
        }),
      );
      prepared.forEach((f) => formData.append("files", f));
      formData.append("fileType", fileType);
      await onUpload(formData);
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) onClose();
  };

  return (
    <Modal
      title={title}
      labelClass="btn-outline-dark"
      activeModal={isOpen}
      onClose={handleClose}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Advanced per-file scanner (opens only when user asks to fine-tune) */}
        {activeTuneItem && activeTuneItem.kind === "image" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Fine-tune scan
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeTuneItem.originalFile.name}
                </p>
              </div>
              <button
                type="button"
                onClick={cancelTuning}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer"
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
          <div className="space-y-4">
            {/* Drop zone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select bill files
              </label>
              <input
                ref={fileInputRef}
                type="file"
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
                className={`border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60">
                    <Icon icon="heroicons:cloud-arrow-up" className="text-2xl" />
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isDragOver ? "Drop file here" : "Drag & drop a bill file here"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    or <span className="text-blue-700 dark:text-blue-400 font-semibold">click to browse</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    JPG · JPEG · PNG · PDF
                  </p>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <Icon
                  icon="heroicons:shield-check"
                  className="text-emerald-600 dark:text-emerald-400 text-sm mt-0.5"
                />
                <span>
                  Images are auto-enhanced for OCR before upload — no
                  auto-cropping, so nothing gets cut off. Use
                  <span className="mx-1 font-semibold">Fine-tune scan</span>
                  per file if you want CamScanner-style perspective correction.
                </span>
              </p>

              {rejected.length > 0 && (
                <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-2 flex items-start gap-2">
                  <Icon
                    icon="heroicons:exclamation-triangle"
                    className="text-amber-600 dark:text-amber-400 text-base mt-0.5"
                  />
                  <div className="text-[12px] text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">
                      {rejected.length} file{rejected.length > 1 ? "s" : ""} skipped:
                    </span>{" "}
                    only JPG / JPEG / PNG / PDF are supported.
                    <button
                      type="button"
                      onClick={() => setRejected([])}
                      className="ml-1 underline hover:no-underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Selected files list */}
            {items.length > 0 && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                    Ready to upload · {items.length}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {items.map((it) => {
                    const tuned = Boolean(it.tunedFile);
                    return (
                      <div
                        key={it.id}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        <span
                          className={`inline-flex w-9 h-9 items-center justify-center rounded-md ring-1 shrink-0 ${
                            tuned
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60"
                              : it.kind === "pdf"
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 ring-rose-100 dark:ring-rose-900/60"
                                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-900/60"
                          }`}
                        >
                          <Icon
                            icon={
                              tuned
                                ? "heroicons:check-badge"
                                : it.kind === "pdf"
                                  ? "heroicons:document-text"
                                  : "heroicons:photo"
                            }
                            className="text-base"
                          />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                            {it.originalFile.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {tuned
                              ? `Fine-tuned · ${bytesToMb(it.tunedFile.size)} MB`
                              : it.kind === "pdf"
                                ? `PDF · ${bytesToMb(it.originalFile.size)} MB`
                                : `Auto-enhance on upload · ${bytesToMb(it.originalFile.size)} MB`}
                          </div>
                        </div>
                        {it.kind === "image" && (
                          <button
                            type="button"
                            onClick={() => setTuningId(it.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                            title="Open CamScanner-style perspective correction"
                          >
                            <Icon icon="heroicons:adjustments-horizontal" className="text-sm" />
                            {tuned ? "Re-tune" : "Fine-tune scan"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remove"
                        >
                          <Icon icon="heroicons:x-mark" className="text-base" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={items.length === 0 || isUploading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Icon icon="heroicons:arrow-path" className="text-base animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Icon icon="heroicons:cloud-arrow-up" className="text-base" />
                    Upload {items.length || ""} {items.length === 1 ? "file" : items.length > 1 ? "files" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadBillModal;
