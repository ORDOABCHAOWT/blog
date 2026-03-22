import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { slugifyHeading } from '@/lib/post-format';

export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  description: string;
  index: number;
};

export type PostDetail = PostSummary & {
  content: string;
};

export type PostHeading = {
  depth: 2 | 3;
  text: string;
  id: string;
};

const postsDir = path.join(process.cwd(), 'posts');

function sortPosts<T extends { date: string }>(posts: T[]) {
  return posts.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date < b.date ? 1 : -1;
  });
}

export function extractHeadings(content: string): PostHeading[] {
  const headings: PostHeading[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;

    const match = /^(##|###)\s+(.+)$/.exec(line.trim());
    if (!match) continue;

    const depth = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = slugifyHeading(text);

    if (!id) continue;

    headings.push({ depth, text, id });
  }

  return headings;
}

export function getPostSummaries(): PostSummary[] {
  const files = fs.readdirSync(postsDir);

  const posts = files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(postsDir, file);
      const source = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(source);

      return {
        slug: file.replace(/\.md$/, ''),
        title: data.title || file,
        date: data.date || '',
        description: data.description || '',
      };
    });

  return sortPosts(posts).map((post, index) => ({
    ...post,
    index: index + 1,
  }));
}

export function getAllPostSlugs() {
  return getPostSummaries().map((post) => post.slug);
}

export function getPostBySlug(slug: string): PostDetail | null {
  const filePath = path.join(postsDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const { content, data } = matter(source);
  const summaries = getPostSummaries();
  const summary = summaries.find((post) => post.slug === slug);

  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    description: data.description || '',
    index: summary?.index || summaries.length + 1,
    content,
  };
}

export function getAdjacentPosts(slug: string) {
  const posts = getPostSummaries();
  const currentIndex = posts.findIndex((post) => post.slug === slug);

  if (currentIndex < 0) {
    return {
      previousPost: null,
      nextPost: null,
    };
  }

  return {
    previousPost: posts[currentIndex - 1] || null,
    nextPost: posts[currentIndex + 1] || null,
  };
}
