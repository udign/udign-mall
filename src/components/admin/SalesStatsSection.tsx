'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { SalesStats } from '@/lib/dashboard/salesStats';
import { Button } from '@/components/ui/primitives/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Chart.js 컴포넌트 등록
Chart.register(...registerables);

interface SalesStatsSectionProps {
  initialStats: SalesStats;
}

const getYearOptions = (currentYear: number) => {
  const yearOptions = [];
  for (let year = currentYear; year >= currentYear - 4; year--) {
    yearOptions.push(year);
  }
  return yearOptions;
};

export default function SalesStatsSection({ initialStats }: SalesStatsSectionProps) {
  const [stats, setStats] = useState<SalesStats>(initialStats);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const currentYear = dayjs().year();
  const yearOptions = getYearOptions(currentYear);

  const fetchStats = async (year?: number) => {
    try {
      setIsLoading(true);

      const targetYear = year || selectedYear;
      const response = await fetch(`/api/admin/sales-stats?year=${targetYear}`);
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

  // 새로고침 버튼 핸들러
  const handleRefresh = () => {
    fetchStats();
  };

  // 연도 변경 핸들러
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    fetchStats(year);
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
    const currentDate = dayjs();
    const currentActualYear = currentDate.year();
    const currentMonth = currentDate.month() + 1; // 0부터 시작하므로 +1

    // 차트 데이터 준비 - x축에는 모든 월 표시, 데이터는 적절한 월까지만
    const labels = stats.monthly_data.map((item) => item.month_name); // 1월~12월 모두 표시

    const salesData = stats.monthly_data.map((item) => {
      const [year, month] = item.month.split('-');
      const itemYear = parseInt(year);
      const itemMonth = parseInt(month);

      // 선택된 연도가 현재 연도인 경우 현재 월까지만, 과거 연도인 경우 모든 월
      if (selectedYear === currentActualYear) {
        // 현재 연도: 현재 월까지만 실제 데이터 반환
        if (
          itemYear < currentActualYear ||
          (itemYear === currentActualYear && itemMonth <= currentMonth)
        ) {
          return item.total_sales;
        }
        return null;
      } else if (selectedYear < currentActualYear) {
        // 과거 연도: 모든 월의 데이터 반환
        return itemYear === selectedYear ? item.total_sales : null;
      } else {
        // 미래 연도: 데이터 없음
        return null;
      }
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
  }, [stats, selectedYear]);

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <h2 className='text-lg font-semibold text-gray-900'>매출 현황</h2>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => handleYearChange(parseInt(value))}
          >
            <SelectTrigger className='w-fit'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleRefresh}
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
        <canvas ref={chartRef} className='h-full w-full'></canvas>
      </div>
    </div>
  );
}
