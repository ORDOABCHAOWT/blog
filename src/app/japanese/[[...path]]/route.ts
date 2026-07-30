import { NextRequest } from 'next/server';

const JAPANESE_ORIGIN = 'https://word-notebook.ordoabchao-wt.workers.dev';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = { params: Promise<{ path?: string[] }> };

const isTextual = (contentType: string) =>
  contentType.startsWith('text/')
  || /(?:json|javascript|xml|manifest)/i.test(contentType);

async function proxyJapanese(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const upstreamUrl = new URL(
    `/japanese/${path.map((segment) => encodeURIComponent(segment)).join('/')}`,
    JAPANESE_ORIGIN,
  );
  upstreamUrl.search = request.nextUrl.search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');
  requestHeaders.delete('accept-encoding');

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    cache: 'no-store',
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);
  const contentType = responseHeaders.get('content-type') || '';
  const bytes = request.method === 'HEAD' ? new ArrayBuffer(0) : await upstream.arrayBuffer();
  const responseBody = request.method === 'HEAD'
    ? null
    : isTextual(contentType)
      ? new TextDecoder().decode(bytes)
      : new Uint8Array(bytes);

  responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  responseHeaders.set('X-Japanese-Proxy-Version', 'decoded-v1');
  responseHeaders.set('X-Japanese-Upstream-Bytes', String(bytes.byteLength));
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  if (path.join('/') === 'sw.js') responseHeaders.set('Service-Worker-Allowed', '/japanese');

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyJapanese;
export const HEAD = proxyJapanese;
