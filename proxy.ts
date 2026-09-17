import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Next.js 16부터 middleware.ts는 deprecated → proxy.ts로 개명됐다(node_modules/next/dist/docs 확인,
// AGENTS.md 지침). accessToken 본체는 localStorage에만 있어 서버(proxy)가 볼 수 없으므로, 로그인 시
// lib/auth-context.tsx가 함께 심어두는 "session" 쿠키(값 자체는 의미 없음, 존재 여부만 확인)로 보호
// 라우트를 가드한다(ROADMAP T-25). matcher가 대상 경로를 이미 좁혀주므로 여기서는 쿠키만 본다.
export function proxy(request: NextRequest) {
  if (request.cookies.has('session')) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/reports/new/:path*', '/me/:path*', '/admin/:path*'],
};
