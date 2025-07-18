import { Calendar } from 'lucide-react';
import { getDesignStats } from '@/lib/dashboard/designStats';
import { getOrderStats } from '@/lib/dashboard/orderStats';
import { getMemberStats } from '@/lib/dashboard/memberStats';
import { getInquiryStats } from '@/lib/dashboard/inquiryStats';
import { getLikeStats } from '@/lib/dashboard/likeStats';
import DesignStatsSection from '@/components/admin/DesignStatsSection';
import OrderStatsSection from '@/components/admin/OrderStatsSection';
import MemberStatsSection from '@/components/admin/MemberStatsSection';
import InquiryStatsSection from '@/components/admin/InquiryStatsSection';
import LikeStatsSection from '@/components/admin/LikeStatsSection';

export default async function AdminDashboard() {
  // 통계 데이터 조회
  const [designStats, orderStats, memberStats, inquiryStats, likeStats] = await Promise.all([
    getDesignStats(),
    getOrderStats(),
    getMemberStats(),
    getInquiryStats(),
    getLikeStats(),
  ]);

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
          2025년 7월 7일
        </div>
      </div>

      {/* 대시보드 그리드 */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* 디자인 현황 */}
        <DesignStatsSection initialStats={designStats} />

        {/* 주문 현황 */}
        <OrderStatsSection initialStats={orderStats} />

        {/* 회원 현황 */}
        <MemberStatsSection initialStats={memberStats} />

        {/* 문의 현황 */}
        <InquiryStatsSection initialStats={inquiryStats} />

        {/* 좋아요 현황 */}
        <LikeStatsSection initialStats={likeStats} />

        {/* 매출 현황 */}
        <div className='rounded-lg border border-gray-200 bg-white p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>매출 현황</h2>
          </div>
          <div className='flex h-24 items-center justify-center text-gray-400'>
            <div className='text-center'>
              <div className='text-sm'>데이터 준비 중</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
