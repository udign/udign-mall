interface ProgressBarProps {
  statusText: string;
  ctStatus?: string;
}

export default function ProgressBar({ statusText, ctStatus }: ProgressBarProps) {
  const statusLabels = [
    '제작 검토',
    '구매 진행',
    '주문 확정',
    '상품 제작',
    '배송 진행',
    '수령 완료',
  ];

  // 상태에 따른 진행도 계산
  let progressCount = 0;
  let currentIndex = 0;

  // 원본 ct_status 값을 직접 확인하여 정확한 상태 매핑
  switch (ctStatus) {
    case '주문':
      progressCount = 2;
      currentIndex = 1;
      break;
    case '입금':
      progressCount = 3;
      currentIndex = 2;
      break;
    case '준비':
      progressCount = 4;
      currentIndex = 3;
      break;
    case '배송':
      progressCount = 5;
      currentIndex = 4;
      break;
    case '완료':
    case '구매확정':
      progressCount = 6;
      currentIndex = 5;
      break;
    default:
      // 변환된 statusText로 판단
      switch (statusText) {
        case '심의중':
          progressCount = 1;
          currentIndex = 0;
          break;
        case '구매 진행':
        case '결제대기':
          progressCount = 2;
          currentIndex = 1;
          break;
        case '결제완료':
          progressCount = 3;
          currentIndex = 2;
          break;
        case '상품 제작':
          progressCount = 4;
          currentIndex = 3;
          break;
        case '배송 진행':
          progressCount = 5;
          currentIndex = 4;
          break;
        case '수령 완료':
          progressCount = 6;
          currentIndex = 5;
          break;
        default:
          progressCount = 1;
          currentIndex = 0;
          break;
      }
      break;
  }

  return (
    <div className='w-full'>
      {/* 진행 바 */}
      <div className='mb-2 flex'>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className={`mx-0.5 h-3 flex-1 rounded-sm ${
              index < progressCount
                ? `bg-gradient-to-r from-gray-400 to-gray-${Math.min(900, 400 + index * 100)}`
                : 'bg-gray-200'
            } `}
          />
        ))}
      </div>

      {/* 상태 라벨 */}
      <div className='flex justify-between text-xs'>
        {statusLabels.map((label, index) => (
          <div
            key={index}
            className={`flex-1 text-center ${
              index === currentIndex
                ? 'font-bold text-red-600'
                : index < progressCount
                  ? 'text-gray-600'
                  : 'text-gray-400'
            } `}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
