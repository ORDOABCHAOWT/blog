import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const globals = fs.readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8'
);

test('CMS does not define a separate admin background palette', () => {
  assert.doesNotMatch(
    globals,
    /--admin-bg|--admin-card-bg|--admin-text|--admin-border/,
    'Expected CMS surfaces to use the blog site palette instead of separate gray admin tokens'
  );
});

test('CMS background uses the shared blog page background without its own glow overlay', () => {
  assert.doesNotMatch(
    globals,
    /\.admin-container::before/,
    'Expected CMS background to match the blog body without an extra admin-only overlay'
  );
});
