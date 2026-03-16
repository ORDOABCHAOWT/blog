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
          border: 1px solid #e0e0e0;
          border-radius: 0.5rem;
          transition: all 0.2s ease-in-out;
        }
        .markdown-editor .EasyMDEContainer:hover,
        .markdown-editor .EasyMDEContainer.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        .markdown-editor .CodeMirror {
          min-height: 400px;
          font-size: 16px;
          line-height: 1.8;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          letter-spacing: 0.2px;
          padding: 20px;
          background-color: #ffffff;
          color: #212121;
        }
        .markdown-editor .CodeMirror-scroll {
          min-height: 400px;
          padding: 8px 0;
        }
        .markdown-editor .CodeMirror-line {
          padding: 2px 0;
        }
        .markdown-editor .CodeMirror pre.CodeMirror-line {
          line-height: 1.8;
          letter-spacing: 0.2px;
        }
        .markdown-editor .editor-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #e0e0e0;
          background: #f9f9f9;
        }
        .markdown-editor .CodeMirror-cursor {
          border-left: 2px solid #3b82f6;
        }
        .markdown-editor .cm-header {
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .markdown-editor .CodeMirror-placeholder {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
          color: #9e9e9e;
          font-style: italic;
        }
      `}</style>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
