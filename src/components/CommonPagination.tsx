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
import { PAGINATION_CONFIG } from '@/lib/constants';

interface CommonPaginationProps {
  currentPageNumber: number;
  totalPageCount: number;
  pathname: string; // 예: '/fashion'
  visiblePageCount?: number;
  queryParams?: Record<string, string>; // 추가 쿼리 파라미터
  onPageChange?: (page: number) => void; // 페이지 변경 시 추가 처리
}

export default function CommonPagination({
  currentPageNumber,
  totalPageCount,
  pathname,
  visiblePageCount = PAGINATION_CONFIG.VISIBLE_PAGE_COUNT,
  queryParams = {},
  onPageChange,
}: CommonPaginationProps) {
  const router = useRouter();

  const {
    visiblePageNumbers,
    showPreviousEllipsis,
    showNextEllipsis,
    showPreviousPageButton,
    showNextPageButton,
  } = usePagination({ currentPageNumber, totalPageCount, visiblePageCount });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPageCount) {
      const params = new URLSearchParams();
      params.set('page', newPage.toString());
      // queryParams props로 전달받은 추가 쿼리 파라미터 추가
      Object.entries(queryParams).forEach(([key, value]) => params.set(key, value));

      router.push(`${pathname}?${params.toString()}`);
      if (onPageChange) onPageChange(newPage);
    }
  };

  return (
    <>
      {totalPageCount > 1 && (
        <Pagination>
          <PaginationContent>
            {showPreviousPageButton && (
              <PaginationItem>
                <Button
                  variant='ghost'
                  size='default'
                  onClick={() => handlePageChange(currentPageNumber - 1)}
                  className='gap-1 px-2.5 sm:pl-2.5'
                >
                  <ChevronLeftIcon className='h-4 w-4' />
                  <span className='hidden sm:block'>이전</span>
                </Button>
              </PaginationItem>
            )}

            {showPreviousEllipsis && (
              <>
                <PaginationItem>
                  <Button variant='ghost' size='icon' onClick={() => handlePageChange(1)}>
                    1
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              </>
            )}

            {visiblePageNumbers.map((pageNum) => (
              <PaginationItem key={pageNum}>
                <Button
                  variant={currentPageNumber === pageNum ? 'outline' : 'ghost'}
                  size='icon'
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              </PaginationItem>
            ))}

            {showNextEllipsis && (
              <>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handlePageChange(totalPageCount)}
                  >
                    {totalPageCount}
                  </Button>
                </PaginationItem>
              </>
            )}

            {showNextPageButton && (
              <PaginationItem>
                <Button
                  variant='ghost'
                  size='default'
                  onClick={() => handlePageChange(currentPageNumber + 1)}
                  className='gap-1 px-2.5 sm:pr-2.5'
                >
                  <span className='hidden sm:block'>다음</span>
                  <ChevronRightIcon className='h-4 w-4' />
                </Button>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
