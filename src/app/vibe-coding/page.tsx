import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PortfolioStarfield from '@/components/PortfolioStarfield';

export const metadata: Metadata = {
  title: 'Vibe coding | Taffy Wang',
  description: '王腾用 AI 编程做的小软件：按实际需要做出来，自己每天在用。',
};

// Project covers live in public/vibe-coding/covers/.
// The original static work pages use rewrites; extension projects use App Router pages.
const projects = [
  {
    index: '01',
    name: 'ChordLens',
    summary: '和弦自学软件：和弦名、琴键、吉他指法同时展示',
    href: '/vibe-coding/chordlens',
    platform: 'macOS',
    stack: 'TypeScript · React · Rust / Tauri',
    cover: '/vibe-coding/covers/chordlens.webp',
  },
  {
    index: '02',
    name: 'Word Notebook',
    summary: '在电脑和 iPhone 之间同步的私有英语生词本',
    href: '/vibe-coding/word-notebook',
    platform: 'PWA',
    stack: 'TypeScript · React · Cloudflare Workers · D1',
    cover: '/vibe-coding/covers/word-notebook.webp',
  },
  {
    index: '03',
    name: '办公小助手',
    summary: 'macOS 办公工具箱：周报、加班、图片转换、视频截帧',
    href: '/vibe-coding/office-assistant',
    platform: 'macOS',
    stack: 'Python · macOS',
    cover: '/vibe-coding/covers/office-assistant.webp',
  },
  {
    index: '04',
    name: 'Glance',
    summary: '在 Touch Bar 上看 Codex 和 Claude 的任务进度',
    href: '/vibe-coding/glance',
    platform: 'Touch Bar',
    stack: 'Swift · AppKit',
    cover: '/vibe-coding/covers/glance.webp',
  },
  {
    index: '05',
    name: 'Smart Bookmark',
    summary: '收藏时自动生成标签，按关键词找回需要的网页',
    href: '/vibe-coding/smart-bookmark',
    platform: 'Chrome Extension',
    stack: 'JavaScript · HTML / CSS · Manifest V3 · WebDAV',
    cover: '/vibe-coding/covers/smart-bookmark.webp',
  },
  {
    index: '06',
    name: '小红书专注搜索页',
    summary: '打开小红书，直接搜索自己想找的内容',
    href: '/vibe-coding/rednote-focus',
    platform: 'Chrome Extension',
    stack: 'JavaScript · DOM / CSS · Manifest V3',
    cover: '/vibe-coding/covers/rednote-focus.webp',
  },
];

export default function VibeCodingPage() {
  return (
    <main className="portfolio-page vibe-page">
      <PortfolioStarfield />
      <header className="portfolio-navigation">
        <Link href="/" className="portfolio-wordmark">
          TAFFY WANG
        </Link>
        <nav className="vibe-crumbs" aria-label="位置">
          <Link href="/posts/aboutMyProjects">Portfolio</Link>
          <span aria-hidden="true">/</span>
          <b>Vibe coding</b>
        </nav>
      </header>

      <section className="vibe-gallery-section" aria-labelledby="vibe-title">
        <div className="vibe-gallery-heading">
          <p className="portfolio-kicker">Portfolio · 01</p>
          <h1 id="vibe-title">Vibe coding</h1>
          <p className="vibe-lede">按实际需要做出来、自己每天在用的小软件。</p>
        </div>

        <ul className="vibe-gallery">
          {projects.map((project, position) => (
            <li key={project.index}>
              {/* Plain anchors support both static work pages and App Router project pages. */}
              <a className="vibe-card" href={project.href}>
                <figure className="vibe-card-cover">
                  <Image
                    src={project.cover}
                    alt={`${project.name} 的封面`}
                    width={1200}
                    height={800}
                    sizes="(max-width: 760px) 100vw, (max-width: 1280px) 50vw, 38rem"
                    priority={position < 2}
                  />
                </figure>
                <span className="vibe-card-label" aria-hidden="true">
                  <span>{project.index} / {project.platform}</span>
                  <span>{project.name}</span>
                </span>
                <span className="vibe-card-meta">
                  <span className="vibe-card-platform">{project.index} / {project.platform}</span>
                  <span className="vibe-card-details">
                    <span className="vibe-card-name">{project.name}</span>
                    <span className="vibe-card-summary">{project.summary}</span>
                    <span className="vibe-card-stack">{project.stack}</span>
                    <span className="vibe-card-more">Learn more <span aria-hidden="true">↗</span></span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <Link className="vibe-back" href="/posts/aboutMyProjects">
          ← 返回作品集
        </Link>
      </section>

    </main>
  );
}
