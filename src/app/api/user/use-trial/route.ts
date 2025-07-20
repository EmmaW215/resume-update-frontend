import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'UID is required' }, { status: 400 });
  }

  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-matcher-backend-rrrw.onrender.com';
    const response = await fetch(`${BACKEND_URL}/api/user/use-trial?uid=${uid}`, {
      method: 'POST',
    });
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error marking trial as used:', error);
    return NextResponse.json({ error: 'Failed to mark trial as used' }, { status: 500 });
  }
} 