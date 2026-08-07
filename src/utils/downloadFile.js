import apiClient from "@/utils/apiClient";

/**
 * Pull a human-readable message out of a JSON error delivered as a Blob.
 * Returns null when the body isn't a Blob or isn't JSON we understand, so
 * the caller can fall back to the original axios error.
 */
async function parseBlobError(body) {
  if (!(body instanceof Blob)) return null;
  try {
    const parsed = JSON.parse(await body.text());
    const message = parsed?.message || parsed?.detail || parsed?.error;
    return message ? { message, body: parsed } : null;
  } catch {
    return null;
  }
}

/**
 * Fetch an authenticated file (blob) from the backend and trigger a
 * browser download. Server-set ``Content-Disposition: attachment;
 * filename="…"`` filename is honoured when present; otherwise the
 * ``fallbackName`` argument is used.
 *
 * Returns the parsed filename actually used (useful for toasts).
 */
export async function downloadAuthenticatedFile(
  url,
  { fallbackName = "download.bin", params, method = "get", data } = {},
) {
  let response;
  try {
    response = await apiClient.request({
      url,
      method,
      responseType: "blob",
      params,
      // POST is used when the request carries a long list of ids — a
      // hundred UUIDs in a query string risks tripping proxy request-line
      // limits, so they travel in the body instead.
      ...(data !== undefined ? { data } : {}),
    });
  } catch (error) {
    // With responseType "blob" an error body is a Blob too, so the server's
    // JSON message would otherwise reach the caller as "[object Blob]".
    // Read it back out so the toast can show what actually went wrong.
    const parsed = await parseBlobError(error?.response?.data);
    if (parsed) {
      const readable = new Error(parsed.message);
      readable.data = parsed.body;
      readable.status = error.response?.status;
      throw readable;
    }
    throw error;
  }

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
