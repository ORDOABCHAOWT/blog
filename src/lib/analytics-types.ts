export type AnalyticsBreakdownRow = {
  label: string;
  pageviews: number;
  visitors: number;
};

export type AnalyticsTrendRow = {
  date: string;
  pageviews: number;
  visitors: number;
};

export type AnalyticsDashboardData = {
  rangeDays: 7 | 30;
  from: string;
  to: string;
  updatedAt: string;
  totals: {
    pageviews: number;
    visitors: number;
    viewsPerVisitor: number;
  };
  trend: AnalyticsTrendRow[];
  paths: AnalyticsBreakdownRow[];
  countries: AnalyticsBreakdownRow[];
  referrers: AnalyticsBreakdownRow[];
  devices: AnalyticsBreakdownRow[];
  operatingSystems: AnalyticsBreakdownRow[];
};

export type AnalyticsApiResponse =
  | { data: AnalyticsDashboardData }
  | {
      code: 'not_configured' | 'upstream_error';
      error: string;
    };
