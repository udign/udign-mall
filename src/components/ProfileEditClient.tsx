'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/primitives/button';
import { Switch } from '@/components/ui/primitives/switch';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import MessageDialog from '@/components/ui/MessageDialog';
import { Dictionary } from '@/lib/dictionaries';

interface ProfileFormData {
  mb_id: string;
  mb_name: string;
  mb_email: string;
  mb_hp: string;
  mb_password: string;
  mb_password_confirm: string;
  mb_mailling: boolean; // 광고성 정보 수신 동의
}

interface ProfileEditClientProps {
  dictionary: Dictionary;
}

export default function ProfileEditClient({ dictionary }: ProfileEditClientProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    mb_id: '',
    mb_name: '',
    mb_email: '',
    mb_hp: '',
    mb_password: '',
    mb_password_confirm: '',
    mb_mailling: false,
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] = useState<string>('');

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
            mb_email: data.user.mb_email || '',
            mb_hp: data.user.mb_hp || '',
            mb_password: '',
            mb_password_confirm: '',
            mb_mailling: data.user.mb_mailling || false,
          });
        }
      } catch (error) {
        console.error('User data load error:', error);
        setError(dictionary.profile.edit.errors.loadFailed);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadUserData();
  }, [user, router, dictionary]);

  if (!user || isDataLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2'></div>
          <p className='text-gray-600'>{dictionary.profile.edit.loadingMessage}</p>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 휴대폰 번호는 숫자만 입력받도록 처리
    if (name === 'mb_hp') {
      // 숫자만 추출
      const numbers = value.replace(/[^0-9]/g, '');
      setFormData({
        ...formData,
        [name]: numbers,
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

  // alert 대신 dialog를 보여주는 함수
  const showAlert = (title: string, description?: string) => {
    setDialogTitle(title);
    setDialogDescription(description || '');
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 필수 입력값 체크
    if (!formData.mb_email) {
      setError(dictionary.profile.edit.errors.emailRequired);
      setIsLoading(false);
      return;
    }

    if (!formData.mb_hp) {
      setError(dictionary.profile.edit.errors.phoneRequired);
      setIsLoading(false);
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.mb_email)) {
      setError(dictionary.profile.edit.errors.invalidEmail);
      setIsLoading(false);
      return;
    }

    // 휴대폰 번호 형식 검증 (숫자만 11자리)
    if (formData.mb_hp.length !== 11 || !formData.mb_hp.startsWith('01')) {
      setError(dictionary.profile.edit.errors.invalidPhone);
      setIsLoading(false);
      return;
    }

    // 비밀번호 확인
    if (formData.mb_password !== formData.mb_password_confirm) {
      setError(dictionary.profile.edit.errors.passwordMismatch);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/profile-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mb_name: formData.mb_name,
          mb_email: formData.mb_email,
          mb_hp: formData.mb_hp,
          mb_password: formData.mb_password || undefined, // 빈 값이면 undefined로 보내서 업데이트하지 않음
          mb_mailling: formData.mb_mailling,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showAlert(dictionary.profile.edit.successTitle, dictionary.profile.edit.successMessage);
        // 페이지 이동을 dialog 닫힘 후에 처리하도록 수정
      } else {
        setError(data.message || dictionary.profile.edit.errors.updateFailed);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(dictionary.profile.edit.errors.updateFailed);
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
                {dictionary.profile.edit.title}
              </h2>
              <p className='text-base text-gray-300'>{dictionary.profile.edit.subtitle}</p>
            </div>

            {error && (
              <div className='mb-4 rounded border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300'>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_id'>
                  {dictionary.profile.edit.fields.userId} <span className='text-red-400'>*</span>
                </label>
                <input
                  id='mb_id'
                  type='text'
                  value={formData.mb_id}
                  disabled
                  className='w-full cursor-not-allowed rounded border border-gray-600 bg-gray-700/50 px-3 py-2 text-gray-400'
                />
                <p className='mt-1 text-xs text-gray-400'>
                  {dictionary.profile.edit.fields.userIdNotEditable}
                </p>
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_name'>
                  {dictionary.profile.edit.fields.name}
                </label>
                <input
                  id='mb_name'
                  type='text'
                  name='mb_name'
                  value={formData.mb_name}
                  disabled
                  className='w-full cursor-not-allowed rounded border border-gray-600 bg-gray-700/50 px-3 py-2 text-gray-400'
                />
                <p className='mt-1 text-xs text-gray-400'>
                  {dictionary.profile.edit.fields.nameNotEditable}
                </p>
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_email'>
                  {dictionary.profile.edit.fields.email} <span className='text-red-400'>*</span>
                </label>
                <input
                  id='mb_email'
                  type='email'
                  name='mb_email'
                  value={formData.mb_email}
                  onChange={handleChange}
                  placeholder={dictionary.profile.edit.fields.emailPlaceholder}
                  required
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_hp'>
                  {dictionary.profile.edit.fields.phone} <span className='text-red-400'>*</span>
                </label>
                <input
                  id='mb_hp'
                  type='text'
                  name='mb_hp'
                  value={formData.mb_hp}
                  onChange={handleChange}
                  placeholder={dictionary.profile.edit.fields.phonePlaceholder}
                  required
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_password'>
                  {dictionary.profile.edit.fields.newPassword}
                </label>
                <input
                  id='mb_password'
                  type='password'
                  name='mb_password'
                  value={formData.mb_password}
                  onChange={handleChange}
                  placeholder={dictionary.profile.edit.fields.newPasswordPlaceholder}
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_password_confirm'>
                  {dictionary.profile.edit.fields.confirmPassword}
                </label>
                <input
                  id='mb_password_confirm'
                  type='password'
                  name='mb_password_confirm'
                  value={formData.mb_password_confirm}
                  onChange={handleChange}
                  placeholder={dictionary.profile.edit.fields.confirmPasswordPlaceholder}
                  disabled={isLoading}
                  className='w-full rounded border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50'
                />
              </div>

              <div className='flex items-center justify-between rounded border border-gray-600 bg-gray-800/50 p-3'>
                <div>
                  <label className='text-sm text-gray-300' htmlFor='mb_mailling'>
                    {dictionary.profile.edit.fields.marketingConsent}
                  </label>
                  <p className='text-xs text-gray-400'>
                    {dictionary.profile.edit.fields.marketingConsentDesc}
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
                  {dictionary.profile.edit.buttons.cancel}
                </Button>
                <Button type='submit' className='flex-1' disabled={isLoading}>
                  {isLoading
                    ? dictionary.profile.edit.buttons.submitting
                    : dictionary.profile.edit.buttons.submit}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <MessageDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={dialogTitle}
        description={dialogDescription}
        dictionary={dictionary}
        onConfirm={() => {
          if (dialogTitle === dictionary.profile.edit.successTitle) {
            window.location.href = ROUTES.MY_UDIGN;
          }
        }}
      />
    </div>
  );
}
