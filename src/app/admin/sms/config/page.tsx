'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Separator } from '@/components/ui/primitives/separator';
import { ExternalLink, Info, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { SMSConfig, SMSConfigFormData, IcodeUserInfo, SMSType } from '@/types/sms';
import Link from 'next/link';

export default function SMSConfigPage() {
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [userInfo, setUserInfo] = useState<IcodeUserInfo | null>(null);
  const [formData, setFormData] = useState<SMSConfigFormData>({
    cf_sms_type: 'SMS',
    cf_icode_id: '',
    cf_icode_pw: '',
    cf_icode_token_key: '',
    cf_phone: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // 설정 로드
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/sms/config');
      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
        setUserInfo(result.userInfo);
        setFormData({
          cf_sms_type: result.data.cf_sms_type || 'SMS',
          cf_icode_id: result.data.cf_icode_id || '',
          cf_icode_pw: result.data.cf_icode_pw || '',
          cf_icode_token_key: result.data.cf_icode_token_key || '',
          cf_phone: result.data.cf_phone || '',
        });
      } else {
        setMessage({ type: 'error', text: result.error || '설정을 불러올 수 없습니다.' });
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
      setMessage({ type: 'error', text: '설정을 불러오는 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/sms/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'SMS 설정이 저장되었습니다.' });
        loadConfig(); // 설정 다시 로드
      } else {
        setMessage({ type: 'error', text: result.error || '설정 저장에 실패했습니다.' });
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      setMessage({ type: 'error', text: '설정 저장 중 오류가 발생했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SMSConfigFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isSMSEnabled = config?.cf_sms_use === 'icode';
  const hasOldCredentials = formData.cf_icode_id && formData.cf_icode_pw;
  const hasTokenKey = formData.cf_icode_token_key;

  return loading ? (
    <div className='flex min-h-[400px] items-center justify-center'>
      <div className='text-center'>
        <div className='border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2'></div>
        <p className='text-muted-foreground'>설정을 불러오는 중...</p>
      </div>
    </div>
  ) : (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>SMS 기본설정</h1>
        <p className='text-muted-foreground'>아이코드 SMS 서비스 설정을 관리합니다.</p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-md border p-4 ${
            message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
          }`}
        >
          {message.type === 'error' ? (
            <AlertTriangle className='h-4 w-4 text-red-600' />
          ) : (
            <CheckCircle className='h-4 w-4 text-green-600' />
          )}
          <div className={message.type === 'error' ? 'text-red-600' : 'text-green-600'}>
            {message.text}
          </div>
        </div>
      )}

      {!isSMSEnabled && (
        <div className='flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-4'>
          <AlertTriangle className='h-4 w-4 text-amber-600' />
          <div className='text-amber-600'>
            SMS 기능을 사용하려면 먼저 환경설정에서 SMS 사용을 활성화해야 합니다.
          </div>
        </div>
      )}

      {!hasOldCredentials && !hasTokenKey && (
        <div className='flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-4'>
          <Info className='h-4 w-4 text-blue-600' />
          <div className='text-blue-600'>
            SMS 기능을 사용하시려면 먼저 아이코드에 서비스 신청을 하셔야 합니다.{' '}
            <Link
              href='http://icodekorea.com/res/join_company_fix_a.php?sellid=sir2'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1 underline hover:no-underline'
            >
              아이코드 서비스 신청하기 <ExternalLink className='h-3 w-3' />
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>기본 설정</CardTitle>
            <CardDescription>SMS 전송 유형과 기본 설정을 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='cf_sms_type'>SMS 전송유형</Label>
              <Select
                value={formData.cf_sms_type}
                onValueChange={(value: SMSType) => handleInputChange('cf_sms_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='SMS'>SMS (최대 80바이트)</SelectItem>
                  <SelectItem value='LMS'>
                    LMS (90바이트 이하는 SMS, 그 이상은 LMS로 전송)
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className='text-muted-foreground text-sm'>
                SMS는 건당 16원, LMS는 건당 48원입니다.
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='cf_phone'>
                회신번호 <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='cf_phone'
                type='tel'
                value={formData.cf_phone}
                onChange={(e) => handleInputChange('cf_phone', e.target.value)}
                placeholder='010-1234-5678'
                required
              />
              <p className='text-muted-foreground text-sm'>
                회신받을 휴대폰 번호를 입력하세요. 회신번호는 발신번호로 사전등록된 번호와 동일해야
                합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>아이코드 설정 (구버전)</CardTitle>
            <CardDescription>아이코드 ID/패스워드 방식 설정입니다.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='cf_icode_id'>아이코드 회원아이디</Label>
              <Input
                id='cf_icode_id'
                value={formData.cf_icode_id}
                onChange={(e) => handleInputChange('cf_icode_id', e.target.value)}
                placeholder='아이코드 회원아이디'
              />
              <p className='text-muted-foreground text-sm'>
                아이코드에서 사용하시는 회원아이디를 입력합니다.
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='cf_icode_pw'>아이코드 비밀번호</Label>
              <div className='relative'>
                <Input
                  id='cf_icode_pw'
                  type={showPassword ? 'text' : 'password'}
                  value={formData.cf_icode_pw}
                  onChange={(e) => handleInputChange('cf_icode_pw', e.target.value)}
                  placeholder='아이코드 비밀번호'
                  className='pr-10'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 text-gray-500' />
                  ) : (
                    <Eye className='h-4 w-4 text-gray-500' />
                  )}
                </Button>
              </div>
              <p className='text-muted-foreground text-sm'>
                아이코드에서 사용하시는 비밀번호를 입력합니다.
              </p>
            </div>

            {userInfo && userInfo.payment ? (
              <>
                <Separator />
                <div className='space-y-2'>
                  <Label>요금제</Label>
                  <div className='flex items-center gap-2'>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        userInfo.payment === 'A'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {userInfo.payment === 'A' ? '충전제' : '정액제'}
                    </span>
                  </div>
                </div>

                {userInfo.payment === 'A' ? (
                  <div className='space-y-2'>
                    <Label>충전 잔액</Label>
                    <div className='flex items-center gap-2'>
                      <span className='text-lg font-semibold'>
                        {userInfo.coin.toLocaleString()} 원
                      </span>
                      <Button type='button' variant='outline' size='sm' asChild>
                        <Link
                          href={`http://www.icodekorea.com/smsbiz/credit_card_amt.php?icode_id=${formData.cf_icode_id}&icode_passwd=${formData.cf_icode_pw}`}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          충전하기 <ExternalLink className='ml-1 h-3 w-3' />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>아이코드 설정 (JSON 버전)</CardTitle>
            <CardDescription>아이코드 토큰키 방식 설정입니다.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='cf_icode_token_key'>아이코드 토큰키</Label>
              <Input
                id='cf_icode_token_key'
                value={formData.cf_icode_token_key}
                onChange={(e) => handleInputChange('cf_icode_token_key', e.target.value)}
                placeholder='토큰키를 입력하세요'
              />
              <p className='text-muted-foreground text-sm'>
                아이코드 JSON 버전의 경우 토큰키를 입력하면 실행됩니다.
                <br />
                LMS 설정시 90바이트 이내는 SMS, 90~2000바이트는 LMS로 발송됩니다.
              </p>
              <p className='text-muted-foreground text-sm'>
                아이코드 사이트 → 토큰키관리 메뉴에서 생성한 토큰키를 입력합니다.
              </p>
              <div className='bg-muted rounded p-2 text-sm'>
                <strong>서버 IP:</strong>{' '}
                {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button type='submit' disabled={saving}>
            {saving ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                저장 중...
              </>
            ) : (
              '설정 저장'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
