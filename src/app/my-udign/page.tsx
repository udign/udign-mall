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
import MessageDialog from '@/components/ui/MessageDialog';

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

  // Dialog 상태
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [messageContent, setMessageContent] = useState<string>('');

  const router = useRouter();

  const { user, isLoading } = useAuth();

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
        // 데이터 새로고침
        await fetchData();
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
        await fetchData();
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
        await fetchData();
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
        await fetchData();
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

      if (result.success) {
        // 성공 시 전체 데이터 새로고침하여 카운트도 함께 업데이트
        await fetchData();
      } else {
        throw new Error(result.message || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('관리자 토글 실패:', error);
      throw error; // ArtworkCard에서 에러 처리하도록 다시 throw
    }
  };

  const currentProducts = data?.products[currentTab] || [];

  return isLoading || loading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <div className='mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-purple-500'></div>
        <p className='mt-4 text-gray-600'>로딩 중...</p>
      </div>
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
          <div className='mb-6 rounded-lg bg-gray-50 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='mb-2 text-2xl font-bold text-gray-900'>My UDIGN</h1>
                <p className='text-gray-600'>나만의 특별한 디자인 여정</p>
              </div>
              <div className='text-right'>
                <p className='text-lg font-semibold'>{data.user.mb_name}님</p>
                <p className='text-gray-600'>유다인에 오신 것을 환영합니다</p>
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

            <div className='flex items-center justify-between rounded-lg bg-gray-50 px-10 py-4'>
              {steps
                .map((step, index) => [
                  <div key={`step-${index}`} className='text-center'>
                    <p className='max-w-18 text-xs font-medium text-gray-700'>{step}</p>
                  </div>,
                  index < steps.length - 1 && (
                    <div key={`arrow-${index}`} className='mx-2 text-gray-400'>
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
              <Link href='/order-history' className='text-sm text-purple-600 hover:text-purple-800'>
                📋 전체 주문내역
              </Link>
            </div>

            <div className='border-b border-gray-200'>
              <nav className='-mb-px flex space-x-8'>
                {Object.entries(STATUS_GROUPS).map(([key, label]) => (
                  <Button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    variant='ghost'
                    className={`flex items-center border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                      currentTab === key
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } `}
                  >
                    {label}
                    {data.counts[key] > 0 && (
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                          currentTab === key
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-600'
                        } `}
                      >
                        {data.counts[key]}
                      </span>
                    )}
                  </Button>
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
