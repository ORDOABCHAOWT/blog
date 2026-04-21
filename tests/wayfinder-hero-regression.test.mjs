import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const homeExperience = fs.readFileSync(
  new URL('../src/components/HomeExperience.tsx', import.meta.url),
  'utf8'
);
const heroSource = fs.readFileSync(
  new URL('../src/components/WayfinderHero.tsx', import.meta.url),
  'utf8'
);
const globalsCss = fs.readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8'
);

function getCssBlock(source, selector) {
  const start = source.indexOf(`${selector} {`);

  assert.notEqual(start, -1, `Expected to find CSS block for ${selector}`);

  const blockStart = source.indexOf('{', start) + 1;
  let depth = 1;
  let index = blockStart;

  while (depth > 0 && index < source.length) {
    const char = source[index];

    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    index += 1;
  }

  return source.slice(blockStart, index - 1);
}

test('homepage hero stays on WayfinderHero and extends further right', () => {
  assert.match(
    homeExperience,
    /<WayfinderHero activeIndex=\{activeIndex\} \/>/,
    'Expected the homepage to keep rendering the original WayfinderHero'
  );

  const heroArtBlock = getCssBlock(globalsCss, '.hero-art');
  const heroBlock = getCssBlock(globalsCss, '.wayfinder-hero');

  assert.match(
    heroArtBlock,
    /padding-right\s*:\s*0\s*;/,
    'Expected the hero art wrapper to stop reserving right-side inset space'
  );
  assert.match(
    heroBlock,
    /width\s*:\s*min\(100%,\s*36rem\)\s*;/,
    'Expected the hero to extend further to the right than the previous 33rem cap'
  );
});

test('wayfinder hero keeps pointer-driven digit avoidance', () => {
  assert.match(
    heroSource,
    /pointerActive/,
    'Expected the hero animation to track whether the pointer is active'
  );
  assert.match(
    heroSource,
    /onPointerMove/,
    'Expected the hero to respond to pointer movement'
  );
  assert.match(
    heroSource,
    /distance\s*<\s*radius/,
    'Expected the digit field to apply a local avoidance radius around the pointer'
  );
  assert.match(
    heroSource,
    /driftX|pushX/,
    'Expected the pointer interaction to displace digits horizontally'
  );
});
