import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, ProductListResponse } from '@/types/product';
import { PAGINATION_CONFIG } from '@/lib/constants';

interface UseCategoryProductsProps {
  categoryId: string; // 필터링 및 표시할 카테고리 ID (빈 문자열이면 모든 카테고리)
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
  const subCategoryId = searchParams.get('subcategory');
  const thirdCategoryId = searchParams.get('thirdcategory');

  const fetchProducts = useCallback(
    async (pageNum: number = currentPage) => {
      try {
        setLoading(true);
        setError(null);

        // 카테고리별 작품 필터링
        const categoryParam = categoryId ? `&category=${categoryId}` : '';
        const subCategoryParam = subCategoryId ? `&subcategory=${subCategoryId}` : '';
        const thirdCategoryParam = thirdCategoryId ? `&thirdcategory=${thirdCategoryId}` : '';
        const response = await fetch(
          `/api/products?page=${pageNum}&limit=${PAGINATION_CONFIG.ITEMS_PER_PAGE}${categoryParam}${subCategoryParam}${thirdCategoryParam}`,
        );

        if (!response.ok) {
          throw new Error('상품을 불러오는데 실패했습니다.');
        }

        const data: ProductListResponse = await response.json();

        if (data.success) {
          setProducts(data.items);
          setTotalPages(data.pagination.totalPages);

          // 카테고리명 설정
          let displayName = '모든 작품';
          if (categoryId && data.categoryCounts[categoryId]) {
            displayName = data.categoryCounts[categoryId].name;

            // 서브카테고리가 있는 경우 카테고리명에 추가
            if (subCategoryId) {
              const subCategoryNames: Record<string, string> = {
                '1010': 'men',
                '1020': 'women',
                '1030': 'common',
                '1040': 'kids',
                '2010': 'men',
                '2020': 'women',
                '3010': 'men',
                '3020': 'women',
              };
              const subCategoryName = subCategoryNames[subCategoryId];
              if (subCategoryName) {
                displayName = `${displayName} > ${subCategoryName}`;

                // 3차 카테고리가 있는 경우 추가
                if (thirdCategoryId) {
                  const thirdCategoryNames: Record<string, string> = {
                    // Fashion
                    '101010': 'top',
                    '101020': 'bottom',
                    '101030': 'outer',
                    '101040': 'product',
                    '101050': 'space',
                    '102010': 'top',
                    '102020': 'bottom',
                    '102030': 'outer',
                    '102040': 'product',
                    '102050': 'space',
                    '103010': 'top',
                    '103020': 'bottom',
                    // Shoes
                    '201010': '운동화',
                    '201020': '구두/스니커즈',
                    '201030': '워커',
                    '201040': '샌들/슬리퍼',
                    '201050': '레인부츠',
                    '202010': '운동화',
                    '202020': '구두/스니커즈',
                    '202030': '샌들/슬리퍼',
                    '202040': '부츠',
                    '202050': '레인부츠',
                    // Others
                    '301010': '상의',
                    '301020': '하의',
                    '301030': 'graphic',
                    '301040': 'product',
                    '301050': 'space',
                    '302010': '상의',
                    '302020': '하의',
                    '302030': 'graphic',
                    '302040': 'product',
                    '302050': 'space',
                  };
                  const thirdCategoryName = thirdCategoryNames[thirdCategoryId];
                  if (thirdCategoryName) {
                    displayName = `${displayName} > ${thirdCategoryName}`;
                  }
                }
              }
            }
          }

          setCategoryName(displayName);
          setCategoryCount(data.pagination.totalCount);
        } else {
          throw new Error('상품 데이터를 처리하는데 실패했습니다.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [currentPage, categoryId, subCategoryId, thirdCategoryId],
  );

  const refetch = useCallback(() => fetchProducts(currentPage), [fetchProducts, currentPage]);

  useEffect(() => {
    // 초기 로드 시 URL 파라미터가 없으면 기본값으로 설정
    if (!searchParams.get('page')) {
      const params = new URLSearchParams();
      params.set('page', '1');
      // 기존 파라미터가 있으면 유지
      if (subCategoryId) {
        params.set('subcategory', subCategoryId);
      }
      if (thirdCategoryId) {
        params.set('thirdcategory', thirdCategoryId);
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
    subCategoryId,
    thirdCategoryId,
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
