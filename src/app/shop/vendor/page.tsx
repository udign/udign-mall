'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import VendorRegisterForm from '@/components/VendorRegisterForm';
import { ROUTES } from '@/lib/routes';
import LoadingState from '@/components/states/LoadingState';

export default function VendorRegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, isLoading, router]);

  const handleSuccess = () => {
    router.push(ROUTES.MY_UDIGN);
  };

  if (isLoading) {
    return <LoadingState message='로딩 중...' />;
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className='flex min-h-screen flex-col bg-cover bg-fixed bg-center bg-no-repeat'
      style={{
        backgroundImage: 'url(/images/auth-bg.png)',
        backgroundColor: '#1a2332',
      }}
    >
      <div className='relative z-10'>
        <div className='px-6 py-5 sm:px-10'>
          <div className='flex items-center'>
            <Link href={ROUTES.HOME} className='flex items-center'>
              <Image
                src='/images/udign-white.png'
                alt='UDIGN'
                width={100}
                height={40}
                className='h-auto'
              />
            </Link>
          </div>
        </div>
      </div>

      <div className='relative z-10 mt-10 flex flex-1 justify-center p-4'>
        <div className='w-full max-w-2xl'>
          <VendorRegisterForm
            onSuccess={handleSuccess}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
} 