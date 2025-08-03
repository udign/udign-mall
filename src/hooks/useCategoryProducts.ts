import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, ProductListResponse } from '@/types/product';
import { Category } from '@/types/category';
import { PAGINATION_CONFIG } from '@/lib/constants';

interface UseCategoryProductsProps {
  categoryId: string;
  pathname: string;
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
  categoryId,
  pathname,
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
  const categoryParam = searchParams.get('ca_id');
  const subCategoryId = searchParams.get('ca_id2');
  const thirdCategoryId = searchParams.get('ca_id3');
  const fourthCategoryId = searchParams.get('ca_id4');

  // 카테고리 breadcrumb 생성 함수
  const generateCategoryBreadcrumb = useCallback(async (): Promise<string> => {
    const categoryIds = [
      categoryParam || categoryId,
      subCategoryId,
      thirdCategoryId,
      fourthCategoryId,
    ].filter(Boolean);

    if (categoryIds.length === 0) {
      return '모든 디자인';
    }

    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      if (!data.success || !data.data?.categories) {
        return '알 수 없는 카테고리';
      }

      const categories = data.data.categories;
      const categoryNames: string[] = [];

      for (const catId of categoryIds) {
        const category = categories.find((cat: Category) => cat.id === catId);
        if (category) {
          categoryNames.push(category.name);
        }
      }

      return categoryNames.length > 0 ? categoryNames.join(' > ') : '알 수 없는 카테고리';
    } catch (error) {
      console.error('카테고리 breadcrumb 생성 실패:', error);
      return '알 수 없는 카테고리';
    }
  }, [categoryParam, categoryId, subCategoryId, thirdCategoryId, fourthCategoryId]);

  const fetchProducts = useCallback(
    async (pageNum: number = currentPage) => {
      try {
        setLoading(true);
        setError(null);

        // 카테고리별 디자인 필터링
        // URL에서 온 ca_id 파라미터 우선 사용, 없으면 props의 categoryId 사용
        const effectiveCategoryId = categoryParam || categoryId;
        const categoryQueryParam = effectiveCategoryId ? `&ca_id=${effectiveCategoryId}` : '';
        const subCategoryParam = subCategoryId ? `&ca_id2=${subCategoryId}` : '';
        // DB에는 ca_id3까지만 있으므로 3차 카테고리까지만 필터링 (4차 카테고리는 3차로 대체)
        const thirdCategoryParam = thirdCategoryId ? `&ca_id3=${thirdCategoryId}` : '';

        const response = await fetch(
          `/api/products?page=${pageNum}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}${categoryQueryParam}${subCategoryParam}${thirdCategoryParam}`,
        );

        if (!response.ok) {
          throw new Error('상품을 불러오는데 실패했습니다.');
        }

        const data: ProductListResponse = await response.json();

        if (data.success) {
          setProducts(data.items);
          setTotalPages(data.pagination.totalPages);
          setCategoryCount(data.pagination.totalCount);

          // 카테고리 breadcrumb 설정
          generateCategoryBreadcrumb()
            .then((breadcrumb) => {
              setCategoryName(breadcrumb);
            })
            .catch((error) => {
              console.error('카테고리 breadcrumb 설정 실패:', error);
              setCategoryName('알 수 없는 카테고리');
            });
        } else {
          throw new Error('상품 데이터를 처리하는데 실패했습니다.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      categoryId,
      categoryParam,
      subCategoryId,
      thirdCategoryId,
      fourthCategoryId,
      generateCategoryBreadcrumb,
    ],
  );

  const refetch = useCallback(() => fetchProducts(currentPage), [fetchProducts, currentPage]);

  useEffect(() => {
    // 초기 로드 시 URL 파라미터가 없으면 기본값으로 설정
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', '1');
      // 기존 파라미터가 있으면 유지
      if (categoryParam) {
        params.set('ca_id', categoryParam);
      }
      if (subCategoryId) {
        params.set('ca_id2', subCategoryId);
      }
      if (thirdCategoryId) {
        params.set('ca_id3', thirdCategoryId);
      }
      if (fourthCategoryId) {
        params.set('ca_id4', fourthCategoryId);
      }
      router.replace(`${pathname}?${params.toString()}`);
    } else {
      fetchProducts(currentPage);
    }
  }, [
    currentPage,
    searchParams,
    router,
    categoryId,
    categoryParam,
    subCategoryId,
    thirdCategoryId,
    fourthCategoryId,
    pathname,
    fetchProducts,
  ]);

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
