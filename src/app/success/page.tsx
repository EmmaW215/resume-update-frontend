'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../firebase";

export default function SuccessPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 支付成功后刷新用户状态
    if (user) {
      fetch(`/api/user/status?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            console.log('User status refreshed after payment:', data);
          }
        })
        .catch(error => {
          console.error('Failed to refresh user status:', error);
        });
    }

    // 倒计时重定向
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for upgrading to MatchWise. Your account has been updated successfully.
          </p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-blue-800 font-medium">
            Redirecting to MatchWise in {countdown} seconds...
          </p>
        </div>
        
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
        >
          Go to MatchWise Now
        </button>
      </div>
    </div>
  );
}