import { Users, ShoppingBag, FileCheck, TrendingUp, Calendar } from 'lucide-react';

export default function AdminDashboard() {
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
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-lg bg-white p-6 shadow'>
          <div className='flex items-center justify-between'>
            <div className='rounded-lg bg-blue-50 p-3'>
              <Users className='h-6 w-6 text-blue-600' />
            </div>
          </div>
          <div className='mt-4'>
            <h3 className='text-lg font-semibold text-gray-900'>회원수</h3>
            <p className='text-sm text-gray-600'>전체 회원</p>
          </div>
        </div>

        <div className='rounded-lg bg-white p-6 shadow'>
          <div className='flex items-center justify-between'>
            <div className='rounded-lg bg-green-50 p-3'>
              <ShoppingBag className='h-6 w-6 text-green-600' />
            </div>
          </div>
          <div className='mt-4'>
            <h3 className='text-lg font-semibold text-gray-900'>주문수</h3>
            <p className='text-sm text-gray-600'>전체 주문</p>
          </div>
        </div>

        <div className='rounded-lg bg-white p-6 shadow'>
          <div className='flex items-center justify-between'>
            <div className='rounded-lg bg-purple-50 p-3'>
              <TrendingUp className='h-6 w-6 text-purple-600' />
            </div>
          </div>
          <div className='mt-4'>
            <h3 className='text-lg font-semibold text-gray-900'>매출</h3>
            <p className='text-sm text-gray-600'>총 매출</p>
          </div>
        </div>

        <div className='rounded-lg bg-white p-6 shadow'>
          <div className='flex items-center justify-between'>
            <div className='rounded-lg bg-orange-50 p-3'>
              <FileCheck className='h-6 w-6 text-orange-600' />
            </div>
          </div>
          <div className='mt-4'>
            <h3 className='text-lg font-semibold text-gray-900'>검수</h3>
            <p className='text-sm text-gray-600'>검수 현황</p>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className='rounded-lg bg-white p-6 shadow'>
        <h2 className='mb-4 text-lg font-semibold text-gray-900'>관리 메뉴</h2>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <div className='rounded-lg border border-gray-200 p-4 hover:bg-gray-50'>
            <h3 className='font-medium text-gray-900'>주문 관리</h3>
            <p className='mt-1 text-sm text-gray-600'>주문 현황 및 배송 관리</p>
          </div>
          <div className='rounded-lg border border-gray-200 p-4 hover:bg-gray-50'>
            <h3 className='font-medium text-gray-900'>상품 관리</h3>
            <p className='mt-1 text-sm text-gray-600'>상품 등록 및 수정</p>
          </div>
          <div className='rounded-lg border border-gray-200 p-4 hover:bg-gray-50'>
            <h3 className='font-medium text-gray-900'>검수 관리</h3>
            <p className='mt-1 text-sm text-gray-600'>상품 검수 및 승인</p>
          </div>
          <div className='rounded-lg border border-gray-200 p-4 hover:bg-gray-50'>
            <h3 className='font-medium text-gray-900'>회원 관리</h3>
            <p className='mt-1 text-sm text-gray-600'>회원 정보 관리</p>
          </div>
          <div className='rounded-lg border border-gray-200 p-4 hover:bg-gray-50'>
            <h3 className='font-medium text-gray-900'>매출 현황</h3>
            <p className='mt-1 text-sm text-gray-600'>매출 통계 및 분석</p>
          </div>
          <div className='rounded-lg border border-gray-200 p-4 hover:bg-gray-50'>
            <h3 className='font-medium text-gray-900'>설정</h3>
            <p className='mt-1 text-sm text-gray-600'>시스템 설정 관리</p>
          </div>
        </div>
      </div>
    </div>
  );
}
