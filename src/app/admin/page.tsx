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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">博客管理后台</h1>
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              ← 返回首页
            </Link>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/new"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ✏️ 写新文章
            </Link>
            <button
              onClick={handleDeploy}
              disabled={deploying}
              className={`px-6 py-2 rounded-lg transition ${
                deploying
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {deploying ? '发布中...' : '🚀 一键发布'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-4 font-semibold">标题</th>
                <th className="text-left p-4 font-semibold">日期</th>
                <th className="text-left p-4 font-semibold">描述</th>
                <th className="text-center p-4 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-gray-400">
                    暂无文章
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.slug} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{post.title}</td>
                    <td className="p-4 text-gray-600 text-sm">{post.date}</td>
                    <td className="p-4 text-gray-600 text-sm truncate max-w-xs">
                      {post.description}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <Link
                          href={`/admin/edit/${post.slug}`}
                          className="px-4 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="px-4 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition"
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
