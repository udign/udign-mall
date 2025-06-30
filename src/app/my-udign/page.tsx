'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiAlertCircle, FiInbox } from 'react-icons/fi';
import { ProductsByStatus, StatusCounts } from '@/types/artwork';
import { STATUS_GROUPS } from '@/lib/constants';
import { Button } from '@/components/ui/primitives/button';
import ArtworkCard from '@/components/ArtworkCard';
import { useAuth } from '@/contexts/AuthContext';
import { BsLightbulb } from 'react-icons/bs';
import { IoIosList } from 'react-icons/io';
import MessageDialog from '@/components/ui/MessageDialog';
import LoadingSpinner from '@/components/states/LoadingSpinner';

interface MyUdignData {
  products: ProductsByStatus;
  counts: StatusCounts;
  user: {
    mb_id: string;
    mb_name: string;
    mb_level: number;
  };
}

const steps = [
  '디자인 좋아요', // collection - 작품에 좋아요를 누른 상태
  '제작 검토', // review - 제작 심의 중인 상태
  '구매 진행', // payment - 결제 대기 중인 상태
  '주문 확정', // paymentCompleted - 결제 완료된 상태
  '상품 제작', // making - 상품 제작 중인 상태
  '배송 진행', // shipping - 배송 중인 상태
  '수령 완료', // completed - 배송 완료된 상태
];

export default function MyUdignPage() {
  const [data, setData] = useState<MyUdignData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [messageContent, setMessageContent] = useState<string>('');

  const router = useRouter();

  const { user, isLoading } = useAuth();

  const currentProducts = data?.products[currentTab] || [];

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login?redirect=/my-udign');
      return;
    }

    fetchData();
  }, [user, isLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my-udign');

      if (!response.ok) {
        throw new Error('데이터를 불러올 수 없습니다.');
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || '데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('MyUdign 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
  };

  console.log(data);

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
        setData((prevData) => {
          if (!prevData) return prevData;

          const updatedProducts: ProductsByStatus = {};
          const updatedCounts = { ...prevData.counts };

          // 변경되는 아이템의 이전 상태 찾기 (관리자 토글과 동일한 패턴)
          const targetArtwork = Object.values(prevData.products)
            .flat()
            .find((artwork) => artwork.it_id === itemId);

          if (!targetArtwork) return prevData;

          const wasLiked = !!targetArtwork.ir_id;
          const isNowLiked = !wasLiked; // 토글이므로 반대

          // 카운트 업데이트
          if (wasLiked && !isNowLiked) {
            // 좋아요 해제 시
            updatedCounts.interest = Math.max(0, updatedCounts.interest - 1);

            // 컬렉션 상태의 작품인 경우 all과 collection 카운트도 감소
            if (targetArtwork._status_text === '컬렉션') {
              updatedCounts.all = Math.max(0, updatedCounts.all - 1);
              updatedCounts.collection = Math.max(0, updatedCounts.collection - 1);
            }
          } else if (!wasLiked && isNowLiked) {
            // 좋아요 추가 시
            updatedCounts.interest = updatedCounts.interest + 1;

            // 컬렉션 상태의 작품인 경우 all과 collection 카운트도 증가
            if (targetArtwork._status_text === '컬렉션') {
              updatedCounts.all = updatedCounts.all + 1;
              updatedCounts.collection = updatedCounts.collection + 1;
            }
          }

          Object.keys(prevData.products).forEach((tabKey) => {
            if (tabKey === 'interest' && wasLiked && !isNowLiked) {
              // interest 탭에서 좋아요 해제된 아이템 제거
              updatedProducts[tabKey] = prevData.products[tabKey].filter(
                (artwork) => artwork.it_id !== itemId,
              );
            } else if (wasLiked && !isNowLiked && targetArtwork._status_text === '컬렉션') {
              // 컬렉션 상태의 작품에서 좋아요 해제 시 해당 탭에서도 제거
              updatedProducts[tabKey] = prevData.products[tabKey].filter(
                (artwork) => artwork.it_id !== itemId,
              );
            } else {
              // 다른 경우에는 상태만 업데이트
              updatedProducts[tabKey] = prevData.products[tabKey].map((artwork) => {
                if (artwork.it_id === itemId) {
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

          return {
            ...prevData,
            products: updatedProducts,
            counts: updatedCounts,
          };
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

        setData((prevData) => {
          if (!prevData) return prevData;

          const updatedProducts: ProductsByStatus = {};

          Object.keys(prevData.products).forEach((tabKey) => {
            updatedProducts[tabKey] = prevData.products[tabKey].map((artwork) => {
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
          });

          return {
            ...prevData,
            products: updatedProducts,
          };
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

        setData((prevData) => {
          if (!prevData) return prevData;

          const updatedProducts: ProductsByStatus = {};

          Object.keys(prevData.products).forEach((tabKey) => {
            updatedProducts[tabKey] = prevData.products[tabKey].map((artwork) => {
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
          });

          return {
            ...prevData,
            products: updatedProducts,
          };
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

        setData((prevData) => {
          if (!prevData) return prevData;

          const updatedProducts: ProductsByStatus = {};

          Object.keys(prevData.products).forEach((tabKey) => {
            updatedProducts[tabKey] = prevData.products[tabKey].map((artwork) => {
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
          });

          return {
            ...prevData,
            products: updatedProducts,
          };
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
        setData((prevData) => {
          if (!prevData) return prevData;

          const updatedProducts: ProductsByStatus = {};
          const updatedCounts = { ...prevData.counts };

          // 변경되는 아이템의 이전 상태 찾기
          const targetArtwork = Object.values(prevData.products)
            .flat()
            .find((artwork) => artwork.it_id === itemId);

          if (!targetArtwork) return prevData;

          const oldStatusKey = targetArtwork._status_key;

          // 새로운 상태 키 결정
          let newStatusKey = 'collection';
          if (newStatus === 'Y') {
            newStatusKey = 'review'; // 심의중
          } else if (newStatus === 'N') {
            newStatusKey = 'payment'; // 구매 진행
          }

          // 상태가 변경되는 경우 카운트 업데이트
          if (oldStatusKey !== newStatusKey) {
            // 기존 탭에서 개수 감소
            if (updatedCounts[oldStatusKey] > 0) {
              updatedCounts[oldStatusKey] = updatedCounts[oldStatusKey] - 1;
            }
            // 새 탭에서 개수 증가
            updatedCounts[newStatusKey] = (updatedCounts[newStatusKey] || 0) + 1;
          }

          Object.keys(prevData.products).forEach((tabKey) => {
            updatedProducts[tabKey] = prevData.products[tabKey].map((artwork) => {
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
          });

          return {
            ...prevData,
            products: updatedProducts,
            counts: updatedCounts,
          };
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
        <Button onClick={fetchData} className='bg-purple-500 hover:bg-purple-600'>
          다시 시도
        </Button>
      </div>
    </div>
  ) : (
    data && (
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
                <p className='text-base font-semibold sm:text-lg'>{data.user.mb_name}님</p>
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
                    {data.counts[key] > 0 && (
                      <span className='text-gray-400'>{data.counts[key]}</span>
                    )}
                    {currentTab === key && (
                      <div className='absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-gray-900' />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className='mt-6'>
              {currentProducts.length === 0 ? (
                <div className='py-14 text-center'>
                  <FiInbox className='mx-auto mb-4 h-14 w-14 text-gray-300' />
                  <p className='text-gray-500'>해당 상태의 작품이 없습니다.</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {currentProducts.map((artwork) => (
                    <ArtworkCard
                      key={artwork.it_id}
                      artwork={artwork}
                      onInterestToggle={handleInterestToggle}
                      onOrderCancel={handleOrderCancel}
                      onPurchaseConfirm={handlePurchaseConfirm}
                      onReturnSubmit={handleReturnSubmit}
                      onAdminToggle={handleAdminToggle}
                      isAdmin={data.user.mb_level >= 10}
                    />
                  ))}
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
