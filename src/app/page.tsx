import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Image from 'next/image';

// 获取所有文章元数据
function getPosts() {
  const postsDir = path.join(process.cwd(), 'posts');
  const files = fs.readdirSync(postsDir);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);
      return {
        slug: file.replace(/\.md$/, ''),
        title: data.title || file,
        date: data.date || '',
        description: data.description || '',
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export default function Home() {
  const posts = getPosts();
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <Image
        src="/avatar.png"
        alt="头像"
        width={120}
        height={120}
        className="rounded-full mb-6 shadow-lg object-cover"
        priority
      />
      <h1 className="text-3xl font-bold mb-2">你的名字</h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">这里写一小段你的个人简介，介绍你自己或你的兴趣。</p>
      <h2 className="text-xl font-semibold mb-4 mt-8">Thoughts</h2>
      <div className="w-full max-w-xl flex flex-col gap-4">
        {posts.length === 0 && <p className="text-center text-gray-400">暂无文章</p>}
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="block p-4 rounded-lg transition text-center hover:bg-gray-50 hover:shadow-md"
          >
            <div className="text-lg font-medium mb-1">{post.title}</div>
            <div className="text-xs text-gray-400 mb-1">{post.date}</div>
            <div className="text-sm text-gray-500 line-clamp-2">{post.description}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
