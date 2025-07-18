import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // 如果没有 uid，直接返回错误
  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  }

  // 代理请求到后端 trial-status
  const res = await fetch(`${BACKEND_URL}/api/user/trial-status?uid=${uid}`);
  const data = await res.json();

  return NextResponse.json(data);
}