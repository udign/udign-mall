'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { SalesStats } from '@/lib/dashboard/salesStats';
import { Button } from '@/components/ui/primitives/button';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Chart.js 컴포넌트 등록
Chart.register(...registerables);

interface SalesStatsSectionProps {
  initialStats: SalesStats;
}

export default function SalesStatsSection({ initialStats }: SalesStatsSectionProps) {
  const [stats, setStats] = useState<SalesStats>(initialStats);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // 실제 매출 데이터가 있는지 확인 (useMemo로 메모이제이션)
  const hasValidData = useMemo(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    return stats.monthly_data.some((item) => {
      const [year, month] = item.month.split('-');
      const itemYear = parseInt(year);
      const itemMonth = parseInt(month);

      // 현재 월까지의 데이터 중에서 매출이 0보다 큰 것이 있는지 확인
      return (
        (itemYear < currentYear || (itemYear === currentYear && itemMonth <= currentMonth)) &&
        item.total_sales > 0
      );
    });
  }, [stats.monthly_data]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/admin/sales-stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
        setLastUpdated(dayjs().format('HH:mm'));
      } else {
        console.error('매출 통계 조회 실패:', result.message);
      }
    } catch (error) {
      console.error('매출 통계 조회 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 차트 생성/업데이트
  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // 기존 차트 인스턴스 삭제
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // 현재 날짜 정보
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0부터 시작하므로 +1

    // 차트 데이터 준비 - x축에는 모든 월 표시, 데이터는 현재 월까지만
    const labels = stats.monthly_data.map((item) => item.month_name); // 1월~12월 모두 표시

    const salesData = stats.monthly_data.map((item) => {
      const [year, month] = item.month.split('-');
      const itemYear = parseInt(year);
      const itemMonth = parseInt(month);

      // 현재 년도보다 이전이거나, 현재 년도의 현재 월 이하만 실제 데이터 반환
      // 그 외에는 null 반환 (Chart.js에서 null 이후로는 선을 그리지 않음)
      if (itemYear < currentYear || (itemYear === currentYear && itemMonth <= currentMonth)) {
        return item.total_sales;
      }
      return null;
    });

    const validSalesData = salesData.filter((sale): sale is number => sale !== null && sale > 0); // null이 아니고 0보다 큰 값만 필터링 (타입 가드 적용)
    const maxSales = validSalesData.length > 0 ? Math.max(...validSalesData) : 0; // 빈 배열일 경우 0으로 설정

    // 차트 설정
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '월별 매출',
            data: salesData,
            borderColor: 'rgb(59, 130, 246)', // blue-500
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            spanGaps: false, // null 값에서 선이 끊어지도록 설정
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // 범례 숨김
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(59, 130, 246, 0.8)',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: function (context) {
                const value = context.parsed.y;
                return `매출: ${value.toLocaleString()}원`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#6b7280', // gray-500
              font: {
                size: 12,
              },
            },
          },
          y: {
            beginAtZero: true,
            max: salesData.length > 0 && maxSales > 0 ? maxSales * 1.2 : 1000000, // 필터링된 데이터의 최대값의 120%로 설정
            grid: {
              color: '#f3f4f6', // gray-100
            },
            ticks: {
              color: '#6b7280', // gray-500
              font: {
                size: 12,
              },
              callback: function (value) {
                return (Number(value) / 10000).toLocaleString() + '만원';
              },
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    };

    // 차트 생성
    chartInstanceRef.current = new Chart(ctx, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [stats]);

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>매출 현황</h2>
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

      <div className='mb-4 space-y-3'>
        <div className='grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4'>
          <div className='text-center'>
            <div className='text-sm text-gray-600'>연간 매출</div>
            <div className='text-lg font-bold text-blue-600'>
              {stats.total_yearly_sales > 0
                ? `${(stats.total_yearly_sales / 10000).toLocaleString()}만원`
                : '0원'}
            </div>
          </div>
          <div className='text-center'>
            <div className='text-sm text-gray-600'>연간 주문</div>
            <div className='text-lg font-bold text-green-600'>
              {stats.total_yearly_orders.toLocaleString()}건
            </div>
          </div>
        </div>
      </div>

      <div className='relative h-64'>
        {hasValidData ? (
          <canvas ref={chartRef} className='h-full w-full'></canvas>
        ) : (
          <div className='flex h-full items-center justify-center text-gray-500'>
            <p>아직 표시할 매출 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
