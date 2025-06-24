'use client';

import { useState, useMemo } from 'react';
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
  const [autoLogin, setAutoLogin] = useState<boolean>(false);

  const { login } = useAuth();

  const isAllFieldsFilled = useMemo(() => {
    return formData.mb_id.trim() !== '' && formData.password.trim() !== '';
  }, [formData]);

  const buttonClass = isAllFieldsFilled
    ? 'bg-primary hover:bg-primary-hover'
    : 'bg-gray-light hover:bg-gray-medium';

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
    <div className='w-full'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6'>
          <h2 className='mb-2 text-2xl font-semibold text-white'>Be sure your design</h2>
          <p className='text-base text-gray-300'>여러분의 디자인은 최고의 가치가 됩니다.</p>
        </div>

        {error && (
          <div className='mb-4 rounded border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_id'>
              아이디
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_id'
              name='mb_id'
              type='text'
              placeholder='아이디'
              value={formData.mb_id}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='password'>
              비밀번호
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='password'
              name='password'
              type='password'
              placeholder='비밀번호'
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className={`${buttonClass} mt-2 w-full cursor-pointer rounded px-4 py-3 font-medium text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50`}
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          <div className='flex items-center justify-between text-sm'>
            <label className='flex cursor-pointer items-center text-gray-300'>
              <input
                type='checkbox'
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                className='text-primary focus:ring-primary mr-2 h-4 w-4 rounded border-gray-600 bg-gray-700 focus:ring-2'
              />
              자동로그인
            </label>
            <div className='text-gray-300'>
              <span className='cursor-pointer hover:text-white'>아이디/비밀번호 찾기</span>
              <span className='mx-2'>|</span>
              {onSwitchToRegister && (
                <button
                  type='button'
                  onClick={onSwitchToRegister}
                  className='cursor-pointer hover:text-white'
                >
                  회원가입
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
