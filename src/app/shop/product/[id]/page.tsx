'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import { ROUTES } from '@/lib/routes';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { FcLike, FcLikePlaceholder } from 'react-icons/fc';
import { Button } from '@/components/ui/primitives/button';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import NotFoundState from '@/components/states/NotFoundState';

interface ProductDetail {
  it_id: string;
  it_name: string;
  it_basic: string;
  it_cust_price: number;
  it_price: number;
  it_img1: string | null;
  it_img2: string | null;
  it_img3: string | null;
  it_info: string;
  ca_name: string;
  creator_name: string;
  description: string;
  current_likes: number;
  is_liked: boolean;
  goal_attainment: boolean;
  is_under_review: boolean;
  is_review_completed: boolean;
  it_4: number; // 목표 인원
  it_8: number; // 심의 기간
  it_9: 'Y' | 'N'; // 수동 심의 여부
  it_10: 'Y' | 'N'; // 심의 완료 여부
  has_access: boolean; // 접근 권한 (좋아요한 회원인지)
  can_purchase: boolean; // 구매 가능 여부
  status_message: string; // 상태 메시지
}

interface ProductDetailResponse {
  success: boolean;
  product: ProductDetail;
  prev_product?: {
    it_id: string;
    it_name: string;
  };
  next_product?: {
    it_id: string;
    it_name: string;
  };
  error?: string;
}

// 썸네일 컴포넌트
interface ThumbnailProps {
  image: string;
  index: number;
  productName: string;
  isSelected: boolean;
  onClick: (image: string) => void;
  isImageFailed: boolean;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

function Thumbnail({
  image,
  index,
  productName,
  isSelected,
  onClick,
  isImageFailed,
  onImageError,
}: ThumbnailProps) {
  return (
    <div
      className={`h-16 w-16 cursor-pointer overflow-hidden rounded-lg transition-colors ${
        isSelected
          ? 'border-primary border-2'
          : index === 0
            ? 'border-2 border-gray-300 hover:border-gray-400'
            : 'border border-gray-200 hover:border-gray-400'
      }`}
      onClick={() => onClick(image)}
    >
      {!isImageFailed ? (
        <Image
          src={image}
          alt={`${productName} 썸네일 ${index + 1}`}
          width={64}
          height={64}
          className='h-full w-full object-cover'
          onError={onImageError}
        />
      ) : (
        <div className='flex h-full w-full items-center justify-center bg-gray-200'>
          <span className='text-xs text-gray-400'>이미지 없음</span>
        </div>
      )}
    </div>
  );
}

// 메인 이미지 컴포넌트
interface MainImageProps {
  selectedImage: string | null;
  productName: string;
  className?: string;
  sizes?: string;
  isImageFailed: boolean;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

function MainImage({
  selectedImage,
  productName,
  className = '',
  sizes = '(max-width: 768px) 100vw, 50vw',
  isImageFailed,
  onImageError,
}: MainImageProps) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-lg bg-gray-200 ${className}`}>
      {selectedImage && !isImageFailed ? (
        <Image
          src={selectedImage}
          alt={productName}
          fill
          className='object-cover'
          sizes={sizes}
          onError={onImageError}
        />
      ) : (
        <div className='flex h-full w-full items-center justify-center bg-gray-200'>
          <span className='text-gray-400'>이미지 없음</span>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [prevProduct, setPrevProduct] = useState<{ it_id: string; it_name: string } | null>(null);
  const [nextProduct, setNextProduct] = useState<{ it_id: string; it_name: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState<number>(1);
  const [likingInProgress, setLikingInProgress] = useState<boolean>(false);

  const params = useParams();
  const router = useRouter();

  const { user, isLoading: authLoading } = useAuth();

  const productId = params.id as string;

  useEffect(() => {
    // 인증 로딩이 완료된 후에만 체크
    if (authLoading) return;

    if (!user) {
      setShowLoginDialog(true);
      return;
    }

    const fetchProductDetail = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/products/${productId}`);
        const data: ProductDetailResponse = await response.json();

        if (data.success) {
          setProduct(data.product);
          setPrevProduct(data.prev_product || null);
          setNextProduct(data.next_product || null);
          // 첫 번째 이미지를 기본 선택 이미지로 설정
          setSelectedImage(data.product.it_img1);
        } else {
          setError(data.error || '상품을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('서버 오류가 발생했습니다.');
        console.error('상품 상세 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId, user, authLoading]);

  const handleLikeToggle = async () => {
    if (!user || !product) return;

    // 이미 진행 중인 요청이 있으면 무시 (연속 클릭 방지)
    if (likingInProgress) {
      return;
    }

    // 현재 상태 저장 (실패시 복구용)
    const wasLiked = product.is_liked;
    const currentCount = product.current_likes;

    try {
      // 1. 진행 중 상태로 설정
      setLikingInProgress(true);

      // 2. 즉시 UI 업데이트 (Optimistic Update)
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              is_liked: !wasLiked,
              current_likes: wasLiked ? currentCount - 1 : currentCount + 1,
            }
          : null,
      );

      // 3. 백그라운드에서 API 호출
      const response = await fetch(`/api/products/${productId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 4. API 성공시 서버 데이터로 정확한 값 업데이트
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                is_liked: data.is_liked,
                current_likes: data.current_likes,
              }
            : null,
        );
      } else {
        // 5. API 실패시 원래 상태로 복구
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                is_liked: wasLiked,
                current_likes: currentCount,
              }
            : null,
        );

        console.error('좋아요 처리 실패');
      }
    } catch (err) {
      // 6. 네트워크 오류시 원래 상태로 복구
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              is_liked: wasLiked,
              current_likes: currentCount,
            }
          : null,
      );

      console.error('좋아요 처리 오류:', err);
    } finally {
      // 7. 진행 중 상태 해제
      setLikingInProgress(false);
    }
  };

  const handleLoginDialogClose = () => {
    setShowLoginDialog(false);
    router.push(ROUTES.HOME);
  };

  const handleThumbnailClick = (imageUrl: string) => setSelectedImage(imageUrl);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const imageUrl = target.src;
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  }, []);

  const handleQuantityIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const getTotalPrice = () => {
    return product ? product.it_price * quantity : 0;
  };

  // 이미지 배열 생성 로직
  const getProductImages = () => {
    if (!product) return [];
    return [product.it_img1, product.it_img2, product.it_img3].filter(Boolean) as string[];
  };

  const productImages = getProductImages();

  return authLoading || loading ? (
    <LoadingState
      message={authLoading ? '인증 정보를 확인하는 중...' : '작품 정보를 불러오는 중...'}
    />
  ) : error ? (
    <ErrorState message={error} showGoHome={true} />
  ) : !product ? (
    <NotFoundState title='상품을 찾을 수 없습니다' />
  ) : (
    <div className='bg-white'>
      <div className='mx-auto my-8 max-w-6xl px-6 py-8 sm:px-10'>
        <div className='flex flex-col gap-8 lg:flex-row'>
          <div className='lg:w-1/2'>
            {/* 데스크톱: 썸네일 왼쪽, 메인 이미지 오른쪽 */}
            <div className='hidden gap-4 sm:flex'>
              <div className='flex flex-col gap-2'>
                {productImages.map((image, index) => (
                  <Thumbnail
                    key={image}
                    image={image}
                    index={index}
                    productName={product.it_name}
                    isSelected={selectedImage === image}
                    onClick={handleThumbnailClick}
                    isImageFailed={failedImages.has(image)}
                    onImageError={handleImageError}
                  />
                ))}
              </div>

              <MainImage
                selectedImage={selectedImage}
                productName={product.it_name}
                className='flex-1'
                sizes='(max-width: 768px) 100vw, 50vw'
                isImageFailed={selectedImage ? failedImages.has(selectedImage) : false}
                onImageError={handleImageError}
              />
            </div>

            {/* 모바일: 메인 이미지 위, 썸네일 아래 */}
            <div className='sm:hidden'>
              <MainImage
                selectedImage={selectedImage}
                productName={product.it_name}
                className='mb-4 w-full'
                sizes='100vw'
                isImageFailed={selectedImage ? failedImages.has(selectedImage) : false}
                onImageError={handleImageError}
              />

              <div className='flex justify-start gap-2'>
                {productImages.map((image, index) => (
                  <Thumbnail
                    key={image}
                    image={image}
                    index={index}
                    productName={product.it_name}
                    isSelected={selectedImage === image}
                    onClick={handleThumbnailClick}
                    isImageFailed={failedImages.has(image)}
                    onImageError={handleImageError}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className='relative lg:w-1/2'>
            <Button
              onClick={handleLikeToggle}
              variant='ghost'
              size='icon'
              className='absolute top-0 right-0 z-10 h-8 w-8 rounded-full bg-white/80 p-1 text-lg backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 hover:bg-white/90'
            >
              {product.is_liked ? <FcLike /> : <FcLikePlaceholder />}
            </Button>

            <h1 className='mb-6 pr-12 text-2xl font-bold text-gray-900'>{product.it_name}</h1>

            {/* 구매 가능한 상품 - 구매 전용 정보 표시 */}
            {product.can_purchase ? (
              <div className='space-y-6'>
                {/* 가격 정보 */}
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                  <h3 className='mb-3 text-lg font-semibold text-gray-900'>가격 정보</h3>
                  <div className='space-y-2'>
                    {product.it_cust_price > 0 && (
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>시중가격</span>
                        <span className='text-sm text-gray-500 line-through'>
                          {product.it_cust_price.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    <div className='flex items-center justify-between'>
                      <span className='text-base font-medium text-gray-900'>판매가격</span>
                      <span className='text-primary text-xl font-bold'>
                        {product.it_price.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>

                {/* 수량 선택 */}
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                  <h3 className='mb-3 text-lg font-semibold text-gray-900'>수량 선택</h3>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>구매 수량</span>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='icon'
                        className='h-8 w-8'
                        onClick={handleQuantityDecrease}
                      >
                        -
                      </Button>
                      <span className='w-12 text-center font-medium'>{quantity}</span>
                      <Button
                        variant='outline'
                        size='icon'
                        className='h-8 w-8'
                        onClick={handleQuantityIncrease}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 총 금액 */}
                <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-lg font-semibold text-gray-900'>총 금액</span>
                    <span className='text-primary text-xl font-bold'>
                      {getTotalPrice().toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 구매 버튼 */}
                <div className='space-y-3'>
                  <Button
                    className='bg-primary hover:bg-primary/90 w-full text-white'
                    size='lg'
                    onClick={() => {
                      alert('장바구니 기능은 개발 중입니다.');
                    }}
                  >
                    장바구니 담기
                  </Button>
                  <Button
                    variant='outline'
                    className='border-primary text-primary hover:bg-primary w-full hover:text-white'
                    size='lg'
                    onClick={() => {
                      router.push(`/shop/checkout?itemId=${product.it_id}&quantity=${quantity}`);
                    }}
                  >
                    구매하기
                  </Button>
                </div>

                {/* 심의 완료 상태 메시지 */}
                <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                  <p className='font-medium text-green-800'>✅ 심의가 완료되었습니다</p>
                  <p className='mt-1 text-sm text-green-600'>구매 가능한 상품입니다.</p>
                </div>
              </div>
            ) : (
              /* 구매 불가능한 상품 - 작품 정보 및 진행 상황 표시 */
              <div className='space-y-6'>
                {/* 작품 설명 */}
                <div>
                  <h2 className='mb-4 text-lg font-semibold text-gray-900'>작품 설명</h2>
                  <div className='space-y-2 leading-relaxed text-gray-700'>
                    {product.description && <p>{product.description}</p>}
                    {product.creator_name && (
                      <p className='text-sm text-gray-600'>
                        디자이너: <span className='font-medium'>{product.creator_name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* 좋아요 진행 상황 */}
                <div className='rounded-lg bg-gray-50 p-4'>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>현재 좋아요</span>
                    <span className='text-lg font-bold text-gray-600'>
                      {product.current_likes}명
                    </span>
                  </div>
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='text-sm text-gray-600'>목표 인원</span>
                    <span className='text-primary text-lg font-bold'>{product.it_4}명</span>
                  </div>
                  <div className='h-2 w-full rounded-full bg-gray-200'>
                    <div
                      className='bg-primary h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${Math.min((product.current_likes / product.it_4) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className='mt-2 text-xs text-gray-500'>
                    {product.goal_attainment
                      ? '목표 달성!'
                      : `목표까지 ${product.it_4 - product.current_likes}명 남았습니다.`}
                  </p>
                </div>

                {/* 상태 메시지 */}
                <div>
                  {product.is_under_review ? (
                    <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                      <p className='font-medium text-yellow-800'>🔍 현재 심의 진행 중입니다</p>
                      <p className='mt-1 text-sm text-yellow-600'>
                        {product.it_9 === 'Y'
                          ? `수동 심의 (${product.it_8}일 후 자동 진행)`
                          : '자동 심의 (목표 달성시 즉시 진행)'}
                      </p>
                      <p className='mt-1 text-sm text-yellow-600'>심의 완료 후 구매 가능합니다.</p>
                    </div>
                  ) : (
                    <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                      <p className='font-medium text-blue-800'>📝 좋아요 모집 중입니다</p>
                      <p className='mt-1 text-sm text-blue-600'>
                        목표 인원 달성시 {product.it_9 === 'Y' ? '수동' : '자동'} 심의로 진행됩니다.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='mt-12'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              {prevProduct ? (
                <Button
                  variant='outline'
                  onClick={() => router.push(`${ROUTES.PRODUCT}/${prevProduct.it_id}`)}
                  className='group flex items-center gap-1 px-5 py-3'
                >
                  <ChevronLeftIcon className='h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600' />
                  <div className='text-left'>
                    <div className='max-w-32 truncate text-sm text-gray-900'>previous</div>
                  </div>
                </Button>
              ) : (
                <Button variant='outline' disabled className='flex items-center gap-1 px-5 py-3'>
                  <ChevronLeftIcon className='h-5 w-5 text-gray-300' />
                  <div className='text-left'>
                    <div className='text-sm text-gray-400'>이전 작품 없음</div>
                  </div>
                </Button>
              )}
            </div>
            <div className='flex items-center'>
              {nextProduct ? (
                <Button
                  variant='outline'
                  onClick={() => router.push(`${ROUTES.PRODUCT}/${nextProduct.it_id}`)}
                  className='group flex items-center gap-1 px-5 py-3'
                >
                  <div className='text-right'>
                    <div className='max-w-32 truncate text-sm text-gray-900'>next</div>
                  </div>
                  <ChevronRightIcon className='h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600' />
                </Button>
              ) : (
                <Button variant='outline' disabled className='flex items-center gap-1 px-5 py-3'>
                  <div className='text-right'>
                    <div className='text-sm text-gray-400'>다음 작품 없음</div>
                  </div>
                  <ChevronRightIcon className='h-5 w-5 text-gray-300' />
                </Button>
              )}
            </div>
          </div>
        </div>

        {product.it_info && (
          <div className='mt-12 border-t border-gray-200 pt-8'>
            <h2 className='mb-4 text-xl font-bold text-gray-900'>상품 상세 정보</h2>
            <div
              className='prose max-w-none text-gray-700'
              dangerouslySetInnerHTML={{ __html: product.it_info }}
            />
          </div>
        )}
      </div>

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={handleLoginDialogClose}
        title='로그인 필요'
        description='상품 상세 정보를 보시려면 로그인이 필요합니다.'
      />
    </div>
  );
}
