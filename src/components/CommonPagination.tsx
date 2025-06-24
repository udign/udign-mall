import { useRouter } from 'next/navigation';
import { usePagination } from '@/hooks/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { PAGINATION_CONFIG } from '@/config/pagination';

interface CommonPaginationProps {
  currentPageNumber: number;
  totalPageCount: number;
  visiblePageCount?: number;
  baseUrl: string; // 예: '/fashion'
  queryParams?: Record<string, string>; // 추가 쿼리 파라미터
  onPageChange?: (page: number) => void; // 페이지 변경 시 추가 처리
}

export default function CommonPagination({
  currentPageNumber,
  totalPageCount,
  visiblePageCount = PAGINATION_CONFIG.VISIBLE_PAGE_COUNT,
  baseUrl,
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
      // URL 파라미터 생성
      const params = new URLSearchParams();

      // 기존 쿼리 파라미터 추가
      Object.entries(queryParams).forEach(([key, value]) => {
        params.set(key, value);
      });

      // 페이지 파라미터 설정
      params.set('page', newPage.toString());

      // URL 업데이트
      router.push(`${baseUrl}?${params.toString()}`);

      // 추가 처리 함수 호출
      if (onPageChange) {
        onPageChange(newPage);
      }

      // 페이지 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 페이지가 1페이지뿐이면 페이지네이션 숨김
  if (totalPageCount <= 1) {
    return null;
  }

  return (
    <Pagination>
      <PaginationContent>
        {/* 이전 페이지 버튼 */}
        {showPreviousPageButton && (
          <PaginationItem>
            <button
              onClick={() => handlePageChange(currentPageNumber - 1)}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'default' }),
                'gap-1 px-2.5 sm:pl-2.5',
              )}
            >
              <ChevronLeftIcon className='h-4 w-4' />
              <span className='hidden sm:block'>이전</span>
            </button>
          </PaginationItem>
        )}

        {/* 첫 페이지와 이전 생략 표시 */}
        {showPreviousEllipsis && (
          <>
            <PaginationItem>
              <button
                onClick={() => handlePageChange(1)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
              >
                1
              </button>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </>
        )}

        {/* 보이는 페이지 번호들 */}
        {visiblePageNumbers.map((pageNum) => (
          <PaginationItem key={pageNum}>
            <button
              onClick={() => handlePageChange(pageNum)}
              className={cn(
                buttonVariants({
                  variant: currentPageNumber === pageNum ? 'outline' : 'ghost',
                  size: 'icon',
                }),
              )}
            >
              {pageNum}
            </button>
          </PaginationItem>
        ))}

        {/* 다음 생략 표시와 마지막 페이지 */}
        {showNextEllipsis && (
          <>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <button
                onClick={() => handlePageChange(totalPageCount)}
                className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
              >
                {totalPageCount}
              </button>
            </PaginationItem>
          </>
        )}

        {/* 다음 페이지 버튼 */}
        {showNextPageButton && (
          <PaginationItem>
            <button
              onClick={() => handlePageChange(currentPageNumber + 1)}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'default' }),
                'gap-1 px-2.5 sm:pr-2.5',
              )}
            >
              <span className='hidden sm:block'>다음</span>
              <ChevronRightIcon className='h-4 w-4' />
            </button>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
