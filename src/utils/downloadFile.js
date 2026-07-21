import apiClient from "@/utils/apiClient";

/**
 * Fetch an authenticated file (blob) from the backend and trigger a
 * browser download. Server-set ``Content-Disposition: attachment;
 * filename="…"`` filename is honoured when present; otherwise the
 * ``fallbackName`` argument is used.
 *
 * Returns the parsed filename actually used (useful for toasts).
 */
export async function downloadAuthenticatedFile(url, { fallbackName = "download.bin", params } = {}) {
  const response = await apiClient.get(url, {
    responseType: "blob",
    params,
  });

  // Try to pull filename from Content-Disposition — axios lower-cases headers.
  let filename = fallbackName;
  const dispo =
    response.headers["content-disposition"] ||
    response.headers["Content-Disposition"];
  if (dispo) {
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(dispo);
    if (match?.[1]) {
      try {
        filename = decodeURIComponent(match[1]);
      } catch {
        filename = match[1];
      }
    }
  }

  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Small timeout so IE/edge cases finish flushing before revoke.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 500);

  return filename;
}
