import { useState } from 'react';
import { ArtworkStatus } from '@/types/artwork';
import ProgressBar from './ProgressBar';
import ReturnModal from './ReturnModal';
import CancelOrderModal from './CancelOrderModal';

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
  isAdmin: boolean;
}

export default function ArtworkCard({
  artwork,
  onInterestToggle,
  onOrderCancel,
  onPurchaseConfirm,
  onReturnSubmit,
  isAdmin,
}: ArtworkCardProps) {
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

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

  const isClickable = artwork._status_text === '컬렉션' || artwork._status_text === '심의중';

  return (
    <>
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 ${isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : ''} `}
        onClick={isClickable ? () => window.open(`/product/${artwork.it_id}`, '_blank') : undefined}
      >
        <div className='flex items-center space-x-4'>
          {/* 상품 이미지 */}
          <div className='flex-shrink-0'>
            <img
              src={`/data/item/${artwork.it_img1}`}
              alt={artwork.it_name}
              className='h-24 w-24 rounded-lg object-cover'
            />
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
                <div className='text-sm'>
                  <label className='flex items-center'>
                    <input
                      type='checkbox'
                      checked={artwork.it_10 === 'N'}
                      onChange={() => {
                        /* 관리자 토글 로직 */
                      }}
                      className='mr-2'
                    />
                    {artwork.it_10 === 'N' ? '심의종료' : '심의중'}
                  </label>
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
                    window.open(`/product/${artwork.it_id}`, '_blank');
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
                    window.open(`/product/${artwork.it_id}`, '_blank');
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
                    window.open(`/product/${artwork.it_id}/qa`, '_blank');
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
    </>
  );
}
