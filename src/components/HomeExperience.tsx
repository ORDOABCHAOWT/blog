'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PostSummary } from '@/lib/posts';
import { formatDisplayDate } from '@/lib/post-format';
import WayfinderHero from '@/components/WayfinderHero';

type HomeExperienceProps = {
  posts: PostSummary[];
};

export default function HomeExperience({ posts }: HomeExperienceProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(posts[0]?.index ?? null);

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

          <div className="home-links">
            <a
              href="https://mp.weixin.qq.com/s/wOQdwQxXzu1bhL9DEM0HJQ"
              target="_blank"
              rel="noopener noreferrer"
            >
              WeChat
            </a>
            <a
              href="https://www.xiaohongshu.com/user/profile/5b1754d2e8ac2b75fc10347c?xsec_token=ABCMBJI0VByax_8-LBrE0odSfAubEeY4hAOFtZcdn2Xm0=&xsec_source=pc_search"
              target="_blank"
              rel="noopener noreferrer"
            >
              Xiaohongshu
            </a>
          </div>
        </div>

        <div className="hero-art">
          <WayfinderHero activeIndex={activeIndex} />
        </div>
      </section>

      <section className="directory-section">
        <div className="directory-header">
          <p className="eyebrow">Writing Index</p>
          <p className="directory-summary">
            {posts.length.toString().padStart(2, '0')} entries in the archive
          </p>
        </div>

        <div className="directory-list">
          {posts.length === 0 ? (
            <p className="directory-empty">暂无文章</p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className={`directory-item ${activeIndex === post.index ? 'is-active' : ''}`}
                onPointerEnter={() => setActiveIndex(post.index)}
                onFocus={() => setActiveIndex(post.index)}
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
