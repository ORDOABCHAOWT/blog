import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(relativePath) {
  return fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const nextConfig = read('next.config.ts');
const requestSecurity = read('src/lib/request-security.ts');
const proxyRoutes = [
  read('src/app/notebook/[[...path]]/route.ts'),
  read('src/app/japanese/[[...path]]/route.ts'),
  read('src/app/blood-pressure/[[...path]]/route.ts'),
];

test('Next image optimization only trusts the owned OSS bucket', () => {
  assert.match(nextConfig, /hostname: 'taffyblog\.oss-ap-northeast-1\.aliyuncs\.com'/);
  assert.doesNotMatch(nextConfig, /\*\*\.aliyuncs\.com/);
});

test('baseline browser security headers apply to every route', () => {
  assert.match(nextConfig, /X-Content-Type-Options[\s\S]*nosniff/);
  assert.match(nextConfig, /Referrer-Policy[\s\S]*strict-origin-when-cross-origin/);
  assert.match(nextConfig, /X-Frame-Options[\s\S]*SAMEORIGIN/);
});

test('public Worker proxies bound request size and upstream duration', () => {
  assert.match(requestSecurity, /MAX_PROXY_BODY_BYTES\s*=\s*4 \* 1024 \* 1024/);
  assert.match(requestSecurity, /UPSTREAM_TIMEOUT_MS\s*=\s*30_000/);

  for (const route of proxyRoutes) {
    assert.match(route, /hasOversizedRequestBody\(request, MAX_PROXY_BODY_BYTES\)/);
    assert.match(route, /signal: getUpstreamTimeoutSignal\(\)/);
  }
});
