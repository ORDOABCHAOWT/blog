import type { Metadata } from 'next';
import Link from 'next/link';
import PortfolioStarfield from '@/components/PortfolioStarfield';

export const metadata: Metadata = {
  title: 'Vibe coding | Taffy Wang',
  description: '王腾用 AI 编程做的小软件：按实际需要做出来，自己每天在用。',
};

// Each project page is a self-contained HTML file in public/vibe-coding/, mapped to a clean URL in next.config.ts.
const projects = [
  {
    index: '01',
    name: 'ChordLens',
    summary: '和弦自学软件：和弦名、琴键、吉他指法同时展示',
    href: '/vibe-coding/chordlens',
  },
  {
    index: '02',
    name: 'Word Notebook',
    summary: '在电脑和 iPhone 之间同步的私有英语生词本',
    href: '/vibe-coding/word-notebook',
  },
  {
    index: '03',
    name: '办公小助手',
    summary: 'macOS 办公工具箱：周报、加班、图片转换、视频截帧',
    href: '/vibe-coding/office-assistant',
  },
  {
    index: '04',
    name: 'Glance',
    summary: '在 Touch Bar 上看 Codex 和 Claude 的任务进度',
    href: '/vibe-coding/glance',
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

      <section className="portfolio-selector" aria-labelledby="vibe-title">
        <div className="portfolio-selector-heading">
          <p className="portfolio-kicker">Portfolio · 01</p>
          <h1 id="vibe-title">Vibe coding</h1>
          <p className="vibe-lede">按实际需要做出来、自己每天在用的小软件。</p>
        </div>

        <ol className="vibe-project-list">
          {projects.map((project) => (
            <li key={project.index}>
              {/* A plain anchor: the target is a static file, not an App Router page. */}
              <a className="vibe-project" href={project.href}>
                <span className="portfolio-category-index">{project.index}</span>
                <span className="vibe-project-name">{project.name}</span>
                <span className="vibe-project-summary">{project.summary}</span>
                <span className="portfolio-category-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ol>

        <Link className="vibe-back" href="/posts/aboutMyProjects">
          ← 返回作品集
        </Link>
      </section>

    </main>
  );
}
