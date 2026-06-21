# CMS Following Editor Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SSPAI-inspired Markdown editor controls that follow the active writing position for formatting and image insertion.

**Architecture:** Keep EasyMDE/CodeMirror as the Markdown editing engine. Extract the existing browser-side image upload/compression path into a shared client utility, then add a lightweight floating command layer inside `MarkdownEditor` that tracks CodeMirror cursor and selection geometry.

**Tech Stack:** Next.js App Router, React client components, EasyMDE/CodeMirror 5, existing `/api/upload` route, Node source-level regression tests.

---

## File Structure

- Create `src/lib/client-image-upload.ts`: browser-only image compression and `/api/upload` helper shared by the drop zone and inline editor image command.
- Modify `src/components/ImageUploader.tsx`: keep the existing drop zone UI but delegate upload/compression to `uploadImageFile`.
- Modify `src/components/MarkdownEditor.tsx`: add floating line `+` menu, selection toolbar, Markdown command handlers, hidden image file input, and CodeMirror position tracking.
- Create `tests/editor-following-tools-regression.test.mjs`: source-level regression tests for the following toolbar, inline image upload reuse, and supported Markdown commands.
- Modify `tests/image-upload-compression-regression.test.mjs`: point compression/upload assertions at the extracted helper while keeping drop-zone reuse assertions.

---

### Task 1: Lock Expected Editor Behavior With Failing Tests

**Files:**
- Create: `tests/editor-following-tools-regression.test.mjs`
- Modify: `tests/image-upload-compression-regression.test.mjs`

- [ ] **Step 1: Write the failing following-tools regression test**

Create `tests/editor-following-tools-regression.test.mjs`:

```js
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
```

- [ ] **Step 2: Update the image compression regression test to target the helper**

In `tests/image-upload-compression-regression.test.mjs`, change the setup to read both files:

```js
const imageUploader = fs.readFileSync(
  new URL('../src/components/ImageUploader.tsx', import.meta.url),
  'utf8'
);
const uploadHelper = fs.readFileSync(
  new URL('../src/lib/client-image-upload.ts', import.meta.url),
  'utf8'
);
const uploadRoute = fs.readFileSync(
  new URL('../src/app/api/upload/route.ts', import.meta.url),
  'utf8'
);
```

Change compression assertions that currently inspect `imageUploader` to inspect `uploadHelper`:

```js
assert.match(uploadHelper, /MAX_IMAGE_UPLOAD_DIMENSION\s*=\s*1600/);
assert.match(uploadHelper, /IMAGE_UPLOAD_MIME_TYPE\s*=\s*'image\/webp'/);
assert.match(uploadHelper, /async function compressImageForUpload\(file: File\)/);
assert.match(uploadHelper, /canvas\.toBlob/);
```

Keep a drop-zone reuse assertion:

```js
assert.match(
  imageUploader,
  /uploadImageFile\(file\)/,
  'Expected the drop zone to delegate compression and upload to the shared helper'
);
```

- [ ] **Step 3: Run tests and verify they fail for the right reason**

Run:

```bash
node --test tests/editor-following-tools-regression.test.mjs tests/image-upload-compression-regression.test.mjs
```

Expected: FAIL because `src/lib/client-image-upload.ts`, following controls, and helper imports do not exist yet.

---

### Task 2: Extract Shared Client Image Upload Helper

**Files:**
- Create: `src/lib/client-image-upload.ts`
- Modify: `src/components/ImageUploader.tsx`
- Test: `tests/image-upload-compression-regression.test.mjs`

- [ ] **Step 1: Create the shared helper**

Create `src/lib/client-image-upload.ts`:

```ts
export const MAX_IMAGE_UPLOAD_DIMENSION = 1600;
export const IMAGE_UPLOAD_QUALITY = 0.78;
export const IMAGE_UPLOAD_MIME_TYPE = 'image/webp';

function getCompressedFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return `${baseName}.webp`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image decode failed'));
    };
    image.src = objectUrl;
  });
}

function encodeCanvas(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

export async function compressImageForUpload(file: File) {
  if (file.type === 'image/gif') {
    return file;
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return file;
  }

  const image = await loadImage(file);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);
  const scale =
    longestEdge > MAX_IMAGE_UPLOAD_DIMENSION
      ? MAX_IMAGE_UPLOAD_DIMENSION / longestEdge
      : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return file;

  context.drawImage(image, 0, 0, width, height);

  const blob = await encodeCanvas(
    canvas,
    IMAGE_UPLOAD_MIME_TYPE,
    IMAGE_UPLOAD_QUALITY
  );

  if (!blob || blob.size >= file.size) {
    return file;
  }

  return new File([blob], getCompressedFileName(file.name), {
    type: IMAGE_UPLOAD_MIME_TYPE,
    lastModified: Date.now(),
  });
}

export async function uploadImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件！');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('图片大小不能超过 10MB！');
  }

  const uploadFile = await compressImageForUpload(file);
  const formData = new FormData();
  formData.append('file', uploadFile);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || '未知错误');
  }

  return {
    markdown: data.markdown as string,
    url: data.url as string | undefined,
  };
}
```

- [ ] **Step 2: Modify `ImageUploader` to use the helper**

In `src/components/ImageUploader.tsx`, add:

```ts
import { uploadImageFile } from '@/lib/client-image-upload';
```

Remove local definitions of:

- `MAX_IMAGE_UPLOAD_DIMENSION`
- `IMAGE_UPLOAD_QUALITY`
- `IMAGE_UPLOAD_MIME_TYPE`
- `getCompressedFileName`
- `loadImage`
- `encodeCanvas`
- `compressImageForUpload`

Replace the body of `handleUpload` with:

```ts
const handleUpload = async (file: File) => {
  if (!file) return;

  setUploading(true);

  try {
    const data = await uploadImageFile(file);
    onUploadSuccess(data.markdown);
    alert('✅ 图片上传成功！');
  } catch (error) {
    alert(`上传失败: ${error instanceof Error ? error.message : '请重试'}`);
  } finally {
    setUploading(false);
  }
};
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
node --test tests/image-upload-compression-regression.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add src/lib/client-image-upload.ts src/components/ImageUploader.tsx tests/image-upload-compression-regression.test.mjs
git commit -m "refactor: share cms image upload helper"
```

---

### Task 3: Add Floating Markdown Commands To `MarkdownEditor`

**Files:**
- Modify: `src/components/MarkdownEditor.tsx`
- Test: `tests/editor-following-tools-regression.test.mjs`

- [ ] **Step 1: Add local types and command state**

In `src/components/MarkdownEditor.tsx`, add:

```ts
import { uploadImageFile } from '@/lib/client-image-upload';

type MarkdownCommand =
  | 'bold'
  | 'italic'
  | 'link'
  | 'heading-2'
  | 'heading-3'
  | 'quote'
  | 'bulleted-list'
  | 'numbered-list'
  | 'divider'
  | 'code-block';

type FloatingPosition = {
  top: number;
  left: number;
};

type CodeMirrorDoc = {
  getCursor: (start?: string) => { line: number; ch: number };
  getSelection: () => string;
  replaceSelection: (text: string) => void;
  replaceRange: (text: string, from: { line: number; ch: number }, to?: { line: number; ch: number }) => void;
  getLine: (line: number) => string;
  setCursor: (cursor: { line: number; ch: number }) => void;
};

type CodeMirrorInstance = {
  getDoc: () => CodeMirrorDoc;
  cursorCoords: (where?: unknown, mode?: 'local' | 'page' | 'window') => { top: number; left: number; bottom: number };
  charCoords: (pos: { line: number; ch: number }, mode?: 'local' | 'page' | 'window') => { top: number; left: number; bottom: number };
  focus: () => void;
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
  getWrapperElement: () => HTMLElement;
};

type EasyMdeInstance = {
  codemirror?: CodeMirrorInstance;
};
```

Inside the component add:

```ts
const instanceRef = useRef<EasyMdeInstance | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);
const menuRef = useRef<HTMLDivElement>(null);
const [lineActionPosition, setLineActionPosition] = useState<FloatingPosition | null>(null);
const [selectionToolbarPosition, setSelectionToolbarPosition] = useState<FloatingPosition | null>(null);
const [lineMenuOpen, setLineMenuOpen] = useState(false);
const [inlineUploading, setInlineUploading] = useState(false);
```

Replace `useRef<any>` and `getMdeInstance(instance: any)` with typed versions:

```ts
const getMdeInstance = useCallback((instance: EasyMdeInstance) => {
  instanceRef.current = instance;
}, []);
```

- [ ] **Step 2: Add CodeMirror geometry tracking**

Add this callback inside `MarkdownEditor`:

```ts
const updateFloatingControls = useCallback(() => {
  const cm = instanceRef.current?.codemirror;
  if (!cm) return;

  const doc = cm.getDoc();
  const wrapper = cm.getWrapperElement();
  const wrapperRect = wrapper.getBoundingClientRect();
  const cursor = doc.getCursor();
  const cursorCoords = cm.cursorCoords(cursor, 'page');
  const selection = doc.getSelection();

  setLineActionPosition({
    top: cursorCoords.top - wrapperRect.top + 2,
    left: -36,
  });

  if (selection) {
    const start = doc.getCursor('start');
    const selectionCoords = cm.charCoords(start, 'page');
    setSelectionToolbarPosition({
      top: selectionCoords.top - wrapperRect.top - 42,
      left: Math.max(8, selectionCoords.left - wrapperRect.left),
    });
  } else {
    setSelectionToolbarPosition(null);
  }
}, []);
```

Attach CodeMirror events after the instance is available:

```ts
useEffect(() => {
  const cm = instanceRef.current?.codemirror;
  if (!cm) return;

  const update = () => updateFloatingControls();
  cm.on('cursorActivity', update);
  cm.on('scroll', update);
  window.addEventListener('resize', update);
  update();

  return () => {
    cm.off('cursorActivity', update);
    cm.off('scroll', update);
    window.removeEventListener('resize', update);
  };
}, [updateFloatingControls]);
```

- [ ] **Step 3: Add Markdown command helpers**

Add these functions inside the component:

```ts
const insertAtCursor = useCallback((text: string) => {
  const cm = instanceRef.current?.codemirror;
  if (!cm) {
    onChange(`${value}\n${text}\n`);
    return;
  }

  const doc = cm.getDoc();
  const cursor = doc.getCursor();
  const textToInsert = `\n${text}\n`;
  doc.replaceRange(textToInsert, cursor);
  const lines = textToInsert.split('\n');
  doc.setCursor({
    line: cursor.line + lines.length - 1,
    ch: lines[lines.length - 1].length,
  });
  cm.focus();
  updateFloatingControls();
}, [onChange, updateFloatingControls, value]);

const replaceCurrentLine = useCallback((transform: (line: string) => string) => {
  const cm = instanceRef.current?.codemirror;
  if (!cm) return;

  const doc = cm.getDoc();
  const cursor = doc.getCursor();
  const currentLine = doc.getLine(cursor.line);
  const nextLine = transform(currentLine);
  doc.replaceRange(nextLine, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: currentLine.length });
  doc.setCursor({ line: cursor.line, ch: nextLine.length });
  cm.focus();
  updateFloatingControls();
}, [updateFloatingControls]);

const applyMarkdownCommand = useCallback((command: MarkdownCommand) => {
  const cm = instanceRef.current?.codemirror;
  if (!cm) return;

  const doc = cm.getDoc();
  const selection = doc.getSelection();

  if (command === 'bold') {
    doc.replaceSelection(selection ? `**${selection}**` : '**粗体文字**');
  } else if (command === 'italic') {
    doc.replaceSelection(selection ? `*${selection}*` : '*斜体文字*');
  } else if (command === 'link') {
    doc.replaceSelection(selection ? `[${selection}](https://)` : '[链接文字](https://)');
  } else if (command === 'heading-2') {
    replaceCurrentLine((line) => `## ${line.replace(/^#{1,6}\s*/, '')}`);
  } else if (command === 'heading-3') {
    replaceCurrentLine((line) => `### ${line.replace(/^#{1,6}\s*/, '')}`);
  } else if (command === 'quote') {
    replaceCurrentLine((line) => line.startsWith('> ') ? line : `> ${line}`);
  } else if (command === 'bulleted-list') {
    replaceCurrentLine((line) => line.startsWith('- ') ? line : `- ${line}`);
  } else if (command === 'numbered-list') {
    replaceCurrentLine((line) => /^\d+\.\s/.test(line) ? line : `1. ${line}`);
  } else if (command === 'divider') {
    insertAtCursor('---');
  } else if (command === 'code-block') {
    doc.replaceSelection(selection ? `\`\`\`\n${selection}\n\`\`\`` : '```\n\n```');
  }

  setLineMenuOpen(false);
  cm.focus();
  updateFloatingControls();
}, [insertAtCursor, replaceCurrentLine, updateFloatingControls]);
```

Update `useImperativeHandle` to call the shared `insertAtCursor` callback:

```ts
useImperativeHandle(ref, () => ({
  insertAtCursor,
}), [insertAtCursor]);
```

- [ ] **Step 4: Add inline image upload handler**

Add:

```ts
const handleInlineImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  setInlineUploading(true);
  setLineMenuOpen(false);

  try {
    const data = await uploadImageFile(file);
    insertAtCursor(data.markdown);
  } catch (error) {
    alert(`上传失败: ${error instanceof Error ? error.message : '请重试'}`);
  } finally {
    setInlineUploading(false);
  }
};
```

- [ ] **Step 5: Render following controls**

Inside the `.markdown-editor` wrapper before `<SimpleMDE />`, render:

```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleInlineImageSelect}
/>
{lineActionPosition && (
  <div
    className="markdown-following-line-action"
    style={{ top: lineActionPosition.top, left: lineActionPosition.left }}
  >
    <button
      type="button"
      className="markdown-following-plus"
      aria-label="打开插入菜单"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => setLineMenuOpen((open) => !open)}
      disabled={inlineUploading}
    >
      {inlineUploading ? '…' : '+'}
    </button>
    {lineMenuOpen && (
      <div ref={menuRef} className="markdown-line-command-menu">
        <button type="button" data-command="image" onMouseDown={(event) => event.preventDefault()} onClick={() => fileInputRef.current?.click()}>图片</button>
        <button type="button" data-command="heading-2" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('heading-2')}>H2</button>
        <button type="button" data-command="heading-3" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('heading-3')}>H3</button>
        <button type="button" data-command="quote" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('quote')}>引用</button>
        <button type="button" data-command="bulleted-list" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('bulleted-list')}>列表</button>
        <button type="button" data-command="numbered-list" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('numbered-list')}>数字列表</button>
        <button type="button" data-command="divider" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('divider')}>分割线</button>
        <button type="button" data-command="code-block" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('code-block')}>代码块</button>
      </div>
    )}
  </div>
)}
{selectionToolbarPosition && (
  <div
    className="markdown-selection-toolbar"
    style={{ top: selectionToolbarPosition.top, left: selectionToolbarPosition.left }}
    onMouseDown={(event) => event.preventDefault()}
  >
    <button type="button" data-command="bold" onClick={() => applyMarkdownCommand('bold')}>B</button>
    <button type="button" data-command="italic" onClick={() => applyMarkdownCommand('italic')}>I</button>
    <button type="button" data-command="link" onClick={() => applyMarkdownCommand('link')}>Link</button>
    <button type="button" data-command="heading-2" onClick={() => applyMarkdownCommand('heading-2')}>H2</button>
    <button type="button" data-command="heading-3" onClick={() => applyMarkdownCommand('heading-3')}>H3</button>
    <button type="button" data-command="quote" onClick={() => applyMarkdownCommand('quote')}>Quote</button>
  </div>
)}
```

Ensure the wrapper is positioned:

```tsx
<div className="markdown-editor markdown-editor-with-following-tools">
```

- [ ] **Step 6: Add styling for floating controls**

Inside the existing global style block in `MarkdownEditor.tsx`, add:

```css
.markdown-editor-with-following-tools {
  position: relative;
}
.markdown-following-line-action {
  position: absolute;
  z-index: 12;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.markdown-following-plus,
.markdown-selection-toolbar button,
.markdown-line-command-menu button {
  border: 1px solid var(--site-border);
  background: var(--site-panel-strong);
  color: var(--site-ink);
  cursor: pointer;
}
.markdown-following-plus {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-family: var(--font-editorial-mono), monospace;
}
.markdown-line-command-menu,
.markdown-selection-toolbar {
  border: 1px solid var(--site-border);
  border-radius: 10px;
  background: var(--site-panel-strong);
  box-shadow: 0 18px 50px rgba(31, 28, 24, 0.14);
}
.markdown-line-command-menu {
  display: grid;
  min-width: 132px;
  padding: 6px;
}
.markdown-line-command-menu button {
  border: none;
  border-radius: 7px;
  padding: 8px 10px;
  text-align: left;
  font-family: var(--font-editorial-display);
}
.markdown-selection-toolbar {
  position: absolute;
  z-index: 13;
  display: flex;
  gap: 4px;
  padding: 5px;
}
.markdown-selection-toolbar button {
  min-width: 30px;
  height: 28px;
  border-radius: 7px;
  font-family: var(--font-editorial-mono), monospace;
  font-size: 0.72rem;
}
.markdown-line-command-menu button:hover,
.markdown-selection-toolbar button:hover,
.markdown-following-plus:hover {
  border-color: var(--site-accent);
  background: color-mix(in srgb, var(--site-accent) 10%, var(--site-panel-strong));
}
@media (max-width: 720px) {
  .markdown-following-line-action {
    left: 8px !important;
  }
  .markdown-selection-toolbar {
    left: 8px !important;
    max-width: calc(100% - 16px);
    flex-wrap: wrap;
  }
}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
node --test tests/editor-following-tools-regression.test.mjs tests/image-upload-compression-regression.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/components/MarkdownEditor.tsx tests/editor-following-tools-regression.test.mjs
git commit -m "feat: add following cms editor tools"
```

---

### Task 4: Browser Verify The Writing Flow

**Files:**
- No code changes expected.

- [ ] **Step 1: Start or reuse the dev server**

Run:

```bash
npm run dev
```

Expected: Next reports a local URL such as `http://127.0.0.1:3000` or another available port.

- [ ] **Step 2: Verify `/admin/new` visually**

Open the local `/admin/new` route in the browser.

Check:

- The page renders without console errors tied to this change.
- Focusing the Markdown body shows the `+` beside the active line.
- Clicking different lines moves the `+`.
- Scrolling inside the editor keeps the `+` attached to the active line.
- Selecting text shows the selection toolbar near the selected text.

- [ ] **Step 3: Verify Markdown commands without saving a post**

In the body editor, use temporary text only and do not submit the form.

Check these command outputs in the editor content:

- H2 turns the current line into `## <text>`.
- H3 turns the current line into `### <text>`.
- Quote turns the current line into `> <text>`.
- Bulleted list turns the current line into `- <text>`.
- Numbered list turns the current line into `1. <text>`.
- Divider inserts `---`.
- Code block inserts fenced backticks.
- Bold and italic wrap the selected text.
- Link wraps selected text as `[text](https://)`.

- [ ] **Step 4: Verify image command does not force top scrolling**

Open the `+` menu from a lower editor line and click `图片`.

Expected:

- The file picker opens from the nearby menu.
- If a test image is selected, the existing upload path returns Markdown and inserts it at the current cursor position.
- No form submit occurs.
- No `posts/*.md` file changes during verification.

- [ ] **Step 5: Run final gate**

Run:

```bash
npm run check
```

Expected: PASS.

If additional diagnostics are run:

```bash
npm run typecheck
npm run lint
npm test
```

Expected: Existing baseline issues may remain; do not fix unrelated baseline debt in this task.

- [ ] **Step 6: Commit verification-only adjustments if any**

If browser verification reveals small styling or positioning adjustments, apply them, rerun focused tests and `npm run check`, then commit:

```bash
git add src/components/MarkdownEditor.tsx tests/editor-following-tools-regression.test.mjs tests/image-upload-compression-regression.test.mjs
git commit -m "fix: polish cms following editor controls"
```

---

## Self-Review

Spec coverage:

- Current-line `+` button: Task 3.
- Selection formatting toolbar: Task 3.
- Inline image insertion using existing upload behavior: Tasks 2 and 3.
- Keep Markdown source format: Task 3 commands operate on Markdown text in CodeMirror.
- Responsive behavior: Task 3 CSS includes narrow layout handling.
- Tests and browser verification: Tasks 1 and 4.

Placeholder scan:

- Every implementation step includes concrete file paths, commands, and code.

Type consistency:

- `uploadImageFile` is introduced in Task 2 and imported by both `ImageUploader` and `MarkdownEditor`.
- `MarkdownCommand` command names match `data-command` attributes used by the regression test.
- CodeMirror helper types are local to `MarkdownEditor` and match the methods used by the plan.
