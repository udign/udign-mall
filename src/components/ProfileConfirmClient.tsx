'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Dictionary } from '@/lib/dictionaries';

interface ProfileConfirmClientProps {
  dictionary: Dictionary;
}

export default function ProfileConfirmClient({ dictionary }: ProfileConfirmClientProps) {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter();

  const { user } = useAuth();

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      router.push(ROUTES.LOGIN);
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/password-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        // 비밀번호 확인 성공 시 회원정보 수정 페이지로 이동
        router.push(ROUTES.PROFILE_EDIT);
      } else {
        setError(data.message || dictionary.profile.confirm.errors.invalidPassword);
      }
    } catch (error) {
      console.error('Password confirm error:', error);
      setError(dictionary.profile.confirm.errors.confirmFailed);
    } finally {
      setIsLoading(false);
    }
  };

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
            <Link href={ROUTES.SHOP} className='flex items-center'>
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
            <div className='mb-6'>
              <h2 className='mb-2 text-2xl font-semibold text-white'>
                {dictionary.profile.confirm.title}
              </h2>
              <p className='text-base text-gray-300'>{dictionary.profile.confirm.subtitle}</p>
            </div>

            {error && (
              <div className='mb-4 rounded border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300'>
                {error}
              </div>
            )}

            <form onSubmit={handleConfirm} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='password'>
                  {dictionary.profile.confirm.fields.password}{' '}
                  <span className='text-red-400'>*</span>
                </label>
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={dictionary.profile.confirm.fields.passwordPlaceholder}
                  required
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div className='flex space-x-3 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.back()}
                  className='flex-1'
                  disabled={isLoading}
                >
                  {dictionary.profile.confirm.buttons.cancel}
                </Button>
                <Button type='submit' className='flex-1' disabled={isLoading || !password.trim()}>
                  {isLoading
                    ? dictionary.profile.confirm.buttons.confirming
                    : dictionary.profile.confirm.buttons.confirm}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
