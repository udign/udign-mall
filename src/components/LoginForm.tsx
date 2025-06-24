'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

interface LoginFormData {
  mb_id: string;
  password: string;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    mb_id: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.mb_id, formData.password);

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mx-auto w-full max-w-md'>
      <form onSubmit={handleSubmit} className='mb-4 rounded bg-white px-8 pt-6 pb-8 shadow-md'>
        <h2 className='mb-6 text-center text-2xl font-bold text-gray-800'>로그인</h2>

        {error && (
          <div className='mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700'>
            {error}
          </div>
        )}

        <div className='mb-4'>
          <label className='mb-2 block text-sm font-bold text-gray-700' htmlFor='mb_id'>
            아이디
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='mb_id'
            name='mb_id'
            type='text'
            placeholder='아이디를 입력하세요'
            value={formData.mb_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className='mb-6'>
          <label className='mb-2 block text-sm font-bold text-gray-700' htmlFor='password'>
            비밀번호
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='password'
            name='password'
            type='password'
            placeholder='비밀번호를 입력하세요'
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className='flex items-center justify-between'>
          <button
            className='focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50'
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </div>

        {onSwitchToRegister && (
          <div className='mt-4 text-center'>
            <p className='text-gray-600'>
              계정이 없으신가요?{' '}
              <button
                type='button'
                onClick={onSwitchToRegister}
                className='font-medium text-blue-500 hover:text-blue-700'
              >
                회원가입
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
