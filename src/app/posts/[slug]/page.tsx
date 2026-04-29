import type { Metadata } from 'next';
import { Children, isValidElement, type ReactNode } from 'react';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import ReadingProgress from '@/components/ReadingProgress';
import { formatDisplayDate, slugifyHeading } from '@/lib/post-format';
import {
  extractHeadings,
  getAdjacentPosts,
  getAllPostSlugs,
  getPostBySlug,
} from '@/lib/posts';

function getNodeText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }

      if (isValidElement(child)) {
        return getNodeText(child.props.children);
      }

      return '';
    })
    .join(' ');
}

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) {
    return {
      title: 'Post not found',
    };
  }

  return {
    title: `${post.title} | Taffy Wang`,
    description: post.description,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const post = getPostBySlug(resolvedParams.slug);

  if (!post) return notFound();

  const { previousPost, nextPost } = getAdjacentPosts(post.slug);
  const headings = extractHeadings(post.content);

  return (
    <main className="post-shell">
      <ReadingProgress />
      <header className="post-hero">
        <div className="post-hero-top">
          <Link href="/" className="post-back">
            Archive Index
          </Link>
          <p className="post-stamp">Essay {String(post.index).padStart(2, '0')}</p>
        </div>

        <div className="post-hero-copy">
          <p className="eyebrow">Notebook Entry</p>
          <h1 className="post-title">{post.title}</h1>
          {post.description ? (
            <p className="post-description">{post.description}</p>
          ) : null}
        </div>

        <p className="post-date">{formatDisplayDate(post.date)}</p>
      </header>

      <div className="post-layout">
        <aside className="post-rail">
          <div className="post-rail-stack">
            {headings.length > 0 ? (
              <nav className="post-outline" aria-label="Table of contents">
                <p className="post-outline-label">On this page</p>
                <div className="post-outline-links">
                  {headings.map((heading) => (
                    <a
                      key={`${heading.depth}-${heading.id}`}
                      href={`#${heading.id}`}
                      className={`post-outline-link depth-${heading.depth}`}
                    >
                      {heading.text}
                    </a>
                  ))}
                </div>
              </nav>
            ) : null}
          </div>
        </aside>

        <article className="post-article">
          <div
            className="editorial-prose"
            data-cjk={/^\s*[　-鿿＀-￯]/.test(post.content) ? 'true' : undefined}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ alt, title, ...props }) => {
                  const [rawAlt = '', rawCaption = ''] = (alt || '').split('|');
                  const altText = rawAlt.trim();
                  const caption = (title || rawCaption).trim();

                  if (!caption) {
                    return (
                      <img
                        {...props}
                        alt={altText}
                        className="editorial-image"
                        loading="lazy"
                      />
                    );
                  }

                  return (
                    <figure className="editorial-figure">
                      <img
                        {...props}
                        alt={altText}
                        className="editorial-image"
                        loading="lazy"
                      />
                      <figcaption>{caption}</figcaption>
                    </figure>
                  );
                },
                a: ({ ...props }) => (
                  <a
                    {...props}
                    target={props.href?.startsWith('http') ? '_blank' : undefined}
                    rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  />
                ),
                h2: ({ children, ...props }) => {
                  const text = getNodeText(children).trim();
                  return (
                    <h2 id={slugifyHeading(text)} {...props}>
                      {children}
                    </h2>
                  );
                },
                h3: ({ children, ...props }) => {
                  const text = getNodeText(children).trim();
                  return (
                    <h3 id={slugifyHeading(text)} {...props}>
                      {children}
                    </h3>
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>

      <nav className="post-pager" aria-label="Adjacent posts">
        {previousPost ? (
          <Link
            href={`/posts/${previousPost.slug}`}
            className="post-pager-link is-prev"
          >
            <span className="post-pager-direction">← Previous</span>
            <span className="post-pager-title">{previousPost.title}</span>
          </Link>
        ) : (
          <span className="post-pager-link is-prev is-muted" aria-disabled="true">
            <span className="post-pager-direction">← Previous</span>
            <span className="post-pager-title">Start of archive</span>
          </span>
        )}
        {nextPost ? (
          <Link
            href={`/posts/${nextPost.slug}`}
            className="post-pager-link is-next"
          >
            <span className="post-pager-direction">Next →</span>
            <span className="post-pager-title">{nextPost.title}</span>
          </Link>
        ) : (
          <span className="post-pager-link is-next is-muted" aria-disabled="true">
            <span className="post-pager-direction">Next →</span>
            <span className="post-pager-title">Latest entry</span>
          </span>
        )}
      </nav>

      <footer className="post-footer">
        <Link href="/" className="post-footer-link">
          Back to archive
        </Link>
      </footer>
    </main>
  );
}
