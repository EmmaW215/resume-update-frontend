'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // After payment success, redirect to main page to refresh user info
    const timer = setTimeout(() => {
      router.replace('/');
    }, 2000); // 2 seconds delay for user to see the success message
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
      <p className="mb-2">You will be redirected to the main page shortly...</p>
      {sessionId && <p className="text-sm text-gray-500">Session ID: {sessionId}</p>}
    </div>
  );
}