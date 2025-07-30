'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/primitives/switch';
import { Button } from '@/components/ui/primitives/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/primitives/radio-group';
import { Label } from '@/components/ui/primitives/label';
import { Textarea } from '@/components/ui/primitives/textarea';
import DaumPostcode from 'react-daum-postcode';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/primitives/dialog';
import { Dictionary } from '@/lib/dictionaries';

interface VendorRegisterFormProps {
  dictionary: Dictionary;
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

interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
}

export default function VendorRegisterForm({
  dictionary,
  onSuccess,
  onCancel,
}: VendorRegisterFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<VendorFormData>({
    vendor_name: '',
    vendor_class: dictionary.vendorRegister.fields.personal,
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
        console.error(dictionary.vendorRegister.errors.vendorInfoLoadError, error);
      }
    };

    if (user) {
      loadVendorInfo();
    }
  }, [user, dictionary]);

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

  const handlePostcodeComplete = (data: DaumPostcodeData) => {
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
      setError(dictionary.vendorRegister.errors.businessNumberLength);
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
        setError(result.message || dictionary.vendorRegister.errors.businessNumberInvalid);
      }
    } catch {
      setError(dictionary.vendorRegister.errors.businessNumberVerifyError);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!isNumberVerified) {
      setError(dictionary.vendorRegister.errors.businessNumberVerifyRequired);
      setIsLoading(false);
      return;
    }

    if (!privacyAgree) {
      setError(dictionary.vendorRegister.errors.privacyAgreeRequired);
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
        setError(result.message || dictionary.vendorRegister.errors.vendorRegisterError);
      }
    } catch {
      setError(dictionary.vendorRegister.errors.vendorRegisterError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mx-auto w-full max-w-2xl'>
      <div className='rounded-lg border border-gray-600 bg-black/80 p-8 backdrop-blur-sm'>
        <div className='mb-6'>
          <h2 className='mb-2 text-center text-2xl font-semibold text-white'>
            {mode === 'create'
              ? dictionary.vendorRegister.title.create
              : dictionary.vendorRegister.title.update}
          </h2>
          <p className='text-center text-sm text-gray-400'>{dictionary.vendorRegister.subtitle}</p>
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
                {dictionary.vendorRegister.fields.vendorName}{' '}
                <span className='text-red-400'>{dictionary.vendorRegister.fields.required}</span>
              </label>
              <input
                className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                id='vendor_name'
                name='vendor_name'
                type='text'
                placeholder={dictionary.vendorRegister.placeholders.vendorName}
                value={formData.vendor_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300'>
                {dictionary.vendorRegister.fields.vendorClass}{' '}
                <span className='text-red-400'>{dictionary.vendorRegister.fields.required}</span>
              </label>
              <RadioGroup
                value={formData.vendor_class}
                onValueChange={(value) => setFormData({ ...formData, vendor_class: value })}
                className='flex gap-6'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value={dictionary.vendorRegister.fields.personal} id='personal' />
                  <Label htmlFor='personal' className='cursor-pointer text-gray-300'>
                    {dictionary.vendorRegister.fields.personal}
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value={dictionary.vendorRegister.fields.corporate}
                    id='corporate'
                  />
                  <Label htmlFor='corporate' className='cursor-pointer text-gray-300'>
                    {dictionary.vendorRegister.fields.corporate}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_representative'>
                {dictionary.vendorRegister.fields.representative}{' '}
                <span className='text-red-400'>{dictionary.vendorRegister.fields.required}</span>
              </label>
              <input
                className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                id='vendor_representative'
                name='vendor_representative'
                type='text'
                placeholder={dictionary.vendorRegister.placeholders.representative}
                value={formData.vendor_representative}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_tel'>
                {dictionary.vendorRegister.fields.contact}{' '}
                <span className='text-red-400'>{dictionary.vendorRegister.fields.required}</span>
              </label>
              <input
                className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                id='vendor_tel'
                name='vendor_tel'
                type='tel'
                placeholder={dictionary.vendorRegister.placeholders.contact}
                value={formData.vendor_tel}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_email'>
                {dictionary.vendorRegister.fields.email}{' '}
                <span className='text-red-400'>{dictionary.vendorRegister.fields.required}</span>
              </label>
              <input
                className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                id='vendor_email'
                name='vendor_email'
                type='email'
                placeholder={dictionary.vendorRegister.placeholders.email}
                value={formData.vendor_email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_fax'>
                {dictionary.vendorRegister.fields.fax}
              </label>
              <input
                className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                id='vendor_fax'
                name='vendor_fax'
                type='tel'
                placeholder={dictionary.vendorRegister.placeholders.fax}
                value={formData.vendor_fax}
                onChange={handleChange}
              />
            </div>

            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_number'>
                {dictionary.vendorRegister.fields.businessNumber}{' '}
                <span className='text-red-400'>{dictionary.vendorRegister.fields.required}</span>
              </label>
              <div className='flex gap-2'>
                <input
                  className='focus:ring-primary flex-1 rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                  id='vendor_number'
                  name='vendor_number'
                  type='text'
                  placeholder={dictionary.vendorRegister.placeholders.businessNumber}
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
                  className={`px-6 ${!isNumberVerified ? 'bg-[#ec4ef3] hover:bg-[#d43de2]' : ''}`}
                >
                  {isVerifying
                    ? dictionary.vendorRegister.buttons.verifying
                    : isNumberVerified
                      ? dictionary.vendorRegister.buttons.verified
                      : dictionary.vendorRegister.buttons.verify}
                </Button>
              </div>
            </div>

            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300'>
                {dictionary.vendorRegister.fields.address}{' '}
                <span className='text-red-400'>{dictionary.vendorRegister.fields.required}</span>
              </label>
              <div className='space-y-2'>
                <div className='flex gap-2'>
                  <input
                    className='focus:ring-primary flex-1 rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                    type='text'
                    placeholder={dictionary.vendorRegister.placeholders.zipCode}
                    value={formData.vendor_postcode}
                    readOnly
                    required
                  />
                  <Button
                    type='button'
                    onClick={() => setIsPostcodeOpen(true)}
                    variant='default'
                    className='bg-[#ec4ef3] px-6 hover:bg-[#d43de2]'
                  >
                    {dictionary.vendorRegister.buttons.addressSearch}
                  </Button>
                </div>
                <input
                  className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                  type='text'
                  placeholder={dictionary.vendorRegister.placeholders.basicAddress}
                  value={formData.vendor_address}
                  readOnly
                  required
                />
                <input
                  className='focus:ring-primary w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                  name='vendor_address_detail'
                  type='text'
                  placeholder={dictionary.vendorRegister.placeholders.detailAddress}
                  value={formData.vendor_address_detail}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className='md:col-span-2'>
              <label className='mb-1 block text-sm text-gray-300' htmlFor='vendor_introduction'>
                {dictionary.vendorRegister.fields.companyIntro}
              </label>
              <Textarea
                className='focus:ring-primary min-h-[120px] w-full rounded border-0 bg-gray-100 px-3 py-2.5 text-gray-800 placeholder-gray-500 focus:ring-2 focus:outline-none'
                id='vendor_introduction'
                name='vendor_introduction'
                placeholder={dictionary.vendorRegister.placeholders.companyIntro}
                value={formData.vendor_introduction}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className='space-y-4 border-t border-gray-600 pt-6'>
            <div className='flex items-center justify-between rounded-lg bg-gray-800/50 p-4'>
              <label className='flex-1 cursor-pointer text-sm font-medium text-white'>
                {dictionary.vendorRegister.privacy.agree}{' '}
                <span className='text-red-400'>{dictionary.vendorRegister.fields.required}</span>
              </label>
              <Switch checked={privacyAgree} onCheckedChange={setPrivacyAgree} />
            </div>
          </div>

          <div className='flex gap-3 pt-4'>
            <Button type='button' onClick={onCancel} variant='secondary' className='flex-1'>
              {dictionary.vendorRegister.buttons.cancel}
            </Button>
            <Button
              type='submit'
              disabled={isLoading || !isAllFieldsFilled}
              variant={isAllFieldsFilled ? 'default' : 'secondary'}
              className={`flex-1 ${isAllFieldsFilled ? 'bg-[#ec4ef3] hover:bg-[#d43de2]' : ''}`}
            >
              {isLoading
                ? dictionary.vendorRegister.buttons.processing
                : mode === 'create'
                  ? dictionary.vendorRegister.buttons.register
                  : dictionary.vendorRegister.buttons.update}
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={isPostcodeOpen} onOpenChange={setIsPostcodeOpen}>
        <DialogContent className='max-w-md p-0'>
          <DialogTitle className='sr-only'>
            {dictionary.vendorRegister.buttons.addressSearch}
          </DialogTitle>
          <DaumPostcode onComplete={handlePostcodeComplete} style={{ height: '450px' }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
