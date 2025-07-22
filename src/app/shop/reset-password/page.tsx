'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import LoadingState from '@/components/states/LoadingState';

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const processPasswordReset = async () => {
      const mbNo = searchParams.get('mb_no');
      const mbNonce = searchParams.get('mb_nonce');

      if (!mbNo || !mbNonce) {
        setError('잘못된 접근입니다.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/password-reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mb_no: mbNo, mb_nonce: mbNonce }),
        });

        const data = await response.json();

        if (data.success) {
          setSuccess(true);
        } else {
          setError(data.message || '비밀번호 변경에 실패했습니다.');
        }
      } catch {
        setError('요청 처리 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    processPasswordReset();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <LoadingState />
      </div>
    );
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
        <div className='w-full max-w-lg'>
          <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
            {success ? (
              <>
                <div className='mb-6 text-center'>
                  <h2 className='mb-2 text-2xl font-semibold text-white'>비밀번호 변경 완료</h2>
                  <p className='text-base text-gray-300'>비밀번호가 성공적으로 변경되었습니다.</p>
                </div>

                <div className='space-y-4'>
                  <div className='rounded border border-green-500/50 bg-green-500/20 p-4 text-sm text-green-300'>
                    <p className='mb-2'>
                      <strong>비밀번호 변경이 완료되었습니다.</strong>
                    </p>
                    <p>회원아이디와 변경된 비밀번호로 로그인 하시기 바랍니다.</p>
                    <p className='mt-2 text-xs text-green-400'>
                      보안을 위해 로그인 후 새로운 비밀번호로 변경해 주시기 바랍니다.
                    </p>
                  </div>

                  <Button onClick={() => router.push(ROUTES.LOGIN)} className='w-full'>
                    로그인 페이지로 이동
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className='mb-6 text-center'>
                  <h2 className='mb-2 text-2xl font-semibold text-white'>비밀번호 변경 실패</h2>
                  <p className='text-base text-gray-300'>비밀번호 변경 중 문제가 발생했습니다.</p>
                </div>

                <div className='space-y-4'>
                  <div className='rounded border border-red-500/50 bg-red-500/20 p-4 text-sm text-red-300'>
                    <p>
                      <strong>오류:</strong> {error}
                    </p>
                    <p className='mt-2 text-xs text-red-400'>
                      인증 링크가 만료되었거나 이미 사용된 링크일 수 있습니다.
                    </p>
                  </div>

                  <div className='flex space-x-3'>
                    <Button
                      onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
                      variant='outline'
                      className='flex-1'
                    >
                      다시 시도
                    </Button>
                    <Button onClick={() => router.push(ROUTES.LOGIN)} className='flex-1'>
                      로그인으로 돌아가기
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
