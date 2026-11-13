import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../extension-project.module.css';

export const metadata: Metadata = {
  title: 'Smart Bookmark | Taffy Wang',
  description: '一款 Chrome 书签扩展，用 AI 生成标签和摘要，支持跨字段关键词搜索与 WebDAV 同步。',
};

export default function SmartBookmarkPage() {
  return (
    <main className="portfolio-page">
      <header className="portfolio-navigation">
        <Link className="portfolio-wordmark" href="/">TAFFY WANG</Link>
        <nav className="vibe-crumbs" aria-label="位置">
          <Link href="/vibe-coding">Vibe coding</Link>
          <span aria-hidden="true">/</span>
          <b>Smart Bookmark</b>
        </nav>
      </header>

      <div className={styles.content}>
        <section className={styles.heading} aria-labelledby="project-title">
          <span className="portfolio-kicker">05 / Chrome Extension</span>
          <h1 id="project-title">Smart Bookmark</h1>
          <p>收藏的网页越来越多，常常只记得大概内容，却想不起标题。这个扩展把标签、摘要和搜索放到浏览器侧边栏，让保存下来的资料更容易找回来。</p>
        </section>

        <figure className={styles.screenshot}>
          <Image src="/vibe-coding/covers/smart-bookmark.webp" width={1280} height={800}
            alt="Smart Bookmark 的 AI 标签生成、网页摘要和搜索结果展示" priority
            sizes="(max-width: 760px) 100vw, 72rem" />
        </figure>

        <section className={styles.features} aria-label="主要功能">
          <div>
            <h2>保存时，补上标签和摘要</h2>
            <p>按快捷键收藏当前网页，调用自行配置的 AI 服务生成标签和摘要，也可以批量整理已经保存的书签。</p>
          </div>
          <div>
            <h2>用记得的关键词找回网页</h2>
            <p>把标题、网址、标签和描述一起纳入匹配。几个关键词可以分散在不同字段，中文输入也能拆词查找。</p>
          </div>
          <div>
            <h2>按自己的方式整理和同步</h2>
            <p>用自定义分组聚合相关网页，通过 WebDAV 同步书签、设置和标签，也支持配置 Ollama 本地模型。</p>
          </div>
        </section>

        <figure className={styles.screenshot}>
          <Image src="/vibe-coding/assets/smart-bookmark-groups.webp" width={1280} height={800}
            alt="Smart Bookmark 根据域名、链接和条件组组织书签的分组界面"
            sizes="(max-width: 760px) 100vw, 72rem" />
          <figcaption className={styles.caption}>通过域名、链接与条件组建立自己的资料分类。</figcaption>
        </figure>

        <footer className={styles.footer}>
          <p>JavaScript · HTML / CSS · Chrome Manifest V3 · WebDAV</p>
          <div className={styles.links}>
            <a href="https://github.com/ORDOABCHAOWT/SmartBookmark" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <Link href="/vibe-coding">← 返回 Vibe coding</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
