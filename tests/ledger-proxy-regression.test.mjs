import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(relativePath) {
  return fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const ledgerProxy = read('src/app/ledger/[[...path]]/route.ts');
const nextConfig = read('next.config.ts');
const rootLayout = read('src/app/layout.tsx');

test('blog forwards the private ledger through a scoped, uncached proxy', () => {
  assert.match(
    ledgerProxy,
    /`\/ledger\/\$\{path\.map/,
    'Expected the public ledger route to stay scoped to the Worker path of the same name'
  );
  assert.match(
    ledgerProxy,
    /const LEDGER_ORIGIN = 'https:\/\/ledger\.[a-z0-9-]+\.workers\.dev';/,
    'Expected one fixed upstream: the route must not take its target from the request or the environment'
  );
  assert.match(
    ledgerProxy,
    /requestHeaders\.delete\('accept-encoding'\)/,
    'Expected the ledger proxy to request an identity-encoded upstream response'
  );
  assert.match(ledgerProxy, /new TextDecoder\(\)\.decode\(bytes\)/, 'Expected textual responses to be decoded before Vercel returns them');
  assert.match(ledgerProxy, /new Uint8Array\(bytes\)/, 'Expected PWA icons to be returned as explicit binary bytes');
  assert.match(
    ledgerProxy,
    /'Cache-Control', 'no-cache, no-store, must-revalidate'/,
    'Financial data must never be cached between the Worker and the browser'
  );
  assert.match(ledgerProxy, /X-Ledger-Proxy-Version', 'decoded-v1'/, 'Expected a safe proxy-version diagnostic');
  assert.match(
    ledgerProxy,
    /Service-Worker-Allowed', '\/ledger'/,
    'Expected the service worker to control the canonical no-trailing-slash app URL'
  );
  assert.doesNotMatch(nextConfig, /\/api\/:path\*/, 'Ledger proxy must not intercept the blog CMS API');
});

test('the blog keeps the stricter headers the ledger asks for', () => {
  const rule = nextConfig.slice(nextConfig.indexOf("source: '/ledger/:path*'"));
  assert.ok(nextConfig.includes("source: '/ledger/:path*'"), 'Expected a header rule for the ledger paths');
  assert.ok(nextConfig.indexOf("source: '/(.*)'") < nextConfig.indexOf("source: '/ledger/:path*'"), 'The ledger rule must come after the site-wide one: the later rule wins');
  assert.match(rule, /Referrer-Policy', value: 'no-referrer'/);
  assert.match(rule, /X-Frame-Options', value: 'DENY'/);
});

test('ledger proxy sends upstream only what the ledger needs', () => {
  assert.match(
    ledgerProxy,
    /const LEDGER_COOKIE = '__Secure-ledger_session';/,
    "Expected the proxy to know the ledger's own session cookie by name"
  );
  assert.match(
    ledgerProxy,
    /if \(cookie\) requestHeaders\.set\('cookie', cookie\);\s*else requestHeaders\.delete\('cookie'\);/,
    'Expected cookies of the blog and of the other apps on this site to stay out of the ledger Worker'
  );
  assert.match(ledgerProxy, /body: requestBody/, 'Expected ledger writes to forward their JSON body to the Worker');
  for (const method of ['GET', 'HEAD', 'POST', 'PUT']) {
    assert.match(ledgerProxy, new RegExp(`export const ${method} = proxyLedger;`), `Expected the ledger route to accept ${method}`);
  }
  for (const method of ['PATCH', 'DELETE', 'OPTIONS']) {
    assert.doesNotMatch(ledgerProxy, new RegExp(`export const ${method}\\b`), `The ledger has no ${method} routes; do not open one here`);
  }
  assert.doesNotMatch(ledgerProxy, /process\.env/, 'The proxy needs no secrets and must not read the environment');
  assert.doesNotMatch(ledgerProxy, /console\./, 'The proxy must not log requests: they carry financial data and credentials');
});

test('pages on this origin stay free of third-party scripts now that the ledger shares it', () => {
  const scripts = [...rootLayout.matchAll(/<Script[^>]*src=["'{]([^"'}]+)/g)].map((match) => match[1]);
  assert.deepEqual(
    scripts.filter((src) => /^(https?:)?\/\//.test(src)),
    [],
    'A script from another origin could act as a signed-in ledger user; see docs/agentic/SECURITY.md'
  );
});
