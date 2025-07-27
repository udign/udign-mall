'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';

export default function ShopPage() {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [isButtonOpen, setIsButtonOpen] = useState<boolean>(true);

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
          <div className='flex flex-col items-center gap-y-14 sm:gap-y-20'>
            <p className='text-gray-dark text-center text-xl font-bold tracking-tight sm:text-3xl'>
              오직 당신만을 위한 디자인을 선택하세요. 최고의 선물이 완성됩니다.
            </p>
            <div className='grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-2 xl:grid-cols-3'>
              <Link href={ROUTES.FASHION}>
                <Image src='/images/fashion.png' alt='패션 카테고리' width={440} height={330} />
              </Link>
              <Link href={ROUTES.SHOES}>
                <Image src='/images/shoes.png' alt='신발 카테고리' width={440} height={330} />
              </Link>
              <Link href={ROUTES.OTHERS}>
                <Image src='/images/others.png' alt='기타 카테고리' width={440} height={330} />
              </Link>
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
