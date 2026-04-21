'use client';

import { memo, useCallback, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PostSummary } from '@/lib/posts';
import { formatDisplayDate } from '@/lib/post-format';
import WayfinderHero from '@/components/WayfinderHero';

type HomeExperienceProps = {
  posts: PostSummary[];
};

type DirectoryItemProps = {
  post: PostSummary;
  isActive: boolean;
  onActivate: (index: number) => void;
};

// Each list item is memoized so that when the active index changes,
// only the two affected items (previous + next active) re-render,
// instead of the entire list. This keeps the main thread free so that
// clicks on <Link> are handled promptly.
const DirectoryItem = memo(function DirectoryItem({
  post,
  isActive,
  onActivate,
}: DirectoryItemProps) {
  const handleActivate = useCallback(() => {
    onActivate(post.index);
  }, [onActivate, post.index]);

  return (
    <Link
      href={`/posts/${post.slug}`}
      prefetch
      className={`directory-item ${isActive ? 'is-active' : ''}`}
      onPointerEnter={handleActivate}
      onFocus={handleActivate}
    >
      <span className="directory-number">
        {String(post.index).padStart(2, '0')}
      </span>
      <div className="directory-content">
        <h2>{post.title}</h2>
        <p>{post.description || 'Open the entry to read the full note.'}</p>
      </div>
      <span className="directory-date">{formatDisplayDate(post.date)}</span>
    </Link>
  );
});

export default function HomeExperience({ posts }: HomeExperienceProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(
    posts[0]?.index ?? null
  );

  const handleActivate = useCallback((index: number) => {
    setActiveIndex((current) => (current === index ? current : index));
  }, []);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="identity-panel">
          <div className="identity-block">
            <Image
              src="/avatar.png"
              alt="Taffy Wang"
              width={104}
              height={104}
              className="identity-avatar"
              priority
            />
            <div>
              <p className="eyebrow">Personal Writing Archive</p>
              <h1 className="home-title">Taffy Wang</h1>
            </div>
          </div>

          <p className="home-deck">Take it easy, just thinking.</p>
          <p className="home-intro">
            Essays, project notes, and field observations on AI, work, images,
            travel, and the ordinary details worth holding onto.
          </p>
        </div>

        <div className="hero-art">
          <WayfinderHero activeIndex={activeIndex} />
        </div>
      </section>

      <section className="directory-section">
        <div className="directory-list">
          {posts.length === 0 ? (
            <p className="directory-empty">暂无文章</p>
          ) : (
            posts.map((post) => (
              <DirectoryItem
                key={post.slug}
                post={post}
                isActive={activeIndex === post.index}
                onActivate={handleActivate}
              />
            ))
          )}
        </div>
      </section>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Taffy Wang</p>
      </footer>
    </main>
  );
}
