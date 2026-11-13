import Link from 'next/link';
import PortfolioStarfield from '@/components/PortfolioStarfield';
import PortfolioTerminal, { type TerminalEntry } from '@/components/PortfolioTerminal';

// Categories with published work link to their own index page; the rest answer "作品整理中" on the screen.
const portfolioCategories: TerminalEntry[] = [
  { dir: 'vibe-coding/', label: 'Vibe coding', count: 6, status: '6 个项目', href: '/vibe-coding' },
  { dir: 'graphic-design/', label: '平面设计', count: 12, status: '12 件作品', href: '/graphic-design', staticPage: true },
  { dir: 'video/', label: '视频', count: 5, status: '5 部作品', href: '/video' },
  { dir: 'social-media/', label: '新媒体运营', count: 0, status: '整理中' },
];

export default function PortfolioExperience() {
  return (
    <main className="portfolio-page portfolio-desk-page">
      <PortfolioStarfield />

      <header className="portfolio-navigation">
        <Link href="/" className="portfolio-wordmark">
          TAFFY WANG
        </Link>
        <span aria-hidden="true">◌</span>
      </header>

      <section className="portfolio-desk" aria-labelledby="portfolio-title">
        <h1 id="portfolio-title" className="sr-only">
          作品集
        </h1>
        <PortfolioTerminal entries={portfolioCategories} badge="PORTFOLIO" />
      </section>
    </main>
  );
}
