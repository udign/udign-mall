'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CATEGORY_IDS } from '@/lib/constants';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import LanguageSelectionDialog from '@/components/LanguageSelectionDialog';
import ProductGrid from '@/components/ProductGrid';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import ErrorState from '@/components/states/ErrorState';
import FloatingUploadButton from '@/components/FloatingUploadButton';
import { Product } from '@/types/product';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Dictionary } from '@/lib/dictionaries';

interface ShopClientProps {
  dictionary: Dictionary;
}

export default function ShopClient({ dictionary }: ShopClientProps) {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const isLoadingRef = useRef(false);

  const fetchProducts = useCallback(
    async (pageNum: number, isNewCategory: boolean = false) => {
      if (isLoadingRef.current) return;

      try {
        isLoadingRef.current = true;

        if (pageNum === 1 || isNewCategory) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        setError(null);

        let url = `/api/products?limit=12&page=${pageNum}`;
        if (selectedCategory !== 'all') {
          url += `&category=${selectedCategory}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          if (pageNum === 1 || isNewCategory) {
            setProducts(data.items);
          } else {
            setProducts((prev) => [...prev, ...data.items]);
          }
          setHasMore(data.pagination.hasNext);
        } else {
          setError(data.error || dictionary.shop.noProducts);
        }
      } catch (err) {
        console.error('제품 조회 오류:', err);
        setError(dictionary.shop.noProducts);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [selectedCategory, dictionary],
  );

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && !isLoadingRef.current) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  }, [page, loading, loadingMore, hasMore, fetchProducts]);

  const observerTarget = useIntersectionObserver(loadMore);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, true);
  }, [selectedCategory, fetchProducts]);

  // 최초 방문 시 언어 선택 Dialog 표시
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const hasSelectedLanguage = localStorage.getItem('language_selected');
      const hasCookie = document.cookie.includes('NEXT_LOCALE=');

      // 언어를 한 번도 선택하지 않은 경우 Dialog 표시
      if (!hasSelectedLanguage && !hasCookie) {
        setShowLanguageDialog(true);
      }
    }
  }, []);

  const categories = [
    { id: 'all', name: dictionary.shop.categories.all },
    { id: CATEGORY_IDS.FASHION, name: dictionary.shop.categories.fashion },
    { id: CATEGORY_IDS.SHOES, name: dictionary.shop.categories.shoes },
    { id: CATEGORY_IDS.OTHERS, name: dictionary.shop.categories.others },
  ];

  return (
    <>
      <main>
        <div className='py-5'>
          <div className='relative left-1/2 aspect-video w-screen -translate-x-1/2 overflow-hidden'>
            <video
              src='/videos/main-banner-pc.mp4'
              autoPlay
              loop
              muted
              className='hidden h-full w-full object-cover sm:block'
            />
            <video
              src='/videos/main-banner-mobile.mp4'
              autoPlay
              loop
              muted
              playsInline
              className='block h-full w-full object-cover sm:hidden'
            />
          </div>
        </div>
        <section className='mb-10 px-6 py-14 sm:px-10 sm:py-20'>
          <div className='flex flex-col items-center gap-y-8'>
            <p className='text-center text-xl font-bold tracking-tight text-white sm:text-3xl'>
              {dictionary.shop.designDescription}
            </p>

            {/* 카테고리 탭 */}
            <div className='flex gap-4'>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`cursor-pointer px-6 py-2 text-base font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'border-b-2 border-white text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* 제품 목록 */}
            <div className='mt-8 w-full'>
              {loading && products.length === 0 ? (
                <div className='flex min-h-96 items-center justify-center'>
                  <LoadingSpinner size='lg' message={dictionary.shop.loadingProducts} />
                </div>
              ) : error && products.length === 0 ? (
                <ErrorState
                  message={error}
                  onRetry={() => fetchProducts(1, true)}
                  showRetry={true}
                />
              ) : (
                <>
                  {products.length === 0 ? (
                    <div className='py-12 text-center'>
                      <p className='text-white/60'>{dictionary.shop.noProducts}</p>
                    </div>
                  ) : (
                    <>
                      <ProductGrid products={products} />

                      {/* 무한 스크롤 트리거 */}
                      {hasMore && (
                        <div ref={observerTarget} className='flex h-20 items-center justify-center'>
                          {loadingMore && (
                            <LoadingSpinner size='sm' message={dictionary.shop.loadMore} />
                          )}
                        </div>
                      )}

                      {!hasMore && products.length > 0 && (
                        <div className='py-8 text-center'>
                          <p className='text-white/60'>{dictionary.shop.allLoaded}</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        title={dictionary.shop.loginRequired}
        description={dictionary.shop.loginRequiredMessage}
      />

      <LanguageSelectionDialog
        open={showLanguageDialog}
        onClose={() => setShowLanguageDialog(false)}
      />

      <FloatingUploadButton dictionary={dictionary} />
    </>
  );
}
