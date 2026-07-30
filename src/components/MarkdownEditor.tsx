'use client';

import {
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import dynamic from 'next/dynamic';
import type EasyMDE from 'easymde';
import { uploadImageFile } from '@/lib/client-image-upload';
import 'easymde/dist/easymde.min.css';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBusyChange?: (busy: boolean) => void;
}

export interface MarkdownEditorRef {
  insertAtCursor: (text: string) => void;
}

type MarkdownCommand =
  | 'paragraph'
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

type EditorPosition = {
  line: number;
  ch: number;
};

type FloatingPosition = {
  top: number;
  left: number;
};

type EditorNotice = {
  tone: 'progress' | 'success' | 'error';
  message: string;
};

const LINE_ACTION_SIZE = 28;
const LINE_ACTION_GAP = 10;

type CodeMirrorDoc = {
  getCursor: (start?: string) => EditorPosition;
  getSelection: () => string;
  replaceSelection: (text: string) => void;
  replaceRange: (text: string, from: EditorPosition, to?: EditorPosition) => void;
  getLine: (line: number) => string;
  lineCount: () => number;
  setCursor: (cursor: EditorPosition) => void;
};

type CodeMirrorInstance = {
  getDoc: () => CodeMirrorDoc;
  coordsChar: (
    coords: { left: number; top: number },
    mode?: 'local' | 'page' | 'window'
  ) => EditorPosition;
  cursorCoords: (
    where?: EditorPosition,
    mode?: 'local' | 'page' | 'window'
  ) => { top: number; left: number; bottom: number };
  charCoords: (
    pos: EditorPosition,
    mode?: 'local' | 'page' | 'window'
  ) => { top: number; left: number; bottom: number };
  focus: () => void;
  on: (event: string, callback: () => void) => void;
  off: (event: string, callback: () => void) => void;
  getWrapperElement: () => HTMLElement;
};

type EasyMdeInstance = {
  codemirror?: CodeMirrorInstance;
};

const positionsEqual = (
  first: FloatingPosition | null,
  second: FloatingPosition | null
) => first?.top === second?.top && first?.left === second?.left;

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ value, onChange, onBusyChange }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<EasyMdeInstance | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const floatingUpdateFrameRef = useRef<number | null>(null);
    const noticeTimerRef = useRef<number | null>(null);
    const retainedObjectUrlsRef = useRef(new Set<string>());
    const lastLineActionPositionRef = useRef<FloatingPosition | null>(null);
    const lastSelectionToolbarPositionRef = useRef<FloatingPosition | null>(null);
    const [editorReadyTick, setEditorReadyTick] = useState(0);
    const [lineActionPosition, setLineActionPosition] =
      useState<FloatingPosition | null>(null);
    const [selectionToolbarPosition, setSelectionToolbarPosition] =
      useState<FloatingPosition | null>(null);
    const [lineMenuOpen, setLineMenuOpen] = useState(false);
    const [editorFocused, setEditorFocused] = useState(false);
    const [inlineUploading, setInlineUploading] = useState(false);
    const [dragUploadActive, setDragUploadActive] = useState(false);
    const [editorNotice, setEditorNotice] = useState<EditorNotice | null>(null);

    const showEditorNotice = useCallback((
      notice: EditorNotice,
      clearAfter?: number
    ) => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = null;
      }

      setEditorNotice(notice);
      if (clearAfter) {
        noticeTimerRef.current = window.setTimeout(() => {
          setEditorNotice(null);
          noticeTimerRef.current = null;
        }, clearAfter);
      }
    }, []);

    useEffect(() => {
      onBusyChange?.(inlineUploading);
    }, [inlineUploading, onBusyChange]);

    useEffect(() => {
      const retainedObjectUrls = retainedObjectUrlsRef.current;

      return () => {
        onBusyChange?.(false);
        if (noticeTimerRef.current !== null) {
          window.clearTimeout(noticeTimerRef.current);
        }
        retainedObjectUrls.forEach((url) => {
          URL.revokeObjectURL(url);
        });
      };
    }, [onBusyChange]);

    const getMdeInstance = useCallback((instance: EasyMdeInstance) => {
      instanceRef.current = instance;
      setEditorReadyTick((tick) => tick + 1);
    }, []);

    const measureFloatingControls = useCallback(() => {
      const cm = instanceRef.current?.codemirror;
      const root = rootRef.current;
      if (!cm || !root) return;

      const doc = cm.getDoc();
      const rootRect = root.getBoundingClientRect();
      const cursor = doc.getCursor();
      const cursorCoords = cm.cursorCoords(cursor, 'window');
      const lineStartCoords = cm.charCoords(
        { line: cursor.line, ch: 0 },
        'window'
      );
      const selection = doc.getSelection();

      const nextLineActionPosition = {
        top: Math.round(
          cursorCoords.top -
            rootRect.top +
            (cursorCoords.bottom - cursorCoords.top - LINE_ACTION_SIZE) / 2
        ),
        left: Math.round(
          lineStartCoords.left -
            rootRect.left -
            LINE_ACTION_SIZE -
            LINE_ACTION_GAP
        ),
      };

      if (!positionsEqual(lastLineActionPositionRef.current, nextLineActionPosition)) {
        lastLineActionPositionRef.current = nextLineActionPosition;
        setLineActionPosition(nextLineActionPosition);
      }

      if (selection) {
        const start = doc.getCursor('start');
        const selectionCoords = cm.charCoords(start, 'window');
        const nextSelectionToolbarPosition = {
          top: Math.round(selectionCoords.top - rootRect.top - 42),
          left: Math.round(Math.max(8, selectionCoords.left - rootRect.left)),
        };

        if (!positionsEqual(lastSelectionToolbarPositionRef.current, nextSelectionToolbarPosition)) {
          lastSelectionToolbarPositionRef.current = nextSelectionToolbarPosition;
          setSelectionToolbarPosition(nextSelectionToolbarPosition);
        }
      } else {
        if (lastSelectionToolbarPositionRef.current !== null) {
          lastSelectionToolbarPositionRef.current = null;
          setSelectionToolbarPosition(null);
        }
      }
    }, []);

    const updateFloatingControls = useCallback(() => {
      if (floatingUpdateFrameRef.current !== null) return;

      floatingUpdateFrameRef.current = window.requestAnimationFrame(() => {
        floatingUpdateFrameRef.current = null;
        measureFloatingControls();
      });
    }, [measureFloatingControls]);

    useEffect(() => {
      const cm = instanceRef.current?.codemirror;
      if (!cm) return;

      const update = () => updateFloatingControls();
      const markFocused = () => {
        setEditorFocused(true);
        update();
      };

      cm.on('cursorActivity', update);
      cm.on('scroll', update);
      cm.on('focus', markFocused);
      window.addEventListener('resize', update);
      update();

      return () => {
        cm.off('cursorActivity', update);
        cm.off('scroll', update);
        cm.off('focus', markFocused);
        window.removeEventListener('resize', update);
        if (floatingUpdateFrameRef.current !== null) {
          window.cancelAnimationFrame(floatingUpdateFrameRef.current);
          floatingUpdateFrameRef.current = null;
        }
      };
    }, [editorReadyTick, updateFloatingControls]);

    useEffect(() => {
      if (!lineMenuOpen) return;

      const handleDocumentPointerDown = (event: PointerEvent) => {
        const target = event.target;
        const root = rootRef.current;
        if (!(target instanceof Node) || !root) return;

        const menu = root.querySelector('.markdown-line-command-menu');
        const plus = root.querySelector('.markdown-following-plus');
        if (menu?.contains(target) || plus?.contains(target)) return;

        setLineMenuOpen(false);
      };

      document.addEventListener('pointerdown', handleDocumentPointerDown);
      return () => {
        document.removeEventListener('pointerdown', handleDocumentPointerDown);
      };
    }, [lineMenuOpen]);

    const insertAtPosition = useCallback((text: string, position?: EditorPosition) => {
      const cm = instanceRef.current?.codemirror;
      if (!cm) {
        onChange(`${value}\n${text}\n`);
        return;
      }

      const doc = cm.getDoc();
      const cursor = position ?? doc.getCursor();
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

    const insertAtCursor = useCallback((text: string) => {
      insertAtPosition(text);
    }, [insertAtPosition]);

    const replaceEditorSnippet = useCallback((
      snippet: string,
      replacement: string
    ) => {
      const cm = instanceRef.current?.codemirror;
      if (!cm) return false;

      const doc = cm.getDoc();
      for (let line = 0; line < doc.lineCount(); line += 1) {
        const lineText = doc.getLine(line);
        const start = lineText.indexOf(snippet);
        if (start === -1) continue;

        doc.replaceRange(
          replacement,
          { line, ch: start },
          { line, ch: start + snippet.length }
        );
        doc.setCursor({ line, ch: start + replacement.length });
        cm.focus();
        updateFloatingControls();
        return true;
      }

      return false;
    }, [updateFloatingControls]);

    const uploadAndInsertImage = useCallback(async (
      file: File,
      position?: EditorPosition
    ) => {
      if (inlineUploading) {
        showEditorNotice({
          tone: 'progress',
          message: '上一张图片仍在处理，请稍候',
        });
        return;
      }

      setInlineUploading(true);
      setLineMenuOpen(false);
      const previewUrl = URL.createObjectURL(file);
      const safeAlt = file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[\[\]()]/g, ' ')
        .trim() || '图片';
      const previewMarkdown = `![${safeAlt}](${previewUrl})`;

      insertAtPosition(previewMarkdown, position);
      showEditorNotice({
        tone: 'progress',
        message: `正在压缩并上传 ${file.name}`,
      });

      try {
        const data = await uploadImageFile(file);
        const replaced = replaceEditorSnippet(
          previewMarkdown,
          data.markdown
        );

        if (replaced) {
          retainedObjectUrlsRef.current.add(previewUrl);
          showEditorNotice({
            tone: 'success',
            message: '图片已插入正文',
          }, 2400);
        } else {
          URL.revokeObjectURL(previewUrl);
          showEditorNotice({
            tone: 'success',
            message: '图片已上传；预览位置已被你移除',
          }, 3200);
        }
      } catch (error) {
        replaceEditorSnippet(previewMarkdown, '');
        URL.revokeObjectURL(previewUrl);
        showEditorNotice({
          tone: 'error',
          message: `上传失败：${error instanceof Error ? error.message : '请重试'}`,
        });
      } finally {
        setInlineUploading(false);
        setDragUploadActive(false);
      }
    }, [
      inlineUploading,
      insertAtPosition,
      replaceEditorSnippet,
      showEditorNotice,
    ]);

    const replaceCurrentLine = useCallback((
      transform: (line: string) => string
    ) => {
      const cm = instanceRef.current?.codemirror;
      if (!cm) return;

      const doc = cm.getDoc();
      const cursor = doc.getCursor();
      const currentLine = doc.getLine(cursor.line);
      const nextLine = transform(currentLine);
      doc.replaceRange(
        nextLine,
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: currentLine.length }
      );
      doc.setCursor({ line: cursor.line, ch: nextLine.length });
      cm.focus();
      updateFloatingControls();
    }, [updateFloatingControls]);

    const normalizeParagraphLine = useCallback((line: string) => {
      return line
        .replace(/^#{1,6}\s*/, '')
        .replace(/^>\s?/, '')
        .replace(/^(\s*)([-*+]|\d+\.)\s+/, '$1');
    }, []);

    const applyMarkdownCommand = useCallback((command: MarkdownCommand) => {
      const cm = instanceRef.current?.codemirror;
      if (!cm) return;

      const doc = cm.getDoc();
      const selection = doc.getSelection();

      if (command === 'paragraph') {
        replaceCurrentLine(normalizeParagraphLine);
      } else if (command === 'bold') {
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
    }, [insertAtCursor, normalizeParagraphLine, replaceCurrentLine, updateFloatingControls]);

    const handleInlineImageSelect = useCallback(async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      await uploadAndInsertImage(file);
    }, [uploadAndInsertImage]);

    const getImageFiles = useCallback((dataTransfer: DataTransfer) => {
      return Array.from(dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
    }, []);

    const hasImageDrag = useCallback((dataTransfer: DataTransfer) => {
      if (dataTransfer.files.length > 0) {
        return getImageFiles(dataTransfer).length > 0;
      }

      return Array.from(dataTransfer.items).some((item) =>
        item.kind === 'file' && item.type.startsWith('image/')
      );
    }, [getImageFiles]);

    const handleEditorDragEnter = useCallback((
      event: React.DragEvent<HTMLDivElement>
    ) => {
      if (!hasImageDrag(event.dataTransfer)) return;

      event.preventDefault();
      setDragUploadActive(true);
    }, [hasImageDrag]);

    const handleEditorDragOver = useCallback((
      event: React.DragEvent<HTMLDivElement>
    ) => {
      if (!hasImageDrag(event.dataTransfer)) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setDragUploadActive(true);
    }, [hasImageDrag]);

    const handleEditorDragLeave = useCallback((
      event: React.DragEvent<HTMLDivElement>
    ) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
        return;
      }

      setDragUploadActive(false);
    }, []);

    const handleEditorDrop = useCallback(async (
      event: React.DragEvent<HTMLDivElement>
    ) => {
      const files = getImageFiles(event.dataTransfer);
      if (files.length === 0) return;

      event.preventDefault();
      event.stopPropagation();
      setDragUploadActive(false);

      const cm = instanceRef.current?.codemirror;
      const dropPosition = cm?.coordsChar(
        { left: event.clientX, top: event.clientY },
        'window'
      );
      if (dropPosition && cm) {
        cm.getDoc().setCursor(dropPosition);
        updateFloatingControls();
      }

      await uploadAndInsertImage(files[0], dropPosition);
    }, [getImageFiles, updateFloatingControls, uploadAndInsertImage]);

    const handleEditorPaste = useCallback(async (
      event: React.ClipboardEvent<HTMLDivElement>
    ) => {
      const files = getImageFiles(event.clipboardData);
      if (files.length === 0) return;

      event.preventDefault();
      const cm = instanceRef.current?.codemirror;
      const cursor = cm?.getDoc().getCursor();
      await uploadAndInsertImage(files[0], cursor);
    }, [getImageFiles, uploadAndInsertImage]);

    const handleEditorBlankMouseDown = useCallback((
      event: React.MouseEvent<HTMLDivElement>
    ) => {
      const cm = instanceRef.current?.codemirror;
      if (!cm || event.button !== 0) return;
      if ((event.target as Element).closest('.markdown-following-line-action, .markdown-selection-toolbar')) {
        return;
      }

      setEditorFocused(true);
      updateFloatingControls();

      const doc = cm.getDoc();
      const lastLine = doc.lineCount() - 1;
      const lastLineText = doc.getLine(lastLine);
      const lastLineEnd = cm.cursorCoords(
        { line: lastLine, ch: lastLineText.length },
        'window'
      );
      if (event.clientY <= lastLineEnd.bottom + 6) return;

      const wrapperLine = cm.getWrapperElement().querySelector('.CodeMirror-line');
      const lineHeight = wrapperLine?.getBoundingClientRect().height || 30;
      const linesToAdd = Math.max(
        1,
        Math.floor((event.clientY - lastLineEnd.bottom) / lineHeight) + 1
      );

      event.preventDefault();
      doc.replaceRange('\n'.repeat(linesToAdd), {
        line: lastLine,
        ch: lastLineText.length,
      });
      doc.setCursor({ line: lastLine + linesToAdd, ch: 0 });
      cm.focus();
      updateFloatingControls();
    }, [updateFloatingControls]);

    const handleRootBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
        return;
      }

      setEditorFocused(false);
      setLineMenuOpen(false);
      lastSelectionToolbarPositionRef.current = null;
      setSelectionToolbarPosition(null);
    }, []);

    useImperativeHandle(ref, () => ({
      insertAtCursor,
    }), [insertAtCursor]);

    const editorOptions = useMemo<EasyMDE.Options>(() => ({
      spellChecker: false,
      placeholder: '在这里输入文章内容（支持Markdown）...',
      autofocus: false,
      status: ['lines', 'words', 'cursor'],
      toolbar: false,
      inputStyle: 'textarea' as const,
      lineWrapping: true,
      previewImagesInEditor: true,
    }), []);

    return (
      <div
        ref={rootRef}
        className={`markdown-editor markdown-editor-with-following-tools${dragUploadActive ? ' is-drag-upload-active' : ''}`}
        onBlur={handleRootBlur}
        onDragEnter={handleEditorDragEnter}
        onDragOver={handleEditorDragOver}
        onDragLeave={handleEditorDragLeave}
        onDrop={handleEditorDrop}
        onPaste={handleEditorPaste}
        onMouseDown={handleEditorBlankMouseDown}
        aria-busy={inlineUploading}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInlineImageSelect}
        />

        <div className="markdown-editor-meta">
          <p className="markdown-editor-help">
            使用行首 <kbd>+</kbd> 添加格式，也可拖入或粘贴图片
          </p>
          {editorNotice && (
            <p
              className={`markdown-editor-notice is-${editorNotice.tone}`}
              role={editorNotice.tone === 'error' ? 'alert' : 'status'}
              aria-live="polite"
            >
              {editorNotice.tone === 'progress' && (
                <span className="markdown-editor-notice-spinner" aria-hidden="true" />
              )}
              {editorNotice.message}
            </p>
          )}
        </div>

        {editorFocused && lineActionPosition && (
          <div
            className="markdown-following-line-action"
            style={{
              top: lineActionPosition.top,
              left: lineActionPosition.left,
            }}
          >
            <button
              type="button"
              className="markdown-following-plus"
              aria-label="打开插入菜单"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setLineMenuOpen((open) => !open)}
              disabled={inlineUploading}
            >
              {inlineUploading ? '...' : '+'}
            </button>

            {lineMenuOpen && (
              <div className="markdown-line-command-menu">
                <button type="button" data-command="paragraph" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('paragraph')}>正文</button>
                <button type="button" data-command="bold" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('bold')}>加粗</button>
                <button type="button" data-command="italic" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('italic')}>斜体</button>
                <button type="button" data-command="link" onMouseDown={(event) => event.preventDefault()} onClick={() => applyMarkdownCommand('link')}>链接</button>
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

        {editorFocused && selectionToolbarPosition && (
          <div
            className="markdown-selection-toolbar"
            style={{
              top: selectionToolbarPosition.top,
              left: selectionToolbarPosition.left,
            }}
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

        <SimpleMDE
          value={value}
          onChange={onChange}
          getMdeInstance={getMdeInstance}
          options={editorOptions}
        />
      <style jsx global>{`
        .markdown-editor-with-following-tools {
          position: relative;
        }
        .markdown-editor-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 30px;
          margin-bottom: 8px;
          padding: 0 2px;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-size: 0.72rem;
          letter-spacing: -0.004em;
        }
        .markdown-editor-help {
          margin: 0;
          color: var(--site-muted);
        }
        .markdown-editor-help kbd {
          display: inline-grid;
          min-width: 20px;
          height: 20px;
          place-items: center;
          margin: 0 2px;
          padding: 0 5px;
          border: 1px solid color-mix(in srgb, var(--site-border) 88%, transparent);
          border-radius: 5px;
          background: var(--site-panel-strong);
          color: var(--site-ink);
          box-shadow: 0 1px 1px color-mix(in srgb, var(--site-shadow) 50%, transparent);
          font: inherit;
        }
        .markdown-editor-notice {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin: 0;
          color: var(--site-muted);
          font-weight: 550;
          text-align: right;
        }
        .markdown-editor-notice.is-success {
          color: #187a35;
        }
        .markdown-editor-notice.is-error {
          color: #b42318;
        }
        .markdown-editor-notice-spinner {
          width: 12px;
          height: 12px;
          border: 1.5px solid color-mix(in srgb, #0071e3 24%, transparent);
          border-top-color: #0071e3;
          border-radius: 50%;
          animation: markdown-editor-spin 720ms linear infinite;
        }
        @keyframes markdown-editor-spin {
          to { transform: rotate(360deg); }
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
          border: 1px solid transparent;
          background: transparent;
          color: var(--site-ink);
          cursor: pointer;
        }
        .markdown-following-plus {
          position: relative;
          display: grid;
          place-items: center;
          flex: 0 0 28px;
          width: 28px;
          height: 28px;
          padding: 0;
          appearance: none;
          border-radius: 999px;
          border-color: color-mix(in srgb, var(--site-border) 72%, transparent);
          background: color-mix(in srgb, var(--site-panel-strong) 76%, transparent);
          color: #0071e3;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-size: 1rem;
          font-weight: 500;
          line-height: 1;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.7) inset,
            0 8px 24px color-mix(in srgb, var(--site-shadow) 64%, transparent);
          backdrop-filter: blur(18px) saturate(145%);
          -webkit-backdrop-filter: blur(18px) saturate(145%);
          transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
            background-color 160ms ease, border-color 160ms ease;
        }
        .markdown-following-plus:not(:disabled) {
          font-size: 0;
        }
        .markdown-following-plus:not(:disabled)::before,
        .markdown-following-plus:not(:disabled)::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 1.5px;
          border-radius: 999px;
          background: currentColor;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .markdown-following-plus:not(:disabled)::after {
          transform: translate(-50%, -50%) rotate(90deg);
        }
        .markdown-following-plus:disabled {
          cursor: wait;
          opacity: 0.62;
        }
        .markdown-line-command-menu,
        .markdown-selection-toolbar {
          border: 1px solid color-mix(in srgb, var(--site-border) 76%, transparent);
          border-radius: 16px;
          background: color-mix(in srgb, var(--site-panel-strong) 82%, transparent);
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.72) inset,
            0 22px 64px color-mix(in srgb, var(--site-shadow) 86%, transparent);
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
        }
        .markdown-line-command-menu {
          display: grid;
          grid-template-columns: repeat(2, minmax(92px, 1fr));
          gap: 4px;
          min-width: 224px;
          padding: 7px;
        }
        .markdown-line-command-menu button {
          border-radius: 9px;
          padding: 8px 10px;
          text-align: left;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: -0.008em;
        }
        .markdown-selection-toolbar {
          position: absolute;
          z-index: 13;
          display: flex;
          gap: 4px;
          padding: 6px;
        }
        .markdown-selection-toolbar button {
          min-width: 30px;
          height: 28px;
          border-radius: 8px;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
        }
        .markdown-line-command-menu button:hover,
        .markdown-selection-toolbar button:hover,
        .markdown-following-plus:hover {
          background: color-mix(in srgb, #0071e3 9%, var(--site-panel-strong));
          border-color: color-mix(in srgb, #0071e3 14%, transparent);
          transform: translateY(-1px);
        }
        .markdown-editor .EasyMDEContainer {
          overflow: hidden;
          border: 1px solid color-mix(in srgb, var(--site-border) 88%, transparent);
          border-radius: 16px;
          background: color-mix(
            in srgb,
            var(--site-panel-strong) 94%,
            var(--site-background)
          );
          box-shadow:
            0 1px 2px color-mix(in srgb, var(--site-shadow) 45%, transparent) inset,
            0 1px 0 rgba(255, 255, 255, 0.68);
          transition: border-color 160ms ease, box-shadow 160ms ease,
            background-color 160ms ease;
        }
        .markdown-editor .EasyMDEContainer:hover {
          border-color: color-mix(in srgb, var(--site-border) 100%, var(--site-ink) 10%);
        }
        .markdown-editor .EasyMDEContainer:focus-within,
        .markdown-editor .EasyMDEContainer.active {
          border-color: #0071e3;
          box-shadow:
            0 0 0 3px color-mix(in srgb, #0071e3 20%, transparent),
            0 1px 2px color-mix(in srgb, var(--site-shadow) 42%, transparent) inset;
        }
        .markdown-editor .CodeMirror {
          position: relative;
          min-height: 420px;
          font-size: 15px;
          line-height: 1.8;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          letter-spacing: -0.006em;
          padding: 24px 26px 24px 48px;
          background: transparent;
          color: var(--site-ink);
          border: none;
          border-radius: 0;
        }
        .markdown-editor .CodeMirror-scroll {
          min-height: 420px;
          padding: 8px 0;
        }
        .markdown-editor .CodeMirror-line {
          padding: 2px 0;
        }
        .markdown-editor .CodeMirror-line:has(.cm-image-marker) {
          overflow: hidden;
          min-height: 160px;
          margin: 10px 0 14px;
          border: 1px solid color-mix(in srgb, var(--site-border) 78%, transparent);
          border-radius: 12px;
          background: color-mix(
            in srgb,
            var(--site-background-soft) 72%,
            var(--site-panel-strong)
          );
          color: transparent;
          font-size: 0;
          line-height: 0;
          box-shadow: 0 8px 24px color-mix(in srgb, var(--site-shadow) 36%, transparent);
        }
        .markdown-editor .CodeMirror-line:has(.cm-image-marker):not(:has([data-img-src])) {
          display: grid;
          place-items: center;
          background:
            linear-gradient(
              100deg,
              transparent 20%,
              color-mix(in srgb, var(--site-panel-strong) 72%, transparent) 42%,
              transparent 64%
            ),
            color-mix(in srgb, var(--site-background-soft) 72%, var(--site-panel-strong));
          background-size: 240% 100%;
          animation: markdown-image-loading 1.4s ease-in-out infinite;
        }
        .markdown-editor .CodeMirror-line:has(.cm-image-marker):not(:has([data-img-src]))::after {
          content: '正在准备图片预览…';
          color: var(--site-muted);
          font-size: 0.76rem;
          line-height: 1.4;
        }
        .markdown-editor span[data-img-src] {
          display: block;
          width: 100%;
          overflow: hidden;
          border-radius: 11px;
          background-color: var(--site-background-soft);
          color: transparent;
          font-size: 0;
          line-height: 0;
        }
        .markdown-editor span[data-img-src]::after {
          width: 100%;
          max-width: 100%;
          background-position: center;
        }
        @keyframes markdown-image-loading {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
        .markdown-editor .CodeMirror pre.CodeMirror-line {
          line-height: 1.8;
          letter-spacing: -0.006em;
        }
        .markdown-editor .editor-toolbar {
          border: none;
          border-radius: 0;
          background: transparent;
          padding: 0 0 0.55rem;
        }
        .markdown-editor .editor-toolbar button {
          color: var(--site-muted) !important;
          border-radius: 8px;
        }
        .markdown-editor .editor-toolbar button:hover,
        .markdown-editor .editor-toolbar button.active {
          background: color-mix(in srgb, #0071e3 8%, var(--site-panel-strong));
          border-color: transparent;
          color: var(--site-ink) !important;
        }
        .markdown-editor .editor-toolbar i.separator {
          border-left: 1px solid color-mix(in srgb, var(--site-border) 55%, transparent);
          border-right: none;
        }
        .markdown-editor .editor-statusbar {
          border-top: 1px solid color-mix(in srgb, var(--site-border) 62%, transparent);
          color: var(--site-muted);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-size: 0.68rem;
          letter-spacing: -0.002em;
          padding: 7px 12px;
        }
        .markdown-editor .CodeMirror-cursor {
          border-left: 2px solid #0071e3;
        }
        .markdown-editor .cm-header {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-weight: 650;
          letter-spacing: -0.025em;
          color: var(--site-ink);
        }
        .markdown-editor .cm-link,
        .markdown-editor .cm-url {
          color: #0071e3;
        }
        .markdown-editor .cm-quote,
        .markdown-editor .cm-em {
          color: var(--site-muted);
          font-style: italic;
        }
        .markdown-editor .CodeMirror-placeholder {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          color: color-mix(in srgb, var(--site-muted) 72%, transparent);
          font-style: normal;
        }
        .markdown-editor.is-drag-upload-active .CodeMirror {
          background:
            linear-gradient(
              135deg,
              color-mix(in srgb, #0071e3 7%, transparent),
              transparent 48%
            );
        }
        .markdown-editor.is-drag-upload-active .CodeMirror::after {
          content: '释放图片即可上传到当前位置';
          position: absolute;
          right: 18px;
          bottom: 14px;
          color: var(--site-muted);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
            var(--font-noto-sans-sc), "PingFang SC", sans-serif;
          font-size: 0.7rem;
          letter-spacing: -0.002em;
          pointer-events: none;
        }
        @media (prefers-color-scheme: dark) {
          .markdown-following-plus,
          .markdown-line-command-menu,
          .markdown-selection-toolbar {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.1) inset,
              0 22px 64px rgba(0, 0, 0, 0.28);
          }
          .markdown-following-plus,
          .markdown-editor .cm-link,
          .markdown-editor .cm-url {
            color: #2997ff;
          }
          .markdown-editor .EasyMDEContainer {
            box-shadow:
              0 1px 2px rgba(0, 0, 0, 0.24) inset,
              0 1px 0 rgba(255, 255, 255, 0.06);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .markdown-following-plus,
          .markdown-line-command-menu button,
          .markdown-selection-toolbar button,
          .markdown-editor .EasyMDEContainer {
            transition-duration: 0.01ms;
          }
          .markdown-editor-notice-spinner,
          .markdown-editor .CodeMirror-line:has(.cm-image-marker):not(:has([data-img-src])) {
            animation-duration: 0.01ms;
          }
          .markdown-line-command-menu button:hover,
          .markdown-selection-toolbar button:hover,
          .markdown-following-plus:hover {
            transform: none;
          }
        }
        @media (max-width: 720px) {
          .markdown-following-line-action {
            left: 8px !important;
          }
          .markdown-line-command-menu {
            grid-template-columns: 1fr;
            min-width: 148px;
          }
          .markdown-selection-toolbar {
            left: 8px !important;
            max-width: calc(100% - 16px);
            flex-wrap: wrap;
          }
          .markdown-editor-meta {
            align-items: flex-start;
            flex-direction: column;
            min-height: 0;
          }
          .markdown-editor-notice {
            text-align: left;
          }
        }
      `}</style>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
