import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rootLayout = fs.readFileSync(
  new URL('../src/app/layout.tsx', import.meta.url),
  'utf8'
);

test('root layout includes Vercel Web Analytics on every page', () => {
  assert.match(
    rootLayout,
    /import\s+{\s*Analytics\s*}\s+from\s+["']@vercel\/analytics\/next["']/,
    'Expected the root layout to use the official Next.js analytics component'
  );
  assert.match(
    rootLayout,
    /<Analytics\s*\/>/,
    'Expected the root layout to render analytics for every route'
  );
});
