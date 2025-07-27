'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/primitives/switch';
import { Button } from '@/components/ui/primitives/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/primitives/radio-group';
import { Label } from '@/components/ui/primitives/label';
import { Textarea } from '@/components/ui/primitives/textarea';
import MessageDialog from '@/components/ui/MessageDialog';
import DaumPostcode from 'react-daum-postcode';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/primitives/dialog';

interface VendorRegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface VendorFormData {
  vendor_name: string;
  vendor_class: string;
  vendor_representative: string;
  vendor_tel: string;
  vendor_email: string;
  vendor_fax: string;
  vendor_number: string;
  vendor_postcode: string;
  vendor_address: string;
  vendor_address_detail: string;
  vendor_introduction: string;
}

export default function VendorRegisterForm({ onSuccess, onCancel }: VendorRegisterFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<VendorFormData>({
    vendor_name: '',
    vendor_class: '개인',
    vendor_representative: '',
    vendor_tel: '',
    vendor_email: '',
    vendor_fax: '',
    vendor_number: '',
    vendor_postcode: '',
    vendor_address: '',
    vendor_address_detail: '',
    vendor_introduction: '',
  });
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [privacyAgree, setPrivacyAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isNumberVerified, setIsNumberVerified] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'create' | 'update'>('create');

  // 기존 벤더 정보 로드
  useEffect(() => {
    const loadVendorInfo = async () => {
      try {
        const response = await fetch('/api/vendor/info');
        if (response.ok) {
          const data = await response.json();
          if (data.vendor_name) {
            setFormData(data);
            setMode('update');
            setIsNumberVerified(true); // 이미 등록된 경우 검증 완료로 처리
          }
        }
      } catch (error) {
        console.error('벤더 정보 로드 실패:', error);
      }
    };
    
    if (user) {
      loadVendorInfo();
    }
  }, [user]);

  const isAllFieldsFilled = useMemo(() => {
    return (
      formData.vendor_name.trim() !== '' &&
      formData.vendor_representative.trim() !== '' &&
      formData.vendor_tel.trim() !== '' &&
      formData.vendor_email.trim() !== '' &&
      formData.vendor_number.trim() !== '' &&
      formData.vendor_postcode.trim() !== '' &&
      formData.vendor_address.trim() !== '' &&
      isNumberVerified &&
      privacyAgree
    );
  }, [formData, isNumberVerified, privacyAgree]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // 사업자등록번호가 변경되면 검증 상태 초기화
    if (name === 'vendor_number' && isNumberVerified) {
      setIsNumberVerified(false);
    }
    
    setError('');
  };

  const handlePostcodeComplete = (data: any) => {
    setFormData({
      ...formData,
      vendor_postcode: data.zonecode,
      vendor_address: data.roadAddress || data.jibunAddress,
    });
    setIsPostcodeOpen(false);
  };

  const verifyBusinessNumber = async () => {
    const number = formData.vendor_number.replace(/[^0-9]/g, '');
    
    if (number.length !== 10) {
      setError('사업자등록번호는 10자리 숫자여야 합니다.');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/vendor/verify-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vendor_number: number }),
      });

      const result = await response.json();

      if (result.valid) {
        setIsNumberVerified(true);
        setFormData({
          ...formData,
          vendor_number: number,
        });
      } else {
        setError(result.message || '유효하지 않은 사업자등록번호입니다.');
      }
    } catch (error) {
      setError('사업자등록번호 검증 중 오류가 발생했습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!isNumberVerified) {
      setError('사업자등록번호 인증을 완료해주세요.');
      setIsLoading(false);
      return;
    }

    if (!privacyAgree) {
      setError('개인정보처리방침에 동의해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/vendor/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          mode,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess?.();
      } else {
        setError(result.message || '벤더 등록 중 오류가 발생했습니다.');
      }
    } catch (error) {
      setError('벤더 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6'>
          <h2 className='mb-2 text-center text-2xl font-semibold text-white'>
            {mode === 'create' ? '벤더 정보 입력' : '벤더 정보 수정'}
          </h2>
          <p className='text-center text-sm text-gray-400'>
            사업자 인증을 위해 아래 항목을 작성해주세요.
          </p>
        </div>

        {error && (
          <div className='mb-4 rounded border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300'>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_name'>
                상호명 <span className='text-red-400'>*</span>
              </label>
              <input
                className='w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                id='vendor_name'
                name='vendor_name'
                type='text'
                placeholder='상호명'
                value={formData.vendor_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300'>
                개인/법인 구분 <span className='text-red-400'>*</span>
              </label>
              <RadioGroup
                value={formData.vendor_class}
                onValueChange={(value) => setFormData({ ...formData, vendor_class: value })}
                className='flex gap-6'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='개인' id='personal' />
                  <Label htmlFor='personal' className='text-gray-300 cursor-pointer'>
                    개인
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='법인' id='corporate' />
                  <Label htmlFor='corporate' className='text-gray-300 cursor-pointer'>
                    법인
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_representative'>
                대표자명 <span className='text-red-400'>*</span>
              </label>
              <input
                className='w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                id='vendor_representative'
                name='vendor_representative'
                type='text'
                placeholder='대표자 이름'
                value={formData.vendor_representative}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_tel'>
                연락처 <span className='text-red-400'>*</span>
              </label>
              <input
                className='w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                id='vendor_tel'
                name='vendor_tel'
                type='tel'
                placeholder='연락처 (- 제외 입력)'
                value={formData.vendor_tel}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_email'>
                이메일 <span className='text-red-400'>*</span>
              </label>
              <input
                className='w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                id='vendor_email'
                name='vendor_email'
                type='email'
                placeholder='이메일 주소'
                value={formData.vendor_email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_fax'>
                FAX
              </label>
              <input
                className='w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                id='vendor_fax'
                name='vendor_fax'
                type='tel'
                placeholder='팩스 번호 (- 제외 입력)'
                value={formData.vendor_fax}
                onChange={handleChange}
              />
            </div>

            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_number'>
                사업자등록번호 <span className='text-red-400'>*</span>
              </label>
              <div className='flex gap-2'>
                <input
                  className='flex-1 rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                  id='vendor_number'
                  name='vendor_number'
                  type='text'
                  placeholder='사업자등록번호 (- 제외 입력)'
                  value={formData.vendor_number}
                  onChange={handleChange}
                  required
                  disabled={mode === 'update'}
                />
                <Button
                  type='button'
                  onClick={verifyBusinessNumber}
                  disabled={isVerifying || isNumberVerified || mode === 'update'}
                  variant={isNumberVerified ? 'secondary' : 'default'}
                  className='px-6'
                >
                  {isVerifying ? '확인 중...' : isNumberVerified ? '인증완료' : '사업자 인증하기'}
                </Button>
              </div>
            </div>

            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300'>
                주소 <span className='text-red-400'>*</span>
              </label>
              <div className='space-y-2'>
                <div className='flex gap-2'>
                  <input
                    className='flex-1 rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                    type='text'
                    placeholder='우편번호'
                    value={formData.vendor_postcode}
                    readOnly
                    required
                  />
                  <Button
                    type='button'
                    onClick={() => setIsPostcodeOpen(true)}
                    variant='default'
                    className='px-6'
                  >
                    주소검색
                  </Button>
                </div>
                <input
                  className='w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                  type='text'
                  placeholder='기본주소'
                  value={formData.vendor_address}
                  readOnly
                  required
                />
                <input
                  className='w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                  name='vendor_address_detail'
                  type='text'
                  placeholder='상세주소'
                  value={formData.vendor_address_detail}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_introduction'>
                회사소개
              </label>
              <Textarea
                className='min-h-[120px] w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:outline-none'
                id='vendor_introduction'
                name='vendor_introduction'
                placeholder='회사 소개를 입력해주세요.'
                value={formData.vendor_introduction}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className='space-y-4 border-t border-gray-600 pt-6'>
            <div className='flex items-center justify-between rounded-lg bg-gray-800/50 p-4'>
              <label className='flex-1 cursor-pointer text-sm font-medium text-white'>
                개인정보처리방침에 동의합니다 <span className='text-red-400'>*</span>
              </label>
              <Switch
                checked={privacyAgree}
                onCheckedChange={setPrivacyAgree}
              />
            </div>
          </div>

          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              onClick={onCancel}
              variant='secondary'
              className='flex-1'
            >
              취소
            </Button>
            <Button
              type='submit'
              disabled={isLoading || !isAllFieldsFilled}
              variant={isAllFieldsFilled ? 'default' : 'secondary'}
              className='flex-1'
            >
              {isLoading ? '처리 중...' : mode === 'create' ? '등록하기' : '수정하기'}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={isPostcodeOpen} onOpenChange={setIsPostcodeOpen}>
        <DialogContent className='max-w-md p-0'>
          <DialogTitle className='sr-only'>주소 검색</DialogTitle>
          <DaumPostcode
            onComplete={handlePostcodeComplete}
            style={{ height: '450px' }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 