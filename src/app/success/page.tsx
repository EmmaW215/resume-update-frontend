// src/app/success/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  // 你可以在这里用 sessionId 调用后端，确认支付状态，刷新会员信息等

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
      <p className="mb-2">Thank you for your purchase.</p>
      {sessionId && <p className="text-sm text-gray-500">Session ID: {sessionId}</p>}
      {/* 你可以加个按钮返回首页 */}
    </div>
  );
}