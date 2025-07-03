'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/primitives/button';
import LoadingState from '@/components/states/LoadingState';
import { XCircleIcon } from 'lucide-react';

export default function PaymentFailPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [failureReason, setFailureReason] = useState<string>('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/shop/login');
      return;
    }

    const message = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.';
    setFailureReason(message);
    setLoading(false);
  }, [authLoading, user, searchParams, router]);

  if (authLoading || loading) {
    return <LoadingState message='결제 결과를 확인하는 중...' />;
  }

  return (
    <div className='min-h-screen bg-white'>
      <div className='mx-auto max-w-2xl px-6 py-16'>
        <div className='space-y-8 text-center'>
          {/* 실패 아이콘 */}
          <div className='flex justify-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-red-100'>
              <XCircleIcon className='h-12 w-12 text-red-600' />
            </div>
          </div>

          {/* 메시지 */}
          <div className='space-y-4'>
            <h1 className='text-3xl font-bold text-gray-900'>결제에 실패했습니다</h1>
            <p className='text-lg text-gray-600'>죄송합니다. 결제 처리 중 문제가 발생했습니다.</p>
          </div>

          {/* 실패 사유 */}
          <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
            <h2 className='mb-3 text-lg font-semibold text-red-900'>실패 사유</h2>
            <p className='text-red-800'>{failureReason}</p>
          </div>

          {/* 안내 메시지 */}
          <div className='rounded-lg border border-gray-200 bg-gray-50 p-4'>
            <div className='space-y-1 text-sm text-gray-700'>
              <p>• 카드 한도나 잔액을 확인해 주세요.</p>
              <p>• 입력 정보가 정확한지 다시 한 번 확인해 주세요.</p>
              <p>• 문제가 지속되면 고객센터로 문의해 주세요.</p>
              <p>• 다른 결제 수단을 이용해 보세요.</p>
            </div>
          </div>

          {/* 버튼들 */}
          <div className='space-y-3'>
            <Button
              onClick={() => router.back()}
              className='bg-primary hover:bg-primary/90 w-full text-white'
              size='lg'
            >
              다시 결제하기
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push('/shop')}
              className='w-full'
              size='lg'
            >
              쇼핑 계속하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
