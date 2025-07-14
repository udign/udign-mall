'use client';

import { useState, useCallback } from 'react';

interface UsePaginationProps {
  boundaryCount?: number; // 시작과 끝에 보여줄 페이지 수 (기본값: 1)
  count?: number; // 전체 페이지 수 (기본값: 1)
  defaultPage?: number; // 초기 페이지 번호 - controlled가 아닐 때만 사용 (기본값: 1)
  disabled?: boolean; // 모든 페이지네이션 버튼 비활성화 여부 (기본값: false)
  hideNextButton?: boolean; // "다음" 버튼 숨김 여부 (기본값: false)
  hidePrevButton?: boolean; // "이전" 버튼 숨김 여부 (기본값: false)
  onChange?: (event: React.MouseEvent<HTMLButtonElement>, value: number) => void; // 페이지 변경 시 호출되는 콜백 함수
  page?: number; // 현재 페이지 번호 - controlled component로 사용할 때
  showFirstButton?: boolean; // "처음" 버튼 표시 여부 (기본값: false)
  showLastButton?: boolean; // "마지막" 버튼 표시 여부 (기본값: false)
  siblingCount?: number; // 현재 페이지 양쪽에 보여줄 페이지 수 (기본값: 1)
}

interface PaginationItem {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; // 버튼 클릭 시 호출되는 핸들러 함수
  type: 'page' | 'first' | 'previous' | 'next' | 'last' | 'start-ellipsis' | 'end-ellipsis'; // 아이템 타입 (page, first, previous, next, last, start-ellipsis, end-ellipsis)
  page: number | null; // 페이지 번호 (ellipsis 타입의 경우 null)
  selected: boolean; // 현재 선택된 페이지인지 여부 (page 타입에서만 true 가능)
  disabled: boolean; // 버튼 비활성화 여부
  'aria-current'?: 'page' | undefined; // 접근성을 위한 aria-current 속성 (현재 페이지일 때만 'page')
}

export const usePagination = ({
  boundaryCount = 1,
  count = 1,
  defaultPage = 1,
  disabled = false,
  hideNextButton = false,
  hidePrevButton = false,
  onChange: handleChange,
  page: pageProp,
  showFirstButton = false,
  showLastButton = false,
  siblingCount = 1,
  ...other
}: UsePaginationProps = {}) => {
  const [internalPage, setInternalPage] = useState(defaultPage);

  const page = pageProp !== undefined ? pageProp : internalPage;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, value: number) => {
      if (pageProp === undefined) {
        setInternalPage(value);
      }
      if (handleChange) {
        handleChange(event, value);
      }
    },
    [pageProp, handleChange],
  );

  // https://dev.to/namirsab/comment/2050
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const startPages = range(1, Math.min(boundaryCount, count));
  const endPages = range(Math.max(count - boundaryCount + 1, boundaryCount + 1), count);

  const siblingsStart = Math.max(
    Math.min(
      // Natural start
      page - siblingCount,
      // Lower boundary when page is high
      count - boundaryCount - siblingCount * 2 - 1,
    ),
    // Greater than startPages
    boundaryCount + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(
      // Natural end
      page + siblingCount,
      // Upper boundary when page is low
      boundaryCount + siblingCount * 2 + 2,
    ),
    // Less than endPages
    count - boundaryCount - 1,
  );

  // Basic list of items to render
  // for example itemList = ['first', 'previous', 1, 'ellipsis', 4, 5, 6, 'ellipsis', 10, 'next', 'last']
  const itemList = [
    ...(showFirstButton ? ['first'] : []),
    ...(hidePrevButton ? [] : ['previous']),
    ...startPages,

    // Start ellipsis

    ...(siblingsStart > boundaryCount + 2
      ? ['start-ellipsis']
      : boundaryCount + 1 < count - boundaryCount
        ? [boundaryCount + 1]
        : []),

    // Sibling pages
    ...range(siblingsStart, siblingsEnd),

    // End ellipsis

    ...(siblingsEnd < count - boundaryCount - 1
      ? ['end-ellipsis']
      : count - boundaryCount > boundaryCount
        ? [count - boundaryCount]
        : []),

    ...endPages,
    ...(hideNextButton ? [] : ['next']),
    ...(showLastButton ? ['last'] : []),
  ];

  // Map the button type to its page number
  const buttonPage = (type: string): number | null => {
    switch (type) {
      case 'first':
        return 1;
      case 'previous':
        return page - 1;
      case 'next':
        return page + 1;
      case 'last':
        return count;
      default:
        return null;
    }
  };

  // Convert the basic item list to PaginationItem props objects
  const items: PaginationItem[] = itemList.map((item) => {
    return typeof item === 'number'
      ? {
          onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
            handleClick(event, item);
          },
          type: 'page' as const,
          page: item,
          selected: item === page,
          disabled,
          'aria-current': item === page ? 'page' : undefined,
        }
      : {
          onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
            const pageNum = buttonPage(item);
            if (pageNum !== null) {
              handleClick(event, pageNum);
            }
          },
          type: item as 'first' | 'previous' | 'next' | 'last' | 'start-ellipsis' | 'end-ellipsis',
          page: buttonPage(item),
          selected: false,
          disabled:
            disabled ||
            (!item.includes('ellipsis') &&
              (item === 'next' || item === 'last' ? page >= count : page <= 1)),
        };
  });

  return {
    items,
    ...other,
  };
};
