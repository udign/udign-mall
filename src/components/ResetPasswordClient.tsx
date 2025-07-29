'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import LoadingState from '@/components/states/LoadingState';
import { Dictionary } from '@/lib/dictionaries';

interface ResetPasswordClientProps {
  dictionary: Dictionary;
}

function ResetPasswordContent({ dictionary }: { dictionary: Dictionary }) {
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
        setError(dictionary.resetPassword.errors.invalidAccess);
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
          setError(data.message || dictionary.resetPassword.errors.resetFailed);
        }
      } catch {
        setError(dictionary.resetPassword.errors.requestError);
      } finally {
        setIsLoading(false);
      }
    };

    processPasswordReset();
  }, [searchParams, dictionary]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <LoadingState dictionary={dictionary} />
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
      <div className='relative z-10 mt-10 flex flex-1 justify-center p-4'>
        <div className='w-full max-w-lg'>
          <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
            {success ? (
              <>
                <div className='mb-6 text-center'>
                  <h2 className='mb-2 text-2xl font-semibold text-white'>
                    {dictionary.resetPassword.success.title}
                  </h2>
                  <p className='text-base text-gray-300'>
                    {dictionary.resetPassword.success.subtitle}
                  </p>
                </div>

                <div className='space-y-4'>
                  <div className='rounded border border-green-500/50 bg-green-500/20 p-4 text-sm text-green-300'>
                    <p className='mb-2'>
                      <strong>{dictionary.resetPassword.success.message}</strong>
                    </p>
                    <p>{dictionary.resetPassword.success.loginMessage}</p>
                    <p className='mt-2 text-xs text-green-400'>
                      {dictionary.resetPassword.success.securityMessage}
                    </p>
                  </div>

                  <Button onClick={() => router.push(ROUTES.LOGIN)} className='w-full'>
                    {dictionary.resetPassword.success.goToLogin}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className='mb-6 text-center'>
                  <h2 className='mb-2 text-2xl font-semibold text-white'>
                    {dictionary.resetPassword.failure.title}
                  </h2>
                  <p className='text-base text-gray-300'>
                    {dictionary.resetPassword.failure.subtitle}
                  </p>
                </div>

                <div className='space-y-4'>
                  <div className='rounded border border-red-500/50 bg-red-500/20 p-4 text-sm text-red-300'>
                    <p>
                      <strong>{dictionary.resetPassword.failure.errorLabel}</strong> {error}
                    </p>
                    <p className='mt-2 text-xs text-red-400'>
                      {dictionary.resetPassword.failure.linkExpiredMessage}
                    </p>
                  </div>

                  <div className='flex space-x-3'>
                    <Button
                      onClick={() => router.push(ROUTES.FORGOT_PASSWORD)}
                      variant='outline'
                      className='flex-1'
                    >
                      {dictionary.resetPassword.failure.tryAgain}
                    </Button>
                    <Button onClick={() => router.push(ROUTES.LOGIN)} className='flex-1'>
                      {dictionary.resetPassword.failure.backToLogin}
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

export default function ResetPasswordClient({ dictionary }: ResetPasswordClientProps) {
  return (
    <Suspense fallback={<LoadingState dictionary={dictionary} />}>
      <ResetPasswordContent dictionary={dictionary} />
    </Suspense>
  );
}
