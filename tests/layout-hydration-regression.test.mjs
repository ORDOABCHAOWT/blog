import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const layout = fs.readFileSync(
  new URL('../src/app/layout.tsx', import.meta.url),
  'utf8'
);

test('root html suppresses extension or locale driven hydration noise', () => {
  assert.match(
    layout,
    /<html[\s\S]*suppressHydrationWarning/,
    'Expected root html to suppress harmless lang/class mutations from browsers or extensions'
  );
});
