import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArtworkStatus } from '@/types/artwork';
import ProgressBar from '@/components/ProgressBar';
import ReturnModal from '@/components/ReturnModal';
import CancelOrderModal from '@/components/CancelOrderModal';
import { Switch } from '@/components/ui/primitives/switch';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/primitives/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MessageDialog from '@/components/ui/MessageDialog';

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

  // 추가 Dialog 상태들
  const [showInterestConfirmDialog, setShowInterestConfirmDialog] = useState<boolean>(false);
  const [showPurchaseConfirmDialog, setShowPurchaseConfirmDialog] = useState<boolean>(false);

  const router = useRouter();

  const { user } = useAuth();

  const handleInterestClick = () => {
    setShowInterestConfirmDialog(true);
  };

  const handleInterestConfirm = () => {
    onInterestToggle(artwork.it_id);
  };

  const handlePurchaseConfirm = () => {
    setShowPurchaseConfirmDialog(true);
  };

  const handlePurchaseConfirmAction = () => {
    onPurchaseConfirm(artwork.od_id!);
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
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/product/${artwork.it_id}`);
                  }}
                  className='bg-purple-600 hover:bg-purple-700'
                  size='sm'
                >
                  🛒 구매하기
                </Button>
              )}

              {/* 결제대기 */}
              {artwork._status_text === '결제대기' && artwork.od_settle_case !== '무통장' && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/product/${artwork.it_id}`);
                  }}
                  className='bg-purple-600 hover:bg-purple-700'
                  size='sm'
                >
                  🛒 구매하기
                </Button>
              )}

              {/* 구매취소 */}
              {((artwork.od_settle_case === '무통장' && artwork._status_text === '결제대기') ||
                artwork._status_text === '결제완료') && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCancelModal(true);
                  }}
                  variant='destructive'
                  size='sm'
                >
                  ❌ 구매취소
                </Button>
              )}

              {/* 구매확정 & 교환/반품 */}
              {(artwork._status_text === '수령 완료' || artwork._status_text === '완료') && (
                <>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchaseConfirm();
                    }}
                    className='bg-green-600 hover:bg-green-700'
                    size='sm'
                  >
                    ✅ 구매확정
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReturnModal(true);
                    }}
                    className='bg-yellow-600 hover:bg-yellow-700'
                    size='sm'
                  >
                    🔄 교환/반품
                  </Button>
                </>
              )}

              {/* 상품문의 */}
              {(artwork._status_text === '상품 제작' || artwork._status_text === '제작중') && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/product/${artwork.it_id}/qa`);
                  }}
                  className='bg-blue-600 hover:bg-blue-700'
                  size='sm'
                >
                  ❓ 상품문의
                </Button>
              )}

              {/* 배송조회 */}
              {(artwork._status_text === '배송 진행' || artwork._status_text === '배송중') && (
                <div className='text-center'>
                  {artwork.od_invoice && artwork.od_delivery_company ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 배송조회 로직
                      }}
                      className='bg-indigo-600 hover:bg-indigo-700'
                      size='sm'
                    >
                      📦 배송조회
                    </Button>
                  ) : (
                    <span className='rounded bg-gray-100 px-3 py-1 text-sm text-gray-500'>
                      운송장 등록 중
                    </span>
                  )}
                </div>
              )}

              {/* 좋아요 취소 */}
              {!artwork._goalAttainment && artwork._status_text === '컬렉션' && artwork.ir_id && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInterestClick();
                  }}
                  variant='outline'
                  className='border-red-300 text-red-500 hover:bg-red-50'
                  size='sm'
                >
                  💔
                </Button>
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
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title='확인'
        description={confirmMessage}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      {/* 메시지 Dialog */}
      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title={messageTitle}
        description={messageContent}
      />

      {/* 관심상품 취소 확인 Dialog */}
      <ConfirmDialog
        open={showInterestConfirmDialog}
        onOpenChange={setShowInterestConfirmDialog}
        title='관심상품 취소'
        description='❤️ 상품을 취소하시겠습니까?'
        onConfirm={handleInterestConfirm}
        variant='destructive'
        confirmText='취소하기'
      />

      {/* 구매확정 확인 Dialog */}
      <ConfirmDialog
        open={showPurchaseConfirmDialog}
        onOpenChange={setShowPurchaseConfirmDialog}
        title='구매확정'
        description='구매 확정 하시겠습니까?'
        onConfirm={handlePurchaseConfirmAction}
        confirmText='확정하기'
      />
    </>
  );
}
