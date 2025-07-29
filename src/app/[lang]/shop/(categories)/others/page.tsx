'use client';

import { Suspense } from 'react';
import { useCategoryProducts } from '@/hooks/useCategoryProducts';
import CategoryProductList from '@/components/CategoryProductList';
import { CATEGORY_IDS } from '@/lib/constants';
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
    categoryId: CATEGORY_IDS.OTHERS,
    pathname: ROUTES.OTHERS,
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
