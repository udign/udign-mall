'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import LoginRequiredDialog from '@/components/LoginRequiredDialog';

export default function Home() {
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);

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

  return (
    <>
      <main>
        <div className='px-6 py-5 sm:px-10'>
          <div className='aspect-video overflow-hidden rounded-xl'>
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
            <button
              onClick={handleUploadClick}
              disabled={isLoading}
              className='bg-primary hover:bg-primary-hover flex w-full max-w-xs cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-lg text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-md sm:gap-3 sm:rounded-3xl sm:px-8 sm:py-3.5 sm:text-2xl'
            >
              <FaPlus className='text-primary rounded-full bg-white p-1 text-lg sm:text-2xl' />내
              디자인 업로드하기
            </button>
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

      <LoginRequiredDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
        title='디자인 업로드'
        description='디자인을 업로드하시려면 로그인이 필요합니다.'
      />
    </>
  );
}
