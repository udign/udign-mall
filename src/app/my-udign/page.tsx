'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArtworkStatus, ProductsByStatus, StatusCounts } from '@/types/artwork';
import { STATUS_GROUPS } from '@/lib/constants';
import { PAGINATION_CONFIG } from '@/config/pagination';
import ArtworkCard from '@/components/ArtworkCard';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import MessageDialog from '@/components/ui/MessageDialog';
import { Button } from '@/components/ui/primitives/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import Link from 'next/link';
import { FiInbox, FiAlertCircle } from 'react-icons/fi';
import { BsLightbulb } from 'react-icons/bs';
import { IoIosList } from 'react-icons/io';

interface MyUdignData {
  products: ProductsByStatus;
  counts: StatusCounts;
  user: {
    mb_id: string;
    mb_name: string;
    mb_level: number;
  };
}

interface TabPageState {
  page: number;
  hasMore: boolean;
  loading: boolean;
  data: ArtworkStatus[];
}

type TabPageStates = {
  [key: string]: TabPageState;
};

const steps = [
  '컬렉션',
  '심의중',
  '구매 진행',
  '결제대기',
  '결제완료',
  '상품 제작',
  '배송 진행',
  '수령 완료',
];

export default function MyUdignPage() {
  const [counts, setCounts] = useState<StatusCounts>({});
  const [user, setUser] = useState<MyUdignData['user'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [messageContent, setMessageContent] = useState<string>('');
  const [tabStates, setTabStates] = useState<TabPageStates>({});

  const router = useRouter();

  const { user: authUser, isLoading } = useAuth();

  // 초기 탭 상태 생성
  const initializeTabState = useCallback(
    (): TabPageState => ({
      page: 1,
      hasMore: true,
      loading: false,
      data: [],
    }),
    [],
  );

  // 현재 탭의 데이터 가져오기
  const currentTabData = tabStates[currentTab]?.data || [];

  useEffect(() => {
    if (isLoading) return;

    if (!authUser) {
      router.push('/login?redirect=/my-udign');
      return;
    }

    // 탭 상태 초기화
    const initialTabStates: TabPageStates = {};
    Object.keys(STATUS_GROUPS).forEach((key) => {
      initialTabStates[key] = initializeTabState();
    });
    setTabStates(initialTabStates);

    // 모든 탭의 첫 페이지 데이터 미리 로드
    fetchAllTabsInitialData();
  }, [authUser, isLoading, router, initializeTabState]);

  // 모든 탭의 초기 데이터 로드
  const fetchAllTabsInitialData = async () => {
    try {
      setLoading(true);

      // 모든 탭의 첫 페이지 데이터를 병렬로 가져오기
      const tabKeys = Object.keys(STATUS_GROUPS);
      const promises = tabKeys.map(async (tab) =>
        // fetch(`/api/my-udign?page=1&limit=${PAGINATION_CONFIG.MY_UDIGN_PAGE_SIZE}&tab=${tab}`)
        //   .then((res) => res.json())
        //   .then((result) => ({ tab, result })),
        {
          const response = await fetch(
            `/api/my-udign?page=1&limit=${PAGINATION_CONFIG.MY_UDIGN_PAGE_SIZE}&tab=${tab}`,
          );
          const result = await response.json();
          return { tab, result };
        },
      );

      const responses = await Promise.all(promises);

      // 첫 번째 응답에서 사용자 정보와 카운트 설정
      const firstSuccessResponse = responses.find((r) => r.result.success);
      if (firstSuccessResponse) {
        const { user, counts } = firstSuccessResponse.result.data;
        setUser(user);
        setCounts(counts);
      }

      // 모든 탭 상태 업데이트
      setTabStates((prev) => {
        const updated = { ...prev };

        responses.forEach(({ tab, result }) => {
          if (result.success) {
            updated[tab] = {
              page: 1,
              hasMore: result.data.hasMore,
              loading: false,
              data: result.data.products[tab] || [],
            };
          } else {
            updated[tab] = {
              page: 1,
              hasMore: false,
              loading: false,
              data: [],
            };
          }
        });

        return updated;
      });
    } catch (err) {
      console.error('초기 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 탭별 데이터 가져오기 (무한 스크롤용)
  const fetchTabData = async (tab: string, page: number) => {
    try {
      setTabStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], loading: true },
      }));

      const response = await fetch(
        `/api/my-udign?page=${page}&limit=${PAGINATION_CONFIG.MY_UDIGN_PAGE_SIZE}&tab=${tab}`,
      );

      if (!response.ok) {
        throw new Error('데이터를 불러올 수 없습니다.');
      }

      const result = await response.json();

      if (result.success) {
        // 탭 상태 업데이트 (기존 데이터에 추가)
        setTabStates((prev) => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            page: page,
            hasMore: result.data.hasMore,
            loading: false,
            data: [...(prev[tab]?.data || []), ...(result.data.products[tab] || [])],
          },
        }));
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('탭 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setTabStates((prev) => ({
        ...prev,
        [tab]: { ...prev[tab], loading: false },
      }));
    }
  };

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
  };

  // 무한 스크롤 처리
  const loadMoreData = useCallback(() => {
    const currentTabState = tabStates[currentTab];
    if (currentTabState && currentTabState.hasMore && !currentTabState.loading) {
      fetchTabData(currentTab, currentTabState.page + 1);
    }
  }, [currentTab, tabStates]);

  // 커스텀 훅으로 IntersectionObserver 처리
  const observerRef = useIntersectionObserver(loadMoreData);

  const handleInterestToggle = async (itemId: string) => {
    try {
      const response = await fetch('/api/my-udign/interest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });

      const result = await response.json();

      if (result.success) {
        // 모든 탭의 데이터 업데이트
        setTabStates((prev) => {
          const updated = { ...prev };

          Object.keys(updated).forEach((tab) => {
            if (updated[tab].data.length > 0) {
              updated[tab].data = updated[tab].data.map((artwork) => {
                if (artwork.it_id === itemId) {
                  const wasLiked = !!artwork.ir_id;
                  const isNowLiked = !wasLiked;

                  return {
                    ...artwork,
                    ir_id: isNowLiked ? 'temp' : undefined,
                    ir_time: isNowLiked ? new Date().toISOString() : undefined,
                    _iCount: isNowLiked ? artwork._iCount + 1 : Math.max(0, artwork._iCount - 1),
                  };
                }
                return artwork;
              });
            }
          });

          return updated;
        });
      } else {
        setMessageContent(result.message || '처리 중 오류가 발생했습니다.');
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('관심상품 토글 실패:', error);
      setMessageContent('서버 통신 중 오류가 발생했습니다.');
      setShowMessageDialog(true);
    }
  };

  const handleOrderCancel = async (orderId: string, cancelMemo: string) => {
    try {
      const response = await fetch('/api/my-udign/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, cancelMemo }),
      });

      const result = await response.json();

      if (result.success) {
        setMessageContent(result.message);
        setShowMessageDialog(true);

        // 모든 탭의 데이터 업데이트
        setTabStates((prev) => {
          const updated = { ...prev };

          Object.keys(updated).forEach((tab) => {
            if (updated[tab].data.length > 0) {
              updated[tab].data = updated[tab].data.map((artwork) => {
                if (artwork.od_id === orderId) {
                  return {
                    ...artwork,
                    od_status: '취소',
                    ct_status: '취소',
                    _status_text: '주문취소',
                    _status_key: 'cancelled',
                  };
                }
                return artwork;
              });
            }
          });

          return updated;
        });
      } else {
        setMessageContent(result.message || '주문 취소 중 오류가 발생했습니다.');
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('주문 취소 실패:', error);
      setMessageContent('서버 통신 중 오류가 발생했습니다.');
      setShowMessageDialog(true);
    }
  };

  const handlePurchaseConfirm = async (orderId: string) => {
    try {
      const response = await fetch('/api/my-udign/confirm-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (result.success) {
        setMessageContent(result.message);
        setShowMessageDialog(true);

        // 모든 탭의 데이터 업데이트
        setTabStates((prev) => {
          const updated = { ...prev };

          Object.keys(updated).forEach((tab) => {
            if (updated[tab].data.length > 0) {
              updated[tab].data = updated[tab].data.map((artwork) => {
                if (artwork.od_id === orderId) {
                  return {
                    ...artwork,
                    od_status: '구매확정',
                    ct_status: '구매확정',
                    _status_text: '구매확정',
                    _status_key: 'completed',
                  };
                }
                return artwork;
              });
            }
          });

          return updated;
        });
      } else {
        setMessageContent(result.message || '구매 확정 중 오류가 발생했습니다.');
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('구매 확정 실패:', error);
      setMessageContent('서버 통신 중 오류가 발생했습니다.');
      setShowMessageDialog(true);
    }
  };

  const handleReturnSubmit = async (returnData: {
    orderId: string;
    name: string;
    phone: string;
    returnType: 'exchange' | 'return';
    reason: string;
  }) => {
    try {
      const response = await fetch('/api/my-udign/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(returnData),
      });

      const result = await response.json();

      if (result.success) {
        setMessageContent(result.message);
        setShowMessageDialog(true);

        // 모든 탭의 데이터 업데이트
        setTabStates((prev) => {
          const updated = { ...prev };

          Object.keys(updated).forEach((tab) => {
            if (updated[tab].data.length > 0) {
              updated[tab].data = updated[tab].data.map((artwork) => {
                if (artwork.od_id === returnData.orderId) {
                  return {
                    ...artwork,
                    return_status: 'pending',
                    return_type: returnData.returnType,
                    return_id: 'temp',
                    return_updated: new Date().toISOString(),
                    _status_text: returnData.returnType === 'exchange' ? '교환신청' : '반품신청',
                  };
                }
                return artwork;
              });
            }
          });

          return updated;
        });
      } else {
        setMessageContent(result.message || '교환/반품 신청 중 오류가 발생했습니다.');
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('교환/반품 신청 실패:', error);
      setMessageContent('서버 통신 중 오류가 발생했습니다.');
      setShowMessageDialog(true);
    }
  };

  const handleAdminToggle = async (itemId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/review-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          it_id: itemId,
          it_10: newStatus,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // 모든 탭의 데이터 업데이트
        setTabStates((prev) => {
          const updated = { ...prev };

          Object.keys(updated).forEach((tab) => {
            if (updated[tab].data.length > 0) {
              updated[tab].data = updated[tab].data.map((artwork) => {
                if (artwork.it_id === itemId) {
                  let newStatusKey = 'collection';
                  if (newStatus === 'Y') {
                    newStatusKey = 'review';
                  } else if (newStatus === 'N') {
                    newStatusKey = 'payment';
                  }

                  return {
                    ...artwork,
                    it_10: result.data.it_10,
                    _status_text: result.data.statusText,
                    _status_key: newStatusKey,
                  };
                }
                return artwork;
              });
            }
          });

          return updated;
        });
      } else {
        throw new Error(result.message || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('관리자 토글 실패:', error);
      throw error;
    }
  };

  return isLoading || loading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner size='lg' message='로딩 중...' />
    </div>
  ) : error ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <p className='mb-4 text-red-600'>{error}</p>
        <Button
          onClick={() => fetchAllTabsInitialData()}
          className='bg-primary hover:bg-primary-hover'
        >
          다시 시도
        </Button>
      </div>
    </div>
  ) : (
    user && (
      <div className='min-h-screen'>
        <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
          <div className='mb-6 rounded-lg bg-gray-50 p-4 sm:p-6'>
            <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
              <div>
                <h1 className='mb-1 text-xl font-bold text-gray-900 sm:mb-2 sm:text-2xl'>
                  My UDIGN
                </h1>
                <p className='text-sm text-gray-600 sm:text-base'>나만의 특별한 디자인 여정</p>
              </div>
              <div className='text-left sm:text-right'>
                <p className='text-base font-semibold sm:text-lg'>{user.mb_name}님</p>
                <p className='text-sm text-gray-600 sm:text-base'>유다인에 오신 것을 환영합니다</p>
              </div>
            </div>
          </div>

          <div className='mb-6 rounded-lg border border-gray-100 p-6'>
            <h2 className='mb-4 flex items-center text-lg font-semibold'>
              <FiAlertCircle className='mr-2' />
              UDIGN 프리오더 시스템
            </h2>
            <div className='mb-4 space-y-2 text-sm text-gray-600'>
              <p>
                • <strong>작품</strong>: 메인 페이지의 디자이너 스케치
              </p>
              <p>
                • <strong>좋아요</strong>: 마음에 드는 작품에 대한 제작 희망 의사표현
              </p>
              <p>
                • <strong>상품</strong>: 실제 제작된 작품 (좋아요한 회원만 구매 가능)
              </p>
            </div>

            <div className='mb-4 rounded-lg bg-blue-50 p-4'>
              <p className='text-sm text-blue-800'>
                <span className='flex items-center'>
                  <BsLightbulb className='mr-1' /> 심의 진행 방식:
                </span>
                <br />• <strong>자동 심의</strong>: 목표 좋아요 인원 달성 시 자동으로 심의 단계 진행
                <br />• <strong>수동 심의</strong>: 관리자가 설정한 기간 후 심의 단계 진행
              </p>
            </div>

            <div className='scrollbar-hide flex items-center justify-between overflow-x-auto rounded-lg bg-gray-50 px-4 py-4 sm:px-6'>
              {steps
                .map((step, index) => [
                  <div key={`step-${index}`} className='text-center'>
                    <p className='min-w-20 text-xs font-medium whitespace-nowrap text-gray-700 sm:min-w-18'>
                      {step}
                    </p>
                  </div>,
                  index < steps.length - 1 && (
                    <div key={`arrow-${index}`} className='mx-1 text-gray-400 sm:mx-2'>
                      →
                    </div>
                  ),
                ])
                .flat()
                .filter(Boolean)}
            </div>
          </div>

          <div className='rounded-lg border border-gray-100 p-6'>
            <div className='mb-6 flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>나의 작품 현황</h2>
              <Link
                href='/order-history'
                className='flex items-center gap-1 text-sm font-semibold text-gray-700'
              >
                <IoIosList className='h-4 w-4' />
                전체 주문내역
              </Link>
            </div>

            <div className='border-b border-gray-100'>
              <nav className='scrollbar-hide flex overflow-x-auto'>
                {Object.entries(STATUS_GROUPS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`relative flex min-w-24 flex-1 cursor-pointer items-center justify-center gap-2 pb-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 hover:text-gray-900 ${
                      currentTab === key ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {key === 'interest' && '❤️ '}
                    {label}
                    {counts[key] > 0 && <span className='text-gray-400'>{counts[key]}</span>}
                    {currentTab === key && (
                      <div className='absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-gray-900' />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className='mt-6'>
              {currentTabData.length === 0 && !tabStates[currentTab]?.loading ? (
                <div className='py-14 text-center'>
                  <FiInbox className='mx-auto mb-4 h-14 w-14 text-gray-300' />
                  <p className='text-gray-500'>해당 상태의 작품이 없습니다.</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {currentTabData.map((artwork) => (
                    <ArtworkCard
                      key={artwork.it_id}
                      artwork={artwork}
                      onInterestToggle={handleInterestToggle}
                      onOrderCancel={handleOrderCancel}
                      onPurchaseConfirm={handlePurchaseConfirm}
                      onReturnSubmit={handleReturnSubmit}
                      onAdminToggle={handleAdminToggle}
                      isAdmin={user.mb_level >= 10}
                    />
                  ))}

                  {tabStates[currentTab]?.hasMore && (
                    <div ref={observerRef} className='flex justify-center py-4'>
                      {tabStates[currentTab]?.loading && (
                        <LoadingSpinner size='sm' message='더 많은 작품을 불러오는 중...' />
                      )}
                    </div>
                  )}

                  {!tabStates[currentTab]?.hasMore && currentTabData.length > 0 && (
                    <div className='py-4 text-center text-sm text-gray-500'>
                      모든 작품을 불러왔습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <MessageDialog
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          title='알림'
          description={messageContent}
        />
      </div>
    )
  );
}
