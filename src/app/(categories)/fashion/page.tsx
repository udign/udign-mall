'use client';

import { Suspense } from 'react';
import { useCategoryProducts } from '@/hooks/useCategoryProducts';
import CategoryProductList from '@/components/CategoryProductList';
import { CATEGORY_IDS } from '@/config/pagination';
import { ROUTES } from '@/lib/routes';

function FashionContent() {
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
    pathname: ROUTES.FASHION,
    targetCategoryId: CATEGORY_IDS.FASHION, // 패션 카테고리 정보 표시
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
      pathname={ROUTES.FASHION}
      fallbackCategoryName='fashion'
      onRetry={refetch}
    />
  );
}

export default function FashionPage() {
  return (
    <Suspense>
      <FashionContent />
    </Suspense>
  );
}
