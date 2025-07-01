'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  ShoppingBag,
  FileCheck,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { ReviewStats } from '@/types/review';

interface DashboardStats {
  totalMembers: number;
  todayMembers: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  reviewStats: ReviewStats;
}

interface RecentActivity {
  id: string;
  type: 'member' | 'order' | 'review';
  title: string;
  description: string;
  time: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          fetch('/api/admin/dashboard/stats'),
          fetch('/api/admin/dashboard/activities'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setRecentActivities(activitiesData.data);
        }
      } catch (error) {
        console.error('대시보드 데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({
    title,
    value,
    todayValue,
    icon,
    color = 'blue',
    trend,
  }: {
    title: string;
    value: number;
    todayValue?: number;
    icon: React.ReactNode;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    trend?: number;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50',
      orange: 'bg-orange-500 text-orange-600 bg-orange-50',
      red: 'bg-red-500 text-red-600 bg-red-50',
    };

    return (
      <div className='rounded-lg bg-white p-6 shadow'>
        <div className='flex items-center justify-between'>
          <div className={`rounded-lg p-3 ${colorClasses[color].split(' ')[2]}`}>
            <div className={colorClasses[color].split(' ')[1]}>{icon}</div>
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              <TrendingUp className='mr-1 h-4 w-4' />
              {trend >= 0 ? '+' : ''}
              {trend}%
            </div>
          )}
        </div>
        <div className='mt-4'>
          <h3 className='text-lg font-semibold text-gray-900'>{value.toLocaleString()}</h3>
          <p className='text-sm text-gray-600'>{title}</p>
          {todayValue !== undefined && (
            <p className='mt-1 text-xs text-gray-500'>오늘: {todayValue.toLocaleString()}</p>
          )}
        </div>
      </div>
    );
  };

  const ReviewStatusCard = ({ reviewStats }: { reviewStats: ReviewStats }) => (
    <div className='rounded-lg bg-white p-6 shadow'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>검수 현황</h3>
        <FileCheck className='h-6 w-6 text-blue-600' />
      </div>

      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-600'>검수 대기</span>
          <div className='flex items-center'>
            <span className='text-lg font-semibold text-orange-600'>{reviewStats.pending}</span>
            <AlertCircle className='ml-1 h-4 w-4 text-orange-600' />
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-600'>심의중</span>
          <span className='text-lg font-semibold text-blue-600'>{reviewStats.in_review}</span>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-600'>승인</span>
          <span className='text-lg font-semibold text-green-600'>{reviewStats.approved}</span>
        </div>

        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-600'>반려</span>
          <span className='text-lg font-semibold text-red-600'>{reviewStats.rejected}</span>
        </div>
      </div>

      <div className='mt-4 border-t pt-4'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-gray-700'>전체</span>
          <span className='text-xl font-bold text-gray-900'>{reviewStats.total}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>관리자 대시보드</h1>
          <p className='mt-1 text-gray-600'>유다인 쇼핑몰 관리 현황을 확인하세요.</p>
        </div>
        <div className='flex items-center text-sm text-gray-500'>
          <Calendar className='mr-2 h-4 w-4' />
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <StatCard
            title='전체 회원수'
            value={stats.totalMembers}
            todayValue={stats.todayMembers}
            icon={<Users className='h-6 w-6' />}
            color='blue'
            trend={5.2}
          />

          <StatCard
            title='전체 주문수'
            value={stats.totalOrders}
            todayValue={stats.todayOrders}
            icon={<ShoppingBag className='h-6 w-6' />}
            color='green'
            trend={2.8}
          />

          <StatCard
            title='총 매출'
            value={stats.totalRevenue}
            todayValue={stats.todayRevenue}
            icon={<TrendingUp className='h-6 w-6' />}
            color='purple'
            trend={8.1}
          />

          <StatCard
            title='검수 대기'
            value={stats.reviewStats.pending}
            icon={<FileCheck className='h-6 w-6' />}
            color='orange'
          />
        </div>
      )}

      {/* 검수 현황 & 최근 활동 */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* 검수 현황 */}
        {stats && <ReviewStatusCard reviewStats={stats.reviewStats} />}

        {/* 최근 활동 */}
        <div className='rounded-lg bg-white p-6 shadow'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>최근 활동</h3>
            <Clock className='h-6 w-6 text-gray-400' />
          </div>

          <div className='space-y-4'>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className='flex items-start space-x-3'>
                  <div
                    className={`mt-2 h-2 w-2 rounded-full ${
                      activity.type === 'member'
                        ? 'bg-blue-500'
                        : activity.type === 'order'
                          ? 'bg-green-500'
                          : 'bg-orange-500'
                    } `}
                  />
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-gray-900'>{activity.title}</p>
                    <p className='text-xs text-gray-600'>{activity.description}</p>
                    <p className='mt-1 text-xs text-gray-400'>{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className='py-4 text-center text-sm text-gray-500'>최근 활동이 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* 빠른 액션 버튼 */}
      <div className='rounded-lg bg-white p-6 shadow'>
        <h3 className='mb-4 text-lg font-semibold text-gray-900'>빠른 액션</h3>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          <button className='flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-blue-400 hover:bg-blue-50'>
            <FileCheck className='mb-2 h-8 w-8 text-gray-400' />
            <span className='text-sm font-medium text-gray-700'>검수 관리</span>
          </button>

          <button className='flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-green-400 hover:bg-green-50'>
            <ShoppingBag className='mb-2 h-8 w-8 text-gray-400' />
            <span className='text-sm font-medium text-gray-700'>상품 등록</span>
          </button>

          <button className='flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-purple-400 hover:bg-purple-50'>
            <Users className='mb-2 h-8 w-8 text-gray-400' />
            <span className='text-sm font-medium text-gray-700'>회원 관리</span>
          </button>

          <button className='flex flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-orange-400 hover:bg-orange-50'>
            <TrendingUp className='mb-2 h-8 w-8 text-gray-400' />
            <span className='text-sm font-medium text-gray-700'>매출 분석</span>
          </button>
        </div>
      </div>
    </div>
  );
}
