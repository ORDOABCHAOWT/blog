'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type PortfolioCategory = {
  id: string;
  index: string;
  label: string;
  englishLabel: string;
  description: string;
  projects?: PortfolioProject[];
};

type PortfolioProject = {
  title: string;
  href: string;
};

const portfolioCategories: PortfolioCategory[] = [
  {
    id: 'vibe-coding',
    index: '01',
    label: 'Vibe coding',
    englishLabel: 'Apps · tools · experiments',
    description: '为日常使用而做的网页应用、自动化工具与小型数字实验。',
    projects: [
      {
        title: 'Word Notebook',
        href: 'https://www.taffy.wang/notebook/',
      },
    ],
  },
  {
    id: 'graphic-design',
    index: '02',
    label: '平面设计',
    englishLabel: 'Identity · print · layout',
    description: '品牌视觉、信息排版、活动物料与让内容清晰被看见的设计。',
  },
  {
    id: 'video',
    index: '03',
    label: '视频',
    englishLabel: 'Direction · edit · story',
    description: '从脚本到剪辑，把信息、情绪和节奏放进同一段叙事里。',
  },
  {
    id: 'social-media',
    index: '04',
    label: '新媒体运营',
    englishLabel: 'Strategy · content · growth',
    description: '围绕选题、文案、内容分发与传播复盘，建立可持续的表达。',
  },
];

const codeAlphabet = '01{}[]()<>/=+*;:._-~';
const codeCellCount = 468;

function makeCodeGlyph(index: number) {
  // Deterministic glyphs prevent hydration mismatches; the dimmer below creates
  // a gentle, random-looking variation after the page becomes interactive.
  return codeAlphabet[
    (index * 17 + Math.floor(index / 11) * 7) % codeAlphabet.length
  ];
}

export default function PortfolioExperience() {
  const [activeCategory, setActiveCategory] = useState(portfolioCategories[0]);
  const [flickeringCells, setFlickeringCells] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const updateFlicker = () => {
      const nextCells = new Set<number>();

      while (nextCells.size < 38) {
        nextCells.add(Math.floor(Math.random() * codeCellCount));
      }

      setFlickeringCells(nextCells);
    };

    updateFlicker();
    const interval = window.setInterval(updateFlicker, 1900);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <main className="portfolio-page">
      <header className="portfolio-navigation">
        <Link href="/" className="portfolio-wordmark">
          TAFFY WANG
        </Link>
        <p>SELECTED WORKS / 2026</p>
        <span aria-hidden="true">◌</span>
      </header>

      <section className="portfolio-selector" aria-labelledby="portfolio-title">
        <div className="portfolio-selector-heading">
          <p className="portfolio-kicker">Portfolio</p>
          <h1 id="portfolio-title">作品集</h1>
          <p>在不同媒介中，持续把想法变成可以被使用、阅读和记住的东西。</p>
        </div>

        <div className="portfolio-category-picker" aria-label="作品类别">
          {portfolioCategories.map((category) => {
            const isActive = activeCategory.id === category.id;

            return (
              <button
                className="portfolio-category-button"
                type="button"
                aria-pressed={isActive}
                key={category.id}
                onClick={() => setActiveCategory(category)}
              >
                <span className="portfolio-category-index">{category.index}</span>
                <span>{category.label}</span>
                <span className="portfolio-category-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
            );
          })}
        </div>

        <div
          className="portfolio-category-detail"
          aria-live="polite"
        >
          <p>{activeCategory.englishLabel}</p>
          <div>
            <span>{activeCategory.description}</span>
            {activeCategory.projects?.length ? (
              <ul className="portfolio-category-projects" aria-label="相关项目">
                {activeCategory.projects.map((project) => (
                  <li key={project.href}>
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.title} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <div className="portfolio-code-field" aria-hidden="true">
        <div className="portfolio-code-grid">
          {Array.from({ length: codeCellCount }, (_, index) => (
            <span
              className={flickeringCells.has(index) ? 'is-flickering' : undefined}
              key={index}
            >
              {makeCodeGlyph(index)}
            </span>
          ))}
        </div>
      </div>

      <footer className="portfolio-footer">
        <span>© TAFFY WANG</span>
        <span>海南 · 中国</span>
      </footer>
    </main>
  );
}
