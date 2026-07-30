import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const homeExperience = fs.readFileSync(
  new URL('../src/components/HomeExperience.tsx', import.meta.url),
  'utf8'
);
const globalsCss = fs.readFileSync(
  new URL('../src/app/globals.css', import.meta.url),
  'utf8'
);
const postLoadingSource = fs.readFileSync(
  new URL('../src/app/posts/[slug]/loading.tsx', import.meta.url),
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

test('article list keeps the anchor hit area stable during hover', () => {
  assert.match(
    homeExperience,
    /className="directory-content"/,
    'Expected the article title block to stay present for hover-scale styling'
  );

  const hoverBlock = getCssBlock(globalsCss, '.directory-item:hover');
  const activeBlock = getCssBlock(globalsCss, '.directory-item.is-active');

  assert.doesNotMatch(
    hoverBlock,
    /transform\s*:/,
    'Hover styles should not translate the clickable anchor itself'
  );
  assert.doesNotMatch(
    activeBlock,
    /transform\s*:/,
    'Active styles should not translate the clickable anchor itself'
  );

  assert.match(
    globalsCss,
    /\.directory-item:hover \.directory-content h2\s*{/,
    'Expected hover motion to be applied to the article title instead of the whole anchor'
  );
  assert.match(
    globalsCss,
    /\.directory-item\.is-active \.directory-content h2\s*{/,
    'Expected active motion to be applied to the article title instead of the whole anchor'
  );
});

test('article routes provide immediate, accessible loading feedback', () => {
  assert.match(
    postLoadingSource,
    /aria-busy="true"/,
    'Expected the dynamic article route to expose its pending state'
  );
  assert.match(
    postLoadingSource,
    /role="status"[\s\S]*aria-live="polite"/,
    'Expected route loading feedback to be announced without interrupting the reader'
  );
  assert.match(
    globalsCss,
    /\.post-loading-line\s*\{/,
    'Expected a lightweight article skeleton while the route resolves'
  );
  assert.match(
    globalsCss,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.post-loading-line\s*\{[\s\S]*?animation:\s*none/,
    'Expected the loading treatment to respect reduced-motion preferences'
  );
});
