'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, AlertCircle, Database, XCircle } from 'lucide-react';
import { ReviewItem, ReviewStats } from '@/types/review';
import { STATUS_GROUPS } from '@/lib/constants';
import CommonPagination from '@/components/CommonPagination';
import { PAGINATION_CONFIG } from '@/lib/constants';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/primitives/button';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { ROUTES } from '@/lib/routes';

const tableHeaders = [
  '이미지',
  '작품명',
  '작품 ID',
  '판매자 ID',
  '판매가격',
  '좋아요',
  '디자인 검수',
  '관리',
];

export default function ReviewManagement() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    itemId: string;
    action: 'payment' | 'review';
    itemName: string;
  }>({
    open: false,
    itemId: '',
    action: 'payment',
    itemName: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // 검수 통계와 목록을 병렬로 가져오기
      const [statsResponse, itemsResponse] = await Promise.all([
        fetch('/api/admin/review/stats'),
        fetch(
          `/api/admin/review/items?page=${currentPage}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}&status=all`,
        ),
      ]);

      // 통계 데이터 처리
      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.data);
        }
      }

      // 검수 목록 데이터 처리
      if (itemsResponse.ok) {
        const itemsResult = await itemsResponse.json();
        if (itemsResult.success) {
          setItems(itemsResult.data.items);
          // 페이지네이션 정보 업데이트
          if (itemsResult.data.pagination) {
            setTotalPages(itemsResult.data.pagination.totalPages);
            setTotalItems(itemsResult.data.pagination.totalItems);
          }
        }
      }
    } catch (error) {
      console.error('검수 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    // 초기 로드 시 URL 파라미터가 없으면 기본값으로 설정
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', '1');
      router.replace(`${ROUTES.ADMIN_REVIEW}?${params.toString()}`);
    } else {
      fetchData();
    }
  }, [currentPage, searchParams, router, fetchData]);

  const showConfirmDialog = (itemId: string, action: 'payment' | 'review', itemName: string) => {
    setConfirmDialog({
      open: true,
      itemId,
      action,
      itemName,
    });
  };

  const handleItemAction = async (itemId: string, action: 'payment' | 'review') => {
    try {
      setActionLoading(itemId);

      const response = await fetch('/api/admin/review/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId,
          action,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 다이얼로그 닫기
        setConfirmDialog((prev) => ({ ...prev, open: false }));

        // 데이터 새로고침
        await fetchData();
      } else {
        alert(result.message || '처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('작품 상태 변경 실패:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVisibility = async (itemId: string, currentVisibility: '1' | '0' | number) => {
    try {
      setVisibilityLoading(itemId);

      // 숫자를 문자열로 변환
      const currentValue = String(currentVisibility);
      const newVisibility = currentValue === '1' ? '0' : '1';

      const response = await fetch('/api/admin/review/toggle-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          itemId,
          visibility: newVisibility,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // 로컬 상태 업데이트 - 숫자 타입으로 업데이트
        setItems((prev) =>
          prev.map((item) =>
            item.it_id === itemId
              ? { ...item, it_use: Number(newVisibility) as unknown as '1' | '0' }
              : item,
          ),
        );
      } else {
        alert(result.message || '디자인 검수 상태 변경 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('디자인 검수 상태 변경 실패:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setVisibilityLoading(null);
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${ROUTES.ADMIN_REVIEW}?${params.toString()}`);
  };

  const handleImageError = (itemId: string) => {
    setImageErrors((prev) => new Set(prev).add(itemId));
  };

  return (
    <>
      <div className='space-y-4'>
        {/* 헤더 */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>작품 관리</h1>
            <p className='mt-1 text-gray-600'>
              모든 작품의 상태를 확인하고 구매 진행/제작 검토 처리를 할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {/* 전체 작품 */}
          <div className='rounded-lg bg-white p-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='rounded-lg bg-blue-100 p-3'>
                  <Database className='h-6 w-6 text-blue-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>전체 작품</p>
                  <p className='text-3xl font-bold text-blue-600'>{stats?.allItems || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 디자인 검수 승인 */}
          <div className='rounded-lg bg-white p-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='rounded-lg bg-green-100 p-3'>
                  <CheckCircle className='h-6 w-6 text-green-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>디자인 검수 승인</p>
                  <p className='text-3xl font-bold text-green-600'>{stats?.approvedItems || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 디자인 검수 반려 */}
          <div className='rounded-lg bg-white p-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='rounded-lg bg-red-100 p-3'>
                  <XCircle className='h-6 w-6 text-red-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>디자인 검수 반려</p>
                  <p className='text-3xl font-bold text-red-600'>{stats?.rejectedItems || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 제작 검토 */}
          <div className='rounded-lg bg-white p-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='rounded-lg bg-orange-100 p-3'>
                  <AlertCircle className='h-6 w-6 text-orange-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>{STATUS_GROUPS.review}</p>
                  <p className='text-3xl font-bold text-orange-600'>{stats?.review || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 구매 진행 */}
          <div className='rounded-lg bg-white p-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='rounded-lg bg-purple-100 p-3'>
                  <CheckCircle className='h-6 w-6 text-purple-600' />
                </div>
                <div className='ml-4'>
                  <p className='text-sm font-medium text-gray-600'>{STATUS_GROUPS.payment}</p>
                  <p className='text-3xl font-bold text-purple-600'>{stats?.payment || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 검수 목록 테이블 */}
        <div className='rounded-lg bg-white'>
          <div>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900'>전체 작품 목록</h3>
              <p className='text-sm text-gray-600'>
                총 {totalItems}개 작품 (페이지 {currentPage}/{totalPages})
              </p>
            </div>

            {loading ? (
              <div className='mt-50'>
                <LoadingSpinner size='md' message='로딩 중...' />
              </div>
            ) : items.length === 0 ? (
              <div className='py-8 text-center text-gray-500'>등록된 작품이 없습니다.</div>
            ) : (
              <>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        {tableHeaders.map((header, index) => (
                          <th
                            key={index}
                            className='px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {items.map((item) => (
                        <tr key={item.it_id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 text-center'>
                            <div className='flex justify-center'>
                              {imageErrors.has(item.it_id) ? (
                                <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-center'>
                                  <span className='text-xs text-gray-400'>
                                    이미지
                                    <br />
                                    없음
                                  </span>
                                </div>
                              ) : (
                                <Image
                                  src={
                                    `${process.env.NEXT_PUBLIC_VERCEL_BLOB_BASE_URL}/item/${item.it_img1}` ||
                                    '/images/no-image.png'
                                  }
                                  alt={item.it_name}
                                  width={48}
                                  height={48}
                                  className='h-12 w-12 rounded-lg object-cover'
                                  onError={() => handleImageError(item.it_id)}
                                />
                              )}
                            </div>
                          </td>
                          <td className='px-6 py-4 text-center'>
                            <div className='text-sm text-gray-900'>
                              <p className='font-medium'>{item.it_name}</p>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-center'>
                            <div className='text-sm text-gray-900'>
                              <p className='text-gray-600'>{item.it_id}</p>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-center'>
                            <div className='text-sm text-gray-900'>
                              <div className='font-medium'>{item.it_1}</div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-center'>
                            <div className='text-sm text-gray-900'>
                              <div className='font-medium'>
                                {item.it_price?.toLocaleString() || 0}원
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-center'>
                            <div className='text-sm text-gray-900'>
                              <div>
                                <span className='font-medium'>{item.interest_count}</span>
                                <span className='text-gray-400'> / </span>
                                <span>{item.it_4}</span>
                                {!item.goal_achieved && item.review_status === 'in_review' && (
                                  <span className='ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800'>
                                    ⚠️ 수동 설정
                                  </span>
                                )}
                              </div>
                              <div className='mt-1 h-1.5 w-full rounded-full bg-gray-200'>
                                <div
                                  className='bg-primary h-1.5 rounded-full'
                                  style={{
                                    width: `${Math.min((item.interest_count / item.it_4) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-center'>
                            <div className='flex justify-center'>
                              <div className='flex items-center space-x-2'>
                                {visibilityLoading === item.it_id ? (
                                  <LoadingSpinner size='sm' className='mb-0' />
                                ) : (
                                  <label className='flex cursor-pointer items-center space-x-2'>
                                    <Checkbox
                                      checked={Number(item.it_use) === 1}
                                      onCheckedChange={() =>
                                        handleToggleVisibility(item.it_id, item.it_use)
                                      }
                                      disabled={visibilityLoading === item.it_id}
                                      className='cursor-pointer'
                                    />
                                    <span className='text-sm text-gray-700'>
                                      {Number(item.it_use) === 1 ? '승인' : '반려'}
                                    </span>
                                  </label>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className='px-6 py-4 text-center'>
                            <div className='flex justify-center'>
                              <div className='flex space-x-2'>
                                {/* 구매 진행 버튼 */}
                                <Button
                                  onClick={() =>
                                    showConfirmDialog(item.it_id, 'payment', item.it_name)
                                  }
                                  disabled={
                                    actionLoading === item.it_id ||
                                    item.review_status === 'approved'
                                  }
                                  variant={
                                    item.review_status === 'approved' ? 'outline' : 'default'
                                  }
                                  size='sm'
                                  className={
                                    item.review_status === 'approved'
                                      ? 'cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300'
                                      : ''
                                  }
                                  title={
                                    item.review_status === 'approved'
                                      ? '이미 구매 진행 상태입니다'
                                      : '구매 진행 상태로 변경'
                                  }
                                >
                                  {actionLoading === item.it_id ? (
                                    <LoadingSpinner size='sm' className='mb-0 border-white' />
                                  ) : (
                                    '구매 진행'
                                  )}
                                </Button>

                                {/* 제작 검토 버튼 */}
                                <Button
                                  onClick={() =>
                                    showConfirmDialog(item.it_id, 'review', item.it_name)
                                  }
                                  disabled={
                                    actionLoading === item.it_id ||
                                    ['pending', 'in_review', 'rejected'].includes(
                                      item.review_status,
                                    )
                                  }
                                  variant={
                                    ['pending', 'in_review', 'rejected'].includes(
                                      item.review_status,
                                    )
                                      ? 'outline'
                                      : 'secondary'
                                  }
                                  size='sm'
                                  className={
                                    ['pending', 'in_review', 'rejected'].includes(
                                      item.review_status,
                                    )
                                      ? 'cursor-not-allowed bg-gray-300 text-gray-500 hover:bg-gray-300'
                                      : 'bg-gray-600 text-white hover:bg-gray-700'
                                  }
                                  title={
                                    ['pending', 'in_review', 'rejected'].includes(
                                      item.review_status,
                                    )
                                      ? '이미 제작 검토 상태입니다'
                                      : '제작 검토 단계로 변경'
                                  }
                                >
                                  {actionLoading === item.it_id ? (
                                    <LoadingSpinner size='sm' className='mb-0 border-white' />
                                  ) : (
                                    '제작 검토'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                <div className='mt-6 flex justify-center'>
                  <CommonPagination
                    currentPageNumber={currentPage}
                    totalPageCount={totalPages}
                    pathname={ROUTES.ADMIN_REVIEW}
                    onPageChange={handlePageChange}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 확인 다이얼로그 */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={`${confirmDialog.action === 'payment' ? '구매 진행' : '제작 검토'} 확인`}
        description={`"${confirmDialog.itemName}" 작품을 ${
          confirmDialog.action === 'payment' ? '구매 진행' : '제작 검토'
        } 상태로 변경하시겠습니까?`}
        confirmText={confirmDialog.action === 'payment' ? '구매 진행' : '제작 검토'}
        cancelText='취소'
        variant={confirmDialog.action === 'payment' ? 'default' : 'destructive'}
        onConfirm={() => handleItemAction(confirmDialog.itemId, confirmDialog.action)}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
