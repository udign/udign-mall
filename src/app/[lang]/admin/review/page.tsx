'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Database, XCircle } from 'lucide-react';
import { ReviewItem, ReviewStats } from '@/types/review';
import { STATUS_GROUPS } from '@/lib/constants';
import CommonPagination from '@/components/CommonPagination';
import { PAGINATION_CONFIG } from '@/lib/constants';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MessageDialog from '@/components/ui/MessageDialog';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { ROUTES } from '@/lib/routes';
import { ReviewTableRow } from '@/components/ReviewTableRow';

const tableHeaders = [
  '작품 ID',
  '이미지',
  '작품명',
  '판매가격',
  '재고',
  '옵션',
  '목표 좋아요',
  '디자인 검수',
  '관리',
];

function ReviewManagement() {
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
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: '',
    description: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsResponse, itemsResponse] = await Promise.all([
        fetch('/api/admin/review/stats'),
        fetch(
          `/api/admin/review/items?page=${currentPage}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}&status=all`,
        ),
      ]);

      // 통계 데이터 처리
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json();
        throw new Error(errorData.error || '통계 데이터를 가져오는데 실패했습니다.');
      }

      const statsResult = await statsResponse.json();

      if (statsResult.success) {
        setStats(statsResult.data);
      }

      // 검수 목록 데이터 처리
      if (!itemsResponse.ok) {
        const errorData = await itemsResponse.json();
        throw new Error(errorData.error || '검수 목록을 가져오는데 실패했습니다.');
      }

      const itemsResult = await itemsResponse.json();

      if (itemsResult.success) {
        setItems(itemsResult.data.items);
        if (itemsResult.data.pagination) {
          setTotalPages(itemsResult.data.pagination.totalPages);
          setTotalItems(itemsResult.data.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error('검수 데이터 로드 실패:', error);
      setMessageDialog({
        open: true,
        title: '데이터 로드 실패',
        description:
          error instanceof Error ? error.message : '검수 데이터를 가져오는데 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '작품 상태 변경에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success) {
        // 다이얼로그 닫기
        setConfirmDialog((prev) => ({ ...prev, open: false }));

        // 현재 아이템의 상태를 찾아서 정확한 통계 업데이트
        const currentItem = items.find((item) => item.it_id === itemId);
        const previousStatus = currentItem?.review_status;
        const newStatus = action === 'payment' ? 'approved' : 'in_review';

        // 로컬 상태 업데이트 - 아이템의 review_status 변경
        setItems((prev) =>
          prev.map((item) =>
            item.it_id === itemId
              ? {
                  ...item,
                  review_status: newStatus,
                }
              : item,
          ),
        );

        // 통계 데이터 실시간 업데이트
        setStats((prevStats) => {
          if (!prevStats) return prevStats;

          const newStats = { ...prevStats };

          // 이전 상태에서 빼기
          if (previousStatus === 'in_review') {
            newStats.review = Math.max(0, newStats.review - 1);
          } else if (previousStatus === 'approved') {
            newStats.payment = Math.max(0, newStats.payment - 1);
          }

          // 새로운 상태에 추가
          if (newStatus === 'in_review') {
            newStats.review = newStats.review + 1;
          } else if (newStatus === 'approved') {
            newStats.payment = newStats.payment + 1;
          }

          return newStats;
        });
      } else {
        setMessageDialog({
          open: true,
          title: '작업 처리 실패',
          description: result.message || '처리 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('작품 상태 변경 실패:', error);
      setMessageDialog({
        open: true,
        title: '상태 변경 실패',
        description: error instanceof Error ? error.message : '작품 상태 변경에 실패했습니다.',
      });
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '디자인 검수 상태 변경에 실패했습니다.');
      }

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

        // 통계 데이터 실시간 업데이트
        setStats((prevStats) => {
          if (!prevStats) return prevStats;

          const isApproving = newVisibility === '1'; // 승인으로 변경
          const isRejecting = newVisibility === '0'; // 반려로 변경

          return {
            ...prevStats,
            approvedItems: isApproving
              ? prevStats.approvedItems + 1
              : isRejecting
                ? Math.max(0, prevStats.approvedItems - 1)
                : prevStats.approvedItems,
            rejectedItems: isRejecting
              ? prevStats.rejectedItems + 1
              : isApproving
                ? Math.max(0, prevStats.rejectedItems - 1)
                : prevStats.rejectedItems,
          };
        });
      } else {
        setMessageDialog({
          open: true,
          title: '검수 상태 변경 실패',
          description: result.message || '디자인 검수 상태 변경 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('디자인 검수 상태 변경 실패:', error);
      setMessageDialog({
        open: true,
        title: '검수 상태 변경 실패',
        description:
          error instanceof Error ? error.message : '디자인 검수 상태 변경에 실패했습니다.',
      });
    } finally {
      setVisibilityLoading(null);
    }
  };

  const handleImageError = (itemId: string) => {
    setImageErrors((prev) => new Set(prev).add(itemId));
  };

  return (
    <>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>작품 관리</h1>
            <p className='mt-1 text-gray-600'>
              모든 작품의 상태를 확인하고 구매 진행/제작 검토 처리를 할 수 있습니다.
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
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
                            className='px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {items.map((item) => (
                        <ReviewTableRow
                          key={item.it_id}
                          item={item}
                          imageErrors={imageErrors}
                          visibilityLoading={visibilityLoading}
                          actionLoading={actionLoading}
                          onImageError={handleImageError}
                          onToggleVisibility={handleToggleVisibility}
                          onShowConfirmDialog={showConfirmDialog}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className='mt-6 flex justify-center'>
                  <CommonPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pathname={ROUTES.ADMIN_REVIEW}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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

      <MessageDialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog((prev) => ({ ...prev, open }))}
        title={messageDialog.title}
        description={messageDialog.description}
      />
    </>
  );
}

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewManagement />
    </Suspense>
  );
}
