import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, ProductListResponse } from '@/types/product';
import { PAGINATION_CONFIG } from '@/config/pagination';

interface UseCategoryProductsProps {
  defaultCategoryId: string;
  pathname: string;
}

interface UseCategoryProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  categoryName: string;
  currentPage: number;
  categoryId: string;
  refetch: () => void;
}

export const useCategoryProducts = ({
  defaultCategoryId,
  pathname,
}: UseCategoryProductsProps): UseCategoryProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [categoryName, setCategoryName] = useState<string>('');

  const router = useRouter();
  const searchParams = useSearchParams();

  const categoryId = searchParams.get('ca_id') || defaultCategoryId;
  const currentPage = parseInt(searchParams.get('page') || '1');

  const fetchProducts = useCallback(
    async (pageNum: number = currentPage, catId: string = categoryId) => {
      try {
        setLoading(true);
        setError(null);

        // 실 데이터
        const response = await fetch(
          `/api/products?ca_id=${catId}&page=${pageNum}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}`,
        );

        // 더미 데이터
        // const response = await fetch(
        //   `/api/products/dummy?ca_id=${catId}&page=${pageNum}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}`,
        // );

        if (!response.ok) {
          throw new Error('상품을 불러오는데 실패했습니다.');
        }

        const data: ProductListResponse = await response.json();

        if (data.success) {
          setProducts(data.items);
          setTotalPages(data.pagination.totalPages);
          setCategoryName(data.category.ca_name);
        } else {
          throw new Error('상품 데이터를 처리하는데 실패했습니다.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [currentPage, categoryId],
  );

  const refetch = useCallback(
    () => fetchProducts(currentPage, categoryId),
    [fetchProducts, currentPage, categoryId],
  );

  useEffect(() => {
    // 초기 로드 시 URL 파라미터가 없으면 기본값으로 설정
    if (!searchParams.get('ca_id') && !searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('ca_id', defaultCategoryId);
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`);
    } else {
      fetchProducts(currentPage, categoryId);
    }
  }, [currentPage, categoryId, searchParams, router, defaultCategoryId, pathname, fetchProducts]);

  return {
    products,
    loading,
    error,
    totalPages,
    categoryName,
    currentPage,
    categoryId,
    refetch,
  };
};
