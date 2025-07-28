'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import { useLocalePath } from '@/hooks/useLocalePath';

export default function ForgotPasswordForm() {
  const addLocalePath = useLocalePath();
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/password-lost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mb_email: email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message);
      }
    } catch {
      setError('요청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return success ? (
    <div className='w-full'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6 text-center'>
          <h2 className='mb-2 text-2xl font-semibold text-white'>메일 발송 완료</h2>
          <p className='text-base text-gray-300'>
            {email} 메일로 회원아이디와 비밀번호를 인증할 수 있는 메일이 발송되었습니다.
          </p>
        </div>

        <div className='space-y-4'>
          <div className='rounded border border-blue-500/50 bg-blue-500/20 p-4 text-sm text-blue-300'>
            <p className='mb-2'>메일을 확인하여 주십시오.</p>
            <p>메일함에서 메일이 보이지 않는다면 스팸함도 확인해 주세요.</p>
          </div>

          <div className='flex space-x-3'>
            <Button
              onClick={() => router.push(addLocalePath(ROUTES.LOGIN))}
              variant='outline'
              className='flex-1'
            >
              로그인으로 돌아가기
            </Button>
            <Button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className='flex-1'
            >
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className='w-full'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6'>
          <h2 className='mb-2 text-2xl font-semibold text-white'>아이디/비밀번호 찾기</h2>
          <p className='text-base text-gray-300'>
            회원가입 시 등록하신 이메일 주소를 입력해 주세요.
            <br />
            해당 이메일로 아이디와 비밀번호 정보를 보내드립니다.
          </p>
        </div>

        {error && (
          <div className='mb-4 rounded border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_email'>
              이메일 주소 <span className='text-red-400'>*</span>
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_email'
              name='mb_email'
              type='email'
              placeholder='이메일 주소를 입력하세요'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Button
            className='mt-4 w-full'
            type='submit'
            disabled={isLoading || !email.trim()}
            variant={email.trim() ? 'default' : 'secondary'}
          >
            {isLoading ? '처리 중...' : '인증메일 보내기'}
          </Button>

          <div className='mt-4 text-center'>
            <Button
              type='button'
              onClick={() => router.push(addLocalePath(ROUTES.LOGIN))}
              variant='link'
              className='text-gray-300 hover:text-white'
            >
              로그인으로 돌아가기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
