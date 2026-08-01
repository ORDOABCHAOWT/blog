import { NextRequest } from 'next/server';

const BLOOD_PRESSURE_ORIGIN = 'https://blood-pressure-journal.ordoabchao-wt.workers.dev';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type RouteContext = { params: Promise<{ path?: string[] }> };

const isTextual = (contentType: string) =>
  contentType.startsWith('text/')
  || /(?:json|javascript|xml|manifest)/i.test(contentType);

async function proxyBloodPressure(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const upstreamUrl = new URL(
    `/blood-pressure/${path.map((segment) => encodeURIComponent(segment)).join('/')}`,
    BLOOD_PRESSURE_ORIGIN,
  );
  upstreamUrl.search = request.nextUrl.search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('host');
  requestHeaders.delete('connection');
  requestHeaders.delete('accept-encoding');
  const requestBody = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: requestHeaders,
    body: requestBody,
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
  responseHeaders.set('X-Blood-Pressure-Proxy-Version', 'decoded-v1');
  responseHeaders.set('X-Blood-Pressure-Upstream-Bytes', String(bytes.byteLength));
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  if (path.join('/') === 'sw.js') responseHeaders.set('Service-Worker-Allowed', '/blood-pressure');

  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyBloodPressure;
export const HEAD = proxyBloodPressure;
export const POST = proxyBloodPressure;
export const PATCH = proxyBloodPressure;
export const PUT = proxyBloodPressure;
export const DELETE = proxyBloodPressure;
