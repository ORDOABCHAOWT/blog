import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const layout = fs.readFileSync(
  new URL('../src/app/layout.tsx', import.meta.url),
  'utf8'
);
const globals = fs.readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8'
);

test('blog and CMS load the approved industrial sans font system', () => {
  assert.match(layout, /IBM_Plex_Sans/);
  assert.match(layout, /Noto_Sans_SC/);
  assert.match(layout, /JetBrains_Mono/);
  assert.doesNotMatch(layout, /\bFraunces\b/);

  assert.match(
    globals,
    /--font-editorial-display:\s*var\(--font-ibm-plex\),\s*var\(--font-noto-sans-sc\)/
  );
  assert.match(globals, /--tracking-heading:\s*0\.035em/);
  assert.match(globals, /--tracking-body:\s*0\.04em/);
  assert.match(globals, /--tracking-meta:\s*0\.2em/);
});

test('dates and article indices retain wide-tracked mono typography', () => {
  assert.match(
    globals,
    /\.directory-number,\s*\.directory-date,\s*\.post-stamp,\s*\.post-date\s*\{[\s\S]*?font-family:\s*var\(--font-editorial-mono\)[\s\S]*?letter-spacing:\s*var\(--tracking-meta\)/
  );
});
