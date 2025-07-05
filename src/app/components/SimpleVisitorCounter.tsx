'use client';

import React, { useState, useEffect } from 'react';

interface SimpleVisitorCounterProps {
  className?: string;
}

export default function SimpleVisitorCounter({ className = '' }: SimpleVisitorCounterProps) {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    // 标记组件已在客户端运行
    setIsClient(true);
    
    // 使用localStorage来模拟访客计数
    const updateVisitorCount = () => {
      try {
        setIsLoading(true);
        
        // 从localStorage获取当前计数
        const currentCount = parseInt(localStorage.getItem('visitorCount') || '0');
        const newCount = currentCount + 1;
        
        // 更新localStorage
        localStorage.setItem('visitorCount', newCount.toString());
        localStorage.setItem('lastVisit', new Date().toISOString());
        
        setVisitorCount(newCount);
      } catch (err) {
        console.error('Visitor counter error:', err);
        setVisitorCount(0);
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

  // 在服务器端渲染时显示加载状态
  if (!isClient) {
    return (
      <div className={`flex items-center justify-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 font-medium">Visitors:</span>
        </div>
        <div className="text-lg font-bold text-blue-600 animate-pulse">
          ...
        </div>
      </div>
    );
  }

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
      ) : (
        <div className="text-lg font-bold text-blue-600 transition-all duration-300 ease-in-out">
          {formatNumber(visitorCount)}
        </div>
      )}
    </div>
  );
} 