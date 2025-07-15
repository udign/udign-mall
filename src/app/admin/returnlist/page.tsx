'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSION_CHECKS } from '@/lib/constants';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import CommonPagination from '@/components/CommonPagination';
import {
  ReturnListResponse,
  ReturnListItem,
  RETURN_STATUS_LABELS,
  RETURN_TYPE_LABELS,
} from '@/types/return';
import { ROUTES } from '@/lib/routes';
import { formatOrderId, formatDate, truncateText } from '@/lib/utils';

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ReturnListPage() {
  const [data, setData] = useState<ReturnListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isLoading: authLoading } = useAuth();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      router.push(ROUTES.SHOP);
      return;
    }
  }, [user, authLoading, router]);

  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/return-list?page=${page}&limit=20&sort=created_at&order=desc`,
      );

      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const result: ReturnListResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      console.error('교환/반품 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', searchParams.get('page') || '1');
      router.replace(`${ROUTES.ADMIN_RETURNLIST}?${params.toString()}`);
    } else if (user && PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      fetchData(currentPage);
    }
  }, [currentPage, user, searchParams, router]);

  return authLoading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner size='lg' message='권한을 확인하는 중...' />
    </div>
  ) : !user || !PERMISSION_CHECKS.isAdmin(user.mb_level) ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <p className='mb-4 text-red-600'>관리자 권한이 필요합니다.</p>
        <button
          onClick={() => router.push(ROUTES.LOGIN)}
          className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          로그인하기
        </button>
      </div>
    </div>
  ) : loading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner size='lg' message='교환/반품 내역을 불러오는 중...' />
    </div>
  ) : error ? (
    <div className='flex min-h-96 items-center justify-center'>
      <div className='text-center'>
        <p className='mb-4 text-red-600'>{error}</p>
        <button
          onClick={() => fetchData(currentPage)}
          className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
        >
          다시 시도
        </button>
      </div>
    </div>
  ) : !data ? (
    <div className='flex min-h-96 items-center justify-center'>
      <p className='text-gray-500'>데이터를 불러올 수 없습니다.</p>
    </div>
  ) : (
    <div className='container mx-auto space-y-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>교환/반품 관리</h1>
        <p className='mt-1 text-gray-600'>교환/반품 신청 내역을 조회하고 관리할 수 있습니다.</p>
      </div>

      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>전체 교환/반품 내역</h3>
        <p className='text-sm text-gray-600'>
          총 {data.pagination.total}개 내역 (페이지 {data.pagination.totalPages}/{currentPage})
        </p>
      </div>

      {/* 상태별 통계 */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-5'>
        <div className='rounded-lg border bg-white p-4'>
          <div className='text-sm text-gray-600'>전체</div>
          <div className='text-xl font-bold text-gray-900'>{data.statusCounts.total}</div>
        </div>
        <div className='rounded-lg border bg-white p-4'>
          <div className='text-sm text-gray-600'>대기</div>
          <div className='text-xl font-bold text-yellow-600'>{data.statusCounts.pending}</div>
        </div>
        <div className='rounded-lg border bg-white p-4'>
          <div className='text-sm text-gray-600'>승인</div>
          <div className='text-xl font-bold text-blue-600'>{data.statusCounts.approved}</div>
        </div>
        <div className='rounded-lg border bg-white p-4'>
          <div className='text-sm text-gray-600'>완료</div>
          <div className='text-xl font-bold text-green-600'>{data.statusCounts.completed}</div>
        </div>
        <div className='rounded-lg border bg-white p-4'>
          <div className='text-sm text-gray-600'>거부</div>
          <div className='text-xl font-bold text-red-600'>{data.statusCounts.rejected}</div>
        </div>
      </div>

      {/* 테이블 */}
      <div className='overflow-hidden rounded-lg border bg-white'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  번호
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  신청일시
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  주문번호
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  신청자
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  유형
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  사유
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                  상태
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {data.returns.map((returnItem: ReturnListItem) => (
                <tr key={returnItem.return_id} className='transition-colors hover:bg-gray-50'>
                  <td className='px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900'>
                    {returnItem.return_id}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    {formatDate(returnItem.created_at)}
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <span className='font-mono'>{formatOrderId(returnItem.od_id)}</span>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <div>
                      <div className='font-medium'>{returnItem.return_name}</div>
                      <div className='text-gray-500'>{returnItem.return_phone}</div>
                      {returnItem.mb_id && (
                        <div className='text-xs text-gray-500'>ID: {returnItem.mb_id}</div>
                      )}
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        returnItem.return_type === 'exchange'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {RETURN_TYPE_LABELS[returnItem.return_type]}
                    </span>
                  </td>
                  <td className='max-w-xs px-6 py-4 text-sm text-gray-900'>
                    <div className='truncate' title={returnItem.return_reason}>
                      {truncateText(returnItem.return_reason, 50)}
                    </div>
                  </td>
                  <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-900'>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(returnItem.return_status)}`}
                    >
                      {RETURN_STATUS_LABELS[returnItem.return_status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.returns.length === 0 && (
          <div className='py-12 text-center'>
            <p className='text-gray-500'>교환/반품 신청 내역이 없습니다.</p>
          </div>
        )}
      </div>

      <div className='mt-6 flex justify-center'>
        <CommonPagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          pathname='/admin/returnlist'
          showFirstButton={true}
          showLastButton={true}
        />
      </div>
    </div>
  );
}
