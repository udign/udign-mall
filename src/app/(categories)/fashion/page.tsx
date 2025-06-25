'use client';

import { useCategoryProducts } from '@/hooks/useCategoryProducts';
import CategoryProductList from '@/components/CategoryProductList';
import { CATEGORY_IDS } from '@/config/pagination';
import { ROUTES } from '@/lib/routes';

export default function FashionPage() {
  const { products, loading, error, totalPages, categoryName, currentPage, categoryId, refetch } =
    useCategoryProducts({
      defaultCategoryId: CATEGORY_IDS.FASHION,
      pathname: ROUTES.FASHION,
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
      pathname={ROUTES.FASHION}
      fallbackCategoryName='fashion'
      onRetry={refetch}
    />
  );
}
