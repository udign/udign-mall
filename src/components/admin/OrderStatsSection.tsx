'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { OrderStats } from '@/lib/dashboard/orderStats';
import { Button } from '@/components/ui/primitives/button';

interface OrderStatsSectionProps {
  initialStats: OrderStats;
}

export default function OrderStatsSection({ initialStats }: OrderStatsSectionProps) {
  const [stats, setStats] = useState<OrderStats>(initialStats);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/admin/order-stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
        setLastUpdated(dayjs().format('HH:mm'));
      } else {
        console.error('주문 통계 조회 실패:', result.message);
      }
    } catch (error) {
      console.error('주문 통계 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>주문 현황</h2>
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
      <div className='grid grid-cols-2 gap-6'>
        <div className='space-y-3 pr-6'>
          <div className='flex justify-between'>
            <span className='text-sm text-gray-600'>입금 대기 중</span>
            <span className='font-semibold text-gray-900'>
              {stats.waitingPayment.toLocaleString()} 건
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-gray-600'>결제완료</span>
            <span className='font-semibold text-gray-900'>
              {stats.paymentCompleted.toLocaleString()} 건
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-gray-600'>배송중</span>
            <span className='font-semibold text-gray-900'>
              {stats.shipping.toLocaleString()} 건
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-gray-600'>배송완료</span>
            <span className='font-semibold text-gray-900'>
              {stats.delivered.toLocaleString()} 건
            </span>
          </div>
        </div>

        <div className='space-y-3 pl-6'>
          <div className='flex justify-between'>
            <span className='text-sm text-gray-600'>취소주문</span>
            <span className='font-semibold text-gray-900'>
              {stats.cancelled.toLocaleString()} 건
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-gray-600'>교환주문</span>
            <span className='font-semibold text-gray-900'>
              {stats.exchanged.toLocaleString()} 건
            </span>
          </div>
          <div className='flex justify-between'>
            <span className='text-sm text-gray-600'>반품주문</span>
            <span className='font-semibold text-gray-900'>
              {stats.returned.toLocaleString()} 건
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
