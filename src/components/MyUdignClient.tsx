'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArtworkStatus, ProductsByStatus, StatusCounts } from '@/types/artwork';
import { STATUS_GROUPS } from '@/lib/constants';
import { PAGINATION_CONFIG } from '@/lib/constants';
import ArtworkCard from '@/components/ArtworkCard';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import MessageDialog from '@/components/ui/MessageDialog';
import { Button } from '@/components/ui/primitives/button';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { FiInbox, FiAlertCircle } from 'react-icons/fi';
import { BsLightbulb } from 'react-icons/bs';
import { ROUTES } from '@/lib/routes';
import { Dictionary } from '@/lib/dictionaries';

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

interface MyUdignClientProps {
  dictionary: Dictionary;
}

export default function MyUdignClient({ dictionary }: MyUdignClientProps) {
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

  // Steps from dictionary
  const steps = [
    dictionary.myUdign.steps.collection,
    dictionary.myUdign.steps.review,
    dictionary.myUdign.steps.payment,
    dictionary.myUdign.steps.paymentWaiting,
    dictionary.myUdign.steps.paymentCompleted,
    dictionary.myUdign.steps.making,
    dictionary.myUdign.steps.shipping,
    dictionary.myUdign.steps.completed,
  ];

  useEffect(() => {
    if (isLoading) return;

    if (!authUser) {
      router.push(ROUTES.LOGIN);
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
      const promises = tabKeys.map(async (tab) => {
        const response = await fetch(
          `/api/my-udign?page=1&limit=${PAGINATION_CONFIG.MY_UDIGN_PAGE_SIZE}&tab=${tab}`,
        );
        const result = await response.json();
        return { tab, result };
      });

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
      setError(err instanceof Error ? err.message : dictionary.common.error);
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
        throw new Error(dictionary.common.error);
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
        setError(result.error || dictionary.common.error);
      }
    } catch (err) {
      console.error('탭 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : dictionary.common.error);
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
        // 먼저 현재 좋아요 상태 확인
        let wasLiked = false;
        let isNowLiked = false;

        // 현재 탭 데이터에서 작품 찾기
        const currentArtwork = currentTabData.find((artwork) => artwork.it_id === itemId);

        if (currentArtwork) {
          wasLiked = !!currentArtwork.ir_id;
          isNowLiked = !wasLiked;
        }

        // 모든 탭의 데이터 업데이트
        setTabStates((prev) => {
          const updated = { ...prev };

          if (wasLiked && !isNowLiked) {
            // 좋아요 해제된 경우: 좋아요 관련 탭들에서 작품 제거
            Object.keys(updated).forEach((tab) => {
              if (updated[tab].data.length > 0) {
                if (tab === 'all' || tab === 'collection') {
                  // 전체 탭과 컬렉션(❤️ 디자인) 탭에서는 작품 완전 제거
                  updated[tab].data = updated[tab].data.filter(
                    (artwork) => artwork.it_id !== itemId,
                  );
                } else {
                  // 다른 탭에서는 좋아요 상태만 업데이트
                  updated[tab].data = updated[tab].data.map((artwork) => {
                    if (artwork.it_id === itemId) {
                      return {
                        ...artwork,
                        ir_id: undefined,
                        ir_time: undefined,
                        _iCount: Math.max(0, artwork._iCount - 1),
                      };
                    }
                    return artwork;
                  });
                }
              }
            });
          } else if (!wasLiked && isNowLiked) {
            // 좋아요 추가된 경우: 모든 탭에서 상태 업데이트
            Object.keys(updated).forEach((tab) => {
              if (updated[tab].data.length > 0) {
                updated[tab].data = updated[tab].data.map((artwork) => {
                  if (artwork.it_id === itemId) {
                    return {
                      ...artwork,
                      ir_id: 'temp',
                      ir_time: new Date().toISOString(),
                      _iCount: artwork._iCount + 1,
                    };
                  }
                  return artwork;
                });
              }
            });
          }

          return updated;
        });

        // 🔑 핵심: counts도 즉시 업데이트 (좋아요 관련 탭들)
        setCounts((prev) => {
          if (wasLiked && !isNowLiked) {
            // 좋아요 해제시: 전체와 컬렉션 카운트 감소
            return {
              ...prev,
              all: Math.max(0, prev.all - 1),
              collection: Math.max(0, prev.collection - 1),
            };
          } else if (!wasLiked && isNowLiked) {
            // 좋아요 추가시: 전체와 컬렉션 카운트 증가
            return {
              ...prev,
              all: prev.all + 1,
              collection: prev.collection + 1,
            };
          }
          return prev;
        });
      } else {
        setMessageContent(result.message || dictionary.common.error);
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('관심상품 토글 실패:', error);
      setMessageContent(dictionary.common.error);
      setShowMessageDialog(true);
    }
  };

  const handleOrderCancel = async (orderId: string, cancelMemo: string) => {
    try {
      // 먼저 현재 작품 상태 확인
      const currentArtwork = currentTabData.find((artwork) => artwork.od_id === orderId);
      if (!currentArtwork) return;

      const oldStatusKey = currentArtwork._status_key;

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

        const newStatusKey = 'cancelled';

        // 탭 간 이동 로직
        setTabStates((prev) => {
          const updated = { ...prev };

          Object.keys(updated).forEach((tab) => {
            if (updated[tab].data.length > 0) {
              if (tab === oldStatusKey) {
                // 기존 탭에서는 작품 제거
                updated[tab].data = updated[tab].data.filter(
                  (artwork) => artwork.od_id !== orderId,
                );
              } else if (tab === newStatusKey) {
                // 새로운 탭에 작품 추가 (이미 존재하지 않는 경우에만)
                const exists = updated[tab].data.some((artwork) => artwork.od_id === orderId);
                if (!exists) {
                  const updatedArtwork = {
                    ...currentArtwork,
                    od_status: '취소',
                    ct_status: '취소',
                    _status_text: dictionary.myUdign.artwork.status.cancelled,
                    _status_key: newStatusKey,
                  };
                  updated[tab].data = [updatedArtwork, ...updated[tab].data];
                }
              } else if (tab === 'all') {
                // 전체 탭에서는 상태만 업데이트
                updated[tab].data = updated[tab].data.map((artwork) => {
                  if (artwork.od_id === orderId) {
                    return {
                      ...artwork,
                      od_status: '취소',
                      ct_status: '취소',
                      _status_text: dictionary.myUdign.artwork.status.cancelled,
                      _status_key: newStatusKey,
                    };
                  }
                  return artwork;
                });
              }
            }
          });

          return updated;
        });

        // 카운트 업데이트
        setCounts((prev) => {
          const newCounts = { ...prev };

          // 기존 탭 카운트 감소
          if (newCounts[oldStatusKey] > 0) {
            newCounts[oldStatusKey] = newCounts[oldStatusKey] - 1;
          }

          // 새로운 탭 카운트 증가
          newCounts[newStatusKey] = (newCounts[newStatusKey] || 0) + 1;

          return newCounts;
        });
      } else {
        setMessageContent(result.message || dictionary.common.error);
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('주문 취소 실패:', error);
      setMessageContent(dictionary.common.error);
      setShowMessageDialog(true);
    }
  };

  const handlePurchaseConfirm = async (orderId: string) => {
    try {
      // 먼저 현재 작품 상태 확인
      const currentArtwork = currentTabData.find((artwork) => artwork.od_id === orderId);
      if (!currentArtwork) return;

      const oldStatusKey = currentArtwork._status_key;

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

        const newStatusKey = 'completed';

        // 탭 간 이동 로직
        setTabStates((prev) => {
          const updated = { ...prev };

          Object.keys(updated).forEach((tab) => {
            if (updated[tab].data.length > 0) {
              if (tab === oldStatusKey) {
                // 기존 탭에서는 작품 제거
                updated[tab].data = updated[tab].data.filter(
                  (artwork) => artwork.od_id !== orderId,
                );
              } else if (tab === newStatusKey) {
                // 새로운 탭에 작품 추가 (이미 존재하지 않는 경우에만)
                const exists = updated[tab].data.some((artwork) => artwork.od_id === orderId);
                if (!exists) {
                  const updatedArtwork = {
                    ...currentArtwork,
                    od_status: '구매확정',
                    ct_status: '구매확정',
                    _status_text: dictionary.myUdign.artwork.status.completed,
                    _status_key: newStatusKey,
                  };
                  updated[tab].data = [updatedArtwork, ...updated[tab].data];
                }
              } else if (tab === 'all') {
                // 전체 탭에서는 상태만 업데이트
                updated[tab].data = updated[tab].data.map((artwork) => {
                  if (artwork.od_id === orderId) {
                    return {
                      ...artwork,
                      od_status: '구매확정',
                      ct_status: '구매확정',
                      _status_text: dictionary.myUdign.artwork.status.completed,
                      _status_key: newStatusKey,
                    };
                  }
                  return artwork;
                });
              }
            }
          });

          return updated;
        });

        // 카운트 업데이트
        setCounts((prev) => {
          const newCounts = { ...prev };

          // 기존 탭 카운트 감소
          if (newCounts[oldStatusKey] > 0) {
            newCounts[oldStatusKey] = newCounts[oldStatusKey] - 1;
          }

          // 새로운 탭 카운트 증가
          newCounts[newStatusKey] = (newCounts[newStatusKey] || 0) + 1;

          return newCounts;
        });
      } else {
        setMessageContent(result.message || dictionary.common.error);
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('구매 확정 실패:', error);
      setMessageContent(dictionary.common.error);
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
        setMessageContent(result.message || dictionary.common.error);
        setShowMessageDialog(true);
      }
    } catch (error) {
      console.error('교환/반품 신청 실패:', error);
      setMessageContent(dictionary.common.error);
      setShowMessageDialog(true);
    }
  };

  const handleAdminToggle = async (itemId: string, newStatus: string) => {
    try {
      // 먼저 현재 상품 상태 확인
      const currentArtwork = currentTabData.find((artwork) => artwork.it_id === itemId);
      if (!currentArtwork) return;

      const oldStatusKey = currentArtwork._status_key;

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
        // 새로운 상태 결정
        let newStatusKey = 'collection';
        if (newStatus === 'Y') {
          newStatusKey = 'review'; // 심의중
        } else if (newStatus === 'N') {
          newStatusKey = 'payment'; // 구매 진행
        }

        // 모든 탭의 데이터 업데이트
        setTabStates((prev) => {
          const updated = { ...prev };

          Object.keys(updated).forEach((tab) => {
            if (updated[tab].data.length > 0) {
              if (tab === oldStatusKey) {
                // 기존 탭에서는 상품 제거
                updated[tab].data = updated[tab].data.filter((artwork) => artwork.it_id !== itemId);
              } else if (tab === newStatusKey) {
                // 새로운 탭에 상품 추가 (이미 존재하지 않는 경우에만)
                const exists = updated[tab].data.some((artwork) => artwork.it_id === itemId);
                if (!exists) {
                  const updatedArtwork = {
                    ...currentArtwork,
                    it_10: result.data.it_10,
                    _status_text: result.data.statusText,
                    _status_key: newStatusKey,
                  };
                  updated[tab].data = [updatedArtwork, ...updated[tab].data];
                }
              } else if (tab === 'all') {
                // 전체 탭에서는 상태만 업데이트
                updated[tab].data = updated[tab].data.map((artwork) => {
                  if (artwork.it_id === itemId) {
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
            }
          });

          return updated;
        });

        // 네비게이션 카운트 업데이트
        setCounts((prev) => {
          const newCounts = { ...prev };

          // 기존 탭 카운트 감소
          if (newCounts[oldStatusKey] > 0) {
            newCounts[oldStatusKey] = newCounts[oldStatusKey] - 1;
          }

          // 새로운 탭 카운트 증가
          newCounts[newStatusKey] = (newCounts[newStatusKey] || 0) + 1;

          return newCounts;
        });
      } else {
        throw new Error(result.message || dictionary.common.error);
      }
    } catch (error) {
      console.error('관리자 토글 실패:', error);
      throw error;
    }
  };

  return isLoading || loading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner size='lg' message={dictionary.common.loading} />
    </div>
  ) : error ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <p className='mb-4 text-red-600'>{error}</p>
        <Button
          onClick={() => fetchAllTabsInitialData()}
          className='bg-primary hover:bg-primary-hover'
        >
          {dictionary.common.retry}
        </Button>
      </div>
    </div>
  ) : (
    user && (
      <div className='min-h-screen'>
        <div className='px-4 py-8 sm:px-6 lg:px-8'>
          <div className='mb-6 rounded-none border border-gray-100 bg-white p-6'>
            <div className='mb-6 rounded-lg p-4 sm:p-6' style={{ backgroundColor: '#17244c' }}>
              <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
                <div>
                  <h1 className='mb-1 text-xl font-bold text-white sm:mb-2 sm:text-2xl'>
                    {dictionary.myUdign.title}
                  </h1>
                  <p className='text-sm text-gray-300 sm:text-base'>
                    {dictionary.myUdign.subtitle}
                  </p>
                </div>
                <div className='text-left sm:text-right'>
                  <p className='text-base font-semibold text-white sm:text-lg'>
                    {dictionary.myUdign.welcome.replace('{{name}}', user.mb_name)}
                  </p>
                  <p className='text-sm text-gray-300 sm:text-base'>
                    {dictionary.myUdign.welcomeMessage}
                  </p>
                </div>
              </div>
            </div>
            <h2 className='mb-4 flex items-center text-lg font-semibold'>
              <FiAlertCircle className='mr-2' />
              {dictionary.myUdign.preorderSystem}
            </h2>
            <div className='mb-4 space-y-2 text-sm text-gray-600'>
              <p>
                • <strong>{dictionary.myUdign.systemDescription.artwork.split(':')[0]}</strong>:{' '}
                {dictionary.myUdign.systemDescription.artwork.split(':')[1]}
              </p>
              <p>
                • <strong>{dictionary.myUdign.systemDescription.like.split(':')[0]}</strong>:{' '}
                {dictionary.myUdign.systemDescription.like.split(':')[1]}
              </p>
              <p>
                • <strong>{dictionary.myUdign.systemDescription.product.split(':')[0]}</strong>:{' '}
                {dictionary.myUdign.systemDescription.product.split(':')[1]}
              </p>
            </div>

            <div className='mb-4 rounded-lg bg-gray-100 p-4'>
              <p className='text-sm text-gray-700'>
                <span className='flex items-center'>
                  <BsLightbulb className='mr-1' /> {dictionary.myUdign.reviewProcess.title}
                </span>
                <br />• <strong>{dictionary.myUdign.reviewProcess.auto.split(':')[0]}</strong>:{' '}
                {dictionary.myUdign.reviewProcess.auto.split(':')[1]}
                <br />• <strong>
                  {dictionary.myUdign.reviewProcess.manual.split(':')[0]}
                </strong>: {dictionary.myUdign.reviewProcess.manual.split(':')[1]}
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

          <div className='rounded-none border border-gray-100 bg-white p-6'>
            <div className='mb-6 flex items-center'>
              <h2 className='text-xl font-semibold'>{dictionary.myUdign.artworkStatus}</h2>
            </div>

            <div className='border-b border-gray-100'>
              <nav className='scrollbar-hide flex overflow-x-auto'>
                {Object.entries(STATUS_GROUPS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`relative flex min-w-40 flex-shrink-0 cursor-pointer items-center justify-center gap-2 px-4 pb-2 text-sm font-medium whitespace-nowrap transition-colors duration-200 hover:text-gray-900 ${
                      currentTab === key ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {dictionary.myUdign.statusGroups[
                      key as keyof typeof dictionary.myUdign.statusGroups
                    ] || label}
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
                  <p className='text-gray-500'>{dictionary.myUdign.noArtworks}</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {currentTabData.map((artwork) => (
                    <ArtworkCard
                      key={artwork.it_id}
                      artwork={artwork}
                      dictionary={dictionary}
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
                        <LoadingSpinner size='sm' message={dictionary.myUdign.loadingMore} />
                      )}
                    </div>
                  )}

                  {!tabStates[currentTab]?.hasMore && currentTabData.length > 0 && (
                    <div className='py-4 text-center text-sm text-gray-500'>
                      {dictionary.myUdign.allLoaded}
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
          title={dictionary.myUdign.notification}
          description={messageContent}
          dictionary={dictionary}
        />
      </div>
    )
  );
}
