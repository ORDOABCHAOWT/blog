import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const middlewarePath = new URL('../src/middleware.ts', import.meta.url);
const nextConfig = fs.readFileSync(
  new URL('../next.config.ts', import.meta.url),
  'utf8'
);
const cmsAccess = fs.readFileSync(
  new URL('../src/lib/cms-access.ts', import.meta.url),
  'utf8'
);
const adminLayout = fs.readFileSync(
  new URL('../src/app/admin/layout.tsx', import.meta.url),
  'utf8'
);

const cmsApiRoutes = [
  '../src/app/api/posts/route.ts',
  '../src/app/api/posts/[slug]/route.ts',
  '../src/app/api/upload/route.ts',
  '../src/app/api/deploy/route.ts',
  '../src/app/api/analytics/route.ts',
].map((relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));

test('CMS admin routes are not gated by Basic Auth middleware', () => {
  assert.equal(
    fs.existsSync(middlewarePath),
    false,
    'Expected /admin to load without a password prompt, so middleware.ts should be removed'
  );
});

test('admin credentials are not exposed through Next runtime env config', () => {
  assert.doesNotMatch(
    nextConfig,
    /ADMIN_USER|ADMIN_PASSWORD/,
    'Expected CMS password env wiring to be removed when admin auth is disabled'
  );
});

test('CMS stays passwordless locally but is unavailable on Vercel deployments', () => {
  assert.match(
    cmsAccess,
    /process\.env\.VERCEL\s*!==\s*'1'/,
    'Expected CMS availability to be limited to non-Vercel environments'
  );
  assert.match(
    adminLayout,
    /!isCmsAvailable\(\)\) notFound\(\)/,
    'Expected Vercel admin page requests to return the framework 404 page'
  );

  for (const route of cmsApiRoutes) {
    assert.match(
      route,
      /!isCmsAvailable\(\)\) return cmsUnavailableResponse\(\)/,
      'Expected each CMS API route to reject Vercel requests before doing work'
    );
  }
});
