'use client';

import { useRef, useImperativeHandle, forwardRef } from 'react';
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
    const editorRef = useRef<{ codemirror?: { getDoc: () => { getCursor: () => { line: number; ch: number }; replaceRange: (text: string, cursor: { line: number; ch: number }) => void; setCursor: (cursor: { line: number; ch: number }) => void }; focus: () => void } } | null>(null);

    useImperativeHandle(ref, () => ({
      insertAtCursor: (text: string) => {
        // 尝试使用 CodeMirror 插入
        try {
          if (editorRef.current?.codemirror) {
            const cm = editorRef.current.codemirror;
            const doc = cm.getDoc();
            const cursor = doc.getCursor();
            doc.replaceRange(text, cursor);
            const lines = text.split('\n');
            const lastLine = lines[lines.length - 1];
            const newCursor = lines.length > 1
              ? { line: cursor.line + lines.length - 1, ch: lastLine.length }
              : { line: cursor.line, ch: cursor.ch + text.length };
            doc.setCursor(newCursor);
            cm.focus();
            return;
          }
        } catch {
          // 忽略错误，使用备用方案
        }

        // 备用方案：直接添加到末尾
        onChange(value + '\n\n' + text + '\n\n');
      },
    }), [value, onChange]);

    return (
      <div className="markdown-editor">
        <SimpleMDE
          ref={editorRef}
          value={value}
          onChange={onChange}
          options={{
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
        }}
      />
      <style jsx global>{`
        .markdown-editor .EasyMDEContainer {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
        }
        .markdown-editor .CodeMirror {
          min-height: 400px;
          font-size: 16px;
          line-height: 2;
          font-family: 'LXGW WenKai', 'Songti SC', 'Noto Serif SC', 'Source Han Serif SC',
                       'STSong', 'SimSun', 'Georgia', 'Times New Roman', serif;
          letter-spacing: 0.5px;
          padding: 16px;
        }
        .markdown-editor .CodeMirror-scroll {
          min-height: 400px;
          padding: 8px 0;
        }
        .markdown-editor .CodeMirror-line {
          padding: 2px 0;
        }
        .markdown-editor .CodeMirror pre.CodeMirror-line {
          line-height: 2;
          letter-spacing: 0.5px;
        }
        .markdown-editor .editor-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #e5e7eb;
          background: #fafafa;
        }
        .markdown-editor .CodeMirror-cursor {
          border-left: 2px solid #4a5568;
        }
        .markdown-editor .cm-header {
          font-weight: 600;
          letter-spacing: 1px;
        }
        .markdown-editor .CodeMirror-placeholder {
          font-family: 'LXGW WenKai', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
          color: #a0aec0;
          font-style: italic;
        }
      `}</style>
      </div>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
