import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // const uid = searchParams.get('uid');
  // TODO: 这里可以对接后端，查询真实 trialUsed 状态
  // 目前 mock，所有用户都未用过试用
  return NextResponse.json({ trialUsed: false });
} 