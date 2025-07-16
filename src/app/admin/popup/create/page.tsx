'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { CreatePopupRequest, POPUP_DEVICE_LABELS } from '@/types/popup';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import { formatDateTime } from '@/lib/utils';
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
import { Textarea } from '@/components/ui/primitives/textarea';
import { Checkbox } from '@/components/ui/primitives/checkbox';

const DEFAULT_VALUES: CreatePopupRequest = {
  nw_division: 'shop',
  nw_device: 'both',
  nw_begin_time: '',
  nw_end_time: '',
  nw_disable_hours: 24,
  nw_left: 10,
  nw_top: 10,
  nw_height: 500,
  nw_width: 450,
  nw_subject: '',
  nw_content: '',
  nw_content_html: 1,
};

export default function PopupCreatePage() {
  const [formData, setFormData] = useState<CreatePopupRequest>(DEFAULT_VALUES);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      router.push(ROUTES.SHOP);
      return;
    }
  }, [user, authLoading, router]);

  const handleInputChange = (field: keyof CreatePopupRequest, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTodayStart = (checked: boolean) => {
    if (checked) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      handleInputChange('nw_begin_time', formatDateTime(today));
    }
  };

  const handleWeekLaterEnd = (checked: boolean) => {
    if (checked) {
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      weekLater.setHours(23, 59, 59, 999);
      handleInputChange('nw_end_time', formatDateTime(weekLater));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 검증
    if (!formData.nw_subject.trim()) {
      setError('제목은 필수 입력 항목입니다.');
      return;
    }

    if (!formData.nw_begin_time) {
      setError('시작일시는 필수 입력 항목입니다.');
      return;
    }

    if (!formData.nw_end_time) {
      setError('종료일시는 필수 입력 항목입니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/popups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '팝업 생성에 실패했습니다.');
      }

      alert('팝업이 성공적으로 생성되었습니다.');
      router.push(ROUTES.ADMIN_POPUP);
    } catch (err) {
      setError(err instanceof Error ? err.message : '팝업 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return authLoading ? (
    <div className='flex min-h-screen items-center justify-center'>
      <LoadingSpinner size='lg' message='권한을 확인하는 중...' />
    </div>
  ) : !user || !PERMISSION_CHECKS.isAdmin(user.mb_level) ? (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <p className='mb-4 text-red-600'>관리자 권한이 필요합니다.</p>
        <Button onClick={() => router.push(ROUTES.LOGIN)}>로그인하기</Button>
      </div>
    </div>
  ) : (
    <div className='space-y-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>팝업 생성</h1>
        <p className='mt-1 text-gray-600'>새로운 팝업을 생성합니다.</p>
      </div>

      {error && (
        <div className='rounded-md border border-red-300 bg-red-50 p-4'>
          <p className='text-sm text-red-600'>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='rounded-lg border bg-white p-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* 접속기기 */}
            <div className='space-y-2'>
              <Label htmlFor='nw_device'>접속기기 *</Label>
              <Select
                value={formData.nw_device}
                onValueChange={(value) => handleInputChange('nw_device', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(POPUP_DEVICE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-sm text-gray-500'>팝업레이어가 표시될 접속기기를 설정합니다.</p>
            </div>

            {/* 비활성화 시간 */}
            <div className='space-y-2'>
              <Label htmlFor='nw_disable_hours'>비활성화 시간 *</Label>
              <div className='flex items-center space-x-2'>
                <Input
                  id='nw_disable_hours'
                  type='number'
                  min='1'
                  value={formData.nw_disable_hours}
                  onChange={(e) =>
                    handleInputChange('nw_disable_hours', parseInt(e.target.value) || 0)
                  }
                  className='w-20'
                />
                <span className='text-sm text-gray-600'>시간</span>
              </div>
              <p className='text-sm text-gray-500'>
                고객이 다시 보지 않음을 선택할 시 몇 시간동안 팝업레이어를 보여주지 않을지
                설정합니다.
              </p>
            </div>

            {/* 시작일시 */}
            <div className='space-y-2'>
              <Label htmlFor='nw_begin_time'>시작일시 *</Label>
              <Input
                id='nw_begin_time'
                type='datetime-local'
                value={formData.nw_begin_time ? formData.nw_begin_time.slice(0, 16) : ''}
                onChange={(e) =>
                  handleInputChange('nw_begin_time', e.target.value ? e.target.value + ':00' : '')
                }
                required
              />
              <div className='flex items-center space-x-2'>
                <Checkbox id='begin_today' onCheckedChange={handleTodayStart} />
                <Label htmlFor='begin_today' className='text-sm text-gray-600'>
                  시작일시를 오늘로
                </Label>
              </div>
            </div>

            {/* 종료일시 */}
            <div className='space-y-2'>
              <Label htmlFor='nw_end_time'>종료일시 *</Label>
              <Input
                id='nw_end_time'
                type='datetime-local'
                value={formData.nw_end_time ? formData.nw_end_time.slice(0, 16) : ''}
                onChange={(e) =>
                  handleInputChange('nw_end_time', e.target.value ? e.target.value + ':00' : '')
                }
                required
              />
              <div className='flex items-center space-x-2'>
                <Checkbox id='end_week_later' onCheckedChange={handleWeekLaterEnd} />
                <Label htmlFor='end_week_later' className='text-sm text-gray-600'>
                  종료일시를 오늘로부터 7일 후로
                </Label>
              </div>
            </div>

            {/* 위치 설정 */}
            <div className='space-y-2'>
              <Label>팝업 위치</Label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label htmlFor='nw_left' className='text-sm'>
                    좌측 위치 (px)
                  </Label>
                  <Input
                    id='nw_left'
                    type='number'
                    min='0'
                    value={formData.nw_left}
                    onChange={(e) => handleInputChange('nw_left', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor='nw_top' className='text-sm'>
                    상단 위치 (px)
                  </Label>
                  <Input
                    id='nw_top'
                    type='number'
                    min='0'
                    value={formData.nw_top}
                    onChange={(e) => handleInputChange('nw_top', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* 크기 설정 */}
            <div className='space-y-2'>
              <Label>팝업 크기</Label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label htmlFor='nw_width' className='text-sm'>
                    너비 (px)
                  </Label>
                  <Input
                    id='nw_width'
                    type='number'
                    min='100'
                    value={formData.nw_width}
                    onChange={(e) => handleInputChange('nw_width', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor='nw_height' className='text-sm'>
                    높이 (px)
                  </Label>
                  <Input
                    id='nw_height'
                    type='number'
                    min='100'
                    value={formData.nw_height}
                    onChange={(e) => handleInputChange('nw_height', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 제목 */}
          <div className='mt-6 space-y-2'>
            <Label htmlFor='nw_subject'>팝업 제목 *</Label>
            <Input
              id='nw_subject'
              type='text'
              value={formData.nw_subject}
              onChange={(e) => handleInputChange('nw_subject', e.target.value)}
              placeholder='팝업 제목을 입력하세요'
              required
            />
          </div>

          {/* 내용 */}
          <div className='mt-6 space-y-2'>
            <Label htmlFor='nw_content'>팝업 내용</Label>
            <Textarea
              id='nw_content'
              value={formData.nw_content}
              onChange={(e) => handleInputChange('nw_content', e.target.value)}
              placeholder='팝업 내용을 입력하세요 (HTML 태그 사용 가능)'
              rows={10}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className='flex justify-between'>
          <Button type='button' variant='outline' onClick={() => router.push(ROUTES.ADMIN_POPUP)}>
            목록으로
          </Button>
          <Button type='submit' disabled={loading}>
            {loading ? '생성 중...' : '팝업 생성'}
          </Button>
        </div>
      </form>
    </div>
  );
}
