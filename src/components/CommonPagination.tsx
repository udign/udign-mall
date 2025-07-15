import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePagination } from '@/hooks/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/primitives/pagination';
import { Button } from '@/components/ui/primitives/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface CommonPaginationProps {
  currentPage: number; // 현재 페이지 번호 (1부터 시작)
  totalPages: number; // 전체 페이지 수
  pathname: string; // 페이지 이동 시 사용할 기본 경로 (쿼리 파라미터 제외) 예: '/fashion'
  boundaryCount?: number; // 시작과 끝에 보여줄 페이지 수 (기본값: 1)
  siblingCount?: number; // 현재 페이지 양쪽에 보여줄 페이지 수 (기본값: 1)
  queryParams?: Record<string, string>; // URL에 추가할 쿼리 파라미터
  onPageChange?: (page: number) => void; // 페이지 변경 시 추가로 실행할 콜백 함수
  showFirstButton?: boolean; // "처음" 버튼 표시 여부 (기본값: false)
  showLastButton?: boolean; // "마지막" 버튼 표시 여부 (기본값: false)
}

const getButtonText = (type: string) => {
  switch (type) {
    case 'first':
      return '처음';
    case 'previous':
      return '이전';
    case 'next':
      return '다음';
    case 'last':
      return '마지막';
    default:
      return type;
  }
};

const getButtonIcon = (type: string) => {
  switch (type) {
    case 'previous':
      return <ChevronLeftIcon className='h-4 w-4' />;
    case 'next':
      return <ChevronRightIcon className='h-4 w-4' />;
    default:
      return null;
  }
};

export default function CommonPagination({
  currentPage,
  totalPages,
  pathname,
  boundaryCount = 1,
  siblingCount = 1,
  queryParams = {},
  onPageChange,
  showFirstButton = false,
  showLastButton = false,
}: CommonPaginationProps) {
  const router = useRouter();

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
        const params = new URLSearchParams();
        // queryParams props로 전달받은 추가 쿼리 파라미터를 먼저 추가
        Object.entries(queryParams).forEach(([key, value]) => params.set(key, value));
        params.set('page', newPage.toString());

        router.push(`${pathname}?${params.toString()}`);
        if (onPageChange) onPageChange(newPage);
      }
    },
    [router, pathname, queryParams, onPageChange, totalPages, currentPage],
  );

  const { items } = usePagination({
    count: totalPages,
    page: currentPage,
    boundaryCount,
    siblingCount,
    showFirstButton,
    showLastButton,
    onChange: (e, page) => handlePageChange(page),
  });

  return (
    <Pagination>
      <PaginationContent>
        {items.map(({ page, type, selected, disabled, onClick, ...item }, index) => {
          const icon = getButtonIcon(type);
          const text = getButtonText(type);
          const isNavButton = type === 'previous' || type === 'next';

          return type === 'start-ellipsis' || type === 'end-ellipsis' ? (
            <PaginationItem key={index}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : type === 'page' ? (
            <PaginationItem key={index}>
              <Button
                variant={selected ? 'outline' : 'ghost'}
                size='icon'
                onClick={onClick}
                disabled={disabled}
                {...item}
              >
                {page}
              </Button>
            </PaginationItem>
          ) : (
            <PaginationItem key={index}>
              <Button
                variant='ghost'
                size={isNavButton ? 'default' : 'icon'}
                onClick={onClick}
                disabled={disabled}
                className={isNavButton ? 'gap-1 px-2.5 sm:pl-2.5' : ''}
                {...item}
              >
                {type === 'previous' && icon}
                <span className={isNavButton ? 'hidden sm:block' : ''}>{text}</span>
                {type === 'next' && icon}
              </Button>
            </PaginationItem>
          );
        })}
      </PaginationContent>
    </Pagination>
  );
}
