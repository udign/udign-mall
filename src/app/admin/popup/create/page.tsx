'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/lib/routes';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { POPUP_DEVICE_LABELS, POPUP_DIVISION_LABELS } from '@/types/popup';
import LoadingSpinner from '@/components/states/LoadingSpinner';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { TiptapEditor } from '@/components/ui/TiptapEditor';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/primitives/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives/popover';
import { Calendar } from '@/components/ui/primitives/calendar';
import MessageDialog from '@/components/ui/MessageDialog';

type PopupFormData = z.infer<typeof popupFormSchema>;

const popupFormSchema = z.object({
  nw_division: z.enum(['comm', 'shop', 'both']),
  nw_device: z.enum(['pc', 'mobile', 'both']),
  nw_begin_time: z.string().min(1, '시작 시간을 선택해주세요'),
  nw_end_time: z.string().min(1, '종료 시간을 선택해주세요'),
  nw_disable_hours: z.number().min(1, '다시 보지 않기 시간은 1시간 이상이어야 합니다'),
  nw_left: z.number().min(0, '좌측 위치는 0 이상이어야 합니다'),
  nw_top: z.number().min(0, '상단 위치는 0 이상이어야 합니다'),
  nw_height: z.number().min(100, '높이는 100px 이상이어야 합니다'),
  nw_width: z.number().min(200, '너비는 200px 이상이어야 합니다'),
  nw_subject: z.string().min(1, '팝업 제목을 입력해주세요'),
  nw_content: z.string().min(1, '팝업 내용을 입력해주세요'),
});

export default function PopupCreatePage() {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogMessage, setDialogMessage] = useState<string>('');
  const [dialogConfirm, setDialogConfirm] = useState<(() => void) | undefined>(undefined);

  const router = useRouter();

  const { user, isLoading: authLoading } = useAuth();

  const form = useForm<PopupFormData>({
    resolver: zodResolver(popupFormSchema),
    defaultValues: {
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
    },
  });

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

  const handleTodayStart = (checked: boolean) => {
    if (checked) {
      const today = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
      form.setValue('nw_begin_time', today);
    }
  };

  const handleWeekLaterEnd = (checked: boolean) => {
    if (checked) {
      const weekLater = dayjs().add(7, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss');
      form.setValue('nw_end_time', weekLater);
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      const startTime = dayjs(date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      form.setValue('nw_begin_time', startTime);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      const endTime = dayjs(date).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      form.setValue('nw_end_time', endTime);
    }
  };

  const showDialog = (title: string, message: string, onConfirm?: () => void) => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogConfirm(() => onConfirm);
    setDialogOpen(true);
  };

  const onSubmit = async (data: PopupFormData) => {
    try {
      // HTML이 기본적으로 사용되므로 nw_content_html: 1을 추가
      const submitData = { ...data, nw_content_html: 1 };

      const response = await fetch('/api/admin/popups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '팝업 생성에 실패했습니다.');
      }

      showDialog('성공', '팝업이 성공적으로 생성되었습니다.', () => {
        router.push(ROUTES.ADMIN_POPUP);
      });
    } catch (err) {
      showDialog('오류', err instanceof Error ? err.message : '팝업 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      {authLoading && (
        <div className='flex min-h-screen items-center justify-center'>
          <LoadingSpinner size='lg' message='권한을 확인하는 중...' />
        </div>
      )}

      {!authLoading && (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) && (
        <div className='flex min-h-screen items-center justify-center'>
          <div className='text-center'>
            <p className='mb-4 text-red-600'>관리자 권한이 필요합니다.</p>
            <Button onClick={() => router.push(ROUTES.LOGIN)}>로그인하기</Button>
          </div>
        </div>
      )}

      {!authLoading && user && PERMISSION_CHECKS.isAdmin(user.mb_level) && (
        <div className='min-h-screen'>
          <div className='mb-6 flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link href={ROUTES.ADMIN_POPUP}>
                <Button variant='outline' size='sm'>
                  <ArrowLeft className='h-4 w-4' />
                </Button>
              </Link>
              <h1 className='text-2xl font-bold text-gray-900'>팝업 생성</h1>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>기본 설정</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='nw_device'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>접속기기 *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='접속기기를 선택하세요' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(POPUP_DEVICE_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className='text-xs text-gray-500'>
                            팝업레이어가 표시될 접속기기를 설정합니다.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='nw_division'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>구분 *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder='구분을 선택하세요' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(POPUP_DIVISION_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className='text-xs text-gray-500'>팝업이 표시될 영역을 설정합니다.</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='nw_disable_hours'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비활성화 시간 *</FormLabel>
                        <div className='flex items-center space-x-2'>
                          <FormControl>
                            <Input
                              type='number'
                              min='1'
                              placeholder='24'
                              className='w-24'
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <span className='text-sm text-gray-600'>시간</span>
                        </div>
                        <p className='text-xs text-gray-500'>
                          고객이 다시 보지 않음을 선택할 시 몇 시간동안 팝업레이어를 보여주지 않을지
                          설정합니다.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>시간 설정</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <FormField
                      control={form.control}
                      name='nw_begin_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>시작일시 *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  className='w-full justify-start text-left font-normal'
                                >
                                  <CalendarIcon className='mr-2 h-4 w-4' />
                                  {field.value
                                    ? dayjs(field.value).format('YYYY년 MM월 DD일 (00:00)')
                                    : '시작일을 선택하세요'}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0'>
                              <Calendar
                                mode='single'
                                selected={field.value ? dayjs(field.value).toDate() : undefined}
                                onSelect={handleStartDateSelect}
                                captionLayout='dropdown'
                              />
                            </PopoverContent>
                          </Popover>
                          <div className='flex items-center space-x-2 pt-2'>
                            <Checkbox onCheckedChange={handleTodayStart} />
                            <span className='text-sm text-gray-600'>오늘 00:00으로 설정</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='nw_end_time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>종료일시 *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant='outline'
                                  className='w-full justify-start text-left font-normal'
                                >
                                  <CalendarIcon className='mr-2 h-4 w-4' />
                                  {field.value
                                    ? dayjs(field.value).format('YYYY년 MM월 DD일 (23:59)')
                                    : '종료일을 선택하세요'}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0'>
                              <Calendar
                                mode='single'
                                selected={field.value ? dayjs(field.value).toDate() : undefined}
                                onSelect={handleEndDateSelect}
                                captionLayout='dropdown'
                              />
                            </PopoverContent>
                          </Popover>
                          <div className='flex items-center space-x-2 pt-2'>
                            <Checkbox onCheckedChange={handleWeekLaterEnd} />
                            <span className='text-sm text-gray-600'>일주일 후 23:59으로 설정</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>위치 및 크기</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-4 gap-4'>
                    <FormField
                      control={form.control}
                      name='nw_left'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>좌측위치</FormLabel>
                          <div className='flex items-center space-x-2'>
                            <FormControl>
                              <Input
                                type='number'
                                min='0'
                                placeholder='10'
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <span className='text-sm text-gray-500'>px</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='nw_top'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>상단위치</FormLabel>
                          <div className='flex items-center space-x-2'>
                            <FormControl>
                              <Input
                                type='number'
                                min='0'
                                placeholder='10'
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <span className='text-sm text-gray-500'>px</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='nw_width'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>가로크기</FormLabel>
                          <div className='flex items-center space-x-2'>
                            <FormControl>
                              <Input
                                type='number'
                                min='200'
                                placeholder='450'
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <span className='text-sm text-gray-500'>px</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='nw_height'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>세로크기</FormLabel>
                          <div className='flex items-center space-x-2'>
                            <FormControl>
                              <Input
                                type='number'
                                min='100'
                                placeholder='500'
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <span className='text-sm text-gray-500'>px</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>팝업 내용</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='nw_subject'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>팝업 제목 *</FormLabel>
                        <FormControl>
                          <Input placeholder='팝업 제목을 입력하세요' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='nw_content'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>팝업 내용 *</FormLabel>
                        <FormControl>
                          <TiptapEditor
                            content={field.value || ''}
                            onChange={field.onChange}
                            placeholder='팝업 내용을 입력하세요'
                          />
                        </FormControl>
                        <p className='text-xs text-gray-500'>
                          리치 텍스트 에디터를 사용하여 다양한 서식을 적용할 수 있습니다.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className='flex justify-end space-x-3'>
                <Link href={ROUTES.ADMIN_POPUP}>
                  <Button type='button' variant='outline'>
                    취소
                  </Button>
                </Link>
                <Button type='submit' disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? '생성 중...' : '팝업 생성'}
                </Button>
              </div>
            </form>
          </Form>

          <MessageDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title={dialogTitle}
            description={dialogMessage}
            onConfirm={dialogConfirm}
          />
        </div>
      )}
    </>
  );
}
