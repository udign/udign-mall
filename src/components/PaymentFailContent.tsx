'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/primitives/button';
import LoadingState from '@/components/states/LoadingState';
import { XCircleIcon } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { Dictionary } from '@/lib/dictionaries';

interface PaymentFailContentProps {
  dictionary: Dictionary;
}

export default function PaymentFailContent({ dictionary }: PaymentFailContentProps) {
  const [failureReason, setFailureReason] = useState<string>('');
  const [isLoadingFailureInfo, setIsLoadingFailureInfo] = useState<boolean>(true);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    const message = searchParams.get('message') || dictionary.paymentFail.unknownError;

    setFailureReason(message);
    setIsLoadingFailureInfo(false);
  }, [authLoading, user, searchParams, router, dictionary]);

  return authLoading || isLoadingFailureInfo ? (
    <LoadingState message={dictionary.paymentFail.checkingResult} dictionary={dictionary} />
  ) : (
    <div className='min-h-screen bg-white'>
      <div className='mx-auto max-w-2xl px-6 py-16'>
        <div className='space-y-8 text-center'>
          <div className='flex justify-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-red-100'>
              <XCircleIcon className='h-12 w-12 text-red-600' />
            </div>
          </div>

          <div className='space-y-4'>
            <h1 className='text-3xl font-bold text-gray-900'>{dictionary.paymentFail.title}</h1>
            <p className='text-lg text-gray-600'>{dictionary.paymentFail.subtitle}</p>
          </div>

          <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
            <h2 className='mb-3 text-lg font-semibold text-red-900'>
              {dictionary.paymentFail.failureReason}
            </h2>
            <p className='text-red-800'>{failureReason}</p>
          </div>

          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <div className='space-y-1 text-sm text-gray-700'>
              <p>{dictionary.paymentFail.troubleshooting.checkBalance}</p>
              <p>{dictionary.paymentFail.troubleshooting.checkInfo}</p>
              <p>{dictionary.paymentFail.troubleshooting.contactSupport}</p>
              <p>{dictionary.paymentFail.troubleshooting.tryOtherMethod}</p>
            </div>
          </div>

          <div className='space-y-3'>
            <Button
              onClick={() => router.back()}
              className='bg-primary hover:bg-primary/90 w-full text-white'
              size='lg'
            >
              {dictionary.paymentFail.retryPayment}
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push(ROUTES.SHOP)}
              className='w-full'
              size='lg'
            >
              {dictionary.paymentFail.continueShopping}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
