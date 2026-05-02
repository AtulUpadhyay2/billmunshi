import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Modal from "@/components/ui/Modal";
import BillScanner from "@/components/scanner/BillScanner";

/**
 * UploadBillModal
 *
 *  Three-step flow:
 *    1. Pick    — operator selects image files (PDF/DOC blocked for now)
 *    2. Scan    — each image goes through CamScanner-style cleanup
 *                 (jscanify + perspective warp + B&W filter for OCR)
 *    3. Review  — final list with the option to upload
 *
 *  Backend contract is unchanged: a single multipart/form-data body with:
 *    files[]  — one or more File entries
 *    fileType — "Single Invoice/File" | "Multiple Invoice/File"
 */

const FILE_TYPES = [
  { value: "Single Invoice/File", label: "Single Invoice/File" },
  { value: "Multiple Invoice/File", label: "Multiple Invoice/File" },
];

// Allow JPG/JPEG/PNG/HEIC images only. PDFs/DOCs are blocked at the upload
// step until we extend the scanner pipeline to handle them.
const ACCEPTED_MIME = ["image/jpeg", "image/jpg", "image/png"];
const ACCEPTED_EXT = [".jpg", ".jpeg", ".png"];

const STEPS = {
  PICK: "pick",
  SCAN: "scan",
  REVIEW: "review",
};

function isAcceptedImage(file) {
  if (file.type && ACCEPTED_MIME.includes(file.type)) return true;
  const ext = "." + file.name.split(".").pop().toLowerCase();
  return ACCEPTED_EXT.includes(ext);
}

function bytesToMb(n) {
  return (n / 1024 / 1024).toFixed(2);
}

const UploadBillModal = ({
  isOpen,
  onClose,
  onUpload,
  title = "Upload Bills",
  module = "tally",
}) => {
  const [items, setItems] = useState([]);
  // each item: {
  //   id, originalFile, scannedFile, status: "pending"|"scanned"|"skipped",
  // }
  const [fileType, setFileType] = useState("Single Invoice/File");
  const [step, setStep] = useState(STEPS.PICK);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [rejected, setRejected] = useState([]);
  const fileInputRef = useRef(null);

  /* ---------------------------------------------------------------- */
  /*  Reset on close                                                   */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setFileType("Single Invoice/File");
      setStep(STEPS.PICK);
      setActiveIndex(0);
      setIsUploading(false);
      setIsDragOver(false);
      setRejected([]);
    }
  }, [isOpen]);

  /* ---------------------------------------------------------------- */
  /*  File input + drag drop                                          */
  /* ---------------------------------------------------------------- */
  const addFiles = (incoming) => {
    const list = Array.from(incoming);
    const accepted = [];
    const rejectedNow = [];
    list.forEach((f) => {
      if (isAcceptedImage(f)) {
        accepted.push({
          id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          originalFile: f,
          scannedFile: null,
          status: "pending",
        });
      } else {
        rejectedNow.push(f.name);
      }
    });
    if (accepted.length) {
      setItems((prev) => [...prev, ...accepted]);
    }
    if (rejectedNow.length) {
      setRejected((prev) => [...prev, ...rejectedNow]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) addFiles(e.target.files);
    // reset so re-selecting the same file fires onChange
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
  };

  /* ---------------------------------------------------------------- */
  /*  Step transitions                                                */
  /* ---------------------------------------------------------------- */
  const goToScan = () => {
    if (items.length === 0) return;
    setActiveIndex(0);
    setStep(STEPS.SCAN);
  };

  const allScanned = useMemo(
    () => items.length > 0 && items.every((i) => i.status !== "pending"),
    [items],
  );

  const advanceAfterScan = () => {
    // Move to next pending item, or jump to review when none left
    const nextPending = items.findIndex((it, idx) =>
      idx > activeIndex ? it.status === "pending" : false,
    );
    if (nextPending !== -1) {
      setActiveIndex(nextPending);
      return;
    }
    // wrap from start to find any pending
    const anyPending = items.findIndex((it) => it.status === "pending");
    if (anyPending !== -1) {
      setActiveIndex(anyPending);
      return;
    }
    setStep(STEPS.REVIEW);
  };

  const handleScanned = (id, scannedFile) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, scannedFile, status: "scanned" }
          : it,
      ),
    );
    // schedule advance after state flush
    setTimeout(advanceAfterScan, 0);
  };

  const handleSkipScan = (id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, scannedFile: null, status: "skipped" }
          : it,
      ),
    );
    setTimeout(advanceAfterScan, 0);
  };

  const handleRescan = (id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, scannedFile: null, status: "pending" }
          : it,
      ),
    );
    const idx = items.findIndex((it) => it.id === id);
    if (idx !== -1) setActiveIndex(idx);
    setStep(STEPS.SCAN);
  };

  /* ---------------------------------------------------------------- */
  /*  Upload                                                          */
  /* ---------------------------------------------------------------- */
  const handleUpload = async () => {
    if (items.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      items.forEach((it) => {
        const fileToSend =
          it.status === "scanned" && it.scannedFile
            ? it.scannedFile
            : it.originalFile;
        formData.append("files", fileToSend);
      });
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

  /* ---------------------------------------------------------------- */
  /*  Render — header progress                                        */
  /* ---------------------------------------------------------------- */
  const StepDot = ({ active, done, label, num }) => (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ring-1 ${
          done
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60"
            : active
              ? "bg-blue-600 text-white ring-blue-700"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-slate-200 dark:ring-slate-700"
        }`}
      >
        {done ? <Icon icon="heroicons:check" className="text-xs" /> : num}
      </span>
      <span
        className={`text-[11px] font-semibold uppercase tracking-wider ${
          active
            ? "text-slate-900 dark:text-white"
            : done
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <Modal
      title={title}
      labelClass="btn-outline-dark"
      activeModal={isOpen}
      onClose={handleClose}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-3">
            <StepDot
              num={1}
              label="Pick files"
              active={step === STEPS.PICK}
              done={step !== STEPS.PICK}
            />
            <span className="w-6 h-px bg-slate-200 dark:bg-slate-700" />
            <StepDot
              num={2}
              label="Scan & enhance"
              active={step === STEPS.SCAN}
              done={step === STEPS.REVIEW}
            />
            <span className="w-6 h-px bg-slate-200 dark:bg-slate-700" />
            <StepDot
              num={3}
              label="Upload"
              active={step === STEPS.REVIEW}
              done={false}
            />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {items.length} {items.length === 1 ? "file" : "files"}
          </div>
        </div>

        {/* ============================ STEP 1: PICK ============================ */}
        {step === STEPS.PICK && (
          <div className="space-y-4">
            {/* File type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                File type
              </label>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg">
                {FILE_TYPES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFileType(f.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      fileType === f.value
                        ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select bill images
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXT.join(",")}
                onChange={handleFileInputChange}
                className="hidden"
                multiple
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
                    {isDragOver ? "Drop images here" : "Drag & drop bill images here"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    or <span className="text-blue-700 dark:text-blue-400 font-semibold">click to browse</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    JPG · JPEG · PNG (multiple supported · PDF / DOC currently disabled)
                  </p>
                </div>
              </div>

              {/* Rejected files notice */}
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
                    only image uploads (JPG / JPEG / PNG) are supported right now.
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
                    Selected images
                  </h4>
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <span className="inline-flex w-9 h-9 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60 shrink-0">
                        <Icon icon="heroicons:photo" className="text-base" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
                          {it.originalFile.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {bytesToMb(it.originalFile.size)} MB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Remove"
                      >
                        <Icon icon="heroicons:x-mark" className="text-base" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={goToScan}
                disabled={items.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
              >
                Continue to scan
                <Icon icon="heroicons:arrow-right" className="text-base" />
              </button>
            </div>
          </div>
        )}

        {/* ============================ STEP 2: SCAN ============================ */}
        {step === STEPS.SCAN && items[activeIndex] && (
          <div className="space-y-3">
            {/* file strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {items.map((it, idx) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold rounded-md border transition-all cursor-pointer ${
                    idx === activeIndex
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60"
                      : it.status === "scanned"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60"
                        : it.status === "skipped"
                          ? "bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {it.status === "scanned" ? (
                    <Icon icon="heroicons:check-circle" className="text-sm" />
                  ) : it.status === "skipped" ? (
                    <Icon icon="heroicons:minus-circle" className="text-sm" />
                  ) : (
                    <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-current/10 text-[10px] font-bold">
                      {idx + 1}
                    </span>
                  )}
                  <span className="max-w-30 truncate">{it.originalFile.name}</span>
                </button>
              ))}
            </div>

            <BillScanner
              key={items[activeIndex].id}
              file={items[activeIndex].originalFile}
              module={module}
              onScanned={(scannedFile) =>
                handleScanned(items[activeIndex].id, scannedFile)
              }
              onSkip={() => handleSkipScan(items[activeIndex].id)}
              onCancel={null}
            />

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(STEPS.PICK)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Icon icon="heroicons:arrow-left" className="text-base" />
                Back to files
              </button>
              <div className="flex items-center gap-2">
                {allScanned && (
                  <button
                    type="button"
                    onClick={() => setStep(STEPS.REVIEW)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/30 ring-1 ring-orange-600/20 cursor-pointer"
                  >
                    Review &amp; upload
                    <Icon icon="heroicons:arrow-right" className="text-base" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================ STEP 3: REVIEW ============================ */}
        {step === STEPS.REVIEW && (
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-300">
                  Review uploads
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {items.filter((i) => i.status === "scanned").length} scanned ·{" "}
                  {items.filter((i) => i.status === "skipped").length} original
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <span
                      className={`inline-flex w-9 h-9 items-center justify-center rounded-md ring-1 shrink-0 ${
                        it.status === "scanned"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-900/60"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700"
                      }`}
                    >
                      <Icon
                        icon={
                          it.status === "scanned"
                            ? "heroicons:check-badge"
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
                        {it.status === "scanned"
                          ? `Scanned · ${bytesToMb(it.scannedFile.size)} MB`
                          : `Original · ${bytesToMb(it.originalFile.size)} MB`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRescan(it.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer"
                    >
                      <Icon icon="heroicons:arrow-path" className="text-sm" />
                      Re-scan
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Remove"
                    >
                      <Icon icon="heroicons:x-mark" className="text-base" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(STEPS.SCAN)}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Icon icon="heroicons:arrow-left" className="text-base" />
                Back
              </button>
              <div className="flex items-center gap-2">
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
                      Upload {items.length} {items.length === 1 ? "file" : "files"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadBillModal;
