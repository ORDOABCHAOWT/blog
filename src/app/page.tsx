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
      <h1 className="text-3xl font-bold mb-2">Taffy Wang</h1>
      <p className="text-gray-500 mb-8 text-center max-w-md">提前退役的转码广告人，Take it Easy, just thinking 🐣</p>
      {/* 社交媒体图标栏 */}
      <div className="flex flex-row items-center gap-6 mb-6">
        {/* 微信 */}
        <a href="https://mp.weixin.qq.com/s/wOQdwQxXzu1bhL9DEM0HJQ" target="_blank" rel="noopener noreferrer" className="p-1 group">
          <Image
            src="/wechat.png"
            alt="微信"
            width={30}
            height={30}
            className="group-hover:brightness-75 transition"
          />
        </a>
        {/* 小红书 */}
        <a href="https://www.xiaohongshu.com/user/profile/5b1754d2e8ac2b75fc10347c?xsec_token=ABCMBJI0VByax_8-LBrE0odSfAubEeY4hAOFtZcdn2Xm0=&xsec_source=pc_search" target="_blank" rel="noopener noreferrer" className="p-1 group">
          <Image
            src="/xhs.png"
            alt="小红书"
            width={28}
            height={28}
            className="group-hover:brightness-75 transition"
          />
        </a>
        {/* Substack */}
        <a href="https://substack.com/@iwanted?utm_source=global-search" target="_blank" rel="noopener noreferrer" className="p-1 group">
          <Image
            src="/substack.png"
            alt="Substack"
            width={24}
            height={24}
            className="group-hover:brightness-75 transition"
          />
        </a>
        {/* Instagram */}
        <a href="https://www.instagram.com/orderfrom_/" target="_blank" rel="noopener noreferrer" className="p-1 group">
          <Image
            src="/instagram.png"
            alt="Instagram"
            width={28}
            height={28}
            className="group-hover:brightness-75 transition"
          />
        </a>
      </div>
      {/* END 社交媒体图标栏 */}
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
