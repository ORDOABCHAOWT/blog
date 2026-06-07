'use client';

import { useRef, useImperativeHandle, forwardRef, useState, useCallback, memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
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

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ value, onChange }, ref) => {
    const instanceRef = useRef<any>(null);

    const getMdeInstance = useCallback((instance: any) => {
      instanceRef.current = instance;
    }, []);

    useImperativeHandle(ref, () => ({
      insertAtCursor: (text: string) => {
        if (instanceRef.current?.codemirror) {
          const cm = instanceRef.current.codemirror;
          const doc = cm.getDoc();
          const cursor = doc.getCursor();

          // 在当前光标位置插入，前后各加一个换行
          const textToInsert = '\n' + text + '\n';
          doc.replaceRange(textToInsert, cursor);

          // 移动光标到插入内容之后
          const lines = textToInsert.split('\n');
          const newCursor = {
            line: cursor.line + lines.length - 1,
            ch: lines[lines.length - 1].length
          };
          doc.setCursor(newCursor);
          cm.focus();
        } else {
          // 备用方案：获取当前编辑器内容并追加
          const currentValue = instanceRef.current?.codemirror?.getValue() || '';
          onChange(currentValue + '\n' + text + '\n');
        }
      },
    }), [onChange]);

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
      <div className="markdown-editor">
        <SimpleMDE
          value={value}
          onChange={onChange}
          getMdeInstance={getMdeInstance}
          options={editorOptions}
        />
      <style jsx global>{`
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
      `}</style>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
