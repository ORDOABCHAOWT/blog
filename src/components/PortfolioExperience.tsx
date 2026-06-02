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
    </main>
  );
}
