'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ProductRankingItem, ProductRankingQueryParams, ProductCategory } from '@/types/sales';
import { Button } from '@/components/ui/primitives/button';
import { Label } from '@/components/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives/popover';
import { Calendar } from '@/components/ui/primitives/calendar';
import { Search, RefreshCw, CalendarIcon } from 'lucide-react';
import CommonPagination from '@/components/CommonPagination';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { ROUTES } from '@/lib/routes';
import { PAGINATION_CONFIG } from '@/lib/constants';

const columns = [
  { key: 'rank', label: '순위' },
  { key: 'product', label: '상품명' },
  { key: 'shopping', label: '쇼핑' },
  { key: 'ordered', label: '주문' },
  { key: 'paid', label: '입금' },
  { key: 'preparing', label: '준비' },
  { key: 'shipped', label: '배송' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '취소' },
  { key: 'returned', label: '반품' },
  { key: 'outOfStock', label: '품절' },
  { key: 'totalQty', label: '합계' },
];

const getCategoryDepth = (categoryId: string): number => {
  if (!categoryId) return 0;
  return Math.floor(categoryId.length / 2);
};

export default function SalesRankingPage() {
  const [data, setData] = useState<ProductRankingItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    categoryId: 'all',
  });
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<typeof filters>(filters);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1');

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const imageUrl = target.src;
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/sales-ranking', {
          method: 'GET',
        });
        const result = await response.json();
        if (result.success) {
          setCategories(result.data || []);
        }
      } catch (error) {
        console.error('카테고리 조회 실패:', error);
      }
    };

    fetchCategories();
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);

    try {
      const queryParams: ProductRankingQueryParams = {
        page: currentPage,
        limit: PAGINATION_CONFIG.ITEMS_PER_PAGE,
      };

      const response = await fetch('/api/admin/sales-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryParams),
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data.rankingData || []);
        if (result.data.pagination) {
          setTotalCount(result.data.pagination.totalItems);
          setTotalPages(result.data.pagination.totalPages);
        }
      } else {
        console.error('데이터 조회 실패:', result.error);
      }
    } catch (error) {
      console.error('API 호출 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchFilteredData = useCallback(async (searchFilters: typeof filters, page: number = 1) => {
    setLoading(true);

    try {
      const queryParams: ProductRankingQueryParams = {
        page,
        limit: PAGINATION_CONFIG.ITEMS_PER_PAGE,
        startDate: searchFilters.startDate
          ? dayjs(searchFilters.startDate).format('YYYY-MM-DD')
          : undefined,
        endDate: searchFilters.endDate
          ? dayjs(searchFilters.endDate).format('YYYY-MM-DD')
          : undefined,
        categoryId: searchFilters.categoryId === 'all' ? undefined : searchFilters.categoryId,
      };

      const response = await fetch('/api/admin/sales-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryParams),
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data.rankingData || []);
        if (result.data.pagination) {
          setTotalCount(result.data.pagination.totalItems);
          setTotalPages(result.data.pagination.totalPages);
        }
      } else {
        console.error('데이터 조회 실패:', result.error);
      }
    } catch (error) {
      console.error('API 호출 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', '1');
      router.replace(`${ROUTES.ADMIN_SALES_RANKING}?${params.toString()}`);
    } else if (!isSearchMode) {
      fetchInitialData();
    }
  }, [currentPage, searchParams, router, fetchInitialData, isSearchMode]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${ROUTES.ADMIN_SALES_RANKING}?${params.toString()}`);

    // 검색 모드인 경우 검색 조건을 유지하여 페이지 변경
    if (isSearchMode) fetchFilteredData(searchFilters, page);
  };

  const handleSearch = () => {
    setIsSearchMode(true);
    setSearchFilters(filters);

    // 페이지를 1로 리셋하고 필터 조건으로 검색
    fetchFilteredData(filters, 1);

    // URL도 1페이지로 업데이트
    const params = new URLSearchParams();
    params.set('page', '1');
    router.replace(`${ROUTES.ADMIN_SALES_RANKING}?${params.toString()}`);
  };

  const handleReset = () => {
    setIsSearchMode(false);
    setFilters({
      startDate: undefined,
      endDate: undefined,
      categoryId: 'all',
    });
    // 페이지를 1로 리셋하고 전체 데이터 로드
    fetchInitialData();

    // URL도 1페이지로 업데이트
    const params = new URLSearchParams();
    params.set('page', '1');
    router.replace(`${ROUTES.ADMIN_SALES_RANKING}?${params.toString()}`);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>상품 판매 순위</h1>
          <p className='mt-1 text-gray-600'>
            상품별 주문 상태에 따른 판매량을 집계하여 순위를 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Search className='h-5 w-5' />
            검색 조건
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='space-y-2'>
              <Label className='text-sm font-medium'>카테고리</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className='w-48'>
                  <SelectValue placeholder='전체분류' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>전체분류</SelectItem>
                  {categories.map((category) => {
                    const depth = getCategoryDepth(category.ca_id);
                    const indentText = '_'.repeat(depth - 1);
                    return (
                      <SelectItem key={category.ca_id} value={category.ca_id}>
                        <span className='text-white'>{indentText}</span>
                        {category.ca_name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium'>시작일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-48 justify-start text-left font-normal'>
                    <CalendarIcon className='h-4 w-4' />
                    {filters.startDate
                      ? dayjs(filters.startDate).format('YYYY년 MM월 DD일')
                      : '시작일을 선택하세요'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={filters.startDate}
                    onSelect={(date) => setFilters((prev) => ({ ...prev, startDate: date }))}
                    disabled={(date) => date > new Date()}
                    captionLayout='dropdown'
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-medium'>종료일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-48 justify-start text-left font-normal'>
                    <CalendarIcon className='h-4 w-4' />
                    {filters.endDate
                      ? dayjs(filters.endDate).format('YYYY년 MM월 DD일')
                      : '종료일을 선택하세요'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={filters.endDate}
                    onSelect={(date) => setFilters((prev) => ({ ...prev, endDate: date }))}
                    disabled={(date) => date > new Date()}
                    captionLayout='dropdown'
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='flex gap-2'>
              <Button onClick={handleSearch} className='flex items-center gap-1.5'>
                <Search className='h-4 w-4' />
                검색
              </Button>
              <Button onClick={handleReset} variant='outline' className='flex items-center gap-1.5'>
                <RefreshCw className='h-4 w-4' />
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>전체 상품 순위</h3>
        <p className='text-sm text-gray-600'>
          총 {totalCount}건 (페이지 {currentPage}/{totalPages})
        </p>
      </div>

      <Card className='py-0'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b'>
                {columns.map((column) => (
                  <th key={column.key} className='p-3 text-center text-sm font-medium'>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className='p-8 text-center'>
                    <LoadingSpinner
                      className='my-10'
                      size='md'
                      message='상품 데이터를 불러오는 중...'
                    />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className='text-muted-foreground p-8 text-center'>
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr key={item.it_id} className={`border-b ${index % 2 === 0 && 'bg-muted/25'}`}>
                    <td className='p-3 text-center font-medium'>{item.rank}</td>
                    <td className='p-3'>
                      <div className='flex items-center gap-3'>
                        <div className='relative h-12 w-12 flex-shrink-0'>
                          {!item.it_img1 ||
                          item.it_img1.trim() === '' ||
                          failedImages.has(item.it_img1) ? (
                            <div className='flex h-full w-full items-center justify-center rounded bg-gray-200'>
                              <span className='text-center text-xs text-gray-400'>
                                이미지
                                <br />
                                없음
                              </span>
                            </div>
                          ) : (
                            <Image
                              src={item.it_img1}
                              alt={item.it_name}
                              fill
                              className='rounded object-cover'
                              onError={handleImageError}
                              sizes='48px'
                            />
                          )}
                        </div>
                        <div>
                          <div className='line-clamp-2 font-medium'>{item.it_name}</div>
                          {item.ca_name && (
                            <div className='text-muted-foreground text-xs'>{item.ca_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className='p-3 text-center'>{item.shopping.toLocaleString()}</td>
                    <td className='p-3 text-center'>{item.ordered.toLocaleString()}</td>
                    <td className='p-3 text-center'>{item.paid.toLocaleString()}</td>
                    <td className='p-3 text-center'>{item.preparing.toLocaleString()}</td>
                    <td className='p-3 text-center'>{item.shipped.toLocaleString()}</td>
                    <td className='p-3 text-center'>{item.completed.toLocaleString()}</td>
                    <td className='p-3 text-center'>{item.cancelled.toLocaleString()}</td>
                    <td className='p-3 text-center'>{item.returned.toLocaleString()}</td>
                    <td className='p-3 text-center'>{item.outOfStock.toLocaleString()}</td>
                    <td className='p-3 text-center font-bold'>{item.totalQty.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CommonPagination
        currentPageNumber={currentPage}
        totalPageCount={totalPages}
        pathname={ROUTES.ADMIN_SALES_RANKING}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
