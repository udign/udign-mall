'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSION_CHECKS, PAGINATION_CONFIG } from '@/lib/constants';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import CommonPagination from '@/components/CommonPagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/primitives/tabs';
import { OrderListItem } from '@/app/api/admin/order-list/route';
import { ROUTES } from '@/lib/routes';
import { formatOrderId, formatDateOnly } from '@/lib/utils';

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

// 결제수단 표시명 변환 유틸 함수
const getPaymentMethodDisplay = (settleCase: string): string => {
  const paymentMethods: Record<string, string> = {
    무통장: '무통장',
    가상계좌: '가상계좌',
    계좌이체: '계좌이체',
    휴대폰: '휴대폰',
    신용카드: '신용카드',
    간편결제: '간편결제',
    KAKAOPAY: '카카오페이',
    삼성페이: '삼성페이',
    lpay: 'LPAY',
    inicis_kakaopay: '카카오페이',
  };
  return paymentMethods[settleCase] || settleCase || '결제수단없음';
};

export default function OrderListPage() {
  const [orderData, setOrderData] = useState<OrderListData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const { user, isLoading: authLoading } = useAuth();

  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentTab = searchParams.get('tab') || 'basic';

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', newTab);
    params.set('page', '1'); // 탭 변경 시 첫 페이지로 이동
    router.push(`${ROUTES.ADMIN_ORDERLIST}?${params.toString()}`);
  };

  const { orders, pagination } = orderData || {
    orders: [],
    pagination: { total: 0, page: 1, limit: PAGINATION_CONFIG.ITEMS_PER_PAGE, totalPages: 0 },
  };

  // 현재 페이지 데이터의 합계 계산
  const currentPageTotals = {
    itemCount: orders.length,
    orderPrice: orders.reduce((sum, order) => sum + order.od_cart_price, 0),
    receiptPrice: orders.reduce((sum, order) => sum + order.od_receipt_price, 0),
    cancelPrice: orders.reduce((sum, order) => sum + order.od_cancel_price, 0),
    couponPrice: orders.reduce((sum, order) => sum + (order.od_coupon || 0), 0),
    misu: orders.reduce((sum, order) => sum + (order.od_misu || 0), 0),
  };

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      router.push(ROUTES.HOME);
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

  useEffect(() => {
    if (!searchParams.get('page') || !searchParams.get('tab')) {
      const params = new URLSearchParams();
      params.set('tab', searchParams.get('tab') || 'basic');
      params.set('page', searchParams.get('page') || '1');
      router.replace(`${ROUTES.ADMIN_ORDERLIST}?${params.toString()}`);
    } else if (user && PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      fetchOrderList(currentPage);
    }
  }, [currentPage, currentTab, user, searchParams, router]);

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
              총 {pagination.total}개 내역 (페이지 {pagination.totalPages}/{currentPage})
            </p>
          </div>

          <Tabs value={currentTab} onValueChange={handleTabChange} className='w-full'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='basic'>기본 정보</TabsTrigger>
              <TabsTrigger value='payment'>결제 정보</TabsTrigger>
              <TabsTrigger value='status'>주문 상태</TabsTrigger>
              <TabsTrigger value='delivery'>배송 정보</TabsTrigger>
            </TabsList>

            <TabsContent value='basic' className='mt-6'>
              <div className='overflow-hidden rounded-lg border bg-white'>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          상품
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문번호
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문자
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문자전화
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          받는분
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
                                  <span className='truncate text-sm text-gray-700'>
                                    {item.it_name}
                                  </span>
                                </div>
                              ))}
                              {order.items.length > 2 && (
                                <div className='text-sm text-gray-500'>
                                  +{order.items.length - 2}개
                                </div>
                              )}
                            </div>
                          </td>
                          <td className='px-4 py-4'>
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
                          <td className='px-4 py-4'>
                            <div className='text-sm font-medium text-gray-900'>{order.od_name}</div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm text-gray-900'>
                              {order.od_tel || order.od_hp}
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm'>
                              <div className='font-medium text-gray-900'>{order.od_b_name}</div>
                              <div className='text-xs text-gray-500'>
                                {order.od_b_tel || order.od_b_hp}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className='bg-gray-100'>
                      <tr>
                        <td colSpan={5} className='px-4 py-3 text-center font-medium text-gray-900'>
                          현재 페이지 ({currentPageTotals.itemCount.toLocaleString()}건)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {orders.length === 0 && (
                  <div className='py-12 text-center'>
                    <p className='text-gray-500'>주문 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value='payment' className='mt-6'>
              <div className='overflow-hidden rounded-lg border bg-white'>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문번호
                        </th>
                        <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문합계
                        </th>
                        <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          선불배송비포함
                        </th>
                        <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          입금합계
                        </th>
                        <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문취소
                        </th>
                        <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          쿠폰
                        </th>
                        <th className='px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          미수금
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          결제수단
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {orders.map((order) => (
                        <tr key={order.od_id} className='transition-colors hover:bg-gray-50'>
                          <td className='px-4 py-4'>
                            <div className='text-sm'>
                              <div className='font-medium text-blue-600'>
                                {formatOrderId(order.od_id)}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {formatDateOnly(order.od_time)}
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4 text-right'>
                            <div className='text-sm font-medium text-gray-900'>
                              {order.od_cart_price.toLocaleString()}원
                            </div>
                          </td>
                          <td className='px-4 py-4 text-right'>
                            <div className='text-sm font-medium text-gray-900'>
                              {order.od_cart_price.toLocaleString()}원
                            </div>
                          </td>
                          <td className='px-4 py-4 text-right'>
                            <div className='text-sm font-medium text-gray-900'>
                              {order.od_receipt_price.toLocaleString()}원
                            </div>
                          </td>
                          <td className='px-4 py-4 text-right'>
                            <div
                              className={`text-sm font-medium ${order.od_cancel_price > 0 ? 'text-red-600' : 'text-gray-900'}`}
                            >
                              {order.od_cancel_price.toLocaleString()}원
                            </div>
                          </td>
                          <td className='px-4 py-4 text-right'>
                            <div className='text-sm font-medium text-gray-900'>
                              {(order.od_coupon || 0).toLocaleString()}원
                            </div>
                          </td>
                          <td className='px-4 py-4 text-right'>
                            <div className='text-sm font-medium text-gray-900'>
                              {(order.od_misu || 0).toLocaleString()}원
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm text-gray-900'>
                              {getPaymentMethodDisplay(order.od_settle_case)}
                            </div>
                            {order.od_receipt_point > 0 && (
                              <div className='text-xs text-gray-500'>포인트</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className='bg-gray-100'>
                      <tr>
                        <td className='px-4 py-3 text-center font-medium text-gray-900'>
                          현재 페이지 ({currentPageTotals.itemCount.toLocaleString()}건)
                        </td>
                        <td className='px-4 py-3 text-right font-bold text-gray-900'>
                          {currentPageTotals.orderPrice.toLocaleString()}원
                        </td>
                        <td className='px-4 py-3 text-right font-bold text-gray-900'>
                          {currentPageTotals.orderPrice.toLocaleString()}원
                        </td>
                        <td className='px-4 py-3 text-right font-bold text-gray-900'>
                          {currentPageTotals.receiptPrice.toLocaleString()}원
                        </td>
                        <td className='px-4 py-3 text-right font-bold text-red-600'>
                          {currentPageTotals.cancelPrice.toLocaleString()}원
                        </td>
                        <td className='px-4 py-3 text-right font-bold text-gray-900'>
                          {currentPageTotals.couponPrice.toLocaleString()}원
                        </td>
                        <td className='px-4 py-3 text-right font-bold text-gray-900'>
                          {currentPageTotals.misu.toLocaleString()}원
                        </td>
                        <td className='px-4 py-3'></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {orders.length === 0 && (
                  <div className='py-12 text-center'>
                    <p className='text-gray-500'>주문 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value='status' className='mt-6'>
              <div className='overflow-hidden rounded-lg border bg-white'>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문번호
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문자
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          회원ID
                        </th>
                        <th className='px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문상품수
                        </th>
                        <th className='px-4 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          누적주문수
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문상태
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {orders.map((order) => (
                        <tr key={order.od_id} className='transition-colors hover:bg-gray-50'>
                          <td className='px-4 py-4'>
                            <div className='text-sm'>
                              <div className='font-medium text-blue-600'>
                                {formatOrderId(order.od_id)}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {formatDateOnly(order.od_time)}
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm font-medium text-gray-900'>{order.od_name}</div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm text-gray-900'>{order.mb_id || '비회원'}</div>
                          </td>
                          <td className='px-4 py-4 text-center'>
                            <div className='text-sm text-gray-900'>{order.od_cart_count}건</div>
                          </td>
                          <td className='px-4 py-4 text-center'>
                            <div className='text-sm text-gray-900'>
                              {order.member_order_count || 0}건
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                order.od_status === '완료'
                                  ? 'bg-green-100 text-green-800'
                                  : order.od_status === '배송'
                                    ? 'bg-blue-100 text-blue-800'
                                    : order.od_status === '준비'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : order.od_status === '입금'
                                        ? 'bg-green-100 text-green-800'
                                        : order.od_status === '주문'
                                          ? 'bg-gray-100 text-gray-800'
                                          : order.od_status === '취소'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {order.od_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className='bg-gray-100'>
                      <tr>
                        <td colSpan={6} className='px-4 py-3 text-center font-medium text-gray-900'>
                          현재 페이지 ({currentPageTotals.itemCount.toLocaleString()}건)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {orders.length === 0 && (
                  <div className='py-12 text-center'>
                    <p className='text-gray-500'>주문 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 배송 정보 탭 */}
            <TabsContent value='delivery' className='mt-6'>
              <div className='overflow-hidden rounded-lg border bg-white'>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문번호
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          받는분
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          주문상태
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          운송장번호
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          배송회사
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase'>
                          배송일시
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-200 bg-white'>
                      {orders.map((order) => (
                        <tr key={order.od_id} className='transition-colors hover:bg-gray-50'>
                          <td className='px-4 py-4'>
                            <div className='text-sm'>
                              <div className='font-medium text-blue-600'>
                                {formatOrderId(order.od_id)}
                              </div>
                              <div className='text-xs text-gray-500'>
                                {formatDateOnly(order.od_time)}
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm'>
                              <div className='font-medium text-gray-900'>{order.od_b_name}</div>
                              <div className='text-xs text-gray-500'>
                                {order.od_b_tel || order.od_b_hp}
                              </div>
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                order.od_status === '완료'
                                  ? 'bg-green-100 text-green-800'
                                  : order.od_status === '배송'
                                    ? 'bg-blue-100 text-blue-800'
                                    : order.od_status === '준비'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : order.od_status === '입금'
                                        ? 'bg-green-100 text-green-800'
                                        : order.od_status === '주문'
                                          ? 'bg-gray-100 text-gray-800'
                                          : order.od_status === '취소'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {order.od_status}
                            </span>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm text-gray-900'>{order.od_invoice || '-'}</div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm text-gray-900'>
                              {order.od_delivery_company || '-'}
                            </div>
                          </td>
                          <td className='px-4 py-4'>
                            <div className='text-sm text-gray-900'>-</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className='bg-gray-100'>
                      <tr>
                        <td colSpan={6} className='px-4 py-3 text-center font-medium text-gray-900'>
                          현재 페이지 ({currentPageTotals.itemCount.toLocaleString()}건)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {orders.length === 0 && (
                  <div className='py-12 text-center'>
                    <p className='text-gray-500'>주문 내역이 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className='mt-6 flex justify-center'>
            <CommonPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pathname={ROUTES.ADMIN_ORDERLIST}
              queryParams={{ tab: currentTab }}
            />
          </div>
        </>
      )}
    </div>
  );
}
