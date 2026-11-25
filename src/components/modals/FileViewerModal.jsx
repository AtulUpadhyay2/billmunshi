import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { BACKDROP_VIEWER } from "@/constants/ui";

/**
 * The document, full size, over the page.
 *
 * It showed "Unknown File Type" for everything. The type was read with
 * `url.split('.').pop()`, and bill URLs are signed:
 *
 *   /media/bills/x.pdf?token=bills/x.pdf%1F7:1xW9pF:X2nC07459sio4…
 *
 * so the last dot-separated piece is the tail of the token, never the
 * extension. Every file fell through to the unknown branch — including
 * the PDFs, which the viewer could have rendered all along.
 *
 * Rebuilt rather than patched, because the old shell fought the
 * content: a fixed h-96 frame inside a max-w-4xl dialog gave a PDF
 * about a third of the screen, and the same two actions were printed
 * twice, once under the file and again in the footer.
 *
 * Now the document gets the window and the chrome gets out of its way:
 * one slim bar with the name and the actions, the file filling
 * everything below it.
 */

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "avif"];

/** Extension from a URL, ignoring the query string and hash. */
export const extensionOf = (url) => {
  if (!url) return "";
  const path = String(url).split(/[?#]/)[0];
  const last = path.split("/").pop() || "";
  const dot = last.lastIndexOf(".");
  return dot === -1 ? "" : last.slice(dot + 1).toLowerCase();
};

const kindOf = (url, fileName) => {
  const ext = extensionOf(url) || extensionOf(fileName);
  if (IMAGE_EXT.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "xls", "xlsx"].includes(ext)) return "office";
  return "other";
};

const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName = "File" }) => {
  const [failed, setFailed] = useState(false);
  const kind = useMemo(() => kindOf(fileUrl, fileName), [fileUrl, fileName]);

  useEffect(() => {
    if (isOpen) setFailed(false);
  }, [isOpen, fileUrl]);

  // Escape closes, as it does on every other dialog in the app.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const openExternal = () =>
    window.open(fileUrl, "_blank", "noopener,noreferrer");

  const download = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const barBtn =
    "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] " +
    "font-semibold text-slate-200 border border-white/15 bg-white/5 " +
    "hover:bg-white/10 hover:border-white/25 transition-colors cursor-pointer";

  const body = () => {
    if (failed || kind === "office" || kind === "other") {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-6">
          <Icon
            icon={failed ? "heroicons:exclamation-triangle" : "heroicons:document"}
            className={`text-5xl ${failed ? "text-amber-400" : "text-slate-500"}`}
          />
          <div>
            <p className="text-sm font-semibold text-slate-100">{fileName}</p>
            <p className="mt-1 text-[12px] text-slate-400">
              {failed
                ? "This file could not be displayed here."
                : `${(extensionOf(fileUrl) || "This file").toUpperCase()} cannot be previewed in the browser.`}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={openExternal} className={barBtn}>
              <Icon icon="heroicons:arrow-top-right-on-square" />
              Open in new tab
            </button>
            <button type="button" onClick={download} className={barBtn}>
              <Icon icon="heroicons:arrow-down-tray" />
              Download
            </button>
          </div>
        </div>
      );
    }

    if (kind === "image") {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <img
            src={fileUrl}
            alt={fileName}
            onError={() => setFailed(true)}
            className="max-h-full max-w-full object-contain rounded-md"
          />
        </div>
      );
    }

    return (
      <iframe
        src={fileUrl}
        title={fileName}
        onError={() => setFailed(true)}
        className="h-full w-full bg-white"
      />
    );
  };

  return (
    <div
      className={BACKDROP_VIEWER}
      role="dialog"
      aria-modal="true"
      aria-label={fileName}
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="flex h-[92vh] w-[94vw] max-w-[1400px] flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
          <Icon
            icon={kind === "image" ? "heroicons:photo" : "heroicons:document-text"}
            className="shrink-0 text-base text-slate-400"
          />
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-100">
            {fileName}
          </p>
          <button type="button" onClick={openExternal} className={barBtn}>
            <Icon icon="heroicons:arrow-top-right-on-square" />
            <span className="hidden sm:inline">Open</span>
          </button>
          <button type="button" onClick={download} className={barBtn}>
            <Icon icon="heroicons:arrow-down-tray" />
            <span className="hidden sm:inline">Download</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <Icon icon="heroicons:x-mark" className="text-lg" />
          </button>
        </div>

        <div className="min-h-0 flex-1 bg-slate-950">{body()}</div>
      </div>
    </div>
  );
};

export default FileViewerModal;
