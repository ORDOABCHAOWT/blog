import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const markdownEditor = fs.readFileSync(
  new URL('../src/components/MarkdownEditor.tsx', import.meta.url),
  'utf8'
);
const imageUploader = fs.readFileSync(
  new URL('../src/components/ImageUploader.tsx', import.meta.url),
  'utf8'
);
const newPostPage = fs.readFileSync(
  new URL('../src/app/admin/new/page.tsx', import.meta.url),
  'utf8'
);
const editPostPage = fs.readFileSync(
  new URL('../src/app/admin/edit/[slug]/page.tsx', import.meta.url),
  'utf8'
);
const uploadHelperPath = new URL('../src/lib/client-image-upload.ts', import.meta.url);

test('Markdown editor exposes a line-following insert menu tied to CodeMirror cursor activity', () => {
  assert.match(
    markdownEditor,
    /className="markdown-following-line-action"/,
    'Expected a current-line + action inside the Markdown editor'
  );
  assert.match(
    markdownEditor,
    /cursorActivity/,
    'Expected the floating action to update when the CodeMirror cursor moves'
  );
  assert.match(
    markdownEditor,
    /scroll/,
    'Expected the floating action to update while the CodeMirror editor scrolls'
  );
  assert.match(
    markdownEditor,
    /cursorCoords|charCoords/,
    'Expected CodeMirror geometry to position the following controls'
  );
});

test('Markdown editor provides nearby Markdown formatting commands', () => {
  for (const command of [
    'bold',
    'italic',
    'link',
    'heading-2',
    'heading-3',
    'quote',
    'bulleted-list',
    'numbered-list',
    'divider',
    'code-block',
  ]) {
    assert.match(
      markdownEditor,
      new RegExp(`data-command="${command}"`),
      `Expected Markdown command ${command} to be available near the cursor`
    );
  }

  assert.match(
    markdownEditor,
    /className="markdown-selection-toolbar"/,
    'Expected selected text to get a contextual format toolbar'
  );
});

test('Inline image insertion reuses the shared upload helper instead of duplicating upload rules', () => {
  assert.equal(
    fs.existsSync(uploadHelperPath),
    true,
    'Expected upload/compression behavior to live in a reusable client helper'
  );
  assert.match(
    markdownEditor,
    /uploadImageFile/,
    'Expected inline image insertion to use the shared upload helper'
  );
  assert.match(
    imageUploader,
    /uploadImageFile/,
    'Expected the existing drop zone to use the same upload helper'
  );
});

test('CMS article forms remove the standalone image upload block above the editor', () => {
  for (const [label, source] of [
    ['new post form', newPostPage],
    ['edit post form', editPostPage],
  ]) {
    assert.doesNotMatch(
      source,
      /ImageUploader|图片上传|handleImageUpload/,
      `Expected ${label} to rely on inline editor image insertion instead of a standalone upload block`
    );
  }
});

test('Markdown editor uploads dropped images at the editor drop position', () => {
  assert.match(
    markdownEditor,
    /handleEditorDrop/,
    'Expected a dedicated editor drop handler for inline image uploads'
  );
  assert.match(
    markdownEditor,
    /coordsChar/,
    'Expected dropped files to be inserted at the CodeMirror coordinates where the user drops them'
  );
  assert.match(
    markdownEditor,
    /setDragUploadActive/,
    'Expected visible drag state while users drag images over the editor'
  );
  assert.match(
    markdownEditor,
    /uploadImageFile\(file\)/,
    'Expected dropped files to reuse the shared upload helper'
  );
});

test('Markdown editor keeps the plus menu lightweight and dismissible from blank clicks', () => {
  assert.match(
    markdownEditor,
    /document\.addEventListener\('pointerdown'/,
    'Expected outside or blank pointer clicks to dismiss the floating menu'
  );
  assert.match(
    markdownEditor,
    /setLineMenuOpen\(false\)/,
    'Expected floating menu state to close without blurring the whole editor'
  );
  assert.doesNotMatch(
    markdownEditor,
    /\.markdown-editor \.EasyMDEContainer\s*\{[^}]*border:\s*1px solid/s,
    'Expected the editor shell to avoid a boxed border treatment'
  );
  assert.match(
    markdownEditor,
    /border:\s*none;[\s\S]*\.markdown-editor \.EasyMDEContainer/,
    'Expected the editor shell to use a cleaner borderless treatment'
  );
});
