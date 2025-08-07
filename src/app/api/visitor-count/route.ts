import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const VISITOR_COUNT_KEY = 'matchwise_visitor_count';
const INIT_FLAG_KEY = 'matchwise_init_flag';

interface VisitorData {
  count: number;
  lastUpdated: string;
}

// 内存缓存，防止KV临时不可用时丢失计数
let memoryCache: VisitorData | null = null;
let lastKVUpdateTime = 0;

async function getVisitorCount(): Promise<VisitorData> {
  try {
    console.log('📡 Attempting to read visitor count from Vercel KV...');
    const data = await kv.get<VisitorData>(VISITOR_COUNT_KEY);
    
    if (data) {
      console.log('✅ Successfully read visitor count from KV:', data);
      memoryCache = data; // 更新内存缓存
      lastKVUpdateTime = Date.now();
      return data;
    } else {
      // 检查是否是首次初始化
      const initFlag = await kv.get(INIT_FLAG_KEY);
      
      if (!initFlag) {
        // 首次初始化 - 设置为116
        console.log('🎯 First time initialization, setting count to 116');
        const initialData: VisitorData = {
          count: 116,
          lastUpdated: new Date().toISOString()
        };
        
        // 设置初始数据和初始化标记
        await kv.set(VISITOR_COUNT_KEY, initialData);
        await kv.set(INIT_FLAG_KEY, 'initialized');
        
        memoryCache = initialData;
        lastKVUpdateTime = Date.now();
        console.log('✅ Created initial visitor count in KV:', initialData);
        return initialData;
      } else {
        // 已经初始化过，但数据丢失 - 使用内存缓存或返回错误
        console.log('⚠️ Init flag exists but no visitor data found - possible data loss');
        if (memoryCache && (Date.now() - lastKVUpdateTime < 300000)) { // 5分钟内的缓存有效
          console.log('📋 Using memory cache:', memoryCache);
          return memoryCache;
        } else {
          // 缓存过期或不存在，这是一个严重问题
          console.error('❌ Data appears to be lost and no valid cache available');
          throw new Error('Visitor data lost and no valid backup available');
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to read from Vercel KV:', error);
    
    // 如果有有效的内存缓存，使用它
    if (memoryCache && (Date.now() - lastKVUpdateTime < 300000)) { // 5分钟内的缓存有效
      console.log('📋 KV failed, using memory cache:', memoryCache);
      return memoryCache;
    }
    
    // 如果没有缓存，这可能是系统问题，抛出错误而不是重置计数器
    throw new Error(`KV connection failed and no valid cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function updateVisitorCount(): Promise<VisitorData> {
  console.log('🔄 Updating visitor count...');
  const currentData = await getVisitorCount();
  const newData: VisitorData = {
    count: currentData.count + 1,
    lastUpdated: new Date().toISOString()
  };
  
  console.log('📊 Current count:', currentData.count, '-> New count:', newData.count);
  
  try {
    // 保存到 Vercel KV
    await kv.set(VISITOR_COUNT_KEY, newData);
    console.log('✅ Successfully updated visitor count in KV');
    
    // 更新内存缓存
    memoryCache = newData;
    lastKVUpdateTime = Date.now();
  } catch (error) {
    console.error('❌ Failed to write to Vercel KV:', error);
    // 即使KV写入失败，也更新内存缓存
    memoryCache = newData;
    lastKVUpdateTime = Date.now();
    console.log('📋 Updated memory cache despite KV failure');
  }
  
  return newData;
}

export async function GET() {
  console.log('📡 GET /api/visitor-count called');
  try {
    const visitorData = await getVisitorCount();
    console.log('✅ GET response:', visitorData);
    
    const response = NextResponse.json(visitorData);
    // 添加CORS头部
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('❌ GET error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to get visitor count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    
    // 即使错误响应也添加CORS头部
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

export async function POST() {
  console.log('📡 POST /api/visitor-count called');
  try {
    const visitorData = await updateVisitorCount();
    console.log('✅ POST response:', visitorData);
    
    const response = NextResponse.json(visitorData);
    // 添加CORS头部
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('❌ POST error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to update visitor count', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
    
    // 即使错误响应也添加CORS头部
    errorResponse.headers.set('Access-Control-Allow-Origin', '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return errorResponse;
  }
}

// 添加OPTIONS方法处理预检请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 