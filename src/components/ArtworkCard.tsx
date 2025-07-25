import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { ArtworkStatus } from '@/types/artwork';
import ProgressBar from '@/components/ProgressBar';
import ReturnModal from '@/components/ReturnModal';
import CancelOrderModal from '@/components/CancelOrderModal';
import { Switch } from '@/components/ui/primitives/switch';
import { Button } from '@/components/ui/primitives/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import MessageDialog from '@/components/ui/MessageDialog';
import { ROUTES } from '@/lib/routes';

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
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const [messageTitle, setMessageTitle] = useState<string>('');
  const [messageContent, setMessageContent] = useState<string>('');
  const [pendingToggleAction, setPendingToggleAction] = useState<(() => Promise<void>) | null>(
    null,
  );
  const [showInterestConfirmDialog, setShowInterestConfirmDialog] = useState<boolean>(false);
  const [showPurchaseConfirmDialog, setShowPurchaseConfirmDialog] = useState<boolean>(false);

  const router = useRouter();

  const isClickable = artwork._status_text === '컬렉션' || artwork._status_text === '심의중';

  const handleInterestClick = () => {
    setShowInterestConfirmDialog(true);
  };

  const handleInterestConfirm = () => {
    setShowInterestConfirmDialog(false);
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
      ? '해당 작품의 상태를 구매 진행 단계로 변경하시겠습니까?'
      : '해당 작품의 상태를 제작 검토 단계로 변경하시겠습니까?';

    setConfirmMessage(confirmMsg);
    setPendingToggleAction(() => async () => {
      setIsToggling(true);
      try {
        await onAdminToggle!(artwork.it_id, newStatus);
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

  return (
    <>
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 ${isClickable && 'cursor-pointer'}`}
        onClick={isClickable ? () => router.push(`${ROUTES.PRODUCT}/${artwork.it_id}`) : undefined}
      >
        <div className='relative'>
          <div className='flex flex-col space-y-4 lg:flex-row lg:items-start lg:space-y-0 lg:space-x-6 lg:pr-32'>
            <div className='flex-shrink-0'>
              {artwork.it_img1 ? (
                <Image
                  src={artwork.it_img1}
                  alt={artwork.it_name}
                  width={96}
                  height={96}
                  className='h-20 w-20 rounded-lg object-cover sm:h-24 sm:w-24 lg:h-28 lg:w-28'
                  priority={false}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML =
                        '<div class="flex h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 items-center justify-center bg-gray-200 rounded-lg"><span class="text-xs text-gray-400">이미지 없음</span></div>';
                    }
                  }}
                />
              ) : (
                <div className='flex h-20 w-20 items-center justify-center rounded-lg bg-gray-200 sm:h-24 sm:w-24 lg:h-28 lg:w-28'>
                  <span className='text-xs text-gray-400'>이미지 없음</span>
                </div>
              )}
            </div>

            <div className='min-w-0 flex-1'>
              <h3 className='text-base font-semibold text-gray-900 sm:text-lg lg:text-xl'>
                {artwork.it_name}
              </h3>

              {isAdmin && (
                <div className='mt-2 flex flex-row items-center space-x-4'>
                  <div className='flex items-center text-sm text-gray-600'>
                    <AiFillHeart className='mr-1 text-red-500' size={16} />
                    <span>{artwork._iCount}</span>
                    {artwork.it_4 > 0 && <span className='text-gray-400'>/{artwork.it_4}</span>}
                  </div>

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
                      {isToggling ? '처리중...' : artwork.it_10 === 'N' ? '구매 진행' : '제작 검토'}
                    </span>
                  </div>
                </div>
              )}

              {artwork._status_text !== '컬렉션' && (
                <div className='mt-3'>
                  <ProgressBar statusText={artwork._status_text} ctStatus={artwork.ct_status} />
                </div>
              )}
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className='mt-4 flex justify-end lg:absolute lg:top-1/2 lg:right-0 lg:mt-0 lg:-translate-y-1/2'>
            <div className='flex space-x-2 overflow-x-auto pb-2 lg:flex-col lg:space-y-2 lg:space-x-0 lg:overflow-visible lg:pb-0'>
              {/* 구매 진행 */}
              {artwork._status_text === '구매 진행' && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/shop/checkout?itemId=${artwork.it_id}&quantity=1`);
                  }}
                  variant='default'
                  size='sm'
                  className='whitespace-nowrap'
                >
                  구매하기
                </Button>
              )}

              {/* 결제대기 */}
              {artwork._status_text === '결제대기' && artwork.od_settle_case !== '무통장' && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/shop/checkout?itemId=${artwork.it_id}&quantity=1`);
                  }}
                  variant='default'
                  size='sm'
                  className='whitespace-nowrap'
                >
                  구매하기
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
                  className='whitespace-nowrap'
                >
                  구매취소
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
                    variant='default'
                    size='sm'
                    className='whitespace-nowrap'
                  >
                    구매확정
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReturnModal(true);
                    }}
                    variant='default'
                    size='sm'
                    className='whitespace-nowrap'
                  >
                    교환/반품
                  </Button>
                </>
              )}

              {/* 상품문의 */}
              {/* {(artwork._status_text === '상품 제작' || artwork._status_text === '제작중') && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/product/${artwork.it_id}/qa`);
                  }}
                  variant='default'
                  size='sm'
                  className='whitespace-nowrap'
                >
                  상품문의
                </Button>
              )} */}

              {/* 배송조회 */}
              {(artwork._status_text === '배송 진행' || artwork._status_text === '배송중') && (
                <div className='flex-shrink-0'>
                  {artwork.od_invoice && artwork.od_delivery_company ? (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        // 배송조회 로직
                      }}
                      variant='default'
                      size='sm'
                      className='whitespace-nowrap'
                    >
                      배송조회
                    </Button>
                  ) : (
                    <span className='rounded bg-gray-100 px-3 py-1 text-sm whitespace-nowrap text-gray-500'>
                      운송장 등록 중
                    </span>
                  )}
                </div>
              )}

              {/* 좋아요 버튼 */}
              {!artwork._goalAttainment && artwork._status_text === '컬렉션' && (
                <div className='flex flex-shrink-0 items-center space-x-2'>
                  {artwork.orderNumber && (
                    <span className='text-sm font-medium text-gray-600'>
                      No. {artwork.orderNumber}
                    </span>
                  )}
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInterestClick();
                    }}
                    variant='ghost'
                    className='transition-transform duration-400 ease-out hover:scale-110 hover:bg-transparent'
                    size='icon'
                  >
                    {artwork.ir_id ? (
                      <AiFillHeart className='text-red-500' size={20} />
                    ) : (
                      <AiOutlineHeart size={20} />
                    )}
                  </Button>
                </div>
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

      {/* 구매 취소 Dialog */}
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

      {/* 관심상품 토글 확인 Dialog */}
      <ConfirmDialog
        open={showInterestConfirmDialog}
        onOpenChange={setShowInterestConfirmDialog}
        title={artwork.ir_id ? '관심상품 취소' : '관심상품 추가'}
        description={
          artwork.ir_id
            ? '이 상품을 관심상품에서 제거하시겠습니까?'
            : '이 상품을 관심상품에 추가하시겠습니까?'
        }
        onConfirm={handleInterestConfirm}
        variant={artwork.ir_id ? 'destructive' : 'default'}
        confirmText={artwork.ir_id ? '제거하기' : '추가하기'}
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
