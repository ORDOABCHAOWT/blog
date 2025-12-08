import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDir = path.join(process.cwd(), 'posts');

// 验证 slug 是否安全（防止路径遍历攻击）
function isValidSlug(slug: string): boolean {
  // 只允许字母、数字、连字符和下划线
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

// GET - 获取单个文章
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 验证 slug 格式
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
    }

    const filePath = path.join(postsDir, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    return NextResponse.json({
      slug,
      title: data.title,
      date: data.date,
      description: data.description,
      content,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// PUT - 更新文章
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { title, date, description, content, newSlug } = await request.json();

    // 验证原始 slug 格式
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
    }

    // 如果有新 slug，也需要验证
    if (newSlug && !isValidSlug(newSlug)) {
      return NextResponse.json({ error: 'Invalid new slug format' }, { status: 400 });
    }

    const oldFilePath = path.join(postsDir, `${slug}.md`);

    if (!fs.existsSync(oldFilePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const frontmatter = matter.stringify(content, {
      title,
      date,
      description: description || '',
    });

    const newFilePath = newSlug && newSlug !== slug
      ? path.join(postsDir, `${newSlug}.md`)
      : oldFilePath;

    if (newSlug && newSlug !== slug && fs.existsSync(newFilePath)) {
      return NextResponse.json({ error: 'New slug already exists' }, { status: 409 });
    }

    fs.writeFileSync(newFilePath, frontmatter);

    if (newSlug && newSlug !== slug) {
      fs.unlinkSync(oldFilePath);
    }

    return NextResponse.json({ success: true, message: 'Post updated' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE - 删除文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 验证 slug 格式
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 });
    }

    const filePath = path.join(postsDir, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
