import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import Image from 'next/image';

export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), 'posts');
  const files = await fs.promises.readdir(postsDir);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({ slug: file.replace(/\.md$/, '') }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const postPath = path.join(process.cwd(), 'posts', `${resolvedParams.slug}.md`);
  
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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, ...props }) => (
              <img
                {...props}
                alt={props.alt || ''}
                className="w-full h-auto rounded-lg my-4"
                loading="lazy"
              />
            ),
            a: ({ node, ...props }) => (
              <a
                {...props}
                className="text-blue-600 hover:underline"
                target={props.href?.startsWith('http') ? '_blank' : undefined}
                rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              />
            ),
            p: ({ node, ...props }) => (
              <p {...props} className="my-4 leading-relaxed" />
            ),
            h1: ({ node, ...props }) => (
              <h1 {...props} className="text-2xl font-bold mt-8 mb-4" />
            ),
            h2: ({ node, ...props }) => (
              <h2 {...props} className="text-xl font-semibold mt-6 mb-3" />
            ),
            h3: ({ node, ...props }) => (
              <h3 {...props} className="text-lg font-semibold mt-4 mb-2" />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote {...props} className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600" />
            ),
            code: ({ node, inline, ...props }: any) => (
              inline
                ? <code {...props} className="bg-gray-100 px-1 py-0.5 rounded text-sm" />
                : <code {...props} className="block bg-gray-100 p-4 rounded-lg my-4 overflow-x-auto" />
            ),
            ul: ({ node, ...props }) => (
              <ul {...props} className="list-disc list-inside my-4 space-y-2" />
            ),
            ol: ({ node, ...props }) => (
              <ol {...props} className="list-decimal list-inside my-4 space-y-2" />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
      <div className="w-full flex justify-center mt-8 mb-4">
        <span className="text-xs text-gray-400">© {new Date().getFullYear()} Taffy</span>
      </div>
    </main>
  );
} 