'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSION_CHECKS, PAGINATION_CONFIG } from '@/lib/constants';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import CommonPagination from '@/components/CommonPagination';

import { Button } from '@/components/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/primitives/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';
import { OrderListItem } from '@/app/api/admin/order-list/route';
import { ROUTES } from '@/lib/routes';
import { formatOrderId, formatDateOnly } from '@/lib/utils';
import MessageDialog from '@/components/ui/MessageDialog';

interface OrderListData {
  orders: OrderListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  totals: {
    itemCount: number;
    orderPrice: number;
    receiptPrice: number;
    cancelPrice: number;
    couponPrice: number;
    misu: number;
  };
}

interface ApiResponse {
  success: boolean;
  data?: OrderListData;
  error?: string;
}

const getPaymentMethodDisplay = (settle_case: string): string => {
  switch (settle_case) {
    case 'card':
      return '신용카드';
    case 'bank':
      return '무통장입금';
    case 'phone':
      return '휴대폰';
    case 'samsung':
      return '삼성페이';
    case 'kakao':
      return '카카오페이';
    case 'payco':
      return '페이코';
    case 'naverpay':
      return '네이버페이';
    case 'tosspay':
      return '토스페이';
    default:
      return settle_case || '-';
  }
};

export default function OrderListPage() {
  const [orderData, setOrderData] = useState<OrderListData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [messageDialog, setMessageDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: '',
    description: '',
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  const { user, isLoading: authLoading } = useAuth();

  const currentPage = parseInt(searchParams.get('page') || '1');

  const { orders, pagination } = orderData || {
    orders: [],
    pagination: { total: 0, page: 1, limit: PAGINATION_CONFIG.ITEMS_PER_PAGE, totalPages: 0 },
  };

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

  const fetchOrderList = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/order-list?page=${page}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}`,
      );
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setOrderData(result.data);
      } else {
        setError(result.error || '주문내역을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('주문내역 조회 오류:', err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: '준비' | '배송') => {
    try {
      setStatusLoading(orderId);

      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '주문 상태 변경에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success) {
        // 로컬 상태 업데이트
        setOrderData((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            orders: prev.orders.map((order) =>
              order.od_id === orderId ? { ...order, od_status: newStatus } : order,
            ),
          };
        });

        setMessageDialog({
          open: true,
          title: '상태 변경 완료',
          description: result.message,
        });
      } else {
        throw new Error(result.message || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 상태 변경 오류:', error);
      setMessageDialog({
        open: true,
        title: '상태 변경 실패',
        description: error instanceof Error ? error.message : '주문 상태 변경에 실패했습니다.',
      });
    } finally {
      setStatusLoading(null);
    }
  };

  useEffect(() => {
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', searchParams.get('page') || '1');
      router.replace(`${ROUTES.ADMIN_ORDERLIST}?${params.toString()}`);
    } else if (user && PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      fetchOrderList(currentPage);
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
  ) : (
    <div className='container mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>주문내역 관리</h1>
        <p className='mt-1 text-gray-600'>전체 주문 내역을 조회하고 관리할 수 있습니다.</p>
      </div>

      {isLoading ? (
        <div className='flex min-h-screen items-center justify-center'>
          <LoadingSpinner size='lg' message='주문내역을 불러오는 중...' />
        </div>
      ) : error ? (
        <div className='flex min-h-96 items-center justify-center'>
          <div className='text-center'>
            <p className='mb-4 text-red-600'>{error}</p>
            <button
              onClick={() => fetchOrderList(currentPage)}
              className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : !orderData ? (
        <div className='flex min-h-96 items-center justify-center'>
          <p>데이터를 불러올 수 없습니다.</p>
        </div>
      ) : (
        <>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900'>전체 주문내역</h3>
            <p className='text-sm text-gray-600'>
              총 {pagination.total}개 내역 (페이지 {currentPage}/{pagination.totalPages})
            </p>
          </div>

          <div className='overflow-hidden rounded-lg border bg-white'>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      상품
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      주문번호
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      주문자
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      받는분
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      주문상태
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      주문금액
                    </th>
                    <th className='px-4 py-3 text-right text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      실결제금액
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      결제수단
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      운송장번호
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase'>
                      배송회사
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {orders.map((order) => (
                    <tr key={order.od_id} className='transition-colors hover:bg-gray-50'>
                      <td className='px-4 py-4'>
                        <div className='flex max-w-48 flex-col space-y-1'>
                          {order.items.slice(0, 2).map((item, index) => (
                            <div
                              key={`${item.it_id}-${index}`}
                              className='flex items-center space-x-2'
                            >
                              {item.it_img1 && (
                                <div className='h-8 w-8 flex-shrink-0'>
                                  <Image
                                    src={item.it_img1}
                                    alt={item.it_name}
                                    width={32}
                                    height={32}
                                    className='h-full w-full rounded object-cover'
                                    unoptimized
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                              <span className='truncate text-sm text-gray-700'>{item.it_name}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className='text-sm text-gray-500'>+{order.items.length - 2}개</div>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='text-sm'>
                          <div className='font-medium text-blue-600'>
                            {formatOrderId(order.od_id)}
                          </div>
                          <div className='text-xs text-gray-500'>
                            {formatDateOnly(order.od_time)}
                          </div>
                          {order.od_mobile === 1 && (
                            <span className='inline-block rounded bg-green-100 px-1 text-xs text-green-800'>
                              M
                            </span>
                          )}
                          {order.od_test === 1 && (
                            <span className='ml-1 inline-block rounded bg-orange-100 px-1 text-xs text-orange-800'>
                              테스트
                            </span>
                          )}
                          {order.od_escrow === 1 && (
                            <span className='ml-1 inline-block rounded bg-purple-100 px-1 text-xs text-purple-800'>
                              에스크로
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>{order.od_name}</div>
                        <div className='text-xs text-gray-500'>
                          {order.od_tel || order.od_hp || '-'}
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='text-sm'>
                          <div className='font-medium text-gray-900'>{order.od_b_name}</div>
                          <div className='text-xs text-gray-500'>
                            {order.od_b_tel || order.od_b_hp}
                          </div>
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        {statusLoading === order.od_id ? (
                          <div className='flex items-center justify-center'>
                            <LoadingSpinner size='sm' className='mb-0' />
                            <span className='ml-2 text-sm text-gray-600'>변경 중...</span>
                          </div>
                        ) : ['입금', '준비'].includes(order.od_status as string) ? (
                          <div className='flex justify-center'>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className={`h-8 rounded-full border px-3 text-sm font-medium ${
                                    order.od_status === '입금'
                                      ? 'border-green-200 bg-green-100 text-green-800'
                                      : (order.od_status as string) === '준비'
                                        ? 'border-yellow-200 bg-yellow-100 text-yellow-800'
                                        : 'border-gray-200 bg-gray-100 text-gray-800'
                                  }`}
                                  disabled={statusLoading !== null}
                                >
                                  {order.od_status}
                                  <ChevronDownIcon className='ml-2 h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                {order.od_status === '입금' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleOrderStatusChange(order.od_id, '준비')}
                                      disabled={statusLoading !== null}
                                    >
                                      <span className='text-yellow-600'>상품제작</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOrderStatusChange(order.od_id, '배송')}
                                      disabled={statusLoading !== null}
                                    >
                                      <span className='text-blue-600'>배송진행</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(order.od_status as string) === '준비' && (
                                  <DropdownMenuItem
                                    onClick={() => handleOrderStatusChange(order.od_id, '배송')}
                                    disabled={statusLoading !== null}
                                  >
                                    <span className='text-blue-600'>배송진행</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              order.od_status === '완료'
                                ? 'bg-green-100 text-green-800'
                                : order.od_status === '배송'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.od_status === '준비'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.od_status === '주문'
                                      ? 'bg-gray-100 text-gray-800'
                                      : order.od_status === '취소'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.od_status}
                          </span>
                        )}
                      </td>
                      <td className='px-4 py-4 text-right whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {order.od_cart_price.toLocaleString()}원
                        </div>
                      </td>
                      <td className='px-4 py-4 text-right whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>
                          {order.od_receipt_price.toLocaleString()}원
                        </div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {getPaymentMethodDisplay(order.od_settle_case)}
                        </div>
                        {order.od_receipt_point > 0 && (
                          <div className='text-xs text-gray-500'>포인트</div>
                        )}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>{order.od_invoice || '-'}</div>
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='text-sm text-gray-900'>
                          {order.od_delivery_company || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {orders.length === 0 && (
              <div className='py-12 text-center'>
                <p className='text-gray-500'>주문 내역이 없습니다.</p>
              </div>
            )}
          </div>

          <div className='mt-6 flex justify-center'>
            <CommonPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pathname={ROUTES.ADMIN_ORDERLIST}
              queryParams={{}}
            />
          </div>
        </>
      )}

      <MessageDialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog((prev) => ({ ...prev, open }))}
        title={messageDialog.title}
        description={messageDialog.description}
      />
    </div>
  );
}
