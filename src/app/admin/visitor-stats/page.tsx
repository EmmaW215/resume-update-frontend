'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface VisitorData {
  count: number;
  lastUpdated: string;
}

export default function VisitorStatsPage() {
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  // 简单的密码验证（实际项目中应该使用更安全的方式）
  const ADMIN_PASSWORD = 'matchwise2024';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_authenticated', 'true');
    } else {
      setError('Invalid password');
    }
  };

  useEffect(() => {
    const authenticated = localStorage.getItem('admin_authenticated') === 'true';
    if (authenticated) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchVisitorStats = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const response = await fetch('/api/visitor-count', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch visitor stats');
        }

        const data: VisitorData = await response.json();
        setVisitorData(data);
      } catch (err) {
        console.error('Visitor stats error:', err);
        setError('Failed to fetch visitor statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisitorStats();
  }, [isAuthenticated]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    setVisitorData(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Admin Access
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Visitor Statistics
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition"
            >
              Logout
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading statistics...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500">{error}</div>
            </div>
          ) : visitorData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-800 mb-4">
                  Total Visitors
                </h2>
                <div className="text-4xl font-bold text-blue-600">
                  {visitorData.count.toLocaleString()}
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  Unique page visits
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-green-800 mb-4">
                  Last Updated
                </h2>
                <div className="text-lg font-semibold text-green-600">
                  {formatDate(visitorData.lastUpdated)}
                </div>
                <p className="text-sm text-green-600 mt-2">
                  Most recent visitor
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Quick Actions
            </h2>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
              >
                Back to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow transition"
              >
                Refresh Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 