'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AnalyticsApiResponse,
  AnalyticsBreakdownRow,
  AnalyticsDashboardData,
  AnalyticsTrendRow,
} from '@/lib/analytics-types';

const numberFormatter = new Intl.NumberFormat('zh-CN');
const compactNumberFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const regionNames =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['zh-CN'], { type: 'region' })
    : null;

const labelMaps: Record<string, string> = {
  Desktop: '桌面设备',
  Mobile: '手机',
  Tablet: '平板',
  Other: '其他',
  Others: '其他',
  Windows: 'Windows',
  macOS: 'macOS',
  iOS: 'iOS',
  Android: 'Android',
  Linux: 'Linux',
};

function formatDimensionLabel(label: string, dimension: 'country' | 'generic') {
  if (label === 'Others') return '其他';
  if (dimension === 'country' && /^[A-Z]{2}$/.test(label)) {
    try {
      return regionNames?.of(label) || label;
    } catch {
      return label;
    }
  }
  return labelMaps[label] || label;
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function TrendChart({ rows }: { rows: AnalyticsTrendRow[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const height = 250;
  const plot = { left: 46, right: 18, top: 18, bottom: 34 };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;
  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [row.pageviews, row.visitors])
  );
  const x = (index: number) =>
    plot.left + (rows.length <= 1 ? 0 : (index / (rows.length - 1)) * plotWidth);
  const y = (value: number) => plot.top + plotHeight - (value / maxValue) * plotHeight;
  const pageviewPoints = rows
    .map((row, index) => `${x(index)},${y(row.pageviews)}`)
    .join(' ');
  const visitorPoints = rows
    .map((row, index) => `${x(index)},${y(row.visitors)}`)
    .join(' ');
  const tickIndexes = Array.from(
    new Set([0, Math.floor((rows.length - 1) / 2), rows.length - 1])
  ).filter((index) => index >= 0);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const updateWidth = () => {
      setWidth(Math.max(280, Math.round(chart.clientWidth)));
    };
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="analytics-chart-wrap" ref={chartRef}>
      <svg
        className="analytics-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="所选时段内每天的浏览量与访客数趋势"
      >
        {[0, 0.5, 1].map((fraction) => {
          const lineY = plot.top + plotHeight * fraction;
          const value = maxValue * (1 - fraction);
          const label = Number.isInteger(value)
            ? compactNumberFormatter.format(value)
            : value.toFixed(1);
          return (
            <g key={fraction}>
              <line
                x1={plot.left}
                x2={width - plot.right}
                y1={lineY}
                y2={lineY}
                className="analytics-chart-grid"
              />
              <text x={plot.left - 10} y={lineY + 4} textAnchor="end">
                {label}
              </text>
            </g>
          );
        })}

        {rows.length > 1 && (
          <>
            <polyline
              points={pageviewPoints}
              className="analytics-chart-line analytics-chart-line-pageviews"
            />
            <polyline
              points={visitorPoints}
              className="analytics-chart-line analytics-chart-line-visitors"
            />
          </>
        )}

        {tickIndexes.map((index) => (
          <text
            key={rows[index]?.date}
            x={x(index)}
            y={height - 9}
            textAnchor={index === 0 ? 'start' : index === rows.length - 1 ? 'end' : 'middle'}
          >
            {rows[index] ? formatDateLabel(rows[index].date) : ''}
          </text>
        ))}
      </svg>
    </div>
  );
}

function BreakdownList({
  rows,
  emptyLabel,
  dimension = 'generic',
}: {
  rows: AnalyticsBreakdownRow[];
  emptyLabel: string;
  dimension?: 'country' | 'generic';
}) {
  const maxPageviews = Math.max(1, ...rows.map((row) => row.pageviews));

  if (rows.length === 0) {
    return <p className="analytics-empty">{emptyLabel}</p>;
  }

  return (
    <ol className="analytics-ranking">
      {rows.map((row, index) => (
        <li key={`${row.label}-${index}`}>
          <div className="analytics-ranking-copy">
            <span title={row.label}>
              {formatDimensionLabel(row.label, dimension)}
            </span>
            <strong>{numberFormatter.format(row.pageviews)}</strong>
          </div>
          <div className="analytics-ranking-track" aria-hidden="true">
            <span style={{ width: `${(row.pageviews / maxPageviews) * 100}%` }} />
          </div>
          <span className="analytics-ranking-meta">
            {numberFormatter.format(row.visitors)} 位访客
          </span>
        </li>
      ))}
    </ol>
  );
}

function SetupState() {
  return (
    <section className="admin-card analytics-setup" aria-labelledby="analytics-setup-title">
      <span className="analytics-setup-icon" aria-hidden="true">↗</span>
      <div>
        <p className="eyebrow">One-time setup</p>
        <h2 id="analytics-setup-title">连接 Vercel 流量数据</h2>
        <p>
          页面已经准备好，只差本机的 Vercel CLI 登录，或一个保存在本地环境文件中的访问令牌。凭证不会发往浏览器、不会提交到 Git，也不会部署到线上。
        </p>
        <p className="analytics-setup-note">
          配置完成后，这里会自动显示真实数据；没有演示数据或估算值。
        </p>
      </div>
    </section>
  );
}

export default function AnalyticsDashboard() {
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [error, setError] = useState<Extract<AnalyticsApiResponse, { error: string }> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = '流量统计 | Taffy CMS';
    const controller = new AbortController();

    async function loadAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analytics?range=${rangeDays}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const payload = (await response.json()) as AnalyticsApiResponse;

        if (!response.ok || !('data' in payload)) {
          setData(null);
          setError(
            'error' in payload
              ? payload
              : { code: 'upstream_error', error: '流量数据加载失败。' }
          );
          return;
        }

        setData(payload.data);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return;
        }
        setData(null);
        setError({ code: 'upstream_error', error: '无法连接流量统计服务。' });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAnalytics();
    return () => controller.abort();
  }, [rangeDays, refreshKey]);

  const updatedLabel = useMemo(() => {
    if (!data) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(data.updatedAt));
  }, [data]);

  return (
    <div className="analytics-dashboard" aria-busy={loading}>
      <div className="analytics-toolbar" aria-label="统计时间范围">
        <div className="analytics-segmented-control">
          {([7, 30] as const).map((days) => (
            <button
              key={days}
              type="button"
              className={rangeDays === days ? 'is-active' : ''}
              onClick={() => setRangeDays(days)}
              aria-pressed={rangeDays === days}
            >
              {days} 天
            </button>
          ))}
        </div>
        <button
          type="button"
          className="admin-button admin-button-secondary analytics-refresh px-4"
          onClick={() => setRefreshKey((key) => key + 1)}
          disabled={loading}
        >
          {loading ? '加载中…' : '刷新数据'}
        </button>
      </div>

      {loading && !data && !error && (
        <div className="analytics-loading" role="status">
          <span />
          正在读取 Vercel Analytics…
        </div>
      )}

      {!loading && error?.code === 'not_configured' && <SetupState />}

      {!loading && error?.code === 'upstream_error' && (
        <div className="admin-alert admin-alert-error analytics-error" role="alert">
          <strong>暂时无法读取统计数据</strong>
          <span>{error.error}</span>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
            重试
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="analytics-status-line" role="status">
            <span><i />已连接 Vercel Web Analytics</span>
            <span>{data.from} — {data.to} · 更新于 {updatedLabel}</span>
          </div>

          <section className="analytics-kpis" aria-label="核心指标">
            <article className="analytics-kpi-card">
              <p>浏览量</p>
              <strong>{numberFormatter.format(data.totals.pageviews)}</strong>
              <span>Pageviews</span>
            </article>
            <article className="analytics-kpi-card">
              <p>访客数</p>
              <strong>{numberFormatter.format(data.totals.visitors)}</strong>
              <span>每日匿名访客去重</span>
            </article>
            <article className="analytics-kpi-card">
              <p>人均浏览</p>
              <strong>{data.totals.viewsPerVisitor.toFixed(2)}</strong>
              <span>浏览量 ÷ 访客数</span>
            </article>
          </section>

          <section className="analytics-panel analytics-trend-panel">
            <div className="analytics-panel-heading">
              <div>
                <p className="eyebrow">Traffic trend</p>
                <h2>访问趋势</h2>
              </div>
              <div className="analytics-legend" aria-label="图例">
                <span className="is-pageviews">浏览量</span>
                <span className="is-visitors">访客数</span>
              </div>
            </div>
            <TrendChart rows={data.trend} />
          </section>

          <div className="analytics-grid analytics-grid-primary">
            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">Content</p>
                  <h2>热门页面</h2>
                </div>
                <span>按浏览量</span>
              </div>
              <BreakdownList rows={data.paths} emptyLabel="这段时间还没有页面访问" />
            </section>

            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">Audience</p>
                  <h2>访客地区</h2>
                </div>
                <span>按浏览量</span>
              </div>
              <BreakdownList
                rows={data.countries}
                emptyLabel="这段时间还没有地区数据"
                dimension="country"
              />
            </section>
          </div>

          <div className="analytics-grid analytics-grid-secondary">
            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">Acquisition</p>
                  <h2>访问来源</h2>
                </div>
              </div>
              <BreakdownList rows={data.referrers} emptyLabel="这段时间还没有来源数据" />
            </section>

            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">Devices</p>
                  <h2>设备类型</h2>
                </div>
              </div>
              <BreakdownList rows={data.devices} emptyLabel="这段时间还没有设备数据" />
            </section>

            <section className="analytics-panel">
              <div className="analytics-panel-heading">
                <div>
                  <p className="eyebrow">Systems</p>
                  <h2>操作系统</h2>
                </div>
              </div>
              <BreakdownList
                rows={data.operatingSystems}
                emptyLabel="这段时间还没有系统数据"
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
