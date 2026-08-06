import Link from 'next/link';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <main className="admin-container px-8 py-12">
      <div className="analytics-shell mx-auto">
        <header className="analytics-page-header">
          <div>
            <p className="eyebrow">Editorial · CMS / Analytics</p>
            <h1>流量统计</h1>
            <p className="analytics-page-description">
              了解有多少人正在阅读、他们从哪里来，以及哪些内容最受欢迎。
            </p>
          </div>
          <nav className="analytics-page-actions" aria-label="页面导航">
            <a
              href="https://vercel.com/ordoabchaowts-projects/blog/analytics?environment=all"
              className="admin-button admin-button-secondary px-5"
              target="_blank"
              rel="noreferrer"
            >
              在 Vercel 查看 ↗
            </a>
            <Link href="/admin" className="admin-button admin-button-primary px-5">
              返回管理后台
            </Link>
          </nav>
        </header>

        <AnalyticsDashboard />
      </div>
    </main>
  );
}
