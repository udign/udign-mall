'use client';

import { Suspense } from 'react';
import { useCategoryProducts } from '@/hooks/useCategoryProducts';
import CategoryProductList from '@/components/CategoryProductList';
import { CATEGORY_IDS } from '@/config/pagination';
import { ROUTES } from '@/lib/routes';

function ShoesContent() {
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
    categoryId: CATEGORY_IDS.SHOES,
    pathname: ROUTES.SHOES,
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
      pathname={ROUTES.SHOES}
      fallbackCategoryName='shoes'
      onRetry={refetch}
    />
  );
}

export default function ShoesPage() {
  return (
    <Suspense>
      <ShoesContent />
    </Suspense>
  );
}
