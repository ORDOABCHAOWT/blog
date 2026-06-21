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
