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
    categoryId: CATEGORY_IDS.FASHION,
    pathname: ROUTES.FASHION,
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
