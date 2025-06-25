'use client';

import { useCategoryProducts } from '@/hooks/useCategoryProducts';
import CategoryProductList from '@/components/CategoryProductList';
import { CATEGORY_IDS } from '@/config/pagination';
import { ROUTES } from '@/lib/routes';

export default function OthersPage() {
  const { products, loading, error, totalPages, categoryName, currentPage, categoryId, refetch } =
    useCategoryProducts({
      defaultCategoryId: CATEGORY_IDS.OTHERS,
      pathname: ROUTES.OTHERS,
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
      pathname={ROUTES.OTHERS}
      fallbackCategoryName='others'
      onRetry={refetch}
    />
  );
}
