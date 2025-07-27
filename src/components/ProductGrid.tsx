'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { Product } from '@/types/product';
import { LikeResponse } from '@/types/product';
import MessageDialog from '@/components/ui/MessageDialog';
import { Button } from '@/components/ui/primitives/button';
import { Progress } from '@/components/ui/primitives/progress';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import { shouldBlurProduct, isCollectionStatus } from '@/lib/artwork-helpers';

interface ProductGridProps {
  products: ProductType[];
  className?: string;
}

interface SearchProduct {
  it_id: string;
  it_name: string;
  it_basic: string;
  it_cust_price: number;
  it_price: number;
  it_img1: string | null;
  it_img2: string | null;
  it_img3: string | null;
  it_img4: string | null;
  it_use_avg: number;
  it_use_cnt: number;
  it_hit: number;
  it_time: string;
  it_update_time: string;
  ca_id: string;
  creator_id: string;
  creator_name: string;
  description: string;
  likes_count: string;
  is_liked: boolean;
  current_likes: number;
  target_likes?: number;
  it_4?: number;
  _status_text?: string;
}

type ProductType = Product | SearchProduct;

export default function ProductGrid({ products, className = '' }: ProductGridProps) {
  const [productLikes, setProductLikes] = useState<
    Record<string, { isLiked: boolean; count: number }>
  >({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [likingInProgress, setLikingInProgress] = useState<Set<string>>(new Set());
  const [showOrderDialog, setShowOrderDialog] = useState<boolean>(false);
  const [orderInfo, setOrderInfo] = useState<{ orderNumber: number; productName: string } | null>(
    null,
  );

  const router = useRouter();
  const { user } = useAuth();

  const handleProductClick = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();

    router.push(`${ROUTES.PRODUCT}/${productId}`);
  };

  const handleLikeToggle = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      return;
    }

    // 이미 진행 중인 요청이 있으면 무시 (연속 클릭 방지)
    if (likingInProgress.has(productId)) {
      return;
    }

    try {
      // 1. 진행 중 상태로 설정
      setLikingInProgress((prev) => new Set(prev).add(productId));

      // 2. API 호출
      const response = await fetch(`/api/products/${productId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: LikeResponse = await response.json();

        // 3. API 성공시 서버 데이터로 UI 업데이트
        setProductLikes((prev) => ({
          ...prev,
          [productId]: {
            isLiked: data.is_liked,
            count: data.current_likes,
          },
        }));

        // 4. 새로 좋아요를 추가한 경우 순번 모달 표시
        if (data.is_liked && data.order_number && data.product_name) {
          setOrderInfo({
            orderNumber: data.order_number,
            productName: data.product_name,
          });
          setShowOrderDialog(true);
        }
      } else {
        console.error('좋아요 처리 실패');
      }
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
    } finally {
      // 5. 진행 중 상태 해제
      setLikingInProgress((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const imageUrl = target.src;
    target.style.display = 'none';
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  }, []);

  const getLikeInfo = (product: ProductType) => {
    const productLike = productLikes[product.it_id];
    if (productLike) {
      return {
        isLiked: productLike.isLiked,
        count: productLike.count,
      };
    }

    // 초기값: 하나의 일관된 소스에서만 가져오기
    return {
      isLiked: product.is_liked || false,
      count: product.current_likes || 0,
    };
  };

  const getLikeTarget = (product: ProductType) => {
    return product.target_likes || 100;
  };

  return (
    <>
      <div
        className={`grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${className}`}
      >
        {products.map((product) => {
          const likeInfo = getLikeInfo(product);
          const likeTarget = getLikeTarget(product);
          const progressValue = Math.min((likeInfo.count / likeTarget) * 100, 100);
          const shouldBlur = shouldBlurProduct(
            {
              current_likes: likeInfo.count,
              it_4: 'it_4' in product ? (product.it_4 as number) : undefined,
              target_likes: likeTarget,
              _status_text:
                '_status_text' in product ? (product._status_text as string) : undefined,
            },
            likeInfo.isLiked,
          );

          return (
            <div
              key={product.it_id}
              onClick={shouldBlur ? undefined : (e) => handleProductClick(e, product.it_id)}
              className={`flex flex-col overflow-hidden border border-gray-200 bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] transition-shadow duration-300 ${
                shouldBlur ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className='relative aspect-square'>
                {product.it_img1 && !failedImages.has(product.it_img1) ? (
                  <Image
                    src={product.it_img1}
                    alt={product.it_name}
                    fill
                    className='object-cover p-4'
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw'
                    onError={handleImageError}
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center bg-gray-200'>
                    <span className='text-gray-400'>이미지 없음</span>
                  </div>
                )}

                {shouldBlur && (
                  <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/50'>
                    <span className='text-sm text-white'>full & under review</span>
                  </div>
                )}
              </div>

              <div className='mb-1 flex-1 px-4 py-2'>
                <div className='flex items-center justify-between'>
                  <h3 className='mr-2 flex overflow-hidden font-medium text-gray-900'>
                    {product.it_name}
                  </h3>
                  {shouldBlur ? (
                    <div className='relative h-7 w-7 flex-shrink-0'>
                      <Image
                        src='/images/logo.png'
                        alt='목표 달성'
                        fill
                        className='object-contain'
                      />
                    </div>
                  ) : (
                    <Button
                      onClick={(e) => handleLikeToggle(e, product.it_id)}
                      variant='ghost'
                      size='icon'
                      disabled={
                        likingInProgress.has(product.it_id) ||
                        !user ||
                        shouldBlur ||
                        ('_status_text' in product &&
                          !isCollectionStatus(product._status_text as string))
                      }
                      className='h-7 w-7 flex-shrink-0 p-1 text-lg transition-all duration-300 ease-out hover:scale-110 hover:bg-transparent disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {likingInProgress.has(product.it_id) ? (
                        <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600' />
                      ) : likeInfo.isLiked ? (
                        <AiFillHeart className='text-red-500' />
                      ) : (
                        <AiOutlineHeart />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <Progress value={progressValue} className='h-2 rounded-none' />
            </div>
          );
        })}
      </div>

      <MessageDialog
        open={showOrderDialog}
        onOpenChange={setShowOrderDialog}
        title='선택해주셔서 감사합니다.'
        description={
          orderInfo
            ? `고객님은 ${orderInfo.productName}의 No. ${orderInfo.orderNumber} 컬렉터입니다.\n\n단 몇 명만을 위한 이 창작의 여정에 함께 해주셔서 진심으로 감사드립니다.`
            : ''
        }
        confirmText='확인'
      />
    </>
  );
}
