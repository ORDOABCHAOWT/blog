import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只保护管理端点，API 端点公开访问（API 端点内部有自己的保护逻辑）
  if (pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization');
    const cookieAuth = request.cookies.get('admin-auth');

    // 检查 Cookie 或 Authorization header
    if (cookieAuth?.value === 'authenticated') {
      return NextResponse.next();
    }

    // 从请求头中提取认证信息
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('需要认证', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Blog Admin Area"',
          'Content-Type': 'text/plain; charset=utf-8'
        },
      });
    }

    // 解码 Base64 认证信息
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // 验证用户名和密码（从环境变量读取）
    const validUsername = process.env.ADMIN_USER || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD;

    // 如果未设置密码，则拒绝访问（安全优先）
    if (!validPassword) {
      console.error('⚠️ ADMIN_PASSWORD 未配置！');
      return new NextResponse('服务器配置错误', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
      });
    }

    // 验证凭据
    if (username !== validUsername || password !== validPassword) {
      return new NextResponse('用户名或密码错误', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Blog Admin Area"',
          'Content-Type': 'text/plain; charset=utf-8'
        },
      });
    }

    // 认证成功，设置 cookie
    const response = NextResponse.next();
    response.cookies.set('admin-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
