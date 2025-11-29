import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = path.join(process.cwd(), 'posts');

// GET - 获取所有文章
export async function GET() {
  try {
    const files = fs.readdirSync(postsDir);
    const posts = files
      .filter((file) => file.endsWith('.md'))
      .map((file) => {
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data, content: markdown } = matter(content);
        return {
          slug: file.replace(/\.md$/, ''),
          title: data.title || file,
          date: data.date || '',
          description: data.description || '',
          content: markdown,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST - 创建新文章
export async function POST(request: NextRequest) {
  try {
    const { slug, title, date, description, content } = await request.json();

    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 });
    }

    const frontmatter = matter.stringify(content, {
      title,
      date: date || new Date().toISOString().split('T')[0],
      description: description || '',
    });

    const filePath = path.join(postsDir, `${slug}.md`);

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post already exists' }, { status: 409 });
    }

    fs.writeFileSync(filePath, frontmatter);

    return NextResponse.json({ success: true, message: 'Post created' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
