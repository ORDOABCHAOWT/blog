'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MarkdownEditor from '@/components/MarkdownEditor';
import { toSafePostSlug } from '@/lib/slug';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const formRef = useRef<HTMLFormElement>(null);
  const contentRef = useRef('');

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    date: '',
    description: '',
    content: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorBusy, setEditorBusy] = useState(false);
  const [error, setError] = useState('');

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${slug}`);
      if (res.ok) {
        const data = await res.json();
        contentRef.current = data.content;
        setFormData({
          slug: data.slug,
          title: data.title,
          date: data.date,
          description: data.description || '',
          content: data.content,
        });
      } else {
        setError('文章不存在');
      }
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    if (formData.title) {
      document.title = `编辑：${formData.title} | 博客管理后台`;
    }
  }, [formData.title]);

  useEffect(() => {
    const handleSaveShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 's' ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      if (!saving && !editorBusy) {
        formRef.current?.requestSubmit();
      }
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [editorBusy, saving]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editorBusy) {
      setError('图片仍在上传，请稍候再保存');
      return;
    }

    setSaving(true);
    setError('');
    const normalizedSlug = toSafePostSlug(
      formData.slug || formData.title,
      formData.date
    );

    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: contentRef.current,
          newSlug: normalizedSlug !== slug ? normalizedSlug : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
      } else {
        setError(data.error || '保存失败');
      }
    } catch {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setError('');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSlugBlur = () => {
    setFormData((prev) => ({
      ...prev,
      slug: toSafePostSlug(prev.slug || prev.title, prev.date),
    }));
  };

  const handleContentChange = useCallback((value: string) => {
    contentRef.current = value;
    setError('');
  }, []);

  const slugPreview = toSafePostSlug(
    formData.slug || formData.title,
    formData.date
  );

  if (loading) {
    return (
      <div className="admin-container flex items-center justify-center">
        <p className="admin-text-secondary">加载中...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="admin-container flex items-center justify-center">
        <div className="text-center">
          <p className="admin-alert admin-alert-error inline-block px-6 py-3 mb-4">{error}</p>
          <br />
          <Link href="/admin" className="admin-link">
            返回管理后台
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="eyebrow">Editorial · CMS / Edit entry</p>
          <h1 className="mb-3" style={{ fontSize: 'clamp(2.2rem, 3.6vw, 2.9rem)', margin: 0 }}>
            编辑文章
          </h1>
          <Link href="/admin" className="admin-link">
            ← 返回管理后台
          </Link>
        </div>

        {error && (
          <div className="admin-alert admin-alert-error mb-8 px-5 py-4">
            {error}
          </div>
        )}

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="admin-card p-8 space-y-7"
          aria-busy={saving || editorBusy}
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">文章标题 *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="admin-input w-full px-4 py-2.5"
                placeholder="输入文章标题"
              />
            </div>

            <div>
              <label className="block mb-2">文章别名 · Slug *</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                onBlur={handleSlugBlur}
                className="admin-input w-full px-4 py-2.5"
                placeholder="article-slug"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
              />
              <p className="admin-field-hint admin-text-secondary mt-2">
                输入时保持原样；保存时会安全整理并重命名文件
                <span className="admin-slug-preview">
                  /posts/{slugPreview || 'article-slug'}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">发布日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="admin-input w-full px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block mb-2">文章描述</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="admin-input w-full px-4 py-2.5"
                placeholder="简短描述文章内容"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2">文章内容 *</label>
            <MarkdownEditor
              value={formData.content}
              onChange={handleContentChange}
              onBusyChange={setEditorBusy}
            />
          </div>

          <div className="admin-editor-actions flex justify-between items-center gap-3 pt-2">
            <p className="admin-editor-shortcut">
              {editorBusy ? '正在处理图片，完成后即可保存' : '⌘S 快速保存'}
            </p>
            <div className="flex justify-end gap-3">
              <Link
                href="/admin"
                className="admin-button admin-button-secondary px-6 py-2.5"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={saving || editorBusy}
                className="admin-button admin-button-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中…' : editorBusy ? '图片上传中…' : '保存更改'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
