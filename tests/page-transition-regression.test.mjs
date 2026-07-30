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
    /ASH_GLYPH_COUNT\s*=\s*(1\d{2}|2[0-4]\d)/,
    'Expected a bounded glyph count so the transition does not delay route rendering'
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

test('route transition starts navigation immediately and never swallows a click', () => {
  const pushIndex = transitionSource.indexOf('router.push(fullPath);', transitionSource.indexOf('document.body.appendChild(overlay);'));
  const animationIndex = transitionSource.indexOf('requestAnimationFrame(draw)');

  assert.notEqual(pushIndex, -1, 'Expected the route push beside the overlay setup');
  assert.notEqual(animationIndex, -1, 'Expected the decorative animation to remain');
  assert.ok(
    pushIndex < animationIndex,
    'Navigation must start before the decorative animation loop'
  );
  assert.match(
    transitionSource,
    /if \(document\.querySelector\('\.page-dust-overlay'\)\) \{\s*router\.push\(fullPath\);\s*return;/,
    'A finishing overlay must not swallow the next internal link click'
  );
  assert.doesNotMatch(
    transitionSource,
    /t\s*>=\s*NAV_AT|if\s*\(!pushed\)/,
    'Navigation must not wait for animation progress or a timeout fallback'
  );
  assert.match(
    transitionSource,
    /TOTAL_MS\s*=\s*(?:[1-7]\d{2}|800)/,
    'The visual transition should stay short enough to feel responsive'
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
