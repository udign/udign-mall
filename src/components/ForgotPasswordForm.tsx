'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { ROUTES } from '@/lib/routes';
import { Dictionary } from '@/lib/dictionaries';

interface ForgotPasswordFormProps {
  dictionary: Dictionary;
}

export default function ForgotPasswordForm({ dictionary }: ForgotPasswordFormProps) {
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
      setError(dictionary.auth.forgotPassword.error.general);
    } finally {
      setIsLoading(false);
    }
  };

  return success ? (
    <div className='w-full'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6 text-center'>
          <h2 className='mb-2 text-2xl font-semibold text-white'>
            {dictionary.auth.forgotPassword.success.title}
          </h2>
          <p className='text-base text-gray-300'>
            {dictionary.auth.forgotPassword.success.message.replace('{{email}}', email)}
          </p>
        </div>

        <div className='space-y-4'>
          <div className='rounded border border-blue-500/50 bg-blue-500/20 p-4 text-sm text-blue-300'>
            <p className='mb-2'>{dictionary.auth.forgotPassword.success.checkEmail}</p>
            <p>{dictionary.auth.forgotPassword.success.checkSpam}</p>
          </div>

          <div className='flex space-x-3'>
            <Button onClick={() => router.push(ROUTES.LOGIN)} variant='outline' className='flex-1'>
              {dictionary.auth.forgotPassword.success.backToLogin}
            </Button>
            <Button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className='flex-1'
            >
              {dictionary.auth.forgotPassword.success.tryAgain}
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className='w-full'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6'>
          <h2 className='mb-2 text-2xl font-semibold text-white'>
            {dictionary.auth.forgotPassword.title}
          </h2>
          <p className='text-base text-gray-300'>
            {dictionary.auth.forgotPassword.description}
            <br />
            {dictionary.auth.forgotPassword.descriptionLine2}
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
              {dictionary.auth.forgotPassword.emailLabel}{' '}
              <span className='text-red-400'>{dictionary.auth.forgotPassword.required}</span>
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_email'
              name='mb_email'
              type='email'
              placeholder={dictionary.auth.forgotPassword.emailPlaceholder}
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
            {isLoading
              ? dictionary.auth.forgotPassword.sendingButton
              : dictionary.auth.forgotPassword.sendButton}
          </Button>

          <div className='mt-4 text-center'>
            <Button
              type='button'
              onClick={() => router.push(ROUTES.LOGIN)}
              variant='link'
              className='text-gray-300 hover:text-white'
            >
              {dictionary.auth.forgotPassword.backToLogin}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
