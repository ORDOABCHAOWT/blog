import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const middlewarePath = new URL('../src/middleware.ts', import.meta.url);
const nextConfig = fs.readFileSync(
  new URL('../next.config.ts', import.meta.url),
  'utf8'
);

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
