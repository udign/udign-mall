import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FcLike, FcLikePlaceholder } from 'react-icons/fc';
import { Product } from '@/types/product';
import CommonPagination from '@/components/CommonPagination';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import { Button } from '@/components/ui/primitives/button';
import { useAuth } from '@/contexts/AuthContext';
import ErrorState from '@/components/states/ErrorState';
import EmptyState from '@/components/states/EmptyState';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { ROUTES } from '@/lib/routes';

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
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [productLikes, setProductLikes] = useState<
    Record<string, { isLiked: boolean; count: number }>
  >({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const router = useRouter();

  const { user } = useAuth();

  const handleProductClick = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();

    if (!user) {
      setShowLoginDialog(true);
    } else {
      router.push(`${ROUTES.PRODUCT}/${productId}`);
    }
  };

  const handleLikeToggle = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProductLikes((prev) => ({
          ...prev,
          [productId]: {
            isLiked: data.is_liked,
            count: data.current_likes,
          },
        }));
      }
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
    }
  };

  const handleImageError = (imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  };

  const getLikeInfo = (product: Product) => {
    const productLike = productLikes[product.it_id];
    if (productLike) {
      return {
        isLiked: productLike.isLiked,
        count: productLike.count,
      };
    }

    // 초기값: 서버에서 받은 데이터 또는 기본값
    return {
      isLiked: product.is_liked || false,
      count: product.current_likes || parseInt(product.likes_count) || 0,
    };
  };

  return (
    <div>
      <div className='mb-8'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>
          {categoryName || fallbackCategoryName}
        </h1>
        <p className='text-gray-600'>
          {loading ? '작품을 불러오는 중...' : `총 ${categoryCount}개의 작품이 있습니다.`}
        </p>
      </div>

      <div className='mb-8 rounded-lg bg-gray-50 p-6 text-center'>
        <p className='mb-1 text-lg text-gray-700'>
          마음에 드는 디자인에 <span className='text-red-500'>❤️</span>를 눌러주세요.
        </p>
        <p className='text-md text-gray-700'>디자인이 현실화되는 시작입니다.</p>
      </div>

      {loading ? (
        <div className='flex min-h-96 items-center justify-center'>
          <LoadingSpinner size='lg' message='작품을 불러오는 중입니다...' />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} showRetry={true} />
      ) : products.length === 0 ? (
        <EmptyState title='등록된 상품이 없습니다' />
      ) : (
        <>
          <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
            {products.map((product) => {
              const likeInfo = getLikeInfo(product);

              return (
                <div
                  key={product.it_id}
                  onClick={(e) => handleProductClick(e, product.it_id)}
                  className='block cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-transform duration-400 ease-out hover:scale-101'
                >
                  <div className='relative aspect-square'>
                    {/* 좋아요 버튼 */}
                    <Button
                      onClick={(e) => handleLikeToggle(e, product.it_id)}
                      variant='ghost'
                      size='icon'
                      className='absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/80 p-1 text-lg backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 hover:bg-white/90'
                    >
                      {likeInfo.isLiked ? <FcLike /> : <FcLikePlaceholder />}
                    </Button>

                    {product.it_img1 && !failedImages.has(product.it_img1) ? (
                      <Image
                        src={product.it_img1}
                        alt={product.it_name}
                        fill
                        className='object-cover p-4'
                        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (product.it_img1) handleImageError(product.it_img1);
                        }}
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                        <span className='text-gray-400'>이미지 없음</span>
                      </div>
                    )}
                  </div>

                  <div className='p-4'>
                    <h3 className='flex overflow-hidden font-medium text-gray-900'>
                      {product.it_name}
                    </h3>
                    <div className='flex items-center gap-1'>
                      <FcLike />
                      <p className='mt-1 text-sm text-gray-500'>{likeInfo.count}명이 좋아합니다</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <CommonPagination
            currentPageNumber={currentPage}
            totalPageCount={totalPages}
            pathname={pathname}
            queryParams={{}}
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
