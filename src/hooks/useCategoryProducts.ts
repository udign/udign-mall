import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, ProductListResponse } from '@/types/product';
import { PAGINATION_CONFIG } from '@/config/pagination';

interface UseCategoryProductsProps {
  defaultCategoryId: string;
  pathname: string;
  targetCategoryId?: string; // 표시하고 싶은 카테고리 ID
}

interface UseCategoryProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  categoryName: string;
  categoryCount: number;
  currentPage: number;
  refetch: () => void;
}

export const useCategoryProducts = ({
  defaultCategoryId,
  pathname,
  targetCategoryId,
}: UseCategoryProductsProps): UseCategoryProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryCount, setCategoryCount] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1');

  const fetchProducts = useCallback(
    async (pageNum: number = currentPage) => {
      try {
        setLoading(true);
        setError(null);

        // 모든 작품을 보여주되, 카테고리별 정보는 별도로 처리
        const response = await fetch(
          `/api/products?page=${pageNum}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}`,
        );

        if (!response.ok) {
          throw new Error('상품을 불러오는데 실패했습니다.');
        }

        const data: ProductListResponse = await response.json();

        if (data.success) {
          setProducts(data.items);
          setTotalPages(data.pagination.totalPages);

          // 타겟 카테고리 ID가 있으면 해당 카테고리 정보 사용
          if (targetCategoryId && data.categoryCounts[targetCategoryId]) {
            setCategoryName(data.categoryCounts[targetCategoryId].name);
            setCategoryCount(data.categoryCounts[targetCategoryId].count);
          } else {
            setCategoryName('모든 작품');
            setCategoryCount(data.pagination.totalCount);
          }
        } else {
          throw new Error('상품 데이터를 처리하는데 실패했습니다.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [currentPage, targetCategoryId],
  );

  const refetch = useCallback(() => fetchProducts(currentPage), [fetchProducts, currentPage]);

  useEffect(() => {
    // 초기 로드 시 URL 파라미터가 없으면 기본값으로 설정
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`);
    } else {
      fetchProducts(currentPage);
    }
  }, [currentPage, searchParams, router, defaultCategoryId, pathname, fetchProducts]);

  return {
    products,
    loading,
    error,
    totalPages,
    categoryName,
    categoryCount,
    currentPage,
    refetch,
  };
};
