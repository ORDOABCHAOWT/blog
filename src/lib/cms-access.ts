export function isCmsAvailable() {
  return process.env.VERCEL !== '1' && process.env.BLOG_CMS_LOCAL === '1';
}

export function cmsUnavailableResponse() {
  return new Response(null, { status: 404 });
}

export function cmsMutationOriginResponse(request: Request) {
  const trustedLocalOrigins = new Set([
    'http://127.0.0.1:3000',
    'http://localhost:3000',
  ]);
  const requestOrigin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  const requestUrl = new URL(request.url);

  if (
    !trustedLocalOrigins.has(requestUrl.origin) ||
    requestOrigin === null ||
    !trustedLocalOrigins.has(requestOrigin) ||
    (fetchSite !== null && fetchSite !== 'same-origin')
  ) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  return null;
}
