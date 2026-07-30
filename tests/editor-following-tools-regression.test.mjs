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
  assert.match(
    markdownEditor,
    /charCoords\(\s*\{ line: cursor\.line, ch: 0 \},\s*'window'\s*\)/,
    'Expected the plus control to align from the current line start instead of the editor frame'
  );
  assert.match(
    markdownEditor,
    /cursorCoords\.bottom - cursorCoords\.top - LINE_ACTION_SIZE/,
    'Expected the plus control to center against the current line height'
  );
  assert.match(
    markdownEditor,
    /lineStartCoords\.left[\s\S]*LINE_ACTION_SIZE[\s\S]*LINE_ACTION_GAP/,
    'Expected a stable gap between the circular control and the writing cursor'
  );
  assert.match(
    markdownEditor,
    /\.markdown-following-plus:not\(:disabled\)::before,[\s\S]*?\.markdown-following-plus:not\(:disabled\)::after[\s\S]*?top:\s*50%;[\s\S]*?left:\s*50%/,
    'Expected the plus glyph to use centered geometry instead of a font baseline'
  );
});

test('Markdown editor provides nearby Markdown formatting commands', () => {
  for (const command of [
    'paragraph',
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

test('Markdown editor replaces the legacy toolbar with a full plus formatting menu', () => {
  assert.match(
    markdownEditor,
    /toolbar:\s*false/,
    'Expected the legacy EasyMDE toolbar row to be hidden'
  );

  const lineMenuMatch = markdownEditor.match(
    /<div className="markdown-line-command-menu">([\s\S]*?)<\/div>/
  );
  assert.ok(lineMenuMatch, 'Expected a line-following plus menu');

  for (const command of [
    'paragraph',
    'bold',
    'italic',
    'link',
    'image',
    'heading-2',
    'heading-3',
    'quote',
    'bulleted-list',
    'numbered-list',
    'divider',
    'code-block',
  ]) {
    assert.match(
      lineMenuMatch[1],
      new RegExp(`data-command="${command}"`),
      `Expected + menu to include ${command}`
    );
  }
});

test('Markdown editor plus menu can reset a line to body text and uses a two-column palette', () => {
  const lineMenuMatch = markdownEditor.match(
    /<div className="markdown-line-command-menu">([\s\S]*?)<\/div>/
  );
  assert.ok(lineMenuMatch, 'Expected a line-following plus menu');
  assert.match(
    lineMenuMatch[1],
    /data-command="paragraph"[\s\S]*>正文</,
    'Expected + menu to include a body text option for undoing accidental headings'
  );
  assert.match(
    markdownEditor,
    /command === 'paragraph'[\s\S]*replaceCurrentLine/,
    'Expected paragraph command to normalize the current block back to body text'
  );
  assert.match(
    markdownEditor,
    /grid-template-columns:\s*repeat\(2,/,
    'Expected the + menu to be a compact two-column palette'
  );
});

test('Markdown editor lets mouse clicks in blank editor space create and select a next line', () => {
  assert.match(
    markdownEditor,
    /handleEditorBlankMouseDown/,
    'Expected a mouse handler for blank editor space'
  );
  assert.match(
    markdownEditor,
    /lineCount\(\)/,
    'Expected blank-space clicks to inspect the final CodeMirror line'
  );
  assert.match(
    markdownEditor,
    /replaceRange\('\\n'\.repeat\(linesToAdd\)/,
    'Expected blank-space clicks below the last line to append selectable empty lines'
  );
  assert.match(
    markdownEditor,
    /setEditorFocused\(true\);[\s\S]*updateFloatingControls\(\);/,
    'Expected mouse activation inside the editor to show the following plus control reliably'
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
      /import\s+ImageUploader|<ImageUploader|handleImageUpload/,
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

test('Markdown editor keeps the plus menu dismissible and the writing surface clearly bounded', () => {
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
  assert.match(
    markdownEditor,
    /\.markdown-editor \.EasyMDEContainer\s*\{[\s\S]*?border:\s*1px solid/,
    'Expected the editor shell to use a quiet standard-material boundary'
  );
  assert.match(
    markdownEditor,
    /\.markdown-editor \.EasyMDEContainer\s*\{[\s\S]*?border-radius:\s*16px/,
    'Expected the editor shell to use the macOS content-surface radius'
  );
});

test('CMS article forms keep editor typing out of React form state hot path', () => {
  for (const [label, source] of [
    ['new post form', newPostPage],
    ['edit post form', editPostPage],
  ]) {
    assert.match(
      source,
      /const contentRef = useRef/,
      `Expected ${label} to store draft body in a ref while typing`
    );
    assert.doesNotMatch(
      source,
      /handleContentChange[\s\S]*setFormData\(\(prev\) => \(\{ \.\.\.prev, content: value \}\)\)/,
      `Expected ${label} not to re-render the whole form on every editor keystroke`
    );
    assert.match(
      source,
      /content:\s*contentRef\.current/,
      `Expected ${label} submit payload to read the latest editor body from the ref`
    );
  }
});

test('Markdown editor batches floating control measurement and skips identical positions', () => {
  assert.match(
    markdownEditor,
    /floatingUpdateFrameRef/,
    'Expected cursor/scroll updates to be coalesced through requestAnimationFrame'
  );
  assert.match(
    markdownEditor,
    /requestAnimationFrame/,
    'Expected high-frequency CodeMirror events to be batched per frame'
  );
  assert.match(
    markdownEditor,
    /lastLineActionPositionRef/,
    'Expected line action position updates to compare against the last measured position'
  );
  assert.match(
    markdownEditor,
    /positionsEqual/,
    'Expected identical floating positions to skip React state updates'
  );
  assert.match(
    markdownEditor,
    /lastCursorGeometryKeyRef/,
    'Expected same-line typing to skip repeated CodeMirror geometry reads'
  );
});

test('Markdown editor defers whole-document word counting while the user types', () => {
  assert.match(
    markdownEditor,
    /WORD_COUNT_DELAY_MS/,
    'Expected word counting to be deferred until the typing burst settles'
  );
  assert.match(
    markdownEditor,
    /scheduleWordCountUpdate/,
    'Expected a debounced custom word-count status item'
  );
  assert.doesNotMatch(
    markdownEditor,
    /status:\s*\[\s*['"]lines['"],\s*['"]words['"]/,
    'Expected to avoid EasyMDE full-document word counting on every update'
  );
});

test('Markdown images render as direct previews instead of exposed URLs', () => {
  assert.match(
    markdownEditor,
    /previewImagesInEditor:\s*false/,
    'Expected the cursor-breaking EasyMDE pseudo-element preview to stay disabled'
  );
  assert.match(
    markdownEditor,
    /addLineWidget\(/,
    'Expected image previews to use CodeMirror-managed line widgets'
  );
  assert.match(
    markdownEditor,
    /\.markdown-image-source-line\s+span[\s\S]*?color:\s*transparent\s*!important/,
    'Expected raw Markdown image text to be hidden without changing its metrics'
  );
  assert.match(
    markdownEditor,
    /noHScroll:\s*false/,
    'Expected image widgets to remain inside the CodeMirror content width'
  );
  assert.match(
    markdownEditor,
    /loadImageIntoWidget\(entry,\s*desired\)/,
    'Expected uploaded image URLs to update the existing widget without rebuilding its line'
  );
  assert.match(
    markdownEditor,
    /entry\.loadVersion !== loadVersion/,
    'Expected stale image load events not to update a newer preview'
  );
  assert.doesNotMatch(
    markdownEditor,
    /widget\.changed\(\)/,
    'Expected image loading not to mutate line-widget geometry after insertion'
  );
  assert.match(
    markdownEditor,
    /\.markdown-image-preview\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*100%/,
    'Expected the preview surface to stay within the editor content box'
  );
  assert.match(
    markdownEditor,
    /\.markdown-image-preview img\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?object-fit:\s*contain/,
    'Expected the image element itself to stay inside the preview surface'
  );
  assert.doesNotMatch(
    markdownEditor,
    /\.CodeMirror-line:has\(\.cm-image-marker\)/,
    'Expected image previews not to rely on expensive relational line selectors'
  );
  assert.doesNotMatch(
    markdownEditor,
    /\.markdown-image-source-line\s+span\s*\{[^}]*?(?:font-size|line-height|display|width)\s*:/,
    'Expected image preview styling to preserve CodeMirror cursor geometry'
  );
});

test('image uploads insert an immediate local preview and replace it in place', () => {
  assert.match(
    markdownEditor,
    /URL\.createObjectURL\(file\)/,
    'Expected a local object URL to make the selected image visible immediately'
  );
  assert.match(
    markdownEditor,
    /insertAtPosition\(previewMarkdown,\s*position\)[\s\S]*?await uploadImageFile\(file\)/,
    'Expected the preview to appear before compression and network upload finish'
  );
  assert.match(
    markdownEditor,
    /replaceEditorSnippet\(\s*previewMarkdown,\s*data\.markdown\s*\)/,
    'Expected successful uploads to swap only the backing Markdown URL'
  );
  const replacementHelper = markdownEditor.match(
    /const replaceEditorSnippet = useCallback\([\s\S]*?return false;[\s\S]*?\}, \[updateFloatingControls\]\);/
  )?.[0];
  assert.ok(replacementHelper, 'Expected the asynchronous image replacement helper');
  assert.doesNotMatch(
    replacementHelper,
    /setCursor|cm\.focus/,
    'Expected upload completion not to steal focus or move the user cursor'
  );
  assert.match(
    markdownEditor,
    /onPaste=\{handleEditorPaste\}/,
    'Expected pasted clipboard images to use the same inline upload flow'
  );
});

test('CMS forms keep saving reachable and block incomplete image uploads', () => {
  for (const [label, source] of [
    ['new post form', newPostPage],
    ['edit post form', editPostPage],
  ]) {
    assert.match(
      source,
      /onBusyChange=\{setEditorBusy\}/,
      `Expected ${label} to receive image processing state`
    );
    assert.match(
      source,
      /disabled=\{saving \|\| editorBusy\}/,
      `Expected ${label} not to save temporary local preview URLs`
    );
    assert.match(
      source,
      /className="admin-editor-actions/,
      `Expected ${label} to keep its save controls in a dedicated sticky action surface`
    );
    assert.match(
      source,
      /formRef\.current\?\.requestSubmit\(\)/,
      `Expected ${label} to support the Cmd/Ctrl+S shortcut`
    );
  }
});
