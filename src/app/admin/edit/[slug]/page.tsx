'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MarkdownEditor, { MarkdownEditorRef } from '@/components/MarkdownEditor';
import ImageUploader from '@/components/ImageUploader';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const editorRef = useRef<MarkdownEditorRef>(null);

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    date: '',
    description: '',
    content: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (formData.title) {
      document.title = `编辑：${formData.title} | 博客管理后台`;
    }
  }, [formData.title]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/posts/${slug}`);
      if (res.ok) {
        const data = await res.json();
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
    } catch (err) {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          newSlug: formData.slug !== slug ? formData.slug : undefined,
        }),
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

  const handleImageUpload = (markdown: string) => {
    // 在光标位置插入图片链接
    if (editorRef.current) {
      editorRef.current.insertAtCursor(markdown);
    }
  };

  const handleContentChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
  }, []);

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

        <form onSubmit={handleSubmit} className="admin-card p-8 space-y-7">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-2">文章标题 *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="admin-input w-full px-4 py-2.5"
                placeholder="article-slug"
              />
              <p className="admin-text-secondary mt-2" style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>
                用于 URL，修改后会重命名文件
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
              {saving ? '保存中…' : '保存更改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
