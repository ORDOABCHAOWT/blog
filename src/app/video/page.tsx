import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import styles from './video.module.css';
import { videoWorks } from './works';

export const metadata: Metadata = {
  title: '视频策划 | Taffy Wang',
  description: '以情景短剧、说唱、纪实与 AI 动画，呈现燃气安全与企业品牌传播的视频策划作品。',
};

export default function VideoPortfolioPage() {
  return (
    <main className={`portfolio-page vibe-page ${styles.page}`}>
      <header className="portfolio-navigation">
        <Link href="/" className="portfolio-wordmark">
          TAFFY WANG
        </Link>
        <nav className="vibe-crumbs" aria-label="位置">
          <Link href="/posts/aboutMyProjects">Portfolio</Link>
          <span aria-hidden="true">/</span>
          <b>Video</b>
        </nav>
      </header>

      <section className="vibe-gallery-section" aria-labelledby="video-title">
        <div className="vibe-gallery-heading">
          <p className="portfolio-kicker">Portfolio · 03</p>
          <h1 id="video-title">视频策划</h1>
        </div>

        <div className={styles.gallery}>
          {videoWorks.map((work) => (
            <article
              className={work.height > work.width ? `${styles.work} ${styles.portrait}` : styles.work}
              key={work.slug}
              aria-labelledby={`${work.slug}-title`}
            >
              <video
                className={styles.player}
                width={work.width}
                height={work.height}
                controls
                playsInline
                preload="none"
                poster={`/video/${work.slug}.webp`}
                aria-labelledby={`${work.slug}-title`}
              >
                <source src={`/video/${work.slug}.mp4`} type="video/mp4" />
                <a href={`/video/${work.slug}.mp4`}>打开视频文件</a>
              </video>
              <div className={styles.caption}>
                <h2 id={`${work.slug}-title`}>{work.title}</h2>
                <p>{work.description}</p>
              </div>
              {work.process && (
                <div className={styles.process} role="group" aria-label="制作过程素材">
                  {work.process.map((step) => (
                    <figure key={step.image}>
                      <Image
                        src={step.image}
                        alt={step.alt}
                        width={1672}
                        height={941}
                        sizes="(max-width: 760px) 100vw, 50vw"
                        className={styles.processImage}
                      />
                      <figcaption>{step.title}</figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <Link className="vibe-back" href="/posts/aboutMyProjects">
          ← 返回作品集
        </Link>
      </section>
    </main>
  );
}
