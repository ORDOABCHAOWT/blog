import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../extension-project.module.css';

export const metadata: Metadata = {
  title: '小红书专注搜索页 | Taffy Wang',
  description: '将小红书首页的推荐流替换为专注搜索入口的 Chrome 扩展。',
};

export default function RednoteFocusPage() {
  return (
    <main className="portfolio-page">
      <header className="portfolio-navigation">
        <Link className="portfolio-wordmark" href="/">TAFFY WANG</Link>
        <nav className="vibe-crumbs" aria-label="位置">
          <Link href="/vibe-coding">Vibe coding</Link>
          <span aria-hidden="true">/</span>
          <b>小红书专注搜索页</b>
        </nav>
      </header>

      <div className={styles.content}>
        <section className={styles.heading} aria-labelledby="project-title">
          <span className="portfolio-kicker">06 / Chrome Extension</span>
          <h1 id="project-title">小红书专注搜索页</h1>
          <p>本来想查一个问题，打开小红书却先刷起了推荐。这个扩展让首页安静下来，把搜索框放到正中间，帮助自己带着明确的问题开始浏览。</p>
        </section>

        <figure className={styles.screenshot}>
          <Image src="/vibe-coding/covers/rednote-focus.webp" width={1280} height={720}
            alt="小红书专注搜索页的搜索框、搜索按钮与简洁渐变背景" priority
            sizes="(max-width: 760px) 100vw, 72rem" />
        </figure>

        <section className={styles.features} aria-label="主要功能">
          <div>
            <h2>打开首页，先看到搜索</h2>
            <p>在小红书 explore 页面隐藏推荐信息流，保留清晰的搜索入口，让访问从自己的需求出发。</p>
          </div>
          <div>
            <h2>搜索后，继续原生浏览</h2>
            <p>输入关键词后进入小红书原生搜索结果。页面切换时跟随站点路由处理，搜索和个人主页按原有方式浏览。</p>
          </div>
          <div>
            <h2>账号入口放在手边</h2>
            <p>从当前页面识别已登录账号，保留通往个人收藏的头像入口。搜索词和账号标识仅在页面中临时使用。</p>
          </div>
        </section>

        <figure className={styles.screenshot}>
          <Image src="/vibe-coding/assets/rednote-search.webp" width={1280} height={720}
            alt="在小红书专注搜索框中输入日语学习的示例"
            sizes="(max-width: 760px) 100vw, 72rem" />
          <figcaption className={styles.caption}>从一个明确的主题进入搜索，例如「日语学习」。</figcaption>
        </figure>

        <footer className={styles.footer}>
          <p>JavaScript · DOM / CSS · Chrome Manifest V3</p>
          <div className={styles.links}>
            <a href="https://github.com/ORDOABCHAOWT/xiaohongshu-focus-extension" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <Link href="/vibe-coding">← 返回 Vibe coding</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
