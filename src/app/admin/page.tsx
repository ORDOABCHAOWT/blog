'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
}

type AdminNotice = {
  message: string;
  tone: 'neutral' | 'success' | 'error';
};

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [notice, setNotice] = useState<AdminNotice | null>(null);

  useEffect(() => {
    document.title = '博客管理后台 | Taffy CMS';
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setNotice({ message: '文章列表加载失败', tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotice({ message: '文章已删除', tone: 'success' });
        fetchPosts();
      } else {
        setNotice({ message: '删除失败，请重试', tone: 'error' });
      }
    } catch (error) {
      setNotice({ message: '删除失败，请重试', tone: 'error' });
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setNotice(null);

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        setNotice({
          message: data.message,
          tone: data.unchanged ? 'neutral' : 'success',
        });
      } else {
        setNotice({
          message: data.message || data.error || '发布失败',
          tone: 'error',
        });
      }
    } catch (error) {
      setNotice({ message: '发布失败，请检查网络连接', tone: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container flex items-center justify-center">
        <p className="admin-text-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="admin-container px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
          <div>
            <p className="eyebrow">Editorial · CMS</p>
            <h1 className="mb-3" style={{ fontSize: 'clamp(2.2rem, 3.6vw, 2.9rem)', margin: 0 }}>
              博客管理后台
            </h1>
            <Link href="/" className="admin-link">
              ← 返回首页
            </Link>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/analytics"
              className="admin-button admin-button-secondary px-6 py-2.5"
            >
              流量统计
            </Link>
            <Link
              href="/admin/new"
              className="admin-button admin-button-primary px-6 py-2.5"
            >
              写新文章
            </Link>
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className="admin-button admin-button-success px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deploying ? '发布中…' : '一键发布'}
            </button>
          </div>
        </div>

        {notice && (
          <div
            className={`admin-status admin-status-${notice.tone} mb-8`}
            role={notice.tone === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            <span className="admin-status-dot" aria-hidden="true" />
            <span>{notice.message}</span>
          </div>
        )}

        <div className="admin-table">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left px-5 py-4">标题</th>
                <th className="text-left px-5 py-4">日期</th>
                <th className="text-left px-5 py-4">描述</th>
                <th className="text-right px-5 py-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center px-5 py-10 admin-text-secondary italic">
                    暂无文章
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.slug}>
                    <td className="px-5 py-4 admin-text-primary" style={{ fontSize: '1.02rem' }}>
                      {post.title}
                    </td>
                    <td className="px-5 py-4 admin-text-secondary" style={{ fontFamily: 'var(--font-editorial-mono), monospace', fontSize: '0.82rem', letterSpacing: 'var(--tracking-meta)', whiteSpace: 'nowrap' }}>
                      {post.date}
                    </td>
                    <td className="px-5 py-4 admin-text-secondary truncate max-w-xs" style={{ fontSize: '0.92rem' }}>
                      {post.description}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/edit/${post.slug}`}
                          className="admin-button admin-button-secondary px-4 py-1.5"
                          style={{ fontSize: '0.7rem' }}
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="admin-button admin-button-danger px-4 py-1.5"
                          style={{ fontSize: '0.7rem' }}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
