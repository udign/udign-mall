'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useTodayViewedProducts } from '@/hooks/useTodayViewedProducts';
import { useIsMobile } from '@/hooks/use-mobile';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import { ROUTES } from '@/lib/routes';
import { shouldBlurProduct, getProductStatus } from '@/lib/artwork-helpers';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from 'lucide-react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { Progress } from '@/components/ui/primitives/progress';
import { Button } from '@/components/ui/primitives/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import NotFoundState from '@/components/states/NotFoundState';
import { LikeResponse } from '@/types/product';
import MessageDialog from '@/components/ui/MessageDialog';
import ImageMagnifierModal from '@/components/ImageMagnifierModal';
import PopularProducts from '@/components/PopularProducts';
import SizeGuideDialog from '@/components/SizeGuideDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/primitives/carousel';
import { Dictionary } from '@/lib/dictionaries';

interface ItemOption {
  io_id: string;
  io_price: number;
  io_stock_qty: number;
  io_use: number;
  option_display: string;
}

interface ProductDetail {
  it_id: string;
  it_name: string;
  it_price: number;
  it_cust_price: number;
  it_img1: string;
  it_img2: string;
  it_img3: string;
  it_basic: string;
  description: string;
  creator_name: string;
  creator_id: string;
  ca_id: string;
  current_likes: number;
  is_liked: boolean;
  it_4: number;
  it_8: number;
  it_9: string;
  can_purchase: boolean;
  is_under_review: boolean;
  is_review_completed: boolean;
  it_info?: string;
  options: ItemOption[];
}

interface ProductDetailResponse {
  success: boolean;
  product: ProductDetail;
  prev_product?: { it_id: string; it_name: string };
  next_product?: { it_id: string; it_name: string };
  error?: string;
}

// MainImage 컴포넌트
interface MainImageProps {
  selectedImage: string;
  productName: string;
  className?: string;
  sizes: string;
  isImageFailed: boolean;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

function MainImage({
  selectedImage,
  productName,
  className = '',
  sizes,
  isImageFailed,
  onImageError,
}: MainImageProps) {
  if (isImageFailed) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ aspectRatio: '1' }}
      >
        <span>이미지를 불러올 수 없습니다</span>
      </div>
    );
  }

  return (
    <Image
      src={selectedImage}
      alt={productName}
      width={600}
      height={600}
      className={className}
      style={{ aspectRatio: '1', objectFit: 'cover' }}
      sizes={sizes}
      onError={onImageError}
      priority
    />
  );
}

// Thumbnail 컴포넌트
interface ThumbnailProps {
  image: string;
  index: number;
  productName: string;
  isSelected: boolean;
  onClick: (imageUrl: string) => void;
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
  if (isImageFailed) {
    return (
      <div className='aspect-square h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 sm:h-20 sm:w-20'>
        <div className='flex h-full items-center justify-center text-xs text-gray-400'>
          <span>오류</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`aspect-square h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border sm:h-20 sm:w-20 ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
      onClick={() => onClick(image)}
    >
      <Image
        src={image}
        alt={`${productName} ${index + 1}`}
        width={80}
        height={80}
        className='h-full w-full object-cover'
        onError={onImageError}
      />
    </div>
  );
}

interface ProductDetailClientProps {
  dictionary: Dictionary;
}

export default function ProductDetailClient({ dictionary }: ProductDetailClientProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [prevProduct, setPrevProduct] = useState<{ it_id: string; it_name: string } | null>(null);
  const [nextProduct, setNextProduct] = useState<{ it_id: string; it_name: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState<number>(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [likingInProgress, setLikingInProgress] = useState<boolean>(false);
  const [showOrderDialog, setShowOrderDialog] = useState<boolean>(false);
  const [orderInfo, setOrderInfo] = useState<{ orderNumber: number; productName: string } | null>(
    null,
  );
  const [showMagnifierModal, setShowMagnifierModal] = useState<boolean>(false);
  const [selectedOptions, setSelectedOptions] = useState<{ [groupName: string]: ItemOption }>({});
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);

  const params = useParams();
  const router = useRouter();

  const { user, isLoading: authLoading } = useAuth();
  const { addViewedProduct } = useTodayViewedProducts();

  const productId = params.id as string;
  const isMobile = useIsMobile();

  useEffect(() => {
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

          // 오늘 본 상품 목록에 추가
          addViewedProduct({
            it_id: data.product.it_id,
            it_name: data.product.it_name,
            it_img1: data.product.it_img1,
            it_img2: data.product.it_img2,
            it_img3: data.product.it_img3,
            it_img4: (data.product as ProductDetail & { it_img4: string | null }).it_img4,
            it_price: data.product.it_price,
            creator_name: data.product.creator_name,
            it_basic: data.product.it_basic,
            it_cust_price: data.product.it_cust_price,
            it_use_avg: 0,
            it_use_cnt: 0,
            it_hit: 0,
            it_time: '',
            it_update_time: '',
            ca_id: '',
            creator_id: '',
            description: data.product.description,
            likes_count: data.product.current_likes.toString(),
            is_liked: data.product.is_liked,
            current_likes: data.product.current_likes,
          });
        } else {
          setError(data.error || dictionary.productDetail.notFound);
        }
      } catch (err) {
        setError('서버 오류가 발생했습니다.');
        console.error('상품 상세 조회 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId, user, addViewedProduct, dictionary]);

  // Carousel과 thumbnail 동기화
  useEffect(() => {
    if (!carouselApi || !product) return;

    const productWithImg4 = product as ProductDetail & { it_img4: string | null };
    const images = [
      productWithImg4.it_img1,
      productWithImg4.it_img2,
      productWithImg4.it_img3,
      productWithImg4.it_img4,
    ].filter(Boolean) as string[];

    const onSelect = () => {
      const index = carouselApi.selectedScrollSnap();
      const selectedImg = images[index];
      if (selectedImg) {
        setSelectedImage(selectedImg);
      }
    };

    carouselApi.on('select', onSelect);
    onSelect(); // 초기 설정

    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, product]);

  // isMobile 상태 변경 시 carousel 재초기화
  useEffect(() => {
    if (carouselApi) {
      carouselApi.reInit({
        watchDrag: isMobile,
      });
    }
  }, [isMobile, carouselApi]);

  const handleLikeToggle = async () => {
    if (!user || !product) return;

    // 이미 진행 중인 요청이 있으면 무시 (연속 클릭 방지)
    if (likingInProgress) {
      return;
    }

    try {
      // 1. 진행 중 상태로 설정
      setLikingInProgress(true);

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
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                is_liked: data.is_liked,
                current_likes: data.current_likes,
              }
            : null,
        );

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
      // 4. 진행 중 상태 해제
      setLikingInProgress(false);
    }
  };

  const handleLoginDialogClose = () => {
    setShowLoginDialog(false);
    router.push(ROUTES.HOME);
  };

  const handleThumbnailClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    if (product && carouselApi) {
      const productWithImg4 = product as ProductDetail & { it_img4: string | null };
      const images = [
        productWithImg4.it_img1,
        productWithImg4.it_img2,
        productWithImg4.it_img3,
        productWithImg4.it_img4,
      ].filter(Boolean) as string[];
      const imageIndex = images.indexOf(imageUrl);
      if (imageIndex !== -1) {
        carouselApi.scrollTo(imageIndex);
      }
    }
  };

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const imageUrl = target.src;
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  }, []);

  const handleMagnifierClick = () => {
    setShowMagnifierModal(true);
  };

  const handleMagnifierModalClose = () => {
    setShowMagnifierModal(false);
  };

  const handleQuantityIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  // 옵션을 그룹별로 분리하는 함수
  const getGroupedOptions = () => {
    if (!product?.options) return {};

    const grouped: { [groupName: string]: ItemOption[] } = {};

    product.options.forEach((option) => {
      // option_display에서 그룹명 추출 (예: "색상 > 빨강" -> "색상")
      const parts = option.option_display.split(' > ');
      const groupName = parts[0] || '기본 옵션';

      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(option);
    });

    return grouped;
  };

  const getTotalPrice = () => {
    if (!product) return 0;
    const basePrice = product.it_price;
    const optionPrice = Object.values(selectedOptions).reduce(
      (sum, option) => sum + option.io_price,
      0,
    );
    return (basePrice + optionPrice) * quantity;
  };

  const handleOptionChange = (groupName: string, optionId: string) => {
    const option = product?.options.find((opt) => opt.io_id === optionId);
    if (option) {
      setSelectedOptions((prev) => ({
        ...prev,
        [groupName]: option,
      }));
    }
  };

  // 모든 필수 옵션이 선택되었는지 확인하는 함수
  const isAllOptionsSelected = () => {
    const groupedOptions = getGroupedOptions();
    const groupNames = Object.keys(groupedOptions);

    if (groupNames.length === 0) return true; // 옵션이 없으면 선택 완료된 것으로 간주

    return groupNames.every((groupName) => selectedOptions[groupName]);
  };

  // 이미지 배열 생성 로직
  const getProductImages = () => {
    if (!product) return [];
    const productWithImg4 = product as ProductDetail & { it_img4: string | null };
    return [
      productWithImg4.it_img1,
      productWithImg4.it_img2,
      productWithImg4.it_img3,
      productWithImg4.it_img4,
    ].filter(Boolean) as string[];
  };

  const productImages = getProductImages();

  return loading ? (
    <LoadingState
      message={
        authLoading
          ? dictionary.productDetail.loading.authCheck
          : dictionary.productDetail.loading.productInfo
      }
    />
  ) : error ? (
    <ErrorState message={error} showGoHome={true} />
  ) : !product ? (
    <NotFoundState title={dictionary.productDetail.notFound} />
  ) : (
    <div className='bg-white'>
      <div className='mx-auto my-8 max-w-6xl px-6 py-8 sm:px-10'>
        {/* 블러 처리 대상 작품 - 좋아요를 누르지 않은 사용자에게만 달성 UI 표시 */}
        {shouldBlurProduct(
          {
            current_likes: product.current_likes,
            it_4: product.it_4,
            target_likes: product.it_4,
            _status_text: getProductStatus(product),
          },
          product.is_liked,
        ) ? (
          <div className='text-center'>
            <h1 className='mb-8 text-3xl font-bold text-gray-900'>{product.it_name}</h1>
            <div className='relative mx-auto max-w-md'>
              <div className='aspect-square overflow-hidden rounded-lg'>
                <MainImage
                  selectedImage={productImages[0]}
                  productName={product.it_name}
                  className='h-full w-full object-cover'
                  sizes='(max-width: 640px) 100vw, 400px'
                  isImageFailed={failedImages.has(productImages[0])}
                  onImageError={handleImageError}
                />
              </div>
              {/* 레이어 오버레이 */}
              <div className='absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/60'>
                <span className='text-xl text-white'>
                  {dictionary.productDetail.status.fullAndUnderReview}
                </span>
              </div>
            </div>

            {/* Previous/Next 버튼들 */}
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
                        <div className='max-w-32 truncate text-sm text-gray-900'>
                          {dictionary.productDetail.navigation.previous}
                        </div>
                      </div>
                    </Button>
                  ) : (
                    <Button
                      variant='outline'
                      disabled
                      className='flex items-center gap-1 px-5 py-3'
                    >
                      <ChevronLeftIcon className='h-5 w-5 text-gray-300' />
                      <div className='text-left'>
                        <div className='text-sm text-gray-400'>
                          {dictionary.productDetail.navigation.noPrevious}
                        </div>
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
                        <div className='max-w-32 truncate text-sm text-gray-900'>
                          {dictionary.productDetail.navigation.next}
                        </div>
                      </div>
                      <ChevronRightIcon className='h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600' />
                    </Button>
                  ) : (
                    <Button
                      variant='outline'
                      disabled
                      className='flex items-center gap-1 px-5 py-3'
                    >
                      <div className='text-right'>
                        <div className='text-sm text-gray-400'>
                          {dictionary.productDetail.navigation.noNext}
                        </div>
                      </div>
                      <ChevronRightIcon className='h-5 w-5 text-gray-300' />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className='flex flex-col gap-8 lg:flex-row'>
              <div className='lg:w-1/2'>
                <div className='flex flex-col gap-4 sm:flex-row'>
                  <div className='order-2 flex gap-2 sm:order-1 sm:flex-col'>
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
                  <div className='order-1 flex-1 sm:order-2'>
                    <div className='relative'>
                      <Carousel
                        setApi={setCarouselApi}
                        className='w-full'
                        opts={{
                          watchDrag: isMobile, // 모바일에서만 드래그 허용
                        }}
                      >
                        <CarouselContent>
                          {productImages.map((image) => (
                            <CarouselItem key={image}>
                              <MainImage
                                selectedImage={image}
                                productName={product.it_name}
                                className='w-full'
                                sizes='(max-width: 640px) 100vw, 50vw'
                                isImageFailed={failedImages.has(image)}
                                onImageError={handleImageError}
                              />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className='left-2 hidden sm:flex' />
                        <CarouselNext className='right-2 hidden sm:flex' />
                      </Carousel>

                      {selectedImage && !failedImages.has(selectedImage) && (
                        <Button
                          onClick={handleMagnifierClick}
                          variant='secondary'
                          size='sm'
                          className='absolute right-3 bottom-3 z-10 h-8 w-8 rounded-full bg-white/80 p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/90'
                        >
                          <SearchIcon className='h-4 w-4' />
                          <span className='sr-only'>
                            {dictionary.productDetail.magnifier.enlargeImage}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='relative lg:w-1/2'>
                <Button
                  onClick={handleLikeToggle}
                  variant='ghost'
                  size='icon'
                  disabled={
                    likingInProgress || product.is_under_review || product.can_purchase || !user
                  }
                  className='absolute top-0 right-0 z-10 h-8 w-8 rounded-full p-1 text-lg backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 hover:bg-transparent disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {likingInProgress ? (
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600' />
                  ) : product.is_liked ? (
                    <AiFillHeart className='text-red-500' />
                  ) : (
                    <AiOutlineHeart />
                  )}
                </Button>

                <h1 className='mb-6 pr-12 text-2xl font-bold text-gray-900'>{product.it_name}</h1>

                {/* 구매 가능한 상품 - 구매 전용 정보 표시 */}
                {product.can_purchase ? (
                  <div className='space-y-6'>
                    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                      <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                        {dictionary.productDetail.price.title}
                      </h3>
                      <div className='space-y-2'>
                        {product.it_cust_price > 0 && (
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>
                              {dictionary.productDetail.price.originalPrice}
                            </span>
                            <span className='text-sm text-gray-500 line-through'>
                              {product.it_cust_price.toLocaleString()}원
                            </span>
                          </div>
                        )}
                        <div className='flex items-center justify-between'>
                          <span className='text-base font-medium text-gray-900'>
                            {dictionary.productDetail.price.salePrice}
                          </span>
                          <span className='text-primary text-xl font-bold'>
                            {product.it_price.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 상품 옵션 선택 */}
                    {product.options && product.options.length > 0 && (
                      <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                        <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                          {dictionary.productDetail.options.title}
                        </h3>
                        <div className='space-y-4'>
                          {Object.entries(getGroupedOptions()).map(([groupName, options]) => (
                            <div key={groupName} className='flex flex-col gap-2'>
                              <label className='text-sm font-medium text-gray-700'>
                                {groupName}
                              </label>
                              <Select
                                value={selectedOptions[groupName]?.io_id || ''}
                                onValueChange={(optionId) =>
                                  handleOptionChange(groupName, optionId)
                                }
                              >
                                <SelectTrigger className='w-full'>
                                  <SelectValue
                                    placeholder={dictionary.productDetail.options.selectPlaceholder.replace(
                                      '{{option}}',
                                      groupName,
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {options.map((option) => {
                                    // option_display에서 옵션값만 추출 (예: "색상 > 빨강" -> "빨강")
                                    const optionValue =
                                      option.option_display.split(' > ')[1] ||
                                      option.option_display;
                                    return (
                                      <SelectItem key={option.io_id} value={option.io_id}>
                                        <div className='flex w-full items-center justify-between'>
                                          <span>{optionValue}</span>
                                          <div className='ml-4 text-right'>
                                            {option.io_price > 0 && (
                                              <span className='text-sm text-blue-600'>
                                                +{option.io_price.toLocaleString()}원
                                              </span>
                                            )}
                                            <div className='text-xs text-gray-500'>
                                              {dictionary.productDetail.options.stock.replace(
                                                '{{count}}',
                                                option.io_stock_qty.toString(),
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}

                          {/* 선택된 옵션들 요약 */}
                          {Object.keys(selectedOptions).length > 0 && (
                            <div className='mt-3 rounded border bg-white p-3'>
                              <h4 className='mb-2 text-sm font-medium text-gray-900'>
                                {dictionary.productDetail.options.selectedOptions}
                              </h4>
                              <div className='space-y-1'>
                                {Object.entries(selectedOptions).map(([groupName, option]) => {
                                  const optionValue =
                                    option.option_display.split(' > ')[1] || option.option_display;
                                  return (
                                    <div
                                      key={groupName}
                                      className='flex items-center justify-between text-sm'
                                    >
                                      <span className='text-gray-600'>
                                        {groupName}:{' '}
                                        <span className='text-gray-900'>{optionValue}</span>
                                      </span>
                                      {option.io_price > 0 && (
                                        <span className='font-medium text-blue-600'>
                                          +{option.io_price.toLocaleString()}원
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                      <h3 className='mb-3 text-lg font-semibold text-gray-900'>
                        {dictionary.productDetail.quantity.title}
                      </h3>
                      <div className='flex items-center justify-between'>
                        <span className='text-sm text-gray-600'>
                          {dictionary.productDetail.quantity.label}
                        </span>
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

                    <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
                      <div className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-600'>
                            {dictionary.productDetail.price.basePrice}
                          </span>
                          <span className='text-sm text-gray-900'>
                            {product.it_price.toLocaleString()}원
                          </span>
                        </div>
                        {Object.values(selectedOptions).some((option) => option.io_price > 0) && (
                          <div className='flex items-center justify-between'>
                            <span className='text-sm text-gray-600'>
                              {dictionary.productDetail.price.optionPrice}
                            </span>
                            <span className='text-sm text-blue-600'>
                              +
                              {Object.values(selectedOptions)
                                .reduce((sum, option) => sum + option.io_price, 0)
                                .toLocaleString()}
                              원
                            </span>
                          </div>
                        )}
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-600'>
                            {dictionary.productDetail.price.quantity}
                          </span>
                          <span className='text-sm text-gray-900'>×{quantity}</span>
                        </div>
                        <hr className='my-2' />
                        <div className='flex items-center justify-between'>
                          <span className='text-lg font-semibold text-gray-900'>
                            {dictionary.productDetail.price.totalPrice}
                          </span>
                          <span className='text-primary text-xl font-bold'>
                            {getTotalPrice().toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className='flex justify-center'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setShowSizeGuide(true)}
                        className='text-gray-600 underline hover:text-gray-900'
                      >
                        {dictionary.productDetail.purchase.sizeGuide}
                      </Button>
                    </div>

                    <Button
                      className='bg-primary hover:bg-primary/90 w-full text-white'
                      size='lg'
                      disabled={product.options.length > 0 && !isAllOptionsSelected()}
                      onClick={() => {
                        const selectedOptionIds = Object.values(selectedOptions).map(
                          (option) => option.io_id,
                        );
                        const optionParams =
                          selectedOptionIds.length > 0
                            ? `&optionIds=${selectedOptionIds.join(',')}`
                            : '';
                        router.push(
                          `/shop/checkout?itemId=${product.it_id}&quantity=${quantity}${optionParams}`,
                        );
                      }}
                    >
                      {dictionary.productDetail.purchase.buyNow}
                    </Button>

                    {product.options.length > 0 && !isAllOptionsSelected() && (
                      <div className='rounded-lg border border-orange-200 bg-orange-50 p-3'>
                        <p className='text-sm text-orange-800'>
                          {dictionary.productDetail.options.allOptionsRequired}
                        </p>
                      </div>
                    )}

                    <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
                      <p className='font-medium text-green-800'>
                        {dictionary.productDetail.status.reviewCompleted}
                      </p>
                      <p className='mt-1 text-sm text-green-600'>
                        {dictionary.productDetail.status.purchaseAvailable}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* 구매 불가능한 상품 - 작품 정보 및 진행 상황 표시 */
                  <div className='space-y-6'>
                    <div className='flex gap-6'>
                      <div className='flex-1'>
                        <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                          {dictionary.productDetail.description.title}
                        </h2>
                        <div className='space-y-2 leading-relaxed text-gray-700'>
                          {product.description && <p>{product.description}</p>}
                          {product.creator_name && (
                            <p className='text-sm text-gray-600'>
                              {dictionary.productDetail.description.designer}{' '}
                              <span className='font-medium'>{product.creator_name}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className='flex w-8 flex-col items-center'>
                        <div className='relative h-40 w-3'>
                          <div className='absolute top-1/2 left-1/2 h-3 w-40 origin-center -translate-x-1/2 -translate-y-1/2 -rotate-90 transform'>
                            <Progress
                              value={Math.min((product.current_likes / product.it_4) * 100, 100)}
                              className='h-3 w-40 bg-gray-100'
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      {product.is_under_review ? (
                        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                          <p className='font-medium text-yellow-800'>
                            {dictionary.productDetail.status.reviewInProgress}
                          </p>
                          <p className='mt-1 text-sm text-yellow-600'>
                            {product.it_9 === 'Y'
                              ? dictionary.productDetail.status.manualReview +
                                ' (' +
                                dictionary.productDetail.status.daysRemaining.replace(
                                  '{{days}}',
                                  product.it_8.toString(),
                                ) +
                                ')'
                              : dictionary.productDetail.status.autoReview}
                          </p>
                          <p className='mt-1 text-sm text-yellow-600'>
                            {dictionary.productDetail.status.reviewInProgressDesc}
                          </p>
                        </div>
                      ) : (
                        <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                          <p className='font-medium text-blue-800'>
                            {dictionary.productDetail.status.collectingLikes}
                          </p>
                          <p className='mt-1 text-sm text-blue-600'>
                            {dictionary.productDetail.status.collectingLikesDesc.replace(
                              '{{type}}',
                              product.it_9 === 'Y' ? '수동' : '자동',
                            )}
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
                        <div className='max-w-32 truncate text-sm text-gray-900'>
                          {dictionary.productDetail.navigation.previous}
                        </div>
                      </div>
                    </Button>
                  ) : (
                    <Button
                      variant='outline'
                      disabled
                      className='flex items-center gap-1 px-5 py-3'
                    >
                      <ChevronLeftIcon className='h-5 w-5 text-gray-300' />
                      <div className='text-left'>
                        <div className='text-sm text-gray-400'>
                          {dictionary.productDetail.navigation.noPrevious}
                        </div>
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
                        <div className='max-w-32 truncate text-sm text-gray-900'>
                          {dictionary.productDetail.navigation.next}
                        </div>
                      </div>
                      <ChevronRightIcon className='h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600' />
                    </Button>
                  ) : (
                    <Button
                      variant='outline'
                      disabled
                      className='flex items-center gap-1 px-5 py-3'
                    >
                      <div className='text-right'>
                        <div className='text-sm text-gray-400'>
                          {dictionary.productDetail.navigation.noNext}
                        </div>
                      </div>
                      <ChevronRightIcon className='h-5 w-5 text-gray-300' />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {product.it_info && (
              <div className='mt-12 border-t border-gray-200 pt-8'>
                <h2 className='mb-4 text-xl font-bold text-gray-900'>
                  {dictionary.productDetail.description.productDetailInfo}
                </h2>
                <div
                  className='prose max-w-none text-gray-700'
                  dangerouslySetInnerHTML={{ __html: product.it_info }}
                />
              </div>
            )}

            {/* 구매 불가능한 상품일 때만 인기 작품 표시 */}
            {!product.can_purchase && (
              <PopularProducts excludeProductId={product.it_id} dictionary={dictionary} />
            )}
          </div>
        )}
      </div>

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={handleLoginDialogClose}
        title={dictionary.productDetail.dialog.loginRequired}
        description={dictionary.productDetail.dialog.loginRequiredDesc}
      />

      {/* 좋아요 순번 모달 */}
      <MessageDialog
        open={showOrderDialog}
        onOpenChange={setShowOrderDialog}
        title={dictionary.productDetail.dialog.likeCompleted}
        description={
          orderInfo
            ? dictionary.productDetail.dialog.likeCompletedDesc
                .replace('{{productName}}', orderInfo.productName)
                .replace('{{orderNumber}}', orderInfo.orderNumber.toString())
            : ''
        }
        confirmText={dictionary.productDetail.dialog.confirm}
      />

      {/* 이미지 확대보기 모달 */}
      <ImageMagnifierModal
        open={showMagnifierModal}
        onOpenChange={handleMagnifierModalClose}
        imageUrl={selectedImage || ''}
        productName={product.it_name}
        dictionary={dictionary}
      />

      {/* 사이즈 가이드 모달 */}
      <SizeGuideDialog
        open={showSizeGuide}
        onOpenChange={setShowSizeGuide}
        dictionary={dictionary}
      />
    </div>
  );
}
