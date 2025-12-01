'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState('');

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
      setMessage('获取文章列表失败');
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
        setMessage('文章删除成功！');
        fetchPosts();
      } else {
        setMessage('删除失败');
      }
    } catch (error) {
      setMessage('删除失败');
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setMessage('');

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.success) {
        setMessage('✅ ' + data.message);
      } else {
        setMessage('❌ ' + (data.message || data.error));
      }
    } catch (error) {
      setMessage('❌ 发布失败，请检查网络连接');
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
    <div className="admin-container p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 admin-text-primary">博客管理后台</h1>
            <Link href="/" className="text-sm admin-link">
              ← 返回首页
            </Link>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/new"
              className="admin-button admin-button-primary px-6 py-2.5"
            >
              ✏️ 写新文章
            </Link>
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className={`admin-button px-6 py-2.5 ${
                deploying
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'admin-button-success'
              }`}
            >
              {deploying ? '发布中...' : '🚀 一键发布'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`admin-alert mb-6 p-4 ${
            message.includes('✅') ? 'admin-alert-success' : 'admin-alert-error'
          }`}>
            {message}
          </div>
        )}

        <div className="admin-card admin-table overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4 font-semibold admin-text-primary">标题</th>
                <th className="text-left p-4 font-semibold admin-text-primary">日期</th>
                <th className="text-left p-4 font-semibold admin-text-primary">描述</th>
                <th className="text-center p-4 font-semibold admin-text-primary">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 admin-text-secondary">
                    暂无文章
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.slug}>
                    <td className="p-4 font-medium admin-text-primary">{post.title}</td>
                    <td className="p-4 admin-text-secondary text-sm">{post.date}</td>
                    <td className="p-4 admin-text-secondary text-sm truncate max-w-xs">
                      {post.description}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/admin/edit/${post.slug}`}
                          className="admin-button admin-button-primary px-4 py-1.5 text-sm"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="admin-button admin-button-danger px-4 py-1.5 text-sm"
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
