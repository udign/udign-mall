'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

interface RegisterFormData {
  mb_id: string;
  mb_password: string;
  mb_password_confirm: string;
  mb_name: string;
  mb_nick: string;
  mb_email: string;
  mb_hp: string;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    mb_id: '',
    mb_password: '',
    mb_password_confirm: '',
    mb_name: '',
    mb_nick: '',
    mb_email: '',
    mb_hp: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { register } = useAuth();

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

    // 비밀번호 확인
    if (formData.mb_password !== formData.mb_password_confirm) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      const registerData = {
        mb_id: formData.mb_id,
        mb_password: formData.mb_password,
        mb_name: formData.mb_name,
        mb_nick: formData.mb_nick,
        mb_email: formData.mb_email,
        mb_hp: formData.mb_hp,
      };
      const result = await register(registerData);

      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mx-auto w-full max-w-md'>
      <form onSubmit={handleSubmit} className='mb-4 rounded bg-white px-8 pt-6 pb-8 shadow-md'>
        <h2 className='mb-6 text-center text-2xl font-bold text-gray-800'>회원가입</h2>

        {error && (
          <div className='mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700'>
            {error}
          </div>
        )}

        <div className='mb-4'>
          <label className='mb-2 block text-sm font-bold text-gray-700' htmlFor='mb_id'>
            아이디 *
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='mb_id'
            name='mb_id'
            type='text'
            placeholder='영문, 숫자 조합 3-20자'
            value={formData.mb_id}
            onChange={handleChange}
            required
          />
        </div>

        <div className='mb-4'>
          <label className='mb-2 block text-sm font-bold text-gray-700' htmlFor='mb_password'>
            비밀번호 *
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='mb_password'
            name='mb_password'
            type='password'
            placeholder='최소 6자 이상'
            value={formData.mb_password}
            onChange={handleChange}
            required
          />
        </div>

        <div className='mb-4'>
          <label
            className='mb-2 block text-sm font-bold text-gray-700'
            htmlFor='mb_password_confirm'
          >
            비밀번호 확인 *
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='mb_password_confirm'
            name='mb_password_confirm'
            type='password'
            placeholder='비밀번호를 다시 입력하세요'
            value={formData.mb_password_confirm}
            onChange={handleChange}
            required
          />
        </div>

        <div className='mb-4'>
          <label className='mb-2 block text-sm font-bold text-gray-700' htmlFor='mb_name'>
            이름 *
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='mb_name'
            name='mb_name'
            type='text'
            placeholder='실명을 입력하세요'
            value={formData.mb_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className='mb-4'>
          <label className='mb-2 block text-sm font-bold text-gray-700' htmlFor='mb_nick'>
            닉네임 *
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='mb_nick'
            name='mb_nick'
            type='text'
            placeholder='닉네임을 입력하세요'
            value={formData.mb_nick}
            onChange={handleChange}
            required
          />
        </div>

        <div className='mb-4'>
          <label className='mb-2 block text-sm font-bold text-gray-700' htmlFor='mb_email'>
            이메일 *
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='mb_email'
            name='mb_email'
            type='email'
            placeholder='이메일을 입력하세요'
            value={formData.mb_email}
            onChange={handleChange}
            required
          />
        </div>

        <div className='mb-6'>
          <label className='mb-2 block text-sm font-bold text-gray-700' htmlFor='mb_hp'>
            휴대폰번호
          </label>
          <input
            className='focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none'
            id='mb_hp'
            name='mb_hp'
            type='tel'
            placeholder='010-1234-5678'
            value={formData.mb_hp}
            onChange={handleChange}
          />
        </div>

        <div className='flex items-center justify-between'>
          <button
            className='focus:shadow-outline rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700 focus:outline-none disabled:opacity-50'
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </div>

        {onSwitchToLogin && (
          <div className='mt-4 text-center'>
            <p className='text-gray-600'>
              이미 계정이 있으신가요?{' '}
              <button
                type='button'
                onClick={onSwitchToLogin}
                className='font-medium text-blue-500 hover:text-blue-700'
              >
                로그인
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
