'use client';

import React, { useState, useEffect } from 'react';

interface SimpleVisitorCounterProps {
  className?: string;
}

export default function SimpleVisitorCounter({ className = '' }: SimpleVisitorCounterProps) {
  const [mounted, setMounted] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
    
    // 只在客户端运行
    try {
      const currentCount = parseInt(localStorage.getItem('visitorCount') || '0');
      const newCount = currentCount + 1;
      localStorage.setItem('visitorCount', newCount.toString());
      setVisitorCount(newCount);
    } catch (err) {
      console.error('Visitor counter error:', err);
      setVisitorCount(0);
    }
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

  // 在客户端挂载前不渲染任何内容
  if (!mounted) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-600 font-medium">Visitors:</span>
      </div>
      <div className="text-lg font-bold text-blue-600 transition-all duration-300 ease-in-out">
        {formatNumber(visitorCount)}
      </div>
    </div>
  );
} 