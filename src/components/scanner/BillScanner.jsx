import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Icon } from "@iconify/react";
import { useSelector } from "react-redux";
import { useProcessBillScan } from "@/services/tally/tallyApiService";

/**
 * BillScanner — server-side document scanner UI.
 *
 *  All OpenCV processing happens on the backend (apps/common/image_enhancement.py).
 *  This component is a thin client:
 *
 *    1. On mount → POST the original image to /scan/process/. Server auto-
 *       detects the paper edges and returns:
 *         { enhanced_b64, corners: [...4], image_size: {w,h} }
 *    2. Render the *original* file in the canvas with 4 draggable corner
 *       handles overlaid on top of the auto-detected polygon.
 *    3. Render the server's `enhanced_b64` as the live preview underneath.
 *    4. When the operator drags corners or changes filter, "Re-enhance"
 *       posts the same image plus the new corners/filter and swaps the
 *       enhanced preview.
 *    5. On "Apply scan" we decode `enhanced_b64` into a JPEG File and
 *       hand it back via `onScanned`.
 *
 *  Props:
 *    file:        File (must be image/* — caller is responsible for filtering)
 *    onScanned:   (newFile: File) => void   — called when operator confirms
 *    onSkip:      () => void                — keep original file as-is
 *    onCancel:    () => void                — close without scanning
 */

const FILTERS = [
  { id: "bw", label: "B&W (best OCR)", icon: "heroicons:sparkles" },
  { id: "grayscale", label: "Grayscale", icon: "heroicons:swatch" },
  { id: "original", label: "Original", icon: "heroicons:photo" },
];

const HANDLE_RADIUS = 14;

const BillScanner = ({ file, onScanned, onSkip, onCancel, module = "tally" }) => {
  const { selectedOrganization } = useSelector((state) => state.auth);
  const orgId = selectedOrganization?.id;

  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const [originalSrc, setOriginalSrc] = useState(null); // ObjectURL of File
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [corners, setCorners] = useState(null);
  const [filter, setFilter] = useState("bw");
  const [enhancedSrc, setEnhancedSrc] = useState(null);
  const [draggingCorner, setDraggingCorner] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { mutateAsync: processScan, isPending: isProcessing } =
    useProcessBillScan();

  /* ----------------------------------------------------------------
   *  Step 1 — load file as image, then call backend to auto-enhance
   * ---------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    let objectUrl;

    async function init() {
      setErrorMsg(null);
      setEnhancedSrc(null);
      setShowOverlay(false);
      setCorners(null);

      try {
        objectUrl = URL.createObjectURL(file);
        setOriginalSrc(objectUrl);

        const img = await loadImage(objectUrl);
        if (cancelled) return;
        // We only need natural size for canvas sizing on the original.
        // The server returns its own working-resolution coords; we'll fit
        // the canvas to that working size when corners come back.
        // Until then, draw at natural size scaled to fit the wrapper.

        const result = await processScan({
          organizationId: orgId,
          module,
          image: file,
          filter: "bw",
        });
        if (cancelled) return;

        if (!result?.success) {
          throw new Error(result?.message || "Scan failed");
        }

        const w = result.image_size?.width || img.naturalWidth;
        const h = result.image_size?.height || img.naturalHeight;
        setImgSize({ width: w, height: h });
        setCorners({
          tl: { x: result.corners[0].x, y: result.corners[0].y },
          tr: { x: result.corners[1].x, y: result.corners[1].y },
          br: { x: result.corners[2].x, y: result.corners[2].y },
          bl: { x: result.corners[3].x, y: result.corners[3].y },
        });
        setEnhancedSrc(result.enhanced_b64);

        // Paint the original to the canvas (downscaled to working size)
        const c = canvasRef.current;
        if (c) {
          c.width = w;
          c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("scan init failed", err);
        setErrorMsg(
          err?.message ||
            "Could not enhance the image. Please try again or skip the scan.",
        );
      }
    }

    if (orgId) init();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, orgId]);

  /* ----------------------------------------------------------------
   *  Re-process when filter changes (auto, on existing corners)
   * ---------------------------------------------------------------- */
  const reEnhance = useCallback(
    async (nextCorners, nextFilter) => {
      if (!orgId) return;
      try {
        setErrorMsg(null);
        const result = await processScan({
          organizationId: orgId,
          module,
          image: file,
          corners: nextCorners
            ? [
                { x: nextCorners.tl.x, y: nextCorners.tl.y },
                { x: nextCorners.tr.x, y: nextCorners.tr.y },
                { x: nextCorners.br.x, y: nextCorners.br.y },
                { x: nextCorners.bl.x, y: nextCorners.bl.y },
              ]
            : undefined,
          filter: nextFilter,
        });
        if (!result?.success) {
          throw new Error(result?.message || "Scan failed");
        }
        setEnhancedSrc(result.enhanced_b64);
      } catch (err) {
        console.error("re-enhance failed", err);
        setErrorMsg(
          err?.message || "Could not re-enhance. Please try again.",
        );
      }
    },
    [file, orgId, module, processScan],
  );

  /* ----------------------------------------------------------------
   *  Overlay drawing — draggable corners
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const c = overlayCanvasRef.current;
    if (!c || !corners || !imgSize.width) return;
    c.width = imgSize.width;
    c.height = imgSize.height;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);

    if (!showOverlay) return;

    // Dim outside the polygon
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.moveTo(corners.tl.x, corners.tl.y);
    ctx.lineTo(corners.tr.x, corners.tr.y);
    ctx.lineTo(corners.br.x, corners.br.y);
    ctx.lineTo(corners.bl.x, corners.bl.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Polygon outline
    ctx.strokeStyle = "rgb(37, 99, 235)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(corners.tl.x, corners.tl.y);
    ctx.lineTo(corners.tr.x, corners.tr.y);
    ctx.lineTo(corners.br.x, corners.br.y);
    ctx.lineTo(corners.bl.x, corners.bl.y);
    ctx.closePath();
    ctx.stroke();

    ["tl", "tr", "br", "bl"].forEach((k) => {
      const p = corners[k];
      ctx.beginPath();
      ctx.arc(p.x, p.y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fill();
      ctx.strokeStyle = "rgb(37, 99, 235)";
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  }, [corners, imgSize, showOverlay]);

  /* ----------------------------------------------------------------
   *  Pointer events
   * ---------------------------------------------------------------- */
  const overlayToImage = useCallback((clientX, clientY) => {
    const c = overlayCanvasRef.current;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    };
  }, []);

  const findHitCorner = (pt) => {
    if (!corners) return null;
    const hitR = HANDLE_RADIUS * 2.2;
    let best = null;
    let bestDist = Infinity;
    for (const k of ["tl", "tr", "br", "bl"]) {
      const p = corners[k];
      const d = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (d < hitR && d < bestDist) {
        best = k;
        bestDist = d;
      }
    }
    return best;
  };

  const handlePointerDown = (e) => {
    if (!showOverlay || !corners) return;
    const pt = overlayToImage(e.clientX, e.clientY);
    const hit = findHitCorner(pt);
    if (hit) {
      setDraggingCorner(hit);
      e.target.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!draggingCorner) return;
    const pt = overlayToImage(e.clientX, e.clientY);
    const clamped = {
      x: Math.max(0, Math.min(imgSize.width, pt.x)),
      y: Math.max(0, Math.min(imgSize.height, pt.y)),
    };
    setCorners((prev) => ({ ...prev, [draggingCorner]: clamped }));
  };

  const handlePointerUp = () => setDraggingCorner(null);

  /* ----------------------------------------------------------------
   *  Buttons
   * ---------------------------------------------------------------- */
  const handleApplyCrop = async () => {
    if (!corners) return;
    await reEnhance(corners, filter);
  };

  const handleSelectFilter = async (id) => {
    setFilter(id);
    await reEnhance(corners, id);
  };

  const handleConfirm = async () => {
    if (!enhancedSrc) return;
    try {
      const blob = await dataUrlToBlob(enhancedSrc);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const newFile = new File([blob], `${baseName}_scanned.jpg`, {
        type: "image/jpeg",
      });
      onScanned(newFile);
    } catch (err) {
      console.error("apply failed", err);
      setErrorMsg("Could not apply the scan. Please try again.");
    }
  };

  const fileMb = useMemo(
    () => (file.size / 1024 / 1024).toFixed(2),
    [file.size],
  );

  /* ----------------------------------------------------------------
   *  Render
   * ---------------------------------------------------------------- */
  const showLoadingOverlay = isProcessing || !enhancedSrc;

  return (
    <div className="flex flex-col gap-3">
      {/* file label */}
      <div className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
        <Icon icon="heroicons:photo" className="text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
          {file.name}
        </span>
        <span className="text-slate-400">·</span>
        <span>{fileMb} MB</span>
      </div>

      {/* Two-pane: original (with corners) | enhanced preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Original + corner overlay (visible when showOverlay) */}
        <div className="relative bg-slate-100 dark:bg-slate-900/60 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 min-h-70">
          <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-white/85 dark:bg-slate-900/85 backdrop-blur px-2 py-0.5 rounded ring-1 ring-slate-200 dark:ring-slate-700">
            <Icon icon="heroicons:photo" className="text-xs" />
            Original
          </div>
          <canvas ref={canvasRef} className="block w-full h-auto select-none" />
          <canvas
            ref={overlayCanvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute inset-0 w-full h-full touch-none"
            style={{
              cursor: draggingCorner
                ? "grabbing"
                : showOverlay
                  ? "crosshair"
                  : "default",
              pointerEvents: showOverlay ? "auto" : "none",
            }}
          />
        </div>

        {/* Enhanced preview */}
        <div className="relative bg-slate-100 dark:bg-slate-900/60 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 min-h-70 flex items-center justify-center">
          <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950/70 backdrop-blur px-2 py-0.5 rounded ring-1 ring-blue-100 dark:ring-blue-900/60">
            <Icon icon="heroicons:sparkles" className="text-xs" />
            Enhanced
          </div>
          {enhancedSrc ? (
            <img
              src={enhancedSrc}
              alt="enhanced"
              className="max-h-105 w-auto h-auto object-contain"
            />
          ) : (
            <div className="text-[12px] text-slate-500 dark:text-slate-400">
              Enhanced preview will appear here…
            </div>
          )}
          {showLoadingOverlay && enhancedSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 text-sm gap-2 bg-slate-100/80 dark:bg-slate-900/70 backdrop-blur-[1px]">
              <Icon icon="heroicons:arrow-path" className="text-2xl animate-spin" />
              <span>Re-enhancing…</span>
            </div>
          )}
          {!enhancedSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-sm gap-2 bg-slate-100/80 dark:bg-slate-900/70">
              <Icon icon="heroicons:arrow-path" className="text-2xl animate-spin" />
              <span>Enhancing on server…</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 px-3 py-2 flex items-start gap-2">
          <Icon icon="heroicons:exclamation-triangle" className="text-rose-600 dark:text-rose-400 text-base mt-0.5" />
          <div className="text-[12px] text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        </div>
      )}

      {/* tools row */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowOverlay((v) => !v)}
          disabled={!corners || isProcessing}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            showOverlay
              ? "bg-blue-600 text-white ring-1 ring-blue-700"
              : "text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Icon icon="heroicons:scissors" className="text-sm" />
          {showOverlay ? "Hide crop" : "Adjust crop"}
        </button>
        {showOverlay && (
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md cursor-pointer"
          >
            <Icon icon="heroicons:arrow-path" className="text-sm" />
            Re-enhance
          </button>
        )}

        <div className="ml-auto inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-md">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleSelectFilter(f.id)}
              disabled={isProcessing}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer disabled:opacity-50 ${
                filter === f.id
                  ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/60"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon icon={f.icon} className="text-xs" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* footer actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          The server detects the document edges and cleans the image. Toggle
          “Adjust crop” to fine-tune the corners, then re-enhance.
        </div>
        <div className="flex items-center gap-2">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer disabled:opacity-50"
            >
              Skip scan
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing || !enhancedSrc}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 rounded-md shadow-sm shadow-orange-500/20 ring-1 ring-orange-600/20 cursor-pointer"
          >
            <Icon icon="heroicons:check" className="text-sm" />
            Apply scan
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Could not decode image. The file may be corrupted."));
    img.src = src;
  });
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export default BillScanner;
