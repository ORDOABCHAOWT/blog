'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
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

type SocialLink = {
  label: string;
  href: string;
  iconSrc?: string;
  iconAlt?: string;
  glyph?: string;
  icon: 'image' | 'github' | 'glyph';
};

const socialLinks: SocialLink[] = [
  {
    label: '微信公众号',
    href: '/qrcode_for_wechat.jpg',
    iconSrc: '/wechat.png',
    iconAlt: '',
    icon: 'image',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/ORDOABCHAOWT',
    icon: 'github',
  },
  {
    label: '个人作品集',
    href: '/posts/aboutMyProjects',
    glyph: '作',
    icon: 'glyph',
  },
];

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="home-social-svg"
    >
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.22c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.21-3.37-1.21-.45-1.19-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.64-1.37-2.22-.26-4.55-1.14-4.55-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.34 9.34 0 0 1 12 5.95c.85 0 1.7.12 2.5.34 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.56 5.04.36.32.68.94.68 1.9l-.01 2.8c0 .27.18.59.69.49A10.1 10.1 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}

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
  const [isWechatPinned, setIsWechatPinned] = useState(false);
  const wechatPopoverRef = useRef<HTMLSpanElement>(null);

  const handleActivate = useCallback((index: number) => {
    setActiveIndex((current) => (current === index ? current : index));
  }, []);

  useEffect(() => {
    if (!isWechatPinned) return;

    function handlePointerDown(event: PointerEvent) {
      if (!wechatPopoverRef.current?.contains(event.target as Node)) {
        setIsWechatPinned(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsWechatPinned(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWechatPinned]);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="identity-panel">
          <div className="identity-block">
            <Image
              src="/avatar-2026.png"
              alt="Taffy Wang"
              width={104}
              height={104}
              className="identity-avatar"
              priority
            />
            <div>
              <h1 className="home-title">Taffy Wang</h1>
            </div>
          </div>

          <p className="home-deck">Take it easy, just thinking.</p>
          <p className="home-intro">
            Essays, project notes, and field observations on AI, work, images,
            travel, and the ordinary details worth holding onto.
          </p>

          <nav className="home-social-links" aria-label="Social links">
            {socialLinks.map((link) =>
              link.label === '微信公众号' ? (
                <span
                  key={link.label}
                  ref={wechatPopoverRef}
                  className={`home-social-wechat ${isWechatPinned ? 'is-open' : ''}`}
                >
                  <button
                    type="button"
                    aria-label="显示微信公众号二维码"
                    aria-expanded={isWechatPinned}
                    aria-controls="home-social-wechat-qr"
                    className="home-social-wechat-trigger"
                    onClick={() => setIsWechatPinned((current) => !current)}
                  >
                    <Image
                      src={link.iconSrc || ''}
                      alt={link.iconAlt || ''}
                      width={24}
                      height={24}
                      className="home-social-image"
                    />
                    <span className="sr-only">{link.label}</span>
                  </button>
                  <span
                    id="home-social-wechat-qr"
                    role="dialog"
                    aria-label="微信公众号二维码"
                    className="home-social-qr-popover"
                  >
                    <Image
                      src="/wechat-official-account-qr.jpg"
                      alt="微信公众号二维码"
                      width={430}
                      height={430}
                      className="home-social-qr-image"
                    />
                    <span className="home-social-qr-caption">
                      扫码关注微信公众号
                    </span>
                  </span>
                </span>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className="home-social-link"
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    link.href.startsWith('http')
                      ? 'noopener noreferrer'
                      : undefined
                  }
                >
                  {link.icon === 'github' ? (
                    <GitHubIcon />
                  ) : (
                    <span aria-hidden="true" className="home-social-glyph">
                      {link.glyph}
                    </span>
                  )}
                  <span className="sr-only">{link.label}</span>
                </a>
              )
            )}
          </nav>
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
