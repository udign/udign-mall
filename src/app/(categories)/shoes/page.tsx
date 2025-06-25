'use client';

import { Suspense } from 'react';
import { useCategoryProducts } from '@/hooks/useCategoryProducts';
import CategoryProductList from '@/components/CategoryProductList';
import { CATEGORY_IDS } from '@/config/pagination';
import { ROUTES } from '@/lib/routes';

function ShoesContent() {
  const { products, loading, error, totalPages, categoryName, currentPage, categoryId, refetch } =
    useCategoryProducts({
      defaultCategoryId: CATEGORY_IDS.SHOES,
      pathname: ROUTES.SHOES,
    });

  return (
    <CategoryProductList
      products={products}
      loading={loading}
      error={error}
      totalPages={totalPages}
      categoryName={categoryName}
      currentPage={currentPage}
      categoryId={categoryId}
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
