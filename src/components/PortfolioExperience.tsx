import Link from 'next/link';
import PortfolioCodeFlow from '@/components/PortfolioCodeFlow';

const portfolioCategories: { index: string; label: string; href?: string }[] = [
  { index: '01', label: 'Vibe coding', href: '/vibe-coding' },
  { index: '02', label: '平面设计' },
  { index: '03', label: '视频' },
  { index: '04', label: '新媒体运营' },
];

export default function PortfolioExperience() {
  return (
    <main className="portfolio-page">
      <header className="portfolio-navigation">
        <Link href="/" className="portfolio-wordmark">
          TAFFY WANG
        </Link>
        <span aria-hidden="true">◌</span>
      </header>

      <section className="portfolio-selector" aria-labelledby="portfolio-title">
        <div className="portfolio-selector-heading">
          <p className="portfolio-kicker">Portfolio</p>
          <h1 id="portfolio-title">作品集</h1>
        </div>

        <div className="portfolio-category-picker" aria-label="作品类别">
          {portfolioCategories.map((category) => {
            const content = (
              <>
                <span className="portfolio-category-index">{category.index}</span>
                <span>{category.label}</span>
                <span className="portfolio-category-arrow" aria-hidden="true">
                  ↗
                </span>
              </>
            );

            // Categories with published work open their own index page; the rest stay placeholders.
            return category.href ? (
              <Link className="portfolio-category-button" href={category.href} key={category.index}>
                {content}
              </Link>
            ) : (
              <button className="portfolio-category-button" type="button" key={category.index}>
                {content}
              </button>
            );
          })}
        </div>
      </section>

      <PortfolioCodeFlow />
    </main>
  );
}
