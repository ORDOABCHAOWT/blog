import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(relativePath) {
  return fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

const adminPage = read('src/app/admin/page.tsx');
const analyticsPage = read('src/app/admin/analytics/page.tsx');
const analyticsDashboard = read('src/components/AnalyticsDashboard.tsx');
const analyticsRoute = read('src/app/api/analytics/route.ts');
const analyticsServer = read('src/lib/vercel-web-analytics.ts');

test('CMS links to a dedicated Vercel Web Analytics dashboard', () => {
  assert.match(adminPage, /href="\/admin\/analytics"/);
  assert.match(analyticsPage, /<AnalyticsDashboard \/>/);
  assert.match(analyticsDashboard, /浏览量/);
  assert.match(analyticsDashboard, /访客地区/);
  assert.match(analyticsDashboard, /热门页面/);
  assert.match(analyticsDashboard, /访问来源/);
  assert.match(analyticsDashboard, /设备类型/);
  assert.match(analyticsDashboard, /操作系统/);
});

test('analytics dashboard supports the reporting windows available on the Hobby plan', () => {
  assert.match(analyticsDashboard, /useState<7 \| 30>\(7\)/);
  assert.match(analyticsDashboard, /\(\[7, 30\] as const\)/);
});

test('analytics API remains local-only and keeps the Vercel token server-side', () => {
  assert.match(
    analyticsRoute,
    /!isCmsAvailable\(\)\) return cmsUnavailableResponse\(\)/
  );
  assert.match(analyticsServer, /process\.env\.VERCEL_ANALYTICS_TOKEN/);
  assert.match(analyticsServer, /com\.vercel\.cli/);
  assert.match(analyticsServer, /Authorization: `Bearer \$\{token\}`/);
  assert.doesNotMatch(analyticsServer, /NEXT_PUBLIC_/);
  assert.doesNotMatch(analyticsDashboard, /VERCEL_ANALYTICS_TOKEN|Authorization/);
});

test('analytics requests are bounded and never use cached traffic data', () => {
  assert.match(analyticsServer, /UPSTREAM_TIMEOUT_MS = 10_000/);
  assert.match(analyticsServer, /AbortSignal\.timeout\(UPSTREAM_TIMEOUT_MS\)/);
  assert.match(analyticsServer, /cache: 'no-store'/);
  assert.match(analyticsRoute, /Cache-Control': 'private, no-store'/);
});
