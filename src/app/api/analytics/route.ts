import { NextRequest, NextResponse } from 'next/server';
import { cmsUnavailableResponse, isCmsAvailable } from '@/lib/cms-access';
import {
  AnalyticsConfigurationError,
  AnalyticsUpstreamError,
  getAnalyticsDashboard,
} from '@/lib/vercel-web-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isCmsAvailable()) return cmsUnavailableResponse();

  const requestedRange = request.nextUrl.searchParams.get('range');
  const rangeDays = requestedRange === '30' ? 30 : 7;

  try {
    const data = await getAnalyticsDashboard(rangeDays);
    return NextResponse.json(
      { data },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    if (error instanceof AnalyticsConfigurationError) {
      return NextResponse.json(
        { code: 'not_configured', error: error.message },
        { status: 503 }
      );
    }

    if (error instanceof AnalyticsUpstreamError) {
      return NextResponse.json(
        { code: 'upstream_error', error: error.message },
        { status: 502 }
      );
    }

    console.error('Failed to load Vercel Web Analytics:', error);
    return NextResponse.json(
      {
        code: 'upstream_error',
        error: '流量数据加载失败，请稍后重试。',
      },
      { status: 502 }
    );
  }
}
