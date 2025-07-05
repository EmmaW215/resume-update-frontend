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

  useEffect(() => {
    const updateVisitorCount = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // 更新访客计数
        const response = await fetch('/api/visitor-count', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to update visitor count');
        }

        const data: VisitorData = await response.json();
        setVisitorCount(data.count);
      } catch (err) {
        console.error('Visitor counter error:', err);
        setError('Failed to update visitor count');
      } finally {
        setIsLoading(false);
      }
    };

    updateVisitorCount();
  }, []);

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
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600 font-medium">Visitors:</span>
      </div>
      
      {isLoading ? (
        <div className="text-lg font-bold text-blue-600 animate-pulse">
          ...
        </div>
      ) : error ? (
        <div className="text-sm text-red-500">
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