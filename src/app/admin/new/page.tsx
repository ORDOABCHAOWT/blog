'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MarkdownEditor, { MarkdownEditorRef } from '@/components/MarkdownEditor';
import ImageUploader from '@/components/ImageUploader';
import { toSafePostSlug } from '@/lib/slug';

export default function NewPostPage() {
  const router = useRouter();
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    content: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = '写新文章 | 博客管理后台';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        slug: toSafePostSlug(formData.slug || formData.title, formData.date),
      };

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin');
      } else {
        setError(data.error || '保存失败');
      }
    } catch (err) {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 自动生成 slug
    if (field === 'title' && !formData.slug) {
      const slug = toSafePostSlug(value, formData.date);
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageUpload = (markdown: string) => {
    // 在光标位置插入图片链接
    if (editorRef.current) {
      editorRef.current.insertAtCursor(markdown);
    }
  };

  const handleContentChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
  }, []);

  return (
    <div className="admin-container px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="eyebrow">Editorial · CMS / New entry</p>
          <h1 className="mb-3" style={{ fontSize: 'clamp(2.2rem, 3.6vw, 2.9rem)', margin: 0 }}>
            写新文章
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

        <form onSubmit={handleSubmit} className="admin-card p-8 space-y-7">
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
                onChange={(e) => setFormData({ ...formData, slug: toSafePostSlug(e.target.value, formData.date) })}
                className="admin-input w-full px-4 py-2.5"
                placeholder="article-slug"
              />
              <p className="admin-text-secondary mt-2" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>
                用于 URL，只能包含字母、数字、连字符和下划线
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">发布日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="admin-input w-full px-4 py-2.5"
              />
            </div>

            <div>
              <label className="block mb-2">文章描述</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="admin-input w-full px-4 py-2.5"
                placeholder="简短描述文章内容"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2">图片上传</label>
            <ImageUploader onUploadSuccess={handleImageUpload} />
          </div>

          <div>
            <label className="block mb-2">文章内容 *</label>
            <MarkdownEditor
              ref={editorRef}
              value={formData.content}
              onChange={handleContentChange}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/admin"
              className="admin-button admin-button-secondary px-6 py-2.5"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="admin-button admin-button-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中…' : '保存文章'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
