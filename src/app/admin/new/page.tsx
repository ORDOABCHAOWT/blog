'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MarkdownEditor, { MarkdownEditorRef } from '@/components/MarkdownEditor';
import ImageUploader from '@/components/ImageUploader';

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
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleImageUpload = (markdown: string) => {
    // 在光标位置插入图片链接
    if (editorRef.current) {
      editorRef.current.insertAtCursor(markdown);
    }
  };

  return (
    <div className="admin-container p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 admin-text-primary">写新文章</h1>
          <Link href="/admin" className="text-sm admin-link">
            ← 返回管理后台
          </Link>
        </div>

        {error && (
          <div className="admin-alert admin-alert-error mb-6 p-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-card p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 admin-text-primary">文章标题 *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="admin-input w-full px-4 py-2"
                placeholder="输入文章标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 admin-text-primary">文章别名（Slug）*</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="admin-input w-full px-4 py-2"
                placeholder="article-slug"
              />
              <p className="text-xs admin-text-secondary mt-1">用于URL，只能包含字母、数字和连字符</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 admin-text-primary">发布日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="admin-input w-full px-4 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 admin-text-primary">文章描述</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="admin-input w-full px-4 py-2"
                placeholder="简短描述文章内容"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 admin-text-primary">图片上传</label>
            <ImageUploader onUploadSuccess={handleImageUpload} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 admin-text-primary">文章内容 *</label>
            <MarkdownEditor
              ref={editorRef}
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin"
              className="admin-button admin-button-secondary px-6 py-2.5"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={`admin-button px-6 py-2.5 ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'admin-button-primary'
              }`}
            >
              {saving ? '保存中...' : '保存文章'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
