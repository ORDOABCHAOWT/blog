export const MAX_CMS_JSON_BODY_BYTES = 2 * 1024 * 1024;
export const MAX_PROXY_BODY_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_REQUEST_BYTES = 11 * 1024 * 1024;
export const UPSTREAM_TIMEOUT_MS = 30_000;

export function hasOversizedRequestBody(request: Request, maxBytes: number) {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return false;

  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > maxBytes;
}

export function getUpstreamTimeoutSignal() {
  return AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
}
