import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const transitionSource = fs.readFileSync(
  new URL('../src/components/PageTransition.tsx', import.meta.url),
  'utf8'
);
const globalsCss = fs.readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8'
);

test('route transition burns into grayscale 0/1 ash instead of a colored bloom', () => {
  assert.match(
    transitionSource,
    /anchor\.getBoundingClientRect\(\)/,
    'Expected transition geometry to be anchored to the clicked link'
  );
  assert.match(
    transitionSource,
    /BURN_BAND/,
    'Expected a page-following burn band rather than a radial ink bloom'
  );
  assert.match(
    transitionSource,
    /ASH_GLYPH_COUNT\s*=\s*(3\d{2}|[4-9]\d{2})/,
    'Expected enough 0/1 ash glyphs for the burn to read clearly'
  );
  assert.match(
    transitionSource,
    /GREY_ASH/,
    'Expected ash colors to stay grayscale'
  );
  assert.doesNotMatch(
    transitionSource,
    /BLOOM_COUNT|EDGE_GLYPH_COUNT|accentRgb|mix-blend-mode/,
    'Transition should not use the rejected colored bloom treatment'
  );
});

test('route transition overlay preserves the page background without blend tinting', () => {
  assert.match(
    globalsCss,
    /\.page-dust-overlay\s*{/,
    'Expected the route transition canvas overlay styles to remain present'
  );
  assert.doesNotMatch(
    globalsCss,
    /mix-blend-mode:/,
    'Overlay should not tint the page through blend modes'
  );
  assert.match(
    globalsCss,
    /\.page-dust-canvas\s*{/,
    'Expected the ash canvas to sit inside a same-background overlay'
  );
});
