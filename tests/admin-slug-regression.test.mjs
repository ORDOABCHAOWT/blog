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

test('new CMS entries normalize Chinese or mixed slug input before save', () => {
  assert.match(
    newPostPage,
    /import\s+\{\s*toSafePostSlug\s*\}\s+from\s+'@\/lib\/slug'/,
    'Expected the new-post form to share the slug sanitizer used for CMS URLs'
  );
  assert.match(
    newPostPage,
    /toSafePostSlug\(value,\s*formData\.date\)/,
    'Expected title-generated slugs to be sanitized through the shared helper'
  );
  assert.match(
    newPostPage,
    /slug:\s*toSafePostSlug\(formData\.slug\s*\|\|\s*formData\.title,\s*formData\.date\)/,
    'Expected submit payloads to clean or fall back from invalid manual slug input'
  );
  assert.match(
    newPostPage,
    /onChange=\{\(e\)\s*=>\s*setFormData\(\{\s*\.\.\.formData,\s*slug:\s*toSafePostSlug\(e\.target\.value,\s*formData\.date\)\s*\}\)\}/,
    'Expected manual slug edits to discard characters the API will reject'
  );
});

test('edit CMS entries normalize renamed slugs before save', () => {
  assert.match(
    editPostPage,
    /import\s+\{\s*toSafePostSlug\s*\}\s+from\s+'@\/lib\/slug'/,
    'Expected the edit form to use the same slug sanitizer as the new-post form'
  );
  assert.match(
    editPostPage,
    /slug:\s*toSafePostSlug\(e\.target\.value,\s*formData\.date\)/,
    'Expected edited slugs to discard characters the API will reject'
  );
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
