import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const VISITOR_COUNT_FILE = path.join(process.cwd(), 'visitor-count.json');

interface VisitorData {
  count: number;
  lastUpdated: string;
}

async function getVisitorCount(): Promise<VisitorData> {
  try {
    const data = await fs.readFile(VISITOR_COUNT_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // 如果文件不存在，返回初始值
    return {
      count: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

async function updateVisitorCount(): Promise<VisitorData> {
  const currentData = await getVisitorCount();
  const newData: VisitorData = {
    count: currentData.count + 1,
    lastUpdated: new Date().toISOString()
  };
  
  try {
    await fs.writeFile(VISITOR_COUNT_FILE, JSON.stringify(newData, null, 2));
  } catch (error) {
    console.error('Failed to write visitor count:', error);
  }
  
  return newData;
}

export async function GET() {
  try {
    const visitorData = await getVisitorCount();
    return NextResponse.json(visitorData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get visitor count' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const visitorData = await updateVisitorCount();
    return NextResponse.json(visitorData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update visitor count' },
      { status: 500 }
    );
  }
} 