import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { ArtworkStatus } from '@/types/artwork';

import ReturnModal from '@/components/ReturnModal';
import CancelOrderModal from '@/components/CancelOrderModal';
// import { Switch } from '@/components/ui/primitives/switch';
import { Button } from '@/components/ui/primitives/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
// import MessageDialog from '@/components/ui/MessageDialog';
import { ROUTES } from '@/lib/routes';
import { Dictionary } from '@/lib/dictionaries';

interface ArtworkCardProps {
  artwork: ArtworkStatus;
  dictionary: Dictionary;
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

const stepItems = [
  { step: 6, label: '수령완료', indent: 'ml-0' },
  { step: 5, label: '배송진행', indent: 'ml-2' },
  { step: 4, label: '상품제작', indent: 'ml-4' },
  { step: 3, label: '주문확정', indent: 'ml-4' },
  { step: 2, label: '구매진행', indent: 'ml-2' },
  { step: 1, label: '제작검토', indent: 'ml-0' },
];

// 택배사별 배송조회 URL 생성 함수
function getTrackingUrl(company: string, invoice: string): string {
  const trackingUrls: Record<string, string> = {
    'CJ대한통운': `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${invoice}`,
    '한진택배': `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=${invoice}`,
    '롯데택배': `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${invoice}`,
    '우체국택배': `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${invoice}`,
    '로젠택배': `https://www.logen.co.kr/mobile/reservation/tracking/index?InvNo=${invoice}`,
    'CU편의점택배': `https://www.cupost.co.kr/postbox/delivery/localResult.cupost?invoice_no=${invoice}`,
    'GS편의점택배': `https://www.cvsnet.co.kr/invoice/tracking.do?invoice_no=${invoice}`,
    '경동택배': `https://kdexp.com/service/delivery/delivery.do?barcode=${invoice}`,
    '대신택배': `https://www.ds3211.co.kr/freight/internalFreightSearch.ht?billno=${invoice}`,
    '일양로지스': `https://www.ilyanglogis.com/functionality/card_form_waybill.asp?hawb_no=${invoice}`,
    '합동택배': `https://hdexp.co.kr/delivery_tracking.hd?barcode_num=${invoice}`,
    'DHL': `https://www.dhl.com/kr-ko/home/tracking/tracking-express.html?submit=1&tracking-id=${invoice}`,
    'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${invoice}`,
    'UPS': `https://www.ups.com/track?loc=ko_KR&tracknum=${invoice}`,
  };

  return trackingUrls[company] || '';
}

export default function ArtworkCard({
  artwork,
  dictionary,
  onInterestToggle,
  onOrderCancel,
  onPurchaseConfirm,
  onReturnSubmit,
  // onAdminToggle,
  // isAdmin,
}: ArtworkCardProps) {
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  // const [isToggling, setIsToggling] = useState<boolean>(false);
  // const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  // const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  // const [confirmMessage, setConfirmMessage] = useState<string>('');
  // const [messageTitle, setMessageTitle] = useState<string>('');
  // const [messageContent, setMessageContent] = useState<string>('');
  // const [pendingToggleAction, setPendingToggleAction] = useState<(() => Promise<void>) | null>(
  //   null,
  // );
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

  // const handleAdminToggle = async (checked: boolean) => {
  //   // PHP 로직과 동일: checked=true면 심의종료('N'), false면 심의중('Y')
  //   const newStatus = checked ? 'N' : 'Y';
  //   const confirmMsg = checked
  //     ? '해당 디자인의 상태를 구매 진행 단계로 변경하시겠습니까?'
  //     : '해당 디자인의 상태를 제작 검토 단계로 변경하시겠습니까?';

  //   setConfirmMessage(confirmMsg);
  //   setPendingToggleAction(() => async () => {
  //     setIsToggling(true);
  //     try {
  //       await onAdminToggle!(artwork.it_id, newStatus);
  //     } catch (error) {
  //       console.error('관리자 토글 실패:', error);
  //       setMessageTitle('오류 발생');
  //       setMessageContent('서버 통신 중 오류가 발생했습니다.');
  //       setShowMessageDialog(true);
  //     } finally {
  //       setIsToggling(false);
  //     }
  //   });
  //   setShowConfirmDialog(true);
  // };

  // const handleConfirmAction = async () => {
  //   setShowConfirmDialog(false);
  //   if (pendingToggleAction) {
  //     await pendingToggleAction();
  //     setPendingToggleAction(null);
  //   }
  // };

  // const handleCancelAction = () => {
  //   setShowConfirmDialog(false);
  //   setPendingToggleAction(null);
  // };

  // 단계별 로고 이미지 가져오기 함수
  const getStatusLogos = (statusText: string, ctStatus?: string) => {
    let progressCount = 0;

    // ProgressBar와 동일한 로직으로 단계 계산
    switch (ctStatus) {
      case '주문':
        progressCount = 2;
        break;
      case '입금':
        progressCount = 3;
        break;
      case '준비':
        progressCount = 4;
        break;
      case '배송':
        progressCount = 5;
        break;
      case '완료':
      case '구매확정':
        progressCount = 6;
        break;
      default:
        switch (statusText) {
          case '심의중':
            progressCount = 1;
            break;
          case '구매 진행':
          case '결제대기':
            progressCount = 2;
            break;
          case '결제완료':
            progressCount = 3;
            break;
          case '상품 제작':
            progressCount = 4;
            break;
          case '배송 진행':
            progressCount = 5;
            break;
          case '수령 완료':
            progressCount = 6;
            break;
          default:
            progressCount = 1;
            break;
        }
        break;
    }

    return progressCount;
  };

  const progressCount = getStatusLogos(artwork._status_text, artwork.ct_status);

  return (
    <>
      <div
        className={`flex flex-col overflow-hidden border border-gray-200 bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={isClickable ? () => router.push(`${ROUTES.PRODUCT}/${artwork.it_id}`) : undefined}
      >
        {/* 상품 이미지 */}
        <div className='relative aspect-square'>
          {artwork.it_img1 ? (
            <Image
              src={artwork.it_img1}
              alt={artwork.it_name}
              fill
              className='object-cover p-4'
              sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-gray-200"><span class="text-gray-400">${dictionary.myUdign.artwork.noImage}</span></div>`;
                }
              }}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-gray-200'>
              <span className='text-gray-400'>{dictionary.myUdign.artwork.noImage}</span>
            </div>
          )}

          {/* 좋아요 버튼 (컬렉션) - 우측 상단 */}
          {!artwork._goalAttainment && artwork._status_text === '컬렉션' && (
            <div className='absolute top-2 right-2'>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleInterestClick();
                }}
                variant='ghost'
                className='h-8 w-8 rounded-full bg-white/80 p-0 transition-all duration-300 ease-out hover:scale-110 hover:bg-white'
                size='icon'
              >
                {artwork.ir_id ? (
                  <AiFillHeart className='text-red-500' size={18} />
                ) : (
                  <AiOutlineHeart size={18} />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className='p-4'>
          <h3 className='text-center text-base font-bold text-gray-900'>{artwork.it_name}</h3>

          {/* 관리자 정보 */}
          {/* {isAdmin && (
            <div className='mb-3 flex flex-row items-center space-x-4'>
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
          )} */}

          {/* 단계별 로고와 액션 버튼 */}
          {artwork._status_text !== '컬렉션' && (
            <div className='mt-8 flex items-center justify-between'>
              {/* 현재 단계 로고와 단계 텍스트 */}
              <div className='flex items-center'>
                {/* 현재 단계 로고 이미지 */}
                <div className='relative h-28 w-28 flex-shrink-0'>
                  <Image
                    src={`/images/로고${progressCount}.png`}
                    alt={`단계 ${progressCount}`}
                    fill
                    className='object-contain'
                    onError={(e) => {
                      console.error(`로고${progressCount}.png 로드 실패`);
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-xs">${progressCount}</div>`;
                      }
                    }}
                  />
                </div>

                {/* 전체 단계 텍스트 리스트 - 타원 형태 */}
                <div className='relative flex flex-col space-y-1 text-xs'>
                  {stepItems.map(({ step, label, indent }) => (
                    <div
                      key={step}
                      className={`${indent} ${
                        step === progressCount ? 'font-semibold text-black' : 'text-gray-400'
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className='flex flex-col space-y-1'>
                {/* 구매 진행 */}
                {artwork._status_text === '구매 진행' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`${ROUTES.PRODUCT}/${artwork.it_id}`);
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
                      router.push(`${ROUTES.PRODUCT}/${artwork.it_id}`);
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

                {/* 배송조회 */}
                {(artwork._status_text === '배송 진행' || artwork._status_text === '배송중') && (
                  <>
                    {artwork.od_invoice && artwork.od_delivery_company ? (
                      <div className='flex flex-col gap-1'>
                        <div className='text-xs text-gray-600'>
                          {artwork.od_delivery_company}
                        </div>
                        <div className='text-xs font-medium'>
                          {artwork.od_invoice}
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 배송조회 링크 - 택배사별 추적 URL
                            const trackingUrl = getTrackingUrl(artwork.od_delivery_company || '', artwork.od_invoice || '');
                            if (trackingUrl) {
                              window.open(trackingUrl, '_blank');
                            }
                          }}
                          variant='default'
                          size='sm'
                          className='whitespace-nowrap'
                        >
                          배송조회
                        </Button>
                      </div>
                    ) : (
                      <span className='rounded bg-gray-100 px-3 py-1 text-sm whitespace-nowrap text-gray-500'>
                        운송장 등록 중
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* 순번 표시 (컬렉션) */}
          {!artwork._goalAttainment && artwork._status_text === '컬렉션' && artwork.orderNumber && (
            <div className='mt-2'>
              <span className='text-sm font-medium text-gray-600'>No. {artwork.orderNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* 모달들 */}
      <ReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onSubmit={onReturnSubmit}
        orderId={artwork.od_id || ''}
        dictionary={dictionary}
      />

      {/* 구매 취소 Dialog */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSubmit={onOrderCancel}
        orderId={artwork.od_id || ''}
        dictionary={dictionary}
      />

      {/* 확인 Dialog */}
      {/* <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title='확인'
        description={confirmMessage}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      /> */}

      {/* 메시지 Dialog */}
      {/* <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title={messageTitle}
        description={messageContent}
      /> */}

      {/* 관심상품 토글 확인 Dialog */}
      <ConfirmDialog
        open={showInterestConfirmDialog}
        onOpenChange={setShowInterestConfirmDialog}
        title={
          artwork.ir_id
            ? dictionary.myUdign.dialogs.interest.remove
            : dictionary.myUdign.dialogs.interest.add
        }
        description={
          artwork.ir_id
            ? dictionary.myUdign.dialogs.interest.removeMessage
            : dictionary.myUdign.dialogs.interest.addMessage
        }
        onConfirm={handleInterestConfirm}
        variant={artwork.ir_id ? 'destructive' : 'default'}
        confirmText={
          artwork.ir_id
            ? dictionary.myUdign.dialogs.interest.removeButton
            : dictionary.myUdign.dialogs.interest.addButton
        }
      />

      {/* 구매확정 확인 Dialog */}
      <ConfirmDialog
        open={showPurchaseConfirmDialog}
        onOpenChange={setShowPurchaseConfirmDialog}
        title={dictionary.myUdign.dialogs.purchase.confirm}
        description={dictionary.myUdign.dialogs.purchase.confirmMessage}
        onConfirm={handlePurchaseConfirmAction}
        confirmText={dictionary.myUdign.dialogs.purchase.confirmButton}
      />
    </>
  );
}
