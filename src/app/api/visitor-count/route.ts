import { NextResponse } from 'next/server';

const VISITOR_COUNT_KEY = 'matchwise_visitor_count';

// 尝试导入 Vercel KV，如果失败则使用备用方案
let kv: {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<void>;
} | null = null;
let useKV = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const kvModule = require('@vercel/kv') as { kv: typeof kv };
  kv = kvModule.kv;
  useKV = true;
  console.log('✅ @vercel/kv loaded successfully');
} catch (error) {
  console.log('⚠️ @vercel/kv not available, using fallback:', error);
  useKV = false;
}

interface VisitorData {
  count: number;
  lastUpdated: string;
}

// 简单的内存存储作为备用方案
let memoryStorage: VisitorData = {
  count: 116,
  lastUpdated: new Date().toISOString()
};

async function getVisitorCount(): Promise<VisitorData> {
  if (useKV && kv) {
    try {
      console.log('📡 Attempting to read visitor count from Vercel KV...');
      const data = await kv.get<VisitorData>(VISITOR_COUNT_KEY);
      
      if (data) {
        console.log('✅ Successfully read visitor count from KV:', data);
        return data;
      } else {
        console.log('⚠️ No visitor count found in KV, creating initial data');
        // 如果KV中没有数据，返回初始值（设置为116以保持现有计数）
        const initialData: VisitorData = {
          count: 116,
          lastUpdated: new Date().toISOString()
        };
        
        // 将初始数据保存到KV
        await kv.set(VISITOR_COUNT_KEY, initialData);
        console.log('✅ Created initial visitor count in KV:', initialData);
        return initialData;
      }
    } catch (error) {
      console.error('❌ Failed to read from Vercel KV, falling back to memory:', error);
      useKV = false; // 禁用 KV，改用内存存储
    }
  }
  
  // 使用内存存储
  console.log('📁 Using memory storage:', memoryStorage);
  return memoryStorage;
}

async function updateVisitorCount(): Promise<VisitorData> {
  console.log('🔄 Updating visitor count...');
  const currentData = await getVisitorCount();
  const newData: VisitorData = {
    count: currentData.count + 1,
    lastUpdated: new Date().toISOString()
  };
  
  console.log('📊 Current count:', currentData.count, '-> New count:', newData.count);
  
  if (useKV && kv) {
    try {
      // 保存到 Vercel KV
      await kv.set(VISITOR_COUNT_KEY, newData);
      console.log('✅ Successfully updated visitor count in KV');
      return newData;
    } catch (error) {
      console.error('❌ Failed to write to Vercel KV, falling back to memory:', error);
      useKV = false; // 禁用 KV，改用内存存储
    }
  }
  
  // 使用内存存储
  memoryStorage = newData;
  console.log('💾 Updated memory storage:', memoryStorage);
  return newData;
}

export async function GET() {
  console.log('📡 GET /api/visitor-count called');
  try {
    const visitorData = await getVisitorCount();
    console.log('✅ GET response:', visitorData);
    return NextResponse.json(visitorData);
  } catch (error) {
    console.error('❌ GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get visitor count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  console.log('📡 POST /api/visitor-count called');
  try {
    const visitorData = await updateVisitorCount();
    console.log('✅ POST response:', visitorData);
    return NextResponse.json(visitorData);
  } catch (error) {
    console.error('❌ POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update visitor count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 