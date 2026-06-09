/**
 * Content-type (MIME) resolution for uploads.
 *
 * The backend derives an object's stored file type from the `Content-Type` of
 * the multipart `file` part. When a caller appends a `Blob`/`File` without a
 * `type` (common when reading bytes from disk into a Buffer/Blob), the part is
 * sent as `application/octet-stream`, so the stored file type ends up blank and
 * the generated CDN URL serves the object as a download instead of inline media.
 *
 * We resolve a usable content type from (in order): an explicit override, the
 * Blob's own `type`, then the filename extension.
 */

/** Generic fallback when nothing better can be determined. */
export const DEFAULT_CONTENT_TYPE = 'application/octet-stream' as const;

/** Common file extensions → MIME types, focused on media (image/video/audio). */
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  // images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
  avif: 'image/avif',
  // video
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
  wmv: 'video/x-ms-wmv',
  flv: 'video/x-flv',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  '3gp': 'video/3gpp',
  ogv: 'video/ogg',
  // audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  weba: 'audio/webm',
  // documents / misc
  pdf: 'application/pdf',
  json: 'application/json',
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  xml: 'application/xml',
  zip: 'application/zip',
  gz: 'application/gzip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/** Lower-cased extension (no dot) from a filename, or `null` if none. */
export function extensionOf(filename: string): string | null {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return null;
  return base.slice(dot + 1).toLowerCase();
}

/** MIME type for a filename based on its extension, or `null` if unknown. */
export function contentTypeFromFilename(filename: string): string | null {
  const ext = extensionOf(filename);
  if (ext === null) return null;
  return EXTENSION_CONTENT_TYPES[ext] ?? null;
}

/** Treat an empty/whitespace or generic-octet-stream type as "missing". */
function isUsableType(type: string | undefined | null): type is string {
  if (type == null) return false;
  const t = type.trim().toLowerCase();
  return t !== '' && t !== DEFAULT_CONTENT_TYPE;
}

/**
 * Resolve the content type to send for an upload.
 *
 * Precedence: explicit override → the file's own `type` → extension lookup →
 * {@link DEFAULT_CONTENT_TYPE}.
 */
export function resolveUploadContentType(
  filename: string,
  file: Blob,
  explicit?: string
): string {
  if (isUsableType(explicit)) return explicit.trim();
  const blobType = (file as { type?: string }).type;
  if (isUsableType(blobType)) return blobType;
  return contentTypeFromFilename(filename) ?? DEFAULT_CONTENT_TYPE;
}
