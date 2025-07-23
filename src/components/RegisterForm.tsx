'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/primitives/switch';
import { Button } from '@/components/ui/primitives/button';
import { Calendar } from '@/components/ui/primitives/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives/popover';
import { CalendarIcon } from 'lucide-react';
import MessageDialog from '@/components/ui/MessageDialog';
import dayjs from 'dayjs';

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
  mb_birth: string;
}

interface AgreementData {
  allAgree: boolean;
  termsAgree: boolean;
  marketingAgree: boolean;
}

// 날짜 포맷팅 유틸리티 함수들
const parseDate = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  return dayjs(dateStr).toDate();
};

const formatDateFromPicker = (date: Date | undefined): string => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD');
};

const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY년 MM월 DD일');
};

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    mb_id: '',
    mb_password: '',
    mb_password_confirm: '',
    mb_name: '',
    mb_email: '',
    mb_hp: '',
    mb_birth: '',
  });
  const [agreements, setAgreements] = useState<AgreementData>({
    allAgree: false,
    termsAgree: false,
    marketingAgree: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showAgeDialog, setShowAgeDialog] = useState<boolean>(false);

  const { register } = useAuth();

  const isAllFieldsFilled = useMemo(() => {
    return (
      formData.mb_id.trim() !== '' &&
      formData.mb_password.trim() !== '' &&
      formData.mb_password_confirm.trim() !== '' &&
      formData.mb_name.trim() !== '' &&
      formData.mb_email.trim() !== '' &&
      formData.mb_hp.trim() !== '' &&
      formData.mb_birth.trim() !== ''
    );
  }, [formData]);

  const isRequiredAgreementsFilled = useMemo(() => {
    return agreements.termsAgree;
  }, [agreements]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleAgreementChange = (key: keyof AgreementData, value: boolean) => {
    if (key === 'allAgree') {
      setAgreements({
        allAgree: value,
        termsAgree: value,
        marketingAgree: value,
      });
    } else {
      const newAgreements = {
        ...agreements,
        [key]: value,
      };

      // 전체 동의 상태 업데이트
      const allChecked = newAgreements.termsAgree && newAgreements.marketingAgree;
      newAgreements.allAgree = allChecked;

      setAgreements(newAgreements);
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 성인 여부 확인 (만 19세 이상)
    if (formData.mb_birth) {
      const birthDate = dayjs(formData.mb_birth);
      const today = dayjs();

      // 만 나이 계산: 생일이 지났으면 연도 차이, 안 지났으면 연도 차이 - 1
      let age = today.year() - birthDate.year();

      // 생일이 아직 안 지났으면 나이에서 1을 뺌
      const hasPassedBirthday =
        today.month() > birthDate.month() ||
        (today.month() === birthDate.month() && today.date() >= birthDate.date());

      if (!hasPassedBirthday) {
        age -= 1;
      }

      if (age < 19) {
        setIsLoading(false);
        setShowAgeDialog(true);
        return;
      }
    }

    // 필수 동의 항목 체크
    if (!agreements.termsAgree) {
      setError('이용약관 및 개인정보 수집 동의는 필수입니다.');
      setIsLoading(false);
      return;
    }

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
        mb_birth: formData.mb_birth,
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
              아이디 <span className='text-red-400'>*</span>
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
              비밀번호 <span className='text-red-400'>*</span>
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
              비밀번호 확인 <span className='text-red-400'>*</span>
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
              이름 <span className='text-red-400'>*</span>
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
              휴대폰번호 <span className='text-red-400'>*</span>
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
              이메일 <span className='text-red-400'>*</span>
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

          <div>
            <label className='mb-1 block text-sm text-gray-300' htmlFor='mb_birth'>
              생년월일 <span className='text-red-400'>*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full justify-start border-0 bg-gray-100 text-left font-normal text-gray-800 hover:bg-gray-200'
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {formData.mb_birth
                    ? formatDateDisplay(formData.mb_birth)
                    : '생년월일을 선택하세요'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0'>
                <Calendar
                  mode='single'
                  selected={parseDate(formData.mb_birth)}
                  onSelect={(date) =>
                    setFormData((prev) => ({ ...prev, mb_birth: formatDateFromPicker(date) }))
                  }
                  disabled={(date) =>
                    dayjs(date).isAfter(dayjs(), 'day') ||
                    dayjs(date).isBefore(dayjs('1900-01-01'), 'day')
                  }
                  captionLayout='dropdown'
                  fromYear={1940}
                  toYear={dayjs().year()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className='space-y-4 border-t border-gray-600 pt-6'>
            <div className='flex items-center justify-between rounded-lg bg-gray-800/50 p-4'>
              <label className='flex-1 cursor-pointer text-sm font-medium text-white'>
                모든 항목에 동의
              </label>
              <Switch
                checked={agreements.allAgree}
                onCheckedChange={(checked) => handleAgreementChange('allAgree', checked)}
              />
            </div>

            <div className='space-y-3 px-4'>
              <div className='flex items-center justify-between'>
                <label className='flex-1 cursor-pointer text-sm text-gray-300'>
                  이용약관 및 필수 개인정보 수집에 대한 동의 <span className='text-red-400'>*</span>
                </label>
                <Switch
                  checked={agreements.termsAgree}
                  onCheckedChange={(checked) => handleAgreementChange('termsAgree', checked)}
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <label className='cursor-pointer text-sm text-gray-300'>
                    광고성 정보 수신에 대한 동의
                  </label>
                  <p className='mt-1 text-xs text-gray-400'>
                    (미 동의시 서비스 이용에 제한이 있을 수도 있습니다.)
                  </p>
                </div>
                <Switch
                  checked={agreements.marketingAgree}
                  onCheckedChange={(checked) => handleAgreementChange('marketingAgree', checked)}
                />
              </div>
            </div>
          </div>

          <Button
            className='mt-2 w-full'
            type='submit'
            disabled={isLoading || !isAllFieldsFilled || !isRequiredAgreementsFilled}
            variant={isAllFieldsFilled && isRequiredAgreementsFilled ? 'default' : 'secondary'}
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </Button>

          <div className='text-center text-sm text-gray-300'>
            이미 계정이 있으신가요?{' '}
            {onSwitchToLogin && (
              <Button
                type='button'
                onClick={onSwitchToLogin}
                variant='link'
                className='hover:text-primary h-auto p-0 font-medium text-white'
              >
                로그인
              </Button>
            )}
          </div>
        </form>
      </div>

      <MessageDialog
        open={showAgeDialog}
        onOpenChange={setShowAgeDialog}
        title='회원가입 제한'
        description='죄송합니다. 만 19세 이상만 회원가입이 가능합니다.'
        confirmText='확인'
      />
    </div>
  );
}
