import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 允许访问计数器API无需身份验证
  if (request.nextUrl.pathname === '/api/visitor-count') {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/visitor-count'
  ]
};