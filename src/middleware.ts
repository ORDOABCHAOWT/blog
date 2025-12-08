import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保护管理端点和 API（但允许公开访问博客文章）
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    // 检查是否配置了认证
    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // 如果配置了认证信息，则要求认证
    if (adminUser && adminPassword) {
      const authHeader = request.headers.get('authorization');
      const expectedAuth = 'Basic ' + Buffer.from(`${adminUser}:${adminPassword}`).toString('base64');

      if (authHeader !== expectedAuth) {
        return new NextResponse('认证失败，需要管理员权限', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Blog Admin Area"',
            'Content-Type': 'text/plain; charset=utf-8'
          },
        });
      }
    }
    // 如果未配置认证，则在响应头中添加警告（但仍允许访问，保持向后兼容）
    else {
      console.warn('⚠️  警告: 未配置 ADMIN_USER 和 ADMIN_PASSWORD 环境变量，管理端点未受保护！');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
