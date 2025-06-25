'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';

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

export default function ProductDetailPage() {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [prevProduct, setPrevProduct] = useState<{ it_id: string; it_name: string } | null>(null);
  const [nextProduct, setNextProduct] = useState<{ it_id: string; it_name: string } | null>(null);

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

    try {
      const response = await fetch(`/api/products/${productId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                is_liked: data.is_liked,
                current_likes: data.current_likes,
              }
            : null,
        );
      }
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
    }
  };

  const handleLoginDialogClose = () => {
    setShowLoginDialog(false);
    router.push('/');
  };

  console.log(product);

  return authLoading || loading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600'></div>
        <p className='text-gray-600'>
          {authLoading ? '인증 정보를 확인하는 중...' : '상품 정보를 불러오는 중...'}
        </p>
      </div>
    </div>
  ) : error ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <h2 className='mb-4 text-2xl font-bold text-red-600'>오류 발생</h2>
        <p className='mb-4 text-gray-600'>{error}</p>
        <button
          onClick={() => router.push('/')}
          className='bg-primary hover:bg-primary-hover rounded-lg px-6 py-2 text-white transition-colors'
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  ) : !product ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <h2 className='mb-4 text-2xl font-bold text-gray-800'>상품을 찾을 수 없습니다</h2>
        <button
          onClick={() => router.push('/')}
          className='rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700'
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  ) : (
    <div className='min-h-screen bg-white'>
      {/* 메인 컨테이너 */}
      <div className='mx-auto max-w-6xl px-6 py-8 sm:px-10'>
        <div className='flex flex-col gap-8 lg:flex-row'>
          {/* 왼쪽: 상품 이미지 */}
          <div className='lg:w-1/2'>
            {/* 썸네일 이미지들 */}
            <div className='mb-4 flex gap-2'>
              {product.it_img1 && (
                <div className='h-16 w-16 overflow-hidden rounded-lg border-2 border-gray-300'>
                  <Image
                    src={product.it_img1}
                    alt={`${product.it_name} 썸네일 1`}
                    width={64}
                    height={64}
                    className='h-full w-full object-cover'
                  />
                </div>
              )}
              {product.it_img2 && (
                <div className='h-16 w-16 overflow-hidden rounded-lg border border-gray-200'>
                  <Image
                    src={product.it_img2}
                    alt={`${product.it_name} 썸네일 2`}
                    width={64}
                    height={64}
                    className='h-full w-full object-cover'
                  />
                </div>
              )}
            </div>

            {/* 메인 이미지 */}
            <div className='relative aspect-square overflow-hidden rounded-lg bg-gray-100'>
              {product.it_img1 ? (
                <Image
                  src={product.it_img1}
                  alt={product.it_name}
                  fill
                  className='object-cover'
                  sizes='(max-width: 768px) 100vw, 50vw'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center'>
                  <span className='text-gray-400'>이미지 없음</span>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 상품 정보 */}
          <div className='relative lg:w-1/2'>
            {/* 우측 상단 하트 아이콘 */}
            <button
              onClick={handleLikeToggle}
              className='absolute top-0 right-0 p-2 text-2xl transition-colors hover:scale-110'
            >
              {product.is_liked ? '❤️' : '🤍'}
            </button>

            {/* 상품 제목 */}
            <h1 className='mb-6 pr-12 text-2xl font-bold text-gray-900'>{product.it_name}</h1>

            {/* 작품 설명 섹션 */}
            <div className='mb-8'>
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

            {/* 좋아요 및 목표 정보 */}
            <div className='mb-8 rounded-lg bg-gray-50 p-4'>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-sm text-gray-600'>현재 좋아요</span>
                <span className='text-lg font-bold text-red-500'>{product.current_likes}명</span>
              </div>
              <div className='mb-3 flex items-center justify-between'>
                <span className='text-sm text-gray-600'>목표 인원</span>
                <span className='text-lg font-bold text-blue-600'>{product.it_4}명</span>
              </div>
              <div className='h-2 w-full rounded-full bg-gray-200'>
                <div
                  className='h-2 rounded-full bg-blue-600 transition-all duration-300'
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

            {/* 상태 표시 */}
            {product.is_under_review && (
              <div className='mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
                <p className='font-medium text-yellow-800'>🔍 현재 심의 진행 중입니다</p>
                <p className='mt-1 text-sm text-yellow-600'>심의 완료 후 구매 가능합니다.</p>
              </div>
            )}

            {product.is_review_completed && (
              <div className='mb-6 rounded-lg border border-green-200 bg-green-50 p-4'>
                <p className='font-medium text-green-800'>✅ 심의가 완료되었습니다</p>
                <p className='mt-1 text-sm text-green-600'>구매 가능한 상품입니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className='mt-12 flex items-center justify-between border-t border-gray-200 pt-8'>
          <div className='flex items-center'>
            {prevProduct ? (
              <button
                onClick={() => router.push(`/product/${prevProduct.it_id}`)}
                className='flex items-center gap-2 px-4 py-2 text-gray-600 transition-colors hover:text-gray-900'
              >
                <span>previous</span>
              </button>
            ) : (
              <div className='flex items-center gap-2 px-4 py-2 text-gray-300'>
                <span>previous</span>
              </div>
            )}
          </div>

          <div className='flex items-center'>
            {nextProduct ? (
              <button
                onClick={() => router.push(`/product/${nextProduct.it_id}`)}
                className='flex items-center gap-2 px-4 py-2 text-gray-600 transition-colors hover:text-gray-900'
              >
                <span>next</span>
              </button>
            ) : (
              <div className='flex items-center gap-2 px-4 py-2 text-gray-300'>
                <span>next</span>
              </div>
            )}
          </div>
        </div>

        {/* 상품 상세 정보 */}
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
