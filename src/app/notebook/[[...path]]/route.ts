import { NextRequest, NextResponse } from 'next/server';

const NOTEBOOK_ORIGIN = 'https://word-notebook.ordoabchao-wt.workers.dev';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = { params: Promise<{ path?: string[] }> };

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

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
    cache: 'no-store',
    redirect: 'manual',
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  if (path.join('/') === 'sw.js') responseHeaders.set('Service-Worker-Allowed', '/notebook/');

  return new NextResponse(upstream.body, {
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
