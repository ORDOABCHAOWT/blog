import Link from 'next/link';

const coverFragments = [
  'w',
  'a',
  'n1',
  'g1',
  't',
  'e',
  'n2',
  'g2',
] as const;

const skillGroups = [
  {
    label: '平面设计',
    detail: 'Photoshop / Illustrator / InDesign / Figma',
  },
  {
    label: '新媒体运营',
    detail: '文案策划 / 视频策划 / 渠道运营',
  },
  {
    label: '数据分析',
    detail: 'Excel / Tableau / 传播效果复盘',
  },
  {
    label: '品牌公关',
    detail: '企业新闻稿 / 传播方案 / 媒体关系维护',
  },
];

const careerRows = [
  ['海南民生管道燃气有限公司', '品牌宣传', '2020-至今'],
  ['广州阳狮媒体', '媒介策划', '2019-2020'],
  ['广州Seed United广告', '媒介策划&执行', '2018-2019'],
  ['广东省广告集团', '媒介购买', '2017-2018'],
];

const wordNotebookUrl =
  'https://word-notebook.ordoabchao-wt.workers.dev';

export default function PortfolioExperience() {
  return (
    <main className="portfolio-page">
      <section className="portfolio-cover-scroll" aria-label="王腾作品集封面">
        <div className="portfolio-cover-stage">
          <img
            src="/portfolio-cover.png"
            alt="王腾作品集&项目经历 Portfolio 封面"
            className="portfolio-cover-image"
          />
          <div className="portfolio-cover-fragments" aria-hidden="true">
            {coverFragments.map((fragment) => (
              <div
                className={`portfolio-cover-fragment is-${fragment}`}
                key={fragment}
              >
                <img src={`/portfolio-letters/${fragment}.png`} alt="" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="portfolio-profile" aria-label="个人简介">
        <div className="portfolio-profile-header">
          <div>
            <p className="portfolio-section-en">Profile</p>
            <h2>个人简介</h2>
          </div>
          <Link href="/" className="portfolio-home-link">
            回到首页
          </Link>
        </div>

        <div className="portfolio-profile-grid">
          <section className="portfolio-profile-block">
            <h3>教育经历</h3>
            <div className="portfolio-profile-line">
              <span>北京师范大学珠海分校</span>
              <span>传播学</span>
              <span>2013-2017</span>
            </div>
          </section>

          <section className="portfolio-profile-block">
            <h3>职业经历</h3>
            <div className="portfolio-career-list">
              {careerRows.map(([company, role, year]) => (
                <div className="portfolio-profile-line" key={`${company}-${year}`}>
                  <span>{company}</span>
                  <span>{role}</span>
                  <span>{year}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="portfolio-profile-block portfolio-skill-block">
            <h3>个人技能</h3>
            <div className="portfolio-skill-list">
              {skillGroups.map((skill) => (
                <article className="portfolio-skill-item" key={skill.label}>
                  <div>
                    <h4>{skill.label}</h4>
                    <p>{skill.detail}</p>
                  </div>
                  <span aria-hidden="true" />
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section
        id="selected-projects"
        className="portfolio-projects"
        aria-labelledby="portfolio-projects-title"
      >
        <header className="portfolio-projects-header">
          <div>
            <p className="portfolio-section-en">Projects</p>
            <h2 id="portfolio-projects-title">项目经历</h2>
          </div>
          <p>
            从真实需求出发，把想法做成可以长期使用、持续更新的产品。
          </p>
        </header>

        <a
          className="portfolio-project-card"
          href={wordNotebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="打开 Word Notebook 网页应用（新窗口）"
        >
          <div className="portfolio-project-copy">
            <div className="portfolio-project-meta">
              <span>01</span>
              <span>Web App · 2026</span>
            </div>

            <div>
              <p className="portfolio-project-kicker">AI vocabulary workspace</p>
              <h3>Word Notebook</h3>
              <p className="portfolio-project-description">
                一套为桌面端和 iPhone 设计的同步单词本。支持 AI
                查词、例句、复习计划和学习进度，让收藏、理解与记忆留在同一处。
              </p>
            </div>

            <div className="portfolio-project-footer">
              <ul aria-label="项目技术">
                <li>React</li>
                <li>Cloudflare Workers</li>
                <li>D1</li>
                <li>Qwen</li>
              </ul>
              <span className="portfolio-project-cta">
                打开项目
                <span aria-hidden="true">↗</span>
              </span>
            </div>
          </div>

          <div className="portfolio-project-preview" aria-hidden="true">
            <div className="portfolio-preview-window">
              <div className="portfolio-preview-toolbar">
                <span />
                <span />
                <span />
                <p>Word Notebook</p>
              </div>
              <div className="portfolio-preview-app">
                <nav className="portfolio-preview-nav">
                  <strong>W</strong>
                  <span className="is-active" />
                  <span />
                  <span />
                </nav>
                <div className="portfolio-preview-main">
                  <div className="portfolio-preview-title">
                    <div>
                      <span>Notebook</span>
                      <small>37 saved words</small>
                    </div>
                    <i />
                  </div>
                  <div className="portfolio-preview-grid">
                    <div className="portfolio-preview-list">
                      <div className="is-selected">
                        <strong>seamless</strong>
                        <small>无缝的；流畅的</small>
                      </div>
                      <div>
                        <strong>resilient</strong>
                        <small>有韧性的；适应力强的</small>
                      </div>
                      <div>
                        <strong>momentum</strong>
                        <small>动力；势头</small>
                      </div>
                    </div>
                    <div className="portfolio-preview-detail">
                      <small>ADJECTIVE</small>
                      <strong>seamless</strong>
                      <p>无缝的；无缝对接的；流畅的</p>
                      <span>
                        The experience stays seamless across every screen.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a>
      </section>
    </main>
  );
}
