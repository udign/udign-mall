import { Product } from '@/types/product';
import CommonPagination from '@/components/CommonPagination';
import ProductGrid from '@/components/ProductGrid';
import ErrorState from '@/components/states/ErrorState';
import EmptyState from '@/components/states/EmptyState';
import LoadingSpinner from '@/components/states/LoadingSpinner';

interface CategoryProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  categoryName: string;
  categoryCount: number;
  currentPage: number;
  pathname: string;
  fallbackCategoryName: string;
  onRetry: () => void;
}

export default function CategoryProductList({
  products,
  loading,
  error,
  totalPages,
  categoryName,
  categoryCount,
  currentPage,
  pathname,
  fallbackCategoryName,
  onRetry,
}: CategoryProductListProps) {
  return (
    <div>
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold text-white'>
          {categoryName || fallbackCategoryName}
        </h1>
        <p className='text-white'>
          {loading ? '디자인을 불러오는 중...' : `총 ${categoryCount}개의 디자인이 있습니다.`}
        </p>
      </div>

      <div className='mb-12 text-center'>
        <p className='mb-1 text-xl text-white'>
          마음에 드는 디자인에 <span className='text-red-500'>❤️</span>를 눌러주세요. 디자인이
          현실화되는 시작입니다.
        </p>
      </div>

      {loading ? (
        <div className='flex min-h-96 items-center justify-center'>
          <LoadingSpinner size='lg' message='디자인을 불러오는 중입니다...' />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} showRetry={true} />
      ) : products.length === 0 ? (
        <EmptyState title='등록된 디자인이 없습니다' />
      ) : (
        <>
          <ProductGrid products={products} className='mb-8' />

          <CommonPagination currentPage={currentPage} totalPages={totalPages} pathname={pathname} />
        </>
      )}
    </div>
  );
}
