'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DisplayPopup, PopupDisplayResponse } from '@/types/popup';
import { isPopupHidden, hidePopup } from '@/lib/cookie-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/primitives/button';

const PopupDisplay = () => {
  const [popups, setPopups] = useState<DisplayPopup[]>([]);
  const [hiddenPopups, setHiddenPopups] = useState<Set<number>>(new Set());

  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchPopups = async () => {
      try {
        const device = isMobile ? 'mobile' : 'pc';
        const response = await fetch(`/api/popups?device=${device}`);
        const data: PopupDisplayResponse = await response.json();

        if (data.success && data.popups) {
          // 쿠키로 이미 숨겨진 팝업들을 필터링
          const visiblePopups = data.popups.filter((popup) => {
            return !isPopupHidden(popup.nw_id);
          });

          setPopups(visiblePopups);
        }
      } catch (error) {
        console.error('팝업 조회 오류:', error);
      }
    };

    // 컴포넌트가 마운트되고 isMobile 값이 결정된 후에 팝업을 불러옴
    if (typeof isMobile === 'boolean') {
      fetchPopups();
    }
  }, [isMobile]);

  const handleClose = (popupId: number) => {
    setHiddenPopups((prev) => new Set([...prev, popupId]));
  };

  const handleDontShowAgain = (popupId: number, hours: number) => {
    hidePopup(popupId, hours);
    setHiddenPopups((prev) => new Set([...prev, popupId]));
  };

  const visiblePopups = popups.filter((popup) => !hiddenPopups.has(popup.nw_id));

  if (visiblePopups.length === 0) {
    return null;
  }

  return (
    <div id='popup-container' className='pointer-events-none fixed inset-0 z-[9999]'>
      <div className='sr-only'>팝업레이어 알림</div>

      {visiblePopups.map((popup) => (
        <div
          key={popup.nw_id}
          id={`popup_${popup.nw_id}`}
          className='pointer-events-auto fixed border border-gray-300 bg-white shadow-lg'
          style={{
            top: `${popup.nw_top}px`,
            left: `${popup.nw_left}px`,
            width: `${popup.nw_width}px`,
            height: `${popup.nw_height}px`,
            zIndex: 10000,
          }}
        >
          {/* 팝업 내용 */}
          <div
            className='h-full w-full overflow-auto p-4'
            style={{
              height: `${popup.nw_height - 60}px`, // 버튼 영역 제외
            }}
          >
            {popup.nw_content ? (
              <div
                dangerouslySetInnerHTML={{ __html: popup.nw_content }}
                className='prose prose-sm max-w-none'
              />
            ) : (
              <div className='flex h-full items-center justify-center'>
                <h3 className='text-lg font-semibold text-gray-800'>{popup.nw_subject}</h3>
              </div>
            )}
          </div>

          {/* 팝업 하단 버튼 영역 */}
          <div className='absolute right-0 bottom-0 left-0 flex h-[60px] items-center justify-between border-t border-gray-200 bg-gray-50 px-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => handleDontShowAgain(popup.nw_id, popup.nw_disable_hours)}
              className='text-xs'
            >
              <strong>{popup.nw_disable_hours}</strong>시간 동안 다시 열람하지 않습니다
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleClose(popup.nw_id)}
              className='flex items-center gap-1 text-xs'
            >
              닫기 <X className='h-3 w-3' />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopupDisplay;
