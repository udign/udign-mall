import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import CommonPagination from '@/components/CommonPagination';

interface CategoryProductListProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  categoryName: string;
  currentPage: number;
  categoryId: string;
  pathname: string;
  fallbackCategoryName: string;
  onRetry: () => void;
}

function ProductListSkeleton() {
  return (
    <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className='overflow-hidden rounded-lg border border-gray-200 bg-white'>
          <div className='aspect-square animate-pulse bg-gray-200' />
          <div className='p-4'>
            <div className='h-5 w-3/4 animate-pulse rounded bg-gray-200' />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className='flex min-h-100 items-center justify-center'>
      <div className='text-center'>
        <h2 className='mb-4 text-2xl font-bold text-red-600'>오류 발생</h2>
        <p className='mb-4 text-gray-600'>{error}</p>
        <button
          onClick={onRetry}
          className='bg-primary hover:bg-primary-hover rounded-lg px-6 py-2 text-white transition-colors'
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className='py-16 text-center'>
      <p className='text-lg text-gray-500'>등록된 상품이 없습니다.</p>
    </div>
  );
}

export default function CategoryProductList({
  products,
  loading,
  error,
  totalPages,
  categoryName,
  currentPage,
  categoryId,
  pathname,
  fallbackCategoryName,
  onRetry,
}: CategoryProductListProps) {
  return (
    <div>
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>
          {categoryName || fallbackCategoryName}
        </h1>
        <p className='text-gray-600'>
          {loading ? '작품을 불러오는 중...' : `총 ${products.length}개의 작품이 있습니다.`}
        </p>
      </div>

      {loading ? (
        <ProductListSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
            {products.map((product) => (
              <Link
                key={product.it_id}
                href={`/product/${product.it_id}`}
                className='block space-y-2 overflow-hidden rounded-lg border border-gray-200 bg-white'
              >
                <div className='relative aspect-square'>
                  {product.it_img1 ? (
                    <Image
                      src={product.it_img1}
                      alt={product.it_name}
                      fill
                      className='object-cover'
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML =
                            '<div class="flex h-full w-full items-center justify-center bg-gray-200"><span class="text-gray-400">이미지 없음</span></div>';
                        }
                      }}
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                      <span className='text-gray-400'>이미지 없음</span>
                    </div>
                  )}
                </div>

                <div className='p-4'>
                  <h3 className='overflow-hidden font-medium text-gray-900'>{product.it_name}</h3>
                </div>
              </Link>
            ))}
          </div>

          <CommonPagination
            currentPageNumber={currentPage}
            totalPageCount={totalPages}
            pathname={pathname}
            queryParams={{ ca_id: categoryId }}
          />
        </>
      )}
    </div>
  );
}
