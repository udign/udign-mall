'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import { Calendar } from '@/components/ui/primitives/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives/popover';
import {
  CalendarDays,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { SalesData, SalesQueryParams, SalesResponse, SalesTotals } from '@/types/sales';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import dayjs from 'dayjs';

type SalesTabType = 'daily' | 'period' | 'monthly' | 'yearly';

interface TabData {
  salesData: SalesData[];
  totals: SalesTotals | null;
}

const SALES_TABS = [
  { key: 'daily' as const, icon: CalendarDays, label: '일일 매출' },
  { key: 'period' as const, icon: BarChart3, label: '일간 매출' },
  { key: 'monthly' as const, icon: PieChart, label: '월간 매출' },
  { key: 'yearly' as const, icon: TrendingUp, label: '연간 매출' },
];

const TABLE_COLUMNS = [
  { key: 'orderCount', label: '주문수', align: 'right' as const },
  { key: 'orderprice', label: '주문합계', align: 'right' as const },
  { key: 'couponPrice', label: '쿠폰', align: 'right' as const },
  { key: 'receiptBank', label: '무통장', align: 'right' as const },
  { key: 'receiptVbank', label: '가상계좌', align: 'right' as const },
  { key: 'receiptIche', label: '계좌이체', align: 'right' as const },
  { key: 'receiptCard', label: '카드입금', align: 'right' as const },
  { key: 'receiptEasy', label: '간편결제', align: 'right' as const },
  { key: 'receiptHp', label: '휴대폰', align: 'right' as const },
  { key: 'receiptPoint', label: '포인트입금', align: 'right' as const },
  { key: 'orderCancel', label: '주문취소', align: 'right' as const },
  { key: 'misu', label: '미수금', align: 'right' as const },
];

const formatDate = (date: string, type: SalesTabType) => {
  switch (type) {
    case 'daily':
      return dayjs(date).format('YYYY년 MM월 DD일');
    case 'period':
      return dayjs(date).format('YYYY년 MM월 DD일');
    case 'monthly':
      return dayjs(date).format('YYYY년 MM월');
    case 'yearly':
      return dayjs(date).format('YYYY년');
    default:
      return date;
  }
};

export default function SalesPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<SalesTabType>('daily');
  const [tabData, setTabData] = useState<Record<SalesTabType, TabData>>({
    daily: { salesData: [], totals: null },
    period: { salesData: [], totals: null },
    monthly: { salesData: [], totals: null },
    yearly: { salesData: [], totals: null },
  });
  const [dailyDate, setDailyDate] = useState<Date>(new Date());
  const [periodStartDate, setPeriodStartDate] = useState<Date>(dayjs().startOf('month').toDate());
  const [periodEndDate, setPeriodEndDate] = useState<Date>(new Date());
  const [monthlyStartMonth, setMonthlyStartMonth] = useState(
    dayjs().startOf('year').format('YYYY-MM'),
  );
  const [monthlyEndMonth, setMonthlyEndMonth] = useState(dayjs().format('YYYY-MM'));
  const [yearlyStartYear, setYearlyStartYear] = useState(String(dayjs().year() - 1));
  const [yearlyEndYear, setYearlyEndYear] = useState(String(dayjs().year()));

  const currentTabData = tabData[activeTab];

  const fetchSalesData = async (params: SalesQueryParams) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SalesResponse = await response.json();

      if (result.success && result.data) {
        setTabData((prev) => ({
          ...prev,
          [activeTab]: {
            salesData: result.data || [],
            totals: result.totals || null,
          },
        }));
      } else {
        console.error('매출 데이터 조회 실패:', result.error);
        setTabData((prev) => ({
          ...prev,
          [activeTab]: {
            salesData: [],
            totals: null,
          },
        }));
      }
    } catch (error) {
      console.error('매출 데이터 조회 중 오류:', error);
      setTabData((prev) => ({
        ...prev,
        [activeTab]: {
          salesData: [],
          totals: null,
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleDailySearch = () => {
    fetchSalesData({
      type: 'daily',
      date: dayjs(dailyDate).format('YYYY-MM-DD'),
    });
  };

  const handlePeriodSearch = () => {
    fetchSalesData({
      type: 'period',
      startDate: dayjs(periodStartDate).format('YYYY-MM-DD'),
      endDate: dayjs(periodEndDate).format('YYYY-MM-DD'),
    });
  };

  const handleMonthlySearch = () => {
    fetchSalesData({
      type: 'monthly',
      startMonth: monthlyStartMonth,
      endMonth: monthlyEndMonth,
    });
  };

  const handleYearlySearch = () => {
    fetchSalesData({
      type: 'yearly',
      startYear: yearlyStartYear,
      endYear: yearlyEndYear,
    });
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>매출현황</h1>
          <p className='mt-1 text-gray-600'>
            일일, 일간, 월간, 연간 매출 데이터를 조회하고 분석할 수 있습니다.
          </p>
        </div>
      </div>

      <div className='space-y-4'>
        <div className='flex space-x-2 border-b pb-2'>
          {SALES_TABS.map(({ key, icon: Icon, label }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'default' : 'outline'}
              onClick={() => setActiveTab(key)}
              className='flex items-center gap-2'
            >
              <Icon className='h-4 w-4' />
              {label}
            </Button>
          ))}
        </div>

        {activeTab === 'daily' && (
          <Card>
            <CardHeader>
              <CardTitle>일일 매출 조회</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-end gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='daily-date'>조회일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-40 justify-start text-left font-normal'
                      >
                        <CalendarIcon className='h-4 w-4' />
                        {dailyDate
                          ? dayjs(dailyDate).format('YYYY년 MM월 DD일')
                          : '날짜를 선택하세요'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={dailyDate}
                        onSelect={(date) => date && setDailyDate(date)}
                        disabled={(date) => date > new Date()}
                        captionLayout='dropdown'
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={handleDailySearch} disabled={loading}>
                  {loading ? '조회 중...' : '조회'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'period' && (
          <Card>
            <CardHeader>
              <CardTitle>일간 매출 조회</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-end gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='period-start'>시작일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-40 justify-start text-left font-normal'
                      >
                        <CalendarIcon className='h-4 w-4' />
                        {periodStartDate
                          ? dayjs(periodStartDate).format('YYYY년 MM월 DD일')
                          : '시작일을 선택하세요'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={periodStartDate}
                        onSelect={(date) => date && setPeriodStartDate(date)}
                        disabled={(date) => date > new Date()}
                        captionLayout='dropdown'
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='period-end'>종료일</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-40 justify-start text-left font-normal'
                      >
                        <CalendarIcon className='h-4 w-4' />
                        {periodEndDate
                          ? dayjs(periodEndDate).format('YYYY년 MM월 DD일')
                          : '종료일을 선택하세요'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                      <Calendar
                        mode='single'
                        selected={periodEndDate}
                        onSelect={(date) => date && setPeriodEndDate(date)}
                        disabled={(date) => date > new Date()}
                        captionLayout='dropdown'
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={handlePeriodSearch} disabled={loading}>
                  {loading ? '조회 중...' : '조회'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'monthly' && (
          <Card>
            <CardHeader>
              <CardTitle>월간 매출 조회</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-end gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='monthly-start'>시작월</Label>
                  <Input
                    id='monthly-start'
                    type='month'
                    value={monthlyStartMonth}
                    onChange={(e) => setMonthlyStartMonth(e.target.value)}
                    max={dayjs().format('YYYY-MM')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='monthly-end'>종료월</Label>
                  <Input
                    id='monthly-end'
                    type='month'
                    value={monthlyEndMonth}
                    onChange={(e) => setMonthlyEndMonth(e.target.value)}
                    max={dayjs().format('YYYY-MM')}
                  />
                </div>
                <Button onClick={handleMonthlySearch} disabled={loading}>
                  {loading ? '조회 중...' : '조회'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'yearly' && (
          <Card>
            <CardHeader>
              <CardTitle>연간 매출 조회</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-end gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='yearly-start'>시작 연도</Label>
                  <Input
                    id='yearly-start'
                    type='number'
                    value={yearlyStartYear}
                    onChange={(e) => setYearlyStartYear(e.target.value)}
                    min='2000'
                    max={String(dayjs().year())}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='yearly-end'>종료 연도</Label>
                  <Input
                    id='yearly-end'
                    type='number'
                    value={yearlyEndYear}
                    onChange={(e) => setYearlyEndYear(e.target.value)}
                    min='2000'
                    max={String(dayjs().year())}
                  />
                </div>
                <Button onClick={handleYearlySearch} disabled={loading}>
                  {loading ? '조회 중...' : '조회'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>매출 데이터 조회 중</CardTitle>
          </CardHeader>
          <CardContent className='my-3.5'>
            <LoadingSpinner size='lg' message='매출 데이터를 조회하고 있습니다...' />
          </CardContent>
        </Card>
      )}

      {!loading && currentTabData.salesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'daily'
                ? '일일'
                : activeTab === 'period'
                  ? '일간'
                  : activeTab === 'monthly'
                    ? '월간'
                    : '연간'}{' '}
              매출 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse border border-gray-300'>
                <thead>
                  <tr className='bg-gray-50'>
                    <th className='border border-gray-300 px-2 py-2 text-center'>
                      {activeTab === 'daily'
                        ? '주문일'
                        : activeTab === 'period'
                          ? '주문일'
                          : activeTab === 'monthly'
                            ? '주문월'
                            : '주문년도'}
                    </th>
                    {TABLE_COLUMNS.map((column) => (
                      <th key={column.key} className='border border-gray-300 px-2 py-2 text-center'>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentTabData.salesData.map((data, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className='border border-gray-300 px-2 py-2 text-center'>
                        {formatDate(data.date, activeTab)}
                      </td>
                      {TABLE_COLUMNS.map((column) => (
                        <td
                          key={column.key}
                          className={`border border-gray-300 px-2 py-2 text-${column.align}`}
                        >
                          {data[column.key as keyof SalesData].toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {currentTabData.totals && (
                  <tfoot>
                    <tr className='bg-gray-100 font-semibold'>
                      <td className='border border-gray-300 px-2 py-2 text-center'>합계</td>
                      {TABLE_COLUMNS.map((column) => (
                        <td
                          key={column.key}
                          className={`border border-gray-300 px-2 py-2 text-${column.align}`}
                        >
                          {currentTabData.totals![column.key as keyof SalesTotals].toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {currentTabData.salesData.length === 0 && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>조회 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse border border-gray-300'>
                <thead>
                  <tr className='bg-gray-50'>
                    <th className='border border-gray-300 px-2 py-2 text-center'>
                      {activeTab === 'daily'
                        ? '주문일'
                        : activeTab === 'period'
                          ? '주문일'
                          : activeTab === 'monthly'
                            ? '주문월'
                            : '주문년도'}
                    </th>
                    {TABLE_COLUMNS.map((column) => (
                      <th key={column.key} className='border border-gray-300 px-2 py-2 text-center'>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className='border border-gray-300 px-2 py-6 text-center'
                      colSpan={TABLE_COLUMNS.length + 1}
                    >
                      조회된 데이터가 없습니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
