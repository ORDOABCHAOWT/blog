import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const newPostPage = fs.readFileSync(
  new URL('../src/app/admin/new/page.tsx', import.meta.url),
  'utf8'
);
const editPostPage = fs.readFileSync(
  new URL('../src/app/admin/edit/[slug]/page.tsx', import.meta.url),
  'utf8'
);
const slugHelperPath = new URL('../src/lib/slug.ts', import.meta.url);

test('new CMS entries preserve slug typing and normalize only at safe boundaries', () => {
  assert.match(
    newPostPage,
    /import\s+\{\s*toSafePostSlug\s*\}\s+from\s+'@\/lib\/slug'/,
    'Expected the new-post form to share the slug sanitizer used for CMS URLs'
  );
  assert.match(
    newPostPage,
    /next\.slug\s*=\s*toSafePostSlug\(value,\s*prev\.date\)/,
    'Expected title-generated slugs to be sanitized through the shared helper'
  );
  assert.match(
    newPostPage,
    /slug:\s*toSafePostSlug\(formData\.slug\s*\|\|\s*formData\.title,\s*formData\.date\)/,
    'Expected submit payloads to clean or fall back from invalid manual slug input'
  );
  assert.match(
    newPostPage,
    /onChange=\{\(e\)\s*=>\s*handleSlugChange\(e\.target\.value\)\}/,
    'Expected manual slug edits to keep the value untouched while the user types'
  );
  assert.match(
    newPostPage,
    /const handleSlugBlur[\s\S]*toSafePostSlug\(prev\.slug \|\| prev\.title,\s*prev\.date\)/,
    'Expected the slug to normalize after typing finishes'
  );
  assert.doesNotMatch(
    newPostPage,
    /onChange=\{[^}]*toSafePostSlug/,
    'Expected slug input events not to rewrite the controlled value on every keystroke'
  );
});

test('edit CMS entries preserve typing and normalize renamed slugs on blur and save', () => {
  assert.match(
    editPostPage,
    /import\s+\{\s*toSafePostSlug\s*\}\s+from\s+'@\/lib\/slug'/,
    'Expected the edit form to use the same slug sanitizer as the new-post form'
  );
  assert.match(
    editPostPage,
    /onChange=\{\(e\)\s*=>\s*handleInputChange\('slug',\s*e\.target\.value\)\}/,
    'Expected edited slugs to preserve the current caret and composition value'
  );
  assert.match(
    editPostPage,
    /const handleSlugBlur[\s\S]*toSafePostSlug\(prev\.slug \|\| prev\.title,\s*prev\.date\)/,
    'Expected edited slugs to normalize when the field loses focus'
  );
  assert.match(
    editPostPage,
    /const normalizedSlug = toSafePostSlug\([\s\S]*?newSlug:\s*normalizedSlug !== slug/,
    'Expected renamed slugs to be normalized again at the API boundary'
  );
  assert.doesNotMatch(
    editPostPage,
    /onChange=\{[^}]*toSafePostSlug/,
    'Expected slug typing not to be sanitized mid-composition'
  );
});

test('CMS slug fields disable text corrections and show the resulting post URL', () => {
  for (const [label, source] of [
    ['new post form', newPostPage],
    ['edit post form', editPostPage],
  ]) {
    assert.match(
      source,
      /autoCapitalize="none"[\s\S]*autoCorrect="off"[\s\S]*spellCheck=\{false\}/,
      `Expected ${label} to avoid browser corrections in URL input`
    );
    assert.match(
      source,
      /className="admin-slug-preview"[\s\S]*\/posts\/\{slugPreview/,
      `Expected ${label} to preview the final article path`
    );
  }
});

test('CMS slug sanitizer keeps ASCII URL slugs and falls back when Chinese text has no ASCII', () => {
  assert.equal(
    fs.existsSync(slugHelperPath),
    true,
    'Expected a shared slug helper so UI behavior and tests stay aligned'
  );

  const slugHelper = fs.readFileSync(slugHelperPath, 'utf8');
  assert.match(
    slugHelper,
    /replace\(\s*\/\[\^a-z0-9_\\s-]\+\/g,\s*''\s*\)/,
    'Expected the helper to remove characters outside the API slug allowlist'
  );
  assert.match(
    slugHelper,
    /post-\$\{safeDate\}/,
    'Expected Chinese-only titles to get a safe dated fallback slug'
  );
});
