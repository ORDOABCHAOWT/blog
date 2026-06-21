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
import { uploadImageFile } from '@/lib/client-image-upload';
import 'easymde/dist/easymde.min.css';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
  ssr: false,
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface MarkdownEditorRef {
  insertAtCursor: (text: string) => void;
}

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

type EditorPosition = {
  line: number;
  ch: number;
};

type FloatingPosition = {
  top: number;
  left: number;
};

type CodeMirrorDoc = {
  getCursor: (start?: string) => EditorPosition;
  getSelection: () => string;
  replaceSelection: (text: string) => void;
  replaceRange: (text: string, from: EditorPosition, to?: EditorPosition) => void;
  getLine: (line: number) => string;
  setCursor: (cursor: EditorPosition) => void;
};

type CodeMirrorInstance = {
  getDoc: () => CodeMirrorDoc;
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

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ value, onChange }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<EasyMdeInstance | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editorReadyTick, setEditorReadyTick] = useState(0);
    const [lineActionPosition, setLineActionPosition] =
      useState<FloatingPosition | null>(null);
    const [selectionToolbarPosition, setSelectionToolbarPosition] =
      useState<FloatingPosition | null>(null);
    const [lineMenuOpen, setLineMenuOpen] = useState(false);
    const [editorFocused, setEditorFocused] = useState(false);
    const [inlineUploading, setInlineUploading] = useState(false);

    const getMdeInstance = useCallback((instance: EasyMdeInstance) => {
      instanceRef.current = instance;
      setEditorReadyTick((tick) => tick + 1);
    }, []);

    const updateFloatingControls = useCallback(() => {
      const cm = instanceRef.current?.codemirror;
      const root = rootRef.current;
      if (!cm || !root) return;

      const doc = cm.getDoc();
      const rootRect = root.getBoundingClientRect();
      const wrapperRect = cm.getWrapperElement().getBoundingClientRect();
      const cursor = doc.getCursor();
      const cursorCoords = cm.cursorCoords(cursor, 'page');
      const selection = doc.getSelection();

      setLineActionPosition({
        top: cursorCoords.top - rootRect.top + 2,
        left: wrapperRect.left - rootRect.left - 38,
      });

      if (selection) {
        const start = doc.getCursor('start');
        const selectionCoords = cm.charCoords(start, 'page');
        setSelectionToolbarPosition({
          top: selectionCoords.top - rootRect.top - 42,
          left: Math.max(8, selectionCoords.left - rootRect.left),
        });
      } else {
        setSelectionToolbarPosition(null);
      }
    }, []);

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
      };
    }, [editorReadyTick, updateFloatingControls]);

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

    const handleInlineImageSelect = useCallback(async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
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
    }, [insertAtCursor]);

    const handleRootBlur = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;
      if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
        return;
      }

      setEditorFocused(false);
      setLineMenuOpen(false);
      setSelectionToolbarPosition(null);
    }, []);

    useImperativeHandle(ref, () => ({
      insertAtCursor,
    }), [insertAtCursor]);

    const editorOptions = useMemo(() => ({
      spellChecker: false,
      placeholder: '在这里输入文章内容（支持Markdown）...',
      autofocus: false,
      status: ['lines', 'words', 'cursor'],
      toolbar: [
        'bold',
        'italic',
        'heading',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        'image',
        '|',
        'preview',
        'side-by-side',
        'fullscreen',
        '|',
        'guide',
      ],
      inputStyle: 'textarea' as const,
      lineWrapping: true,
    }), []);

    return (
      <div
        ref={rootRef}
        className="markdown-editor markdown-editor-with-following-tools"
        onBlur={handleRootBlur}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInlineImageSelect}
        />

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
        .markdown-following-plus:disabled {
          cursor: wait;
          opacity: 0.62;
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
        .markdown-editor .EasyMDEContainer {
          border: 1px solid var(--site-border);
          border-radius: 12px;
          background: var(--site-panel-strong);
          transition: border-color 220ms ease, box-shadow 220ms ease;
        }
        .markdown-editor .EasyMDEContainer:hover,
        .markdown-editor .EasyMDEContainer.active {
          border-color: var(--site-accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--site-accent) 18%, transparent);
        }
        .markdown-editor .CodeMirror {
          min-height: 420px;
          font-size: 16px;
          line-height: 1.85;
          font-family: var(--font-editorial-display);
          letter-spacing: var(--tracking-body);
          padding: 22px;
          background: transparent;
          color: var(--site-ink);
          border: none;
          border-radius: 0 0 12px 12px;
        }
        .markdown-editor .CodeMirror-scroll {
          min-height: 420px;
          padding: 8px 0;
        }
        .markdown-editor .CodeMirror-line {
          padding: 2px 0;
        }
        .markdown-editor .CodeMirror pre.CodeMirror-line {
          line-height: 1.85;
          letter-spacing: var(--tracking-body);
        }
        .markdown-editor .editor-toolbar {
          border: none;
          border-bottom: 1px solid var(--site-border);
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          background: var(--site-panel);
          padding: 0.4rem 0.5rem;
        }
        .markdown-editor .editor-toolbar button {
          color: var(--site-muted) !important;
          border-radius: 6px;
        }
        .markdown-editor .editor-toolbar button:hover,
        .markdown-editor .editor-toolbar button.active {
          background: rgba(46, 39, 31, 0.06);
          border-color: transparent;
          color: var(--site-ink) !important;
        }
        @media (prefers-color-scheme: dark) {
          .markdown-editor .editor-toolbar button:hover,
          .markdown-editor .editor-toolbar button.active {
            background: rgba(233, 226, 214, 0.08);
          }
        }
        .markdown-editor .editor-toolbar i.separator {
          border-left: 1px solid var(--site-border);
          border-right: none;
        }
        .markdown-editor .editor-statusbar {
          color: var(--site-muted);
          font-family: var(--font-editorial-mono), monospace;
          font-size: 0.72rem;
          letter-spacing: var(--tracking-meta);
          padding: 6px 12px;
        }
        .markdown-editor .CodeMirror-cursor {
          border-left: 2px solid var(--site-accent);
        }
        .markdown-editor .cm-header {
          font-family: var(--font-editorial-display);
          font-weight: 500;
          letter-spacing: var(--tracking-heading);
          color: var(--site-ink);
        }
        .markdown-editor .cm-link,
        .markdown-editor .cm-url {
          color: var(--site-accent);
        }
        .markdown-editor .cm-quote,
        .markdown-editor .cm-em {
          color: var(--site-muted);
          font-style: italic;
        }
        .markdown-editor .CodeMirror-placeholder {
          font-family: var(--font-editorial-display);
          color: var(--site-muted);
          font-style: italic;
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
      `}</style>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
