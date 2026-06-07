import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rootIconUrl = new URL('../src/app/icon.svg', import.meta.url);
const legacyRootIconUrl = new URL('../src/app/favicon.ico', import.meta.url);
const adminIconUrl = new URL('../public/admin-favicon.svg', import.meta.url);
const adminLayout = fs.readFileSync(
  new URL('../src/app/admin/layout.tsx', import.meta.url),
  'utf8'
);

test('blog and CMS use distinct writing emoji favicons', () => {
  assert.equal(fs.existsSync(rootIconUrl), true, 'Expected a blog icon.svg');
  assert.equal(
    fs.existsSync(legacyRootIconUrl),
    false,
    'Expected the legacy root favicon.ico to be removed'
  );
  assert.equal(fs.existsSync(adminIconUrl), true, 'Expected an admin favicon SVG');
  assert.match(
    adminLayout,
    /icon:\s*['"]\/admin-favicon\.svg['"]/,
    'Expected CMS metadata to use the admin writing favicon'
  );
});
