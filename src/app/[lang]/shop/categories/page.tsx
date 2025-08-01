'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCategoryProducts } from '@/hooks/useCategoryProducts';
import CategoryProductList from '@/components/CategoryProductList';
import { ROUTES } from '@/lib/routes';

function CategoriesContent() {
  const searchParams = useSearchParams();

  // 쿼리 파라미터에서 카테고리 정보 추출
  const categoryId = searchParams.get('category') || '';
  const subcategoryId = searchParams.get('subcategory') || '';
  const thirdcategoryId = searchParams.get('thirdcategory') || '';
  const fourthcategoryId = searchParams.get('fourthcategory') || '';

  // 가장 구체적인 카테고리 ID 사용
  const targetCategoryId = fourthcategoryId || thirdcategoryId || subcategoryId || categoryId;

  const {
    products,
    loading,
    error,
    totalPages,
    categoryName,
    categoryCount,
    currentPage,
    refetch,
  } = useCategoryProducts({
    categoryId: targetCategoryId,
    pathname: ROUTES.CATEGORIES,
  });

  // 카테고리명 fallback 로직
  const getFallbackCategoryName = () => {
    if (categoryId.startsWith('10')) return 'Fashion Design';
    if (categoryId.startsWith('20')) return 'Shoes';
    if (categoryId.startsWith('30')) return 'Others';
    return 'Categories';
  };

  return (
    <CategoryProductList
      products={products}
      loading={loading}
      error={error}
      totalPages={totalPages}
      categoryName={categoryName}
      categoryCount={categoryCount}
      currentPage={currentPage}
      pathname={ROUTES.CATEGORIES}
      fallbackCategoryName={getFallbackCategoryName()}
      onRetry={refetch}
    />
  );
}

export default function CategoriesPage() {
  return (
    <Suspense>
      <CategoriesContent />
    </Suspense>
  );
}
