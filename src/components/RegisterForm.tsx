'use client';

import { useState, useMemo } from 'react';
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
  mb_email: string;
  mb_hp: string;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    mb_id: '',
    mb_password: '',
    mb_password_confirm: '',
    mb_name: '',
    mb_email: '',
    mb_hp: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const { register } = useAuth();

  const isAllFieldsFilled = useMemo(() => {
    return (
      formData.mb_id.trim() !== '' &&
      formData.mb_password.trim() !== '' &&
      formData.mb_password_confirm.trim() !== '' &&
      formData.mb_name.trim() !== '' &&
      formData.mb_email.trim() !== '' &&
      formData.mb_hp.trim() !== ''
    );
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

    // 비밀번호 확인
    if (formData.mb_password !== formData.mb_password_confirm) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 비밀번호 규칙 검사
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,15}$/;
    if (!passwordRegex.test(formData.mb_password)) {
      setError('비밀번호는 6~15자 이내 영문(대소문자), 숫자, 특수문자를 모두 포함해야 합니다.');
      setIsLoading(false);
      return;
    }

    try {
      const registerData = {
        mb_id: formData.mb_id,
        mb_password: formData.mb_password,
        mb_name: formData.mb_name,
        mb_nick: formData.mb_name, // 닉네임을 이름과 동일하게 설정
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
    <div className='w-full'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6'>
          <h2 className='mb-2 text-center text-2xl font-semibold text-white'>
            유다인에 오신 것을 환영합니다.
          </h2>
        </div>

        {error && (
          <div className='mb-4 rounded border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_id'>
              아이디 *
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
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_password'>
              비밀번호 *
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_password'
              name='mb_password'
              type='password'
              placeholder='비밀번호(6~15자 이내 영문(대소문자), 숫자, 특수문자 조합)'
              value={formData.mb_password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_password_confirm'>
              비밀번호 확인 *
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_password_confirm'
              name='mb_password_confirm'
              type='password'
              placeholder='비밀번호 확인'
              value={formData.mb_password_confirm}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_name'>
              이름 *
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_name'
              name='mb_name'
              type='text'
              placeholder='이름'
              value={formData.mb_name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_hp'>
              휴대폰번호 *
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_hp'
              name='mb_hp'
              type='tel'
              placeholder='휴대폰 번호(- 제외 입력)'
              value={formData.mb_hp}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_email'>
              이메일 *
            </label>
            <input
              className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
              id='mb_email'
              name='mb_email'
              type='email'
              placeholder='E-mail'
              value={formData.mb_email}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className={`${buttonClass} mt-2 w-full cursor-pointer rounded px-4 py-3 font-medium text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50`}
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>

          <div className='text-center text-sm text-gray-300'>
            이미 계정이 있으신가요?{' '}
            {onSwitchToLogin && (
              <button
                type='button'
                onClick={onSwitchToLogin}
                className='hover:text-primary cursor-pointer font-medium text-white'
              >
                로그인
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
