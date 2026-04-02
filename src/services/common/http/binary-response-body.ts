/**
 * Helpers for `HttpRequestConfig.responseType === 'arraybuffer'` only.
 * Other SDK services use the default JSON/text parsing — they never set `responseType`.
 */

/** Decode an error response body that was read as ArrayBuffer (try JSON, else UTF-8 text). */
export function decodeArrayBufferErrorBody(buffer: ArrayBuffer): unknown {
  const txt = new TextDecoder().decode(buffer);
  try {
    return JSON.parse(txt) as unknown;
  } catch {
    return txt;
  }
}
