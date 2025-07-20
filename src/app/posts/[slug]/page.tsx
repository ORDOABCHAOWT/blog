import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), 'posts');
  const files = fs.readdirSync(postsDir);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({ slug: file.replace(/\.md$/, '') }));
}

export default async function PostPage({ params }: any) {
  const postPath = path.join(process.cwd(), 'posts', `${params.slug}.md`);
  if (!fs.existsSync(postPath)) return notFound();
  const source = fs.readFileSync(postPath, 'utf8');
  const { content, data } = matter(source);
  return (
    <main className="prose prose-neutral dark:prose-invert mx-auto px-4 py-12 min-h-screen flex flex-col items-center">
      <Link href="/" className="mb-8 text-gray-400 hover:text-gray-700 text-sm">← 返回首页</Link>
      <h1 className="mb-2 text-3xl font-bold text-center">{data.title}</h1>
      <div className="mb-4 text-xs text-gray-400 text-center">{data.date}</div>
      <div className="mb-8 text-gray-500 text-center">{data.description}</div>
      <article className="w-full max-w-2xl">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </main>
  );
} 