// 测试访问者计数器API的脚本
// 使用方法: node test-visitor-counter.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testVisitorCounter() {
  console.log('🧪 Testing Visitor Counter API...');
  console.log('📍 Base URL:', BASE_URL);
  
  try {
    // 测试 GET 请求
    console.log('\n📡 Testing GET /api/visitor-count...');
    const getResponse = await fetch(`${BASE_URL}/api/visitor-count`);
    console.log('GET Status:', getResponse.status);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET Response:', getData);
    } else {
      const errorText = await getResponse.text();
      console.log('❌ GET Error:', errorText);
    }
    
    // 测试 POST 请求
    console.log('\n📡 Testing POST /api/visitor-count...');
    const postResponse = await fetch(`${BASE_URL}/api/visitor-count`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('POST Status:', postResponse.status);
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST Response:', postData);
    } else {
      const errorText = await postResponse.text();
      console.log('❌ POST Error:', errorText);
    }
    
    // 再次测试 GET 请求查看是否更新
    console.log('\n📡 Testing GET /api/visitor-count again...');
    const getResponse2 = await fetch(`${BASE_URL}/api/visitor-count`);
    console.log('GET Status:', getResponse2.status);
    
    if (getResponse2.ok) {
      const getData2 = await getResponse2.json();
      console.log('✅ GET Response (after POST):', getData2);
    } else {
      const errorText = await getResponse2.text();
      console.log('❌ GET Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testVisitorCounter();
}

module.exports = { testVisitorCounter }; 