interface UsePaginationProps {
  currentPageNumber: number; // 현재 페이지 번호
  totalPageCount: number; // 전체 페이지 번호
  visiblePageCount: number; // 페이지네이션에서 한 번에 보여줄 페이지 개수
}

export const usePagination = ({
  currentPageNumber,
  totalPageCount,
  visiblePageCount = 5,
}: UsePaginationProps) => {
  const allpageNumbers = Array.from({ length: totalPageCount }, (_, i) => i + 1);
  const halfVisiblePageCount = Math.round(visiblePageCount / 2); // ex: visiblePageCount가 5일 경우 3

  // 현재 페이지(currentPageNumber)를 기준(중앙)으로 페이지네이션에서 한 번에 보여줄 페이지 번호들을 필터링
  const visiblePageNumbers = allpageNumbers.filter((pageNumber) =>
    currentPageNumber > halfVisiblePageCount
      ? Math.abs(pageNumber - currentPageNumber) < halfVisiblePageCount
      : pageNumber <= visiblePageCount,
  );
  const showPreviousEllipsis = currentPageNumber > halfVisiblePageCount;
  const showNextEllipsis = totalPageCount - currentPageNumber > halfVisiblePageCount - 1;
  const showPreviousPageButton = currentPageNumber > 1;
  const showNextPageButton = currentPageNumber < totalPageCount;

  return {
    visiblePageNumbers,
    showPreviousEllipsis,
    showNextEllipsis,
    showPreviousPageButton,
    showNextPageButton,
  };
};
