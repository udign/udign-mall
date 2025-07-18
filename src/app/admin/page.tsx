import { Calendar } from 'lucide-react';
import { getDesignStats, type DesignStats } from '@/lib/dashboard/designStats';
import DesignStatsSection from '@/components/admin/DesignStatsSection';

export default async function AdminDashboard() {
  const designStats: DesignStats = await getDesignStats();

  return (
    <div className='space-y-6'>
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

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <DesignStatsSection initialStats={designStats} />

        {/* 주문 현황 */}
        <div className='rounded-lg border border-gray-200 bg-white p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>주문 현황</h2>
          </div>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span className='text-sm text-gray-600'>입금 대기 중</span>
              <span className='font-semibold text-gray-900'>35 건</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-sm text-gray-600'>검제완료</span>
              <span className='font-semibold text-gray-900'>348 건</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-sm text-gray-600'>배송중</span>
              <span className='font-semibold text-gray-900'>793 건</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-sm text-gray-600'>배송완료</span>
              <span className='font-semibold text-gray-900'>3975 건</span>
            </div>
            <div className='grid grid-cols-3 gap-4 pt-2'>
              <div className='text-center'>
                <div className='text-xs text-gray-600'>취소주문</div>
                <div className='text-lg font-bold text-gray-900'>1 건</div>
              </div>
              <div className='text-center'>
                <div className='text-xs text-gray-600'>교환주문</div>
                <div className='text-lg font-bold text-gray-900'>0 건</div>
              </div>
              <div className='text-center'>
                <div className='text-xs text-gray-600'>반품주문</div>
                <div className='text-lg font-bold text-gray-900'>2 건</div>
              </div>
            </div>
          </div>
        </div>

        {/* 회원 현황 */}
        <div className='rounded-lg border border-gray-200 bg-white p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>회원 현황</h2>
          </div>
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-sm text-gray-600'>전체</div>
              <div className='text-2xl font-bold text-green-600'>26578</div>
            </div>
            <div className='text-center'>
              <div className='text-sm text-gray-600'>신규</div>
              <div className='text-2xl font-bold text-gray-900'>139</div>
            </div>
            <div className='text-center'>
              <div className='text-sm text-gray-600'>디자인등록회원</div>
              <div className='text-2xl font-bold text-gray-900'>357</div>
            </div>
          </div>
        </div>

        {/* 문의 현황 */}
        <div className='rounded-lg border border-gray-200 bg-white p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>문의 현황</h2>
          </div>
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-sm text-gray-600'>미처리 답변</div>
              <div className='text-2xl font-bold text-red-600'>2</div>
            </div>
            <div className='text-center'>
              <div className='text-sm text-gray-600'>재품의</div>
              <div className='text-2xl font-bold text-orange-600'>1</div>
            </div>
            <div className='text-center'>
              <div className='text-sm text-gray-600'>일반 답변</div>
              <div className='text-2xl font-bold text-green-600'>10</div>
            </div>
          </div>
        </div>

        {/* 좋아요 현황 */}
        <div className='rounded-lg border border-gray-200 bg-white p-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>좋아요 현황</h2>
          </div>
          <div className='flex h-24 items-center justify-center text-gray-400'>
            <div className='text-center'>
              <div className='text-sm'>데이터 준비 중</div>
            </div>
          </div>
        </div>

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
