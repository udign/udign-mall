'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { DesignStats } from '@/lib/dashboard/designStats';
import { Button } from '@/components/ui/primitives/button';

interface DesignStatsSectionProps {
  initialStats: DesignStats;
}

export default function DesignStatsSection({ initialStats }: DesignStatsSectionProps) {
  const [stats, setStats] = useState<DesignStats>(initialStats);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/admin/design-stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
        setLastUpdated(dayjs().format('HH:mm'));
      } else {
        console.error('디자인 통계 조회 실패:', result.message);
      }
    } catch (error) {
      console.error('디자인 통계 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>디자인 현황</h2>
        <Button
          onClick={fetchStats}
          disabled={isLoading}
          variant='ghost'
          size='sm'
          className='text-sm text-gray-500 hover:text-gray-700'
        >
          <RefreshCw className={`h-4 w-4 ${isLoading && 'animate-spin'}`} />
          {lastUpdated ? `최근 ${lastUpdated}` : '새로고침'}
        </Button>
      </div>
      <div className='grid grid-cols-3 gap-4'>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>전체</div>
          <div className='text-xl font-bold text-blue-600'>{stats.total.toLocaleString()}</div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>신규</div>
          <div className='text-xl font-bold text-gray-900'>{stats.new.toLocaleString()}</div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>승인</div>
          <div className='text-xl font-bold text-gray-900'>{stats.approved.toLocaleString()}</div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>제작검토</div>
          <div className='text-xl font-bold text-gray-900'>{stats.review.toLocaleString()}</div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>결제</div>
          <div className='text-xl font-bold text-gray-900'>{stats.payment.toLocaleString()}</div>
        </div>
        <div className='text-center'>
          <div className='text-sm text-gray-600'>제작</div>
          <div className='text-xl font-bold text-gray-900'>{stats.making.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
