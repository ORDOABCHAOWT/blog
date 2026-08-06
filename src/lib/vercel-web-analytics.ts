import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  AnalyticsBreakdownRow,
  AnalyticsDashboardData,
  AnalyticsTrendRow,
} from '@/lib/analytics-types';

const ANALYTICS_API_BASE =
  'https://api.vercel.com/v1/query/web-analytics/visits';
const DEFAULT_PROJECT_ID = 'blog';
const DEFAULT_TEAM_SLUG = 'ordoabchaowts-projects';
const UPSTREAM_TIMEOUT_MS = 10_000;

type VercelAnalyticsRow = Record<string, unknown> & {
  pageviews?: number;
  visitors?: number;
  timestamp?: string;
};

type VercelAnalyticsResponse = {
  data?: VercelAnalyticsRow[] | {
    pageviews?: number;
    visitors?: number;
  };
};

export class AnalyticsConfigurationError extends Error {}

export class AnalyticsUpstreamError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

function readVercelCliToken() {
  const candidatePaths = [
    process.env.XDG_CONFIG_HOME
      ? path.join(process.env.XDG_CONFIG_HOME, 'com.vercel.cli', 'auth.json')
      : '',
    path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'com.vercel.cli',
      'auth.json'
    ),
    path.join(os.homedir(), '.local', 'share', 'com.vercel.cli', 'auth.json'),
  ].filter(Boolean);

  for (const candidatePath of candidatePaths) {
    try {
      const auth = JSON.parse(fs.readFileSync(candidatePath, 'utf8')) as {
        token?: unknown;
      };
      if (typeof auth.token === 'string' && auth.token.trim()) {
        return auth.token.trim();
      }
    } catch {
      // A missing or unreadable CLI credential simply falls through to setup state.
    }
  }

  return undefined;
}

function getConfig() {
  const token =
    process.env.VERCEL_ANALYTICS_TOKEN?.trim() || readVercelCliToken();

  if (!token) {
    throw new AnalyticsConfigurationError(
      '尚未配置 Vercel Analytics 访问令牌，也没有检测到 Vercel CLI 登录。'
    );
  }

  return {
    token,
    projectId:
      process.env.VERCEL_ANALYTICS_PROJECT_ID?.trim() || DEFAULT_PROJECT_ID,
    teamSlug:
      process.env.VERCEL_ANALYTICS_TEAM_SLUG?.trim() || DEFAULT_TEAM_SLUG,
  };
}

function toUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(days: 7 | 30) {
  const until = new Date();
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - days + 1);

  return {
    since: toUtcDate(since),
    until: toUtcDate(until),
  };
}

async function queryVercelAnalytics(
  endpoint: 'count' | 'aggregate',
  query: Record<string, string>
) {
  const { token, projectId, teamSlug } = getConfig();
  const url = new URL(`${ANALYTICS_API_BASE}/${endpoint}`);

  url.searchParams.set('projectId', projectId);
  url.searchParams.set('slug', teamSlug);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? 'Vercel 访问令牌无效、已过期，或没有此项目的读取权限。'
        : 'Vercel Analytics 暂时无法返回数据。';
    throw new AnalyticsUpstreamError(message, response.status);
  }

  return (await response.json()) as VercelAnalyticsResponse;
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asRows(response: VercelAnalyticsResponse) {
  return Array.isArray(response.data) ? response.data : [];
}

function toBreakdown(
  response: VercelAnalyticsResponse,
  dimension: string,
  fallbackLabel: string
): AnalyticsBreakdownRow[] {
  return asRows(response).map((row) => {
    const rawLabel = row[dimension];
    return {
      label:
        typeof rawLabel === 'string' && rawLabel.trim()
          ? rawLabel
          : fallbackLabel,
      pageviews: asNumber(row.pageviews),
      visitors: asNumber(row.visitors),
    };
  });
}

function fillTrend(
  response: VercelAnalyticsResponse,
  since: string,
  days: 7 | 30
): AnalyticsTrendRow[] {
  const values = new Map(
    asRows(response).map((row) => [
      typeof row.timestamp === 'string' ? row.timestamp.slice(0, 10) : '',
      {
        pageviews: asNumber(row.pageviews),
        visitors: asNumber(row.visitors),
      },
    ])
  );
  const firstDay = new Date(`${since}T00:00:00.000Z`);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(firstDay);
    date.setUTCDate(firstDay.getUTCDate() + index);
    const dateKey = toUtcDate(date);
    const value = values.get(dateKey);

    return {
      date: dateKey,
      pageviews: value?.pageviews ?? 0,
      visitors: value?.visitors ?? 0,
    };
  });
}

export async function getAnalyticsDashboard(
  rangeDays: 7 | 30
): Promise<AnalyticsDashboardData> {
  const { since, until } = getDateRange(rangeDays);
  const rangeQuery = { since, until };
  const aggregateQuery = {
    ...rangeQuery,
    limit: '8',
  };

  const [totals, trend, paths, countries, referrers, devices, operatingSystems] =
    await Promise.all([
      queryVercelAnalytics('count', rangeQuery),
      queryVercelAnalytics('aggregate', { ...rangeQuery, by: 'day', limit: '30' }),
      queryVercelAnalytics('aggregate', { ...aggregateQuery, by: 'requestPath' }),
      queryVercelAnalytics('aggregate', { ...aggregateQuery, by: 'country' }),
      queryVercelAnalytics('aggregate', {
        ...aggregateQuery,
        by: 'referrerHostname',
      }),
      queryVercelAnalytics('aggregate', { ...aggregateQuery, by: 'deviceType' }),
      queryVercelAnalytics('aggregate', { ...aggregateQuery, by: 'osName' }),
    ]);

  const totalsData = Array.isArray(totals.data) ? undefined : totals.data;
  const pageviews = asNumber(totalsData?.pageviews);
  const visitors = asNumber(totalsData?.visitors);

  return {
    rangeDays,
    from: since,
    to: until,
    updatedAt: new Date().toISOString(),
    totals: {
      pageviews,
      visitors,
      viewsPerVisitor:
        visitors > 0 ? Number((pageviews / visitors).toFixed(2)) : 0,
    },
    trend: fillTrend(trend, since, rangeDays),
    paths: toBreakdown(paths, 'requestPath', '未知页面'),
    countries: toBreakdown(countries, 'country', '未知地区'),
    referrers: toBreakdown(referrers, 'referrerHostname', '直接访问'),
    devices: toBreakdown(devices, 'deviceType', '未知设备'),
    operatingSystems: toBreakdown(operatingSystems, 'osName', '未知系统'),
  };
}
