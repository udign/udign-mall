'use client';

import { Button } from '@/components/ui/primitives/button';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import { useLocalePath } from '@/hooks/useLocalePath';
import { CATEGORY_IDS } from '@/lib/constants';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import ProductGrid from '@/components/ProductGrid';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import ErrorState from '@/components/states/ErrorState';
import { Product } from '@/types/product';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Dictionary } from '@/lib/dictionaries';

interface ShopClientProps {
  dictionary: Dictionary;
}

export default function ShopClient({ dictionary }: ShopClientProps) {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [isButtonOpen, setIsButtonOpen] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const isLoadingRef = useRef(false);

  const router = useRouter();
  const { user, isLoading } = useAuth();
  const addLocalePath = useLocalePath();

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    if (!user) {
      setShowLoginDialog(true);
    } else {
      router.push(addLocalePath(ROUTES.UPLOAD));
    }
  };

  const toggleButton = () => {
    setIsButtonOpen(!isButtonOpen);
  };

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

  const categories = [
    { id: 'all', name: dictionary.shop.categories.all },
    { id: CATEGORY_IDS.FASHION, name: dictionary.shop.categories.fashion },
    { id: CATEGORY_IDS.SHOES, name: dictionary.shop.categories.shoes },
    { id: CATEGORY_IDS.OTHERS, name: dictionary.shop.categories.others },
  ];

  return (
    <>
      <main>
        <div className='py-5 xl:px-10'>
          <div className='aspect-video overflow-hidden'>
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
                  className={`px-6 py-2 text-base font-medium transition-colors ${
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

      {/* 플로팅 업로드 버튼 */}
      <div className='fixed top-1/3 left-0 z-40 -translate-y-1/2'>
        <div
          className='flex items-center transition-transform duration-300 ease-in-out'
          style={{
            transform: isButtonOpen ? 'translateX(0)' : 'translateX(calc(-100% + 32px))',
          }}
        >
          <Button
            onClick={handleUploadClick}
            disabled={isLoading}
            className='flex h-12 items-center gap-2 rounded-none px-6 text-white shadow-lg'
            style={{ backgroundColor: '#618e49' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4a6e37')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#618e49')}
          >
            <span className='text-base font-semibold'>{dictionary.shop.uploadProduct}</span>
          </Button>
          <button
            onClick={toggleButton}
            className='flex h-12 w-8 items-center justify-center rounded-none text-white shadow-lg transition-colors'
            style={{ backgroundColor: '#618e49' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4a6e37')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#618e49')}
          >
            {isButtonOpen ? (
              <ChevronLeft className='h-5 w-5' />
            ) : (
              <ChevronRight className='h-5 w-5' />
            )}
          </button>
        </div>
      </div>

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        title={dictionary.shop.loginRequired}
        description={dictionary.shop.loginRequiredMessage}
      />
    </>
  );
}
