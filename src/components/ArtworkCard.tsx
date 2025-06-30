import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArtworkStatus } from '@/types/artwork';
import ProgressBar from '@/components/ProgressBar';
import ReturnModal from '@/components/ReturnModal';
import CancelOrderModal from '@/components/CancelOrderModal';
import { Switch } from '@/components/ui/primitives/switch';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives/dialog';
import { Button } from '@/components/ui/primitives/button';

interface ArtworkCardProps {
  artwork: ArtworkStatus;
  onInterestToggle: (itemId: string) => Promise<void>;
  onOrderCancel: (orderId: string, cancelMemo: string) => Promise<void>;
  onPurchaseConfirm: (orderId: string) => Promise<void>;
  onReturnSubmit: (returnData: {
    orderId: string;
    name: string;
    phone: string;
    returnType: 'exchange' | 'return';
    reason: string;
  }) => Promise<void>;
  onAdminToggle?: (itemId: string, newStatus: string) => Promise<void>;
  isAdmin: boolean;
}

export default function ArtworkCard({
  artwork,
  onInterestToggle,
  onOrderCancel,
  onPurchaseConfirm,
  onReturnSubmit,
  onAdminToggle,
  isAdmin,
}: ArtworkCardProps) {
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  // Dialog 상태들
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [messageTitle, setMessageTitle] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>('');
  const [pendingToggleAction, setPendingToggleAction] = useState<(() => Promise<void>) | null>(
    null,
  );

  const router = useRouter();

  const { user } = useAuth();

  const handleInterestClick = () => {
    if (confirm('❤️ 상품을 취소하시겠습니까?')) {
      onInterestToggle(artwork.it_id);
    }
  };

  const handlePurchaseConfirm = () => {
    if (confirm('구매 확정 하시겠습니까?')) {
      onPurchaseConfirm(artwork.od_id!);
    }
  };

  const handleAdminToggle = async (checked: boolean) => {
    // PHP 로직과 동일: checked=true면 심의종료('N'), false면 심의중('Y')
    const newStatus = checked ? 'N' : 'Y';
    const confirmMsg = checked
      ? '해당 작품의 심의를 종료하시겠습니까?'
      : '해당 작품을 심의중으로 변경하시겠습니까?';

    if (!user) {
      setMessageTitle('로그인 필요');
      setMessageContent('로그인이 필요합니다.');
      setShowMessageDialog(true);
      return;
    }

    if (!onAdminToggle) {
      setMessageTitle('기능 사용 불가');
      setMessageContent('관리자 토글 기능을 사용할 수 없습니다.');
      setShowMessageDialog(true);
      return;
    }

    // 확인 Dialog 표시
    setConfirmMessage(confirmMsg);
    setPendingToggleAction(() => async () => {
      setIsToggling(true);
      try {
        await onAdminToggle(artwork.it_id, newStatus);
        setMessageTitle('상태 변경 완료');
        setMessageContent('상태가 변경되었습니다.');
        setShowMessageDialog(true);
      } catch (error) {
        console.error('관리자 토글 실패:', error);
        setMessageTitle('오류 발생');
        setMessageContent('서버 통신 중 오류가 발생했습니다.');
        setShowMessageDialog(true);
      } finally {
        setIsToggling(false);
      }
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    setShowConfirmDialog(false);
    if (pendingToggleAction) {
      await pendingToggleAction();
      setPendingToggleAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingToggleAction(null);
  };

  const isClickable = artwork._status_text === '컬렉션' || artwork._status_text === '심의중';

  return (
    <>
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 ${isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : ''} `}
        onClick={isClickable ? () => router.push(`/product/${artwork.it_id}`) : undefined}
      >
        <div className='flex items-center space-x-4'>
          {/* 상품 이미지 */}
          <div className='flex-shrink-0'>
            {artwork.it_img1 ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_VERCEL_BLOB_BASE_URL}/item/${artwork.it_img1}`}
                alt={artwork.it_name}
                width={96}
                height={96}
                className='h-24 w-24 rounded-lg object-cover'
                priority={false}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML =
                      '<div class="flex h-24 w-24 items-center justify-center bg-gray-200 rounded-lg"><span class="text-xs text-gray-400">이미지 없음</span></div>';
                  }
                }}
              />
            ) : (
              <div className='flex h-24 w-24 items-center justify-center rounded-lg bg-gray-200'>
                <span className='text-xs text-gray-400'>이미지 없음</span>
              </div>
            )}
          </div>

          {/* 상품 정보 */}
          <div className='min-w-0 flex-1'>
            <h3 className='truncate text-lg font-semibold text-gray-900'>{artwork.it_name}</h3>

            <div className='mt-2 flex items-center space-x-4'>
              {/* 좋아요 수 표시 */}
              <div className='flex items-center text-sm text-gray-600'>
                <span className='mr-1 text-red-500'>❤️</span>
                <span>{artwork._iCount}</span>
                {artwork.it_4 > 0 && <span className='text-gray-400'>/{artwork.it_4}</span>}
              </div>

              {/* 심의 기간 표시 */}
              {artwork.it_9 === 'Y' && artwork.it_8 > 0 && artwork._status_text === '컬렉션' && (
                <div className='rounded bg-blue-100 px-2 py-1 text-sm text-blue-800'>
                  📅 심의까지 D-
                  {Math.max(
                    0,
                    artwork.it_8 -
                      Math.floor(
                        (Date.now() - new Date(artwork.ir_time!).getTime()) / (1000 * 60 * 60 * 24),
                      ),
                  )}
                </div>
              )}

              {/* 관리자 토글 */}
              {isAdmin && (
                <div
                  className='flex items-center space-x-2 text-sm'
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={artwork.it_10 === 'N'}
                    onCheckedChange={handleAdminToggle}
                    disabled={isToggling}
                  />
                  <span className='text-gray-700'>
                    {isToggling ? '처리중...' : artwork.it_10 === 'N' ? '심의종료' : '심의중'}
                  </span>
                </div>
              )}
            </div>

            {/* 진행 상태바 */}
            {artwork._status_text !== '컬렉션' && (
              <div className='mt-4'>
                <ProgressBar statusText={artwork._status_text} ctStatus={artwork.ct_status} />
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className='flex-shrink-0'>
            <div className='flex flex-col space-y-2'>
              {/* 구매 진행 */}
              {artwork._status_text === '구매 진행' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/product/${artwork.it_id}`);
                  }}
                  className='rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700'
                >
                  🛒 구매하기
                </button>
              )}

              {/* 결제대기 */}
              {artwork._status_text === '결제대기' && artwork.od_settle_case !== '무통장' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/product/${artwork.it_id}`);
                  }}
                  className='rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700'
                >
                  🛒 구매하기
                </button>
              )}

              {/* 구매취소 */}
              {((artwork.od_settle_case === '무통장' && artwork._status_text === '결제대기') ||
                artwork._status_text === '결제완료') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCancelModal(true);
                  }}
                  className='rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700'
                >
                  ❌ 구매취소
                </button>
              )}

              {/* 구매확정 & 교환/반품 */}
              {(artwork._status_text === '수령 완료' || artwork._status_text === '완료') && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchaseConfirm();
                    }}
                    className='rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700'
                  >
                    ✅ 구매확정
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReturnModal(true);
                    }}
                    className='rounded bg-yellow-600 px-4 py-2 text-sm text-white hover:bg-yellow-700'
                  >
                    🔄 교환/반품
                  </button>
                </>
              )}

              {/* 상품문의 */}
              {(artwork._status_text === '상품 제작' || artwork._status_text === '제작중') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/product/${artwork.it_id}/qa`);
                  }}
                  className='rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700'
                >
                  ❓ 상품문의
                </button>
              )}

              {/* 배송조회 */}
              {(artwork._status_text === '배송 진행' || artwork._status_text === '배송중') && (
                <div className='text-center'>
                  {artwork.od_invoice && artwork.od_delivery_company ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 배송조회 로직
                      }}
                      className='rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700'
                    >
                      📦 배송조회
                    </button>
                  ) : (
                    <span className='rounded bg-gray-100 px-3 py-1 text-sm text-gray-500'>
                      운송장 등록 중
                    </span>
                  )}
                </div>
              )}

              {/* 좋아요 취소 */}
              {!artwork._goalAttainment && artwork._status_text === '컬렉션' && artwork.ir_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInterestClick();
                  }}
                  className='rounded border border-red-300 px-3 py-2 text-sm text-red-500 hover:bg-red-50'
                >
                  💔
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSubmit={onReturnSubmit}
        orderId={artwork.od_id || ''}
      />

      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSubmit={onOrderCancel}
        orderId={artwork.od_id || ''}
      />

      {/* 확인 Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>확인</DialogTitle>
            <DialogDescription>{confirmMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCancelAction} variant='outline'>
              취소
            </Button>
            <Button onClick={handleConfirmAction} variant='default'>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메시지 Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messageTitle}</DialogTitle>
            <DialogDescription>{messageContent}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowMessageDialog(false)} variant='default'>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
