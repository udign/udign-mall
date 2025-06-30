'use client';

import { Suspense } from 'react';
import { useCategoryProducts } from '@/hooks/useCategoryProducts';
import CategoryProductList from '@/components/CategoryProductList';
import { CATEGORY_IDS } from '@/config/pagination';
import { ROUTES } from '@/lib/routes';

function OthersContent() {
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
    defaultCategoryId: '', // 모든 카테고리 포함
    pathname: ROUTES.OTHERS,
    targetCategoryId: CATEGORY_IDS.OTHERS, // 기타 카테고리 정보 표시
  });

  return (
    <CategoryProductList
      products={products}
      loading={loading}
      error={error}
      totalPages={totalPages}
      categoryName={categoryName}
      categoryCount={categoryCount}
      currentPage={currentPage}
      pathname={ROUTES.OTHERS}
      fallbackCategoryName='others'
      onRetry={refetch}
    />
  );
}

export default function OthersPage() {
  return (
    <Suspense>
      <OthersContent />
    </Suspense>
  );
}
