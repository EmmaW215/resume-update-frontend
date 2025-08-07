'use client';

import React, { useState, useEffect } from 'react';

interface VisitorCounterProps {
  className?: string;
}

interface VisitorData {
  count: number;
  lastUpdated: string;
}

export default function VisitorCounter({ className = '' }: VisitorCounterProps) {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    const updateVisitorCount = async () => {
      try {
        console.log('🔄 VisitorCounter: Starting update...');
        setIsLoading(true);
        setError('');
        
        // 更新访客计数
        const response = await fetch('/api/visitor-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // 添加超时设置
          signal: AbortSignal.timeout(10000), // 10秒超时
        });

        console.log('📡 VisitorCounter: Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ VisitorCounter: Response not ok:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data: VisitorData = await response.json();
        console.log('✅ VisitorCounter: Successfully updated count:', data);
        setVisitorCount(data.count);
        setRetryCount(0); // 重置重试计数
      } catch (err) {
        console.error('❌ VisitorCounter error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to update visitor count: ${errorMessage}`);
        
        // 如果是网络错误，尝试重试
        if (retryCount < 3 && (errorMessage.includes('fetch') || errorMessage.includes('timeout'))) {
          console.log(`🔄 VisitorCounter: Retrying... (${retryCount + 1}/3)`);
          setRetryCount(prev => prev + 1);
          // 延迟重试
          setTimeout(() => {
            updateVisitorCount();
          }, 2000 * (retryCount + 1)); // 递增延迟
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    updateVisitorCount();
  }, [retryCount]);

  // 格式化数字显示
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full animate-pulse ${
          isLoading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'
        }`}></div>
        <span className="text-sm text-gray-600 font-medium">Visitors:</span>
      </div>
      
      {isLoading ? (
        <div className="text-lg font-bold text-blue-600 animate-pulse">
          {retryCount > 0 ? `Retrying...` : `...`}
        </div>
      ) : error ? (
        <div className="text-sm text-red-500" title={error}>
          Error
        </div>
      ) : (
        <div className="text-lg font-bold text-blue-600 transition-all duration-300 ease-in-out">
          {formatNumber(visitorCount)}
        </div>
      )}
    </div>
  );
} 