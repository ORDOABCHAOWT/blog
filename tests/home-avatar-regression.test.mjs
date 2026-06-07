import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const homeExperience = fs.readFileSync(
  new URL('../src/components/HomeExperience.tsx', import.meta.url),
  'utf8'
);

test('homepage uses the cache-busted 2026 portrait avatar', () => {
  assert.match(
    homeExperience,
    /src="\/avatar-2026\.png"/,
    'Expected the homepage to use the new portrait avatar without the old image cache'
  );
});
