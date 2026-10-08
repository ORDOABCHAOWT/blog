import { NextRequest } from 'next/server';
import {
  getUpstreamTimeoutSignal,
  hasOversizedRequestBody,
  MAX_PROXY_BODY_BYTES,
} from '@/lib/request-security';

// The ledger is a private finance app on its own Worker. workers.dev cannot be reached from some
// networks, so the blog forwards /ledger to it, the same way it forwards /notebook. The Worker knows
// it is mounted under /ledger (page links, manifest, service worker scope, cookie path), so this
// route rewrites nothing: requests and responses pass through as they are.
const LEDGER_ORIGIN = 'https://ledger.ordoabchao-wt.workers.dev';
const LEDGER_COOKIE = '__Secure-ledger_session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = { params: Promise<{ path?: string[] }> };

const isTextual = (contentType: string) =>
  contentType.startsWith('text/')
  || /(?:json|javascript|xml|manifest)/i.test(contentType);

// Only the ledger's own session cookie goes upstream; cookies of the blog and of the other apps
// on this site are none of its business.
const ledgerCookie = (header: string | null) =>
  (header || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${LEDGER_COOKIE}=`));

async function proxyLedger(request: NextRequest, context: RouteContext) {
  if (hasOversizedRequestBody(request, MAX_PROXY_BODY_BYTES)) {
    return new Response('Request body is too large', { status: 413 });
  }

  const { path = [] } = await context.params;
  const upstreamUrl = new URL(
    `/ledger/${path.map((segment) => encodeURIComponent(segment)).join('/')}`,
    LEDGER_ORIGIN,
  );
  upstreamUrl.search = request.nextUrl.search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');
  requestHeaders.delete('accept-encoding');
  const cookie = ledgerCookie(request.headers.get('cookie'));
  if (cookie) requestHeaders.set('cookie', cookie);
  else requestHeaders.delete('cookie');

  const requestBody = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();
  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body: requestBody,
    cache: 'no-store',
    redirect: 'manual',
    signal: getUpstreamTimeoutSignal(),
  });

  const responseHeaders = new Headers(upstream.headers);
  const contentType = responseHeaders.get('content-type') || '';
  const bytes = request.method === 'HEAD' ? new ArrayBuffer(0) : await upstream.arrayBuffer();
  const responseBody = request.method === 'HEAD'
    ? null
    : isTextual(contentType)
      ? new TextDecoder().decode(bytes)
      : new Uint8Array(bytes);

  // Financial data: nothing between the Worker and the browser may keep a copy.
  responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  responseHeaders.set('X-Ledger-Proxy-Version', 'decoded-v1');
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  if (path.join('/') === 'sw.js') responseHeaders.set('Service-Worker-Allowed', '/ledger');

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyLedger;
export const HEAD = proxyLedger;
export const POST = proxyLedger;
export const PUT = proxyLedger;
