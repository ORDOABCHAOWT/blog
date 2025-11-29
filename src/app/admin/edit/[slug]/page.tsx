'use client';

import { useState, useEffect, useRef } from 'react';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin" className="text-blue-600 hover:underline">
            返回管理后台
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">编辑文章</h1>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">
            ← 返回管理后台
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">文章标题 *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入文章标题"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">文章别名（Slug）*</label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="article-slug"
              />
              <p className="text-xs text-gray-500 mt-1">用于URL，修改后会重命名文件</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">发布日期</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">文章描述</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="简短描述文章内容"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">图片上传</label>
            <ImageUploader onUploadSuccess={handleImageUpload} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">文章内容 *</label>
            <MarkdownEditor
              ref={editorRef}
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/admin"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 rounded-lg transition ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saving ? '保存中...' : '保存更改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
