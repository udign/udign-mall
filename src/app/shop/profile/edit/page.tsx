'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { Switch } from '@/components/ui/primitives/switch';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface ProfileFormData {
  mb_id: string;
  mb_name: string;
  mb_hp: string;
  mb_password: string;
  mb_password_confirm: string;
  mb_mailling: boolean; // 광고성 정보 수신 동의
}

export default function ProfileEditPage() {
  const [formData, setFormData] = useState<ProfileFormData>({
    mb_id: '',
    mb_name: '',
    mb_hp: '',
    mb_password: '',
    mb_password_confirm: '',
    mb_mailling: false,
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);

  const router = useRouter();

  const { user } = useAuth();

  // 로그인 체크 및 현재 사용자 정보 로드
  useEffect(() => {
    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // 현재 사용자 정보 로드
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.success && data.user) {
          setFormData({
            mb_id: data.user.mb_id,
            mb_name: data.user.mb_name,
            mb_hp: data.user.mb_hp || '',
            mb_password: '',
            mb_password_confirm: '',
            mb_mailling: data.user.mb_mailling || false,
          });
        }
      } catch (error) {
        console.error('User data load error:', error);
        setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadUserData();
  }, [user, router]);

  if (!user || isDataLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2'></div>
          <p className='text-gray-600'>사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 휴대폰 번호 자동 포맷팅
    if (name === 'mb_hp') {
      // 숫자만 추출
      const numbers = value.replace(/[^0-9]/g, '');
      let formattedValue = numbers;

      // 휴대폰 번호 포맷팅 (010-1234-5678)
      if (numbers.length > 3 && numbers.length <= 7) {
        formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length > 7) {
        formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }

      setFormData({
        ...formData,
        [name]: formattedValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    setError('');
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      mb_mailling: checked,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 비밀번호 확인
    if (formData.mb_password !== formData.mb_password_confirm) {
      setError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 휴대폰 번호 형식 검증 (숫자만 11자리 또는 하이픈 포함 13자리)
    if (formData.mb_hp) {
      const phoneNumbers = formData.mb_hp.replace(/[^0-9]/g, '');
      if (phoneNumbers.length !== 11 || !phoneNumbers.startsWith('01')) {
        setError('휴대폰 번호는 01로 시작하는 11자리 숫자로 입력해주세요.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/profile-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mb_name: formData.mb_name,
          mb_hp: formData.mb_hp,
          mb_password: formData.mb_password || undefined, // 빈 값이면 undefined로 보내서 업데이트하지 않음
          mb_mailling: formData.mb_mailling,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('회원정보가 성공적으로 수정되었습니다.');
        // 페이지 새로고침하여 사용자 정보 업데이트
        window.location.href = ROUTES.MY_UDIGN;
      } else {
        setError(data.message || '회원정보 수정 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('회원정보 수정 중 오류가 발생했습니다.');
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
              <h2 className='mb-2 text-2xl font-semibold text-white'>회원정보 수정</h2>
              <p className='text-base text-gray-300'>회원정보를 수정하실 수 있습니다.</p>
            </div>

            {error && (
              <div className='mb-4 rounded border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300'>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_id'>
                  아이디 <span className='text-red-400'>*</span>
                </label>
                <input
                  id='mb_id'
                  type='text'
                  value={formData.mb_id}
                  disabled
                  className='w-full cursor-not-allowed rounded border border-gray-600 bg-gray-700/50 px-3 py-2 text-gray-400'
                />
                <p className='mt-1 text-xs text-gray-400'>아이디는 변경할 수 없습니다.</p>
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_name'>
                  이름 <span className='text-red-400'>*</span>
                </label>
                <input
                  id='mb_name'
                  type='text'
                  name='mb_name'
                  value={formData.mb_name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_hp'>
                  휴대폰 번호
                </label>
                <input
                  id='mb_hp'
                  type='text'
                  name='mb_hp'
                  value={formData.mb_hp}
                  onChange={handleChange}
                  placeholder='예: 01012345678 (숫자만 입력)'
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_password'>
                  새 비밀번호
                </label>
                <input
                  id='mb_password'
                  type='password'
                  name='mb_password'
                  value={formData.mb_password}
                  onChange={handleChange}
                  placeholder='변경하지 않으려면 비워두세요'
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_password_confirm'>
                  새 비밀번호 확인
                </label>
                <input
                  id='mb_password_confirm'
                  type='password'
                  name='mb_password_confirm'
                  value={formData.mb_password_confirm}
                  onChange={handleChange}
                  placeholder='새 비밀번호를 다시 입력하세요'
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div className='flex items-center justify-between rounded border border-gray-600 bg-gray-800/50 p-3'>
                <div>
                  <label className='text-sm text-gray-300' htmlFor='mb_mailling'>
                    광고성 정보 수신 동의
                  </label>
                  <p className='text-xs text-gray-400'>
                    이벤트, 할인 혜택 등의 정보를 받아보시겠습니까?
                  </p>
                </div>
                <Switch
                  id='mb_mailling'
                  checked={formData.mb_mailling}
                  onCheckedChange={handleSwitchChange}
                  disabled={isLoading}
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
                  취소
                </Button>
                <Button type='submit' className='flex-1' disabled={isLoading}>
                  {isLoading ? '수정 중...' : '수정하기'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
