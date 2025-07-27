'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import { CATEGORY_IDS } from '@/lib/constants';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';
import ProductGrid from '@/components/ProductGrid';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import ErrorState from '@/components/states/ErrorState';
import { Product } from '@/types/product';

export default function ShopPage() {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [isButtonOpen, setIsButtonOpen] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user, isLoading } = useAuth();

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    if (!user) {
      setShowLoginDialog(true);
    } else {
      router.push(ROUTES.UPLOAD);
    }
  };

  const toggleButton = () => {
    setIsButtonOpen(!isButtonOpen);
  };

  const fetchProducts = async (category: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/products?limit=12';
      if (category !== 'all') {
        url += `&category=${category}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.items);
      } else {
        setError(data.error || '제품을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('제품 조회 오류:', err);
      setError('제품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(selectedCategory);
  }, [selectedCategory]);

  const categories = [
    { id: 'all', name: 'All' },
    { id: CATEGORY_IDS.FASHION, name: 'Fashion' },
    { id: CATEGORY_IDS.SHOES, name: 'Shoes' },
    { id: CATEGORY_IDS.OTHERS, name: 'Others' },
  ];

  return (
    <>
      <main>
        <div className='py-5 lg:px-10'>
          <div className='aspect-video overflow-hidden lg:rounded-xl'>
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
            <p className='text-white text-center text-xl font-bold tracking-tight sm:text-3xl'>
              오직 당신만을 위한 디자인을 선택하세요. 최고의 선물이 완성됩니다.
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
            <div className='w-full mt-8'>
              {loading ? (
                <div className='flex min-h-96 items-center justify-center'>
                  <LoadingSpinner size='lg' message='작품을 불러오는 중입니다...' />
                </div>
              ) : error ? (
                <ErrorState message={error} onRetry={() => fetchProducts(selectedCategory)} showRetry={true} />
              ) : products.length === 0 ? (
                <div className='text-center py-12'>
                  <p className='text-white/60'>등록된 작품이 없습니다.</p>
                </div>
              ) : (
                <ProductGrid products={products} />
              )}
            </div>
          </div>
        </section>
      </main>

      {/* 플로팅 업로드 버튼 */}
      <div className='fixed left-0 top-1/3 z-40 -translate-y-1/2'>
        <div 
          className='flex items-center transition-transform duration-300 ease-in-out'
          style={{
            transform: isButtonOpen ? 'translateX(0)' : 'translateX(calc(-100% + 32px))',
          }}
        >
          <Button
            onClick={handleUploadClick}
            disabled={isLoading}
            className='flex h-12 items-center gap-2 rounded-l-none rounded-r-none px-6 text-white shadow-lg'
            style={{ backgroundColor: '#618e49' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a6e37'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#618e49'}
          >
            <span className='text-base font-semibold'>디자인 업로드</span>
          </Button>
          <button
            onClick={toggleButton}
            className='flex h-12 w-8 items-center justify-center rounded-r-lg text-white shadow-lg transition-colors'
            style={{ backgroundColor: '#618e49' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a6e37'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#618e49'}
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
        title='디자인 업로드'
        description='디자인을 업로드하시려면 로그인이 필요합니다.'
      />
    </>
  );
}
