import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';
import CommonPagination from '@/components/CommonPagination';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorState, EmptyState } from '@/components/ui';

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
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);

  const router = useRouter();

  const { user } = useAuth();

  const handleProductClick = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();

    if (!user) {
      setShowLoginDialog(true);
    } else {
      router.push(`/product/${productId}`);
    }
  };

  console.log(products);

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

      <div className='mb-8 rounded-lg bg-gray-50 p-6 text-center'>
        <p className='mb-1 text-lg text-gray-700'>
          마음에 드는 디자인에 <span className='text-red-500'>❤️</span>를 눌러주세요.
        </p>
        <p className='text-md text-gray-700'>디자인이 현실화되는 시작입니다.</p>
      </div>

      {loading ? (
        <>
          <ProductListSkeleton />
          <CommonPagination
            currentPageNumber={currentPage}
            totalPageCount={totalPages}
            pathname={pathname}
            queryParams={{ ca_id: categoryId }}
          />
        </>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} showRetry={true} />
      ) : products.length === 0 ? (
        <EmptyState title='등록된 상품이 없습니다' />
      ) : (
        <>
          <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
            {products.map((product) => (
              <div
                key={product.it_id}
                onClick={(e) => handleProductClick(e, product.it_id)}
                className='block cursor-pointer space-y-2 overflow-hidden rounded-lg border border-gray-200 bg-white transition-transform duration-400 ease-out hover:scale-101'
              >
                <div className='relative aspect-square'>
                  {product.it_img1 ? (
                    <Image
                      src={product.it_img1}
                      alt={product.it_name}
                      fill
                      className='object-cover p-4'
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
              </div>
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

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        title='상품 상세보기'
        description='상품 상세 정보를 보시려면 로그인이 필요합니다.'
      />
    </div>
  );
}
