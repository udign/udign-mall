import { Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import { getDesignStats } from '@/lib/dashboard/designStats';
import { getOrderStats } from '@/lib/dashboard/orderStats';
import { getMemberStats } from '@/lib/dashboard/memberStats';
import { getInquiryStats } from '@/lib/dashboard/inquiryStats';
import { getLikeStats } from '@/lib/dashboard/likeStats';
import { getSalesStats } from '@/lib/dashboard/salesStats';
import DesignStatsSection from '@/components/admin/DesignStatsSection';
import OrderStatsSection from '@/components/admin/OrderStatsSection';
import MemberStatsSection from '@/components/admin/MemberStatsSection';
import InquiryStatsSection from '@/components/admin/InquiryStatsSection';
import LikeStatsSection from '@/components/admin/LikeStatsSection';
import SalesStatsSection from '@/components/admin/SalesStatsSection';

export default async function AdminDashboard() {
  const [designStats, orderStats, memberStats, inquiryStats, likeStats, salesStats] =
    await Promise.all([
      getDesignStats(),
      getOrderStats(),
      getMemberStats(),
      getInquiryStats(),
      getLikeStats(),
      getSalesStats(dayjs().year()),
    ]);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>관리자 대시보드</h1>
          <p className='mt-1 text-gray-600'>유다인 쇼핑몰 관리 현황을 확인하세요.</p>
        </div>
        <div className='flex items-center text-sm text-gray-500'>
          <Calendar className='mr-2 h-4 w-4' />
          {dayjs().format('YYYY년 M월 D일')}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <DesignStatsSection initialStats={designStats} />
        <OrderStatsSection initialStats={orderStats} />
        <MemberStatsSection initialStats={memberStats} />
        <InquiryStatsSection initialStats={inquiryStats} />
        <LikeStatsSection initialStats={likeStats} />
        <SalesStatsSection initialStats={salesStats} />
      </div>
    </div>
  );
}
