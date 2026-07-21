import { NextRequest } from 'next/server';

const NOTEBOOK_ORIGIN = 'https://word-notebook.ordoabchao-wt.workers.dev';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = { params: Promise<{ path?: string[] }> };

const isTextual = (contentType: string) =>
  contentType.startsWith('text/')
  || /(?:json|javascript|xml|manifest)/i.test(contentType);

async function proxyNotebook(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const upstreamUrl = new URL(
    `/notebook/${path.map((segment) => encodeURIComponent(segment)).join('/')}`,
    NOTEBOOK_ORIGIN,
  );
  upstreamUrl.search = request.nextUrl.search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');
  requestHeaders.delete('accept-encoding');

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
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
  responseHeaders.set('X-Notebook-Proxy-Version', 'decoded-v2');
  responseHeaders.set('X-Notebook-Upstream-Bytes', String(bytes.byteLength));
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  if (path.join('/') === 'sw.js') responseHeaders.set('Service-Worker-Allowed', '/notebook/');

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyNotebook;
export const HEAD = proxyNotebook;
export const POST = proxyNotebook;
export const PATCH = proxyNotebook;
export const DELETE = proxyNotebook;
