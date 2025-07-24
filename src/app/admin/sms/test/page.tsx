'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
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
import { Textarea } from '@/components/ui/primitives/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives/select';
import { Separator } from '@/components/ui/primitives/separator';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/primitives/popover';
import {
  AlertTriangle,
  CheckCircle,
  Send,
  Plus,
  Smile,
  Hash,
  User,
  Users,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  SMSConfig,
  SMSTestFormData,
  SMSTestRequest,
  SMSTestResponse,
  SMSRecipient,
  SMS_SPECIAL_CHARS,
  SMS_EMOTICONS,
} from '@/types/sms';
import MessageDialog from '@/components/ui/MessageDialog';

export default function SMSTestPage() {
  const [config, setConfig] = useState<SMSConfig | null>(null);
  const [formData, setFormData] = useState<SMSTestFormData>({
    message: '',
    recipients: [],
    replyNumber: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [messageLength, setMessageLength] = useState<number>(0);
  const [newRecipient, setNewRecipient] = useState<{ name: string; phone: string }>({
    name: '',
    phone: '',
  });
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [sendResults, setSendResults] = useState<SMSTestResponse | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [dialogTitle, setDialogTitle] = useState<string>('');
  const [dialogDescription, setDialogDescription] = useState<string>('');

  // 설정 로드
  useEffect(() => {
    loadConfig();
  }, []);

  // 메시지 길이 계산 (한글은 2바이트, 영문은 1바이트)
  useEffect(() => {
    const calculateByteLength = (text: string) => {
      let length = 0;
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        if (charCode > 127) {
          length += 2;
        } else {
          length += 1;
        }
      }
      return length;
    };
    setMessageLength(calculateByteLength(formData.message));
  }, [formData.message]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/sms/config');
      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
        setFormData((prev) => ({
          ...prev,
          replyNumber: result.data.cf_phone || '',
        }));
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

  // alert 대신 dialog를 보여주는 함수
  const showAlert = (title: string, description?: string) => {
    setDialogTitle(title);
    setDialogDescription(description || '');
    setShowDialog(true);
  };

  const addRecipient = () => {
    if (!newRecipient.phone.trim()) {
      showAlert('입력 오류', '휴대폰 번호를 입력해주세요.');
      return;
    }

    // 휴대폰 번호 형식 검증
    const phoneRegex = /^01[016789][0-9]{3,4}[0-9]{4}$/;
    const formattedPhone = newRecipient.phone.replace(/[^0-9]/g, '');

    if (!phoneRegex.test(formattedPhone)) {
      showAlert('형식 오류', '휴대폰 번호 형식이 올바르지 않습니다.');
      return;
    }

    // 중복 확인
    if (formData.recipients.some((r) => r.phone === formattedPhone)) {
      showAlert('중복 오류', '이미 같은 번호가 목록에 있습니다.');
      return;
    }

    const recipient: SMSRecipient = {
      id: dayjs().valueOf().toString(),
      name: newRecipient.name.trim() || formattedPhone,
      phone: formattedPhone,
      type: 'individual',
    };

    setFormData((prev) => ({
      ...prev,
      recipients: [...prev.recipients, recipient],
    }));

    setNewRecipient({ name: '', phone: '' });
  };

  const removeRecipient = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r.id !== id),
    }));
  };

  const addSpecialChar = (char: string) => {
    setFormData((prev) => ({
      ...prev,
      message: prev.message + char,
    }));
  };

  const handleSend = async () => {
    if (!formData.message.trim()) {
      showAlert('입력 오류', '메시지를 입력해주세요.');
      return;
    }

    if (formData.recipients.length === 0) {
      showAlert('입력 오류', '수신자를 추가해주세요.');
      return;
    }

    if (!formData.replyNumber.trim()) {
      showAlert('입력 오류', '회신번호를 입력해주세요.');
      return;
    }

    setSending(true);
    setMessage(null);
    setSendResults(null);

    try {
      const request: SMSTestRequest = {
        message: formData.message,
        recipients: formData.recipients.map((r) => ({
          name: r.name,
          phone: r.phone,
        })),
        replyNumber: formData.replyNumber,
        scheduled:
          isScheduled && formData.scheduled
            ? `${formData.scheduled.year}-${formData.scheduled.month.toString().padStart(2, '0')}-${formData.scheduled.day.toString().padStart(2, '0')} ${formData.scheduled.hour.toString().padStart(2, '0')}:${formData.scheduled.minute.toString().padStart(2, '0')}:00`
            : undefined,
      };

      const response = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result: SMSTestResponse = await response.json();

      if (result.success) {
        setSendResults(result);
        setMessage({
          type: 'success',
          text: `SMS 전송 완료! 성공: ${result.totalSent}건, 실패: ${result.totalFailed}건`,
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'SMS 전송에 실패했습니다.' });
      }
    } catch (error) {
      console.error('SMS 전송 실패:', error);
      setMessage({ type: 'error', text: 'SMS 전송 중 오류가 발생했습니다.' });
    } finally {
      setSending(false);
    }
  };

  const isSMSEnabled = config?.cf_sms_use === 'icode';
  const hasCredentials = (config?.cf_icode_id && config?.cf_icode_pw) || config?.cf_icode_token_key;
  const maxBytes = config?.cf_sms_type === 'LMS' ? (messageLength > 90 ? 2000 : 90) : 80;

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
        <h1 className='text-2xl font-bold text-gray-900'>SMS 발송 테스트</h1>
        <p className='text-muted-foreground'>SMS 메시지를 테스트로 발송해볼 수 있습니다.</p>
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

      {(!isSMSEnabled || !hasCredentials) && (
        <div className='flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-4'>
          <AlertTriangle className='h-4 w-4 text-amber-600' />
          <div className='text-amber-600'>
            SMS 기능을 사용하려면 먼저 SMS 기본설정을 완료해야 합니다.
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Send className='h-5 w-5' />
              메시지 작성
            </CardTitle>
            <CardDescription>
              발송할 메시지를 작성하세요. {'{이름}'} 변수를 사용하면 수신자별로 개인화됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='message'>메시지 내용</Label>
                <div className='flex items-center gap-2'>
                  <span
                    className={`text-sm ${messageLength > maxBytes ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    {messageLength} / {maxBytes} 바이트
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      config?.cf_sms_type === 'LMS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {config?.cf_sms_type || 'SMS'}
                  </span>
                </div>
              </div>
              <Textarea
                id='message'
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder='발송할 메시지를 입력하세요...'
                rows={6}
                className='resize-none'
                maxLength={config?.cf_sms_type === 'LMS' ? 2000 : 80}
              />

              <div className='flex gap-2'>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <Hash className='mr-1 h-4 w-4' />
                      특수문자
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-80'>
                    <div className='grid grid-cols-8 gap-1'>
                      {SMS_SPECIAL_CHARS.map((char) => (
                        <Button
                          key={char}
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0'
                          onClick={() => addSpecialChar(char)}
                        >
                          {char}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant='outline' size='sm'>
                      <Smile className='mr-1 h-4 w-4' />
                      이모티콘
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-80'>
                    <div className='grid grid-cols-4 gap-1'>
                      {SMS_EMOTICONS.map((emoticon) => (
                        <Button
                          key={emoticon}
                          variant='ghost'
                          size='sm'
                          className='h-8 text-xs'
                          onClick={() => addSpecialChar(emoticon)}
                        >
                          {emoticon}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button variant='outline' size='sm' onClick={() => addSpecialChar('{이름}')}>
                  {'{이름}'}
                </Button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='reply_number'>회신번호</Label>
              <Input
                id='reply_number'
                type='tel'
                value={formData.replyNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, replyNumber: e.target.value }))}
                placeholder='010-1234-5678'
              />
            </div>

            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='scheduled'
                  checked={isScheduled}
                  onCheckedChange={(checked) => setIsScheduled(checked === true)}
                />
                <Label htmlFor='scheduled' className='flex items-center gap-2'>
                  <Clock className='h-4 w-4' />
                  예약 전송
                </Label>
              </div>

              {isScheduled && (
                <div className='grid grid-cols-5 gap-2'>
                  <Select
                    value={formData.scheduled?.year?.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled: { ...prev.scheduled!, year: parseInt(value) },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='년' />
                    </SelectTrigger>
                    <SelectContent>
                      {[dayjs().year(), dayjs().year() + 1].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}년
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.scheduled?.month?.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled: { ...prev.scheduled!, month: parseInt(value) },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='월' />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {month}월
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.scheduled?.day?.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled: { ...prev.scheduled!, day: parseInt(value) },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='일' />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}일
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.scheduled?.hour?.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled: { ...prev.scheduled!, hour: parseInt(value) },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='시' />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour}시
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={formData.scheduled?.minute?.toString()}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        scheduled: { ...prev.scheduled!, minute: parseInt(value) },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='분' />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                        <SelectItem key={minute} value={minute.toString()}>
                          {minute}분
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 수신자 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              수신자 관리
            </CardTitle>
            <CardDescription>SMS를 받을 사람들을 추가하세요.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>새 수신자 추가</Label>
              <div className='space-y-2'>
                <Input
                  placeholder='이름 (선택사항)'
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient((prev) => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder='휴대폰 번호'
                  value={newRecipient.phone}
                  onChange={(e) => setNewRecipient((prev) => ({ ...prev, phone: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addRecipient()}
                />
                <Button onClick={addRecipient} className='w-full' size='sm'>
                  <Plus className='h-4 w-4' />
                  추가
                </Button>
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <Label>수신자 목록 ({formData.recipients.length}명)</Label>
              <div className='max-h-48 space-y-1 overflow-y-auto'>
                {formData.recipients.length === 0 ? (
                  <p className='text-muted-foreground text-sm'>수신자가 없습니다.</p>
                ) : (
                  formData.recipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className='flex items-center justify-between rounded border p-2'
                    >
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4' />
                        <div>
                          <div className='text-sm font-medium'>{recipient.name}</div>
                          <div className='text-muted-foreground text-xs'>{recipient.phone}</div>
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => removeRecipient(recipient.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 전송 버튼 */}
      <div className='flex justify-end'>
        <Button
          onClick={handleSend}
          disabled={sending || !isSMSEnabled || !hasCredentials}
          size='lg'
        >
          {sending ? (
            <>
              <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
              전송 중...
            </>
          ) : (
            <>
              <Send className='h-4 w-4' />
              SMS 전송
            </>
          )}
        </Button>
      </div>

      {/* 전송 결과 */}
      {sendResults && (
        <Card>
          <CardHeader>
            <CardTitle>전송 결과</CardTitle>
            <CardDescription>
              총 {sendResults.totalSent + sendResults.totalFailed}건 중 {sendResults.totalSent}건
              성공, {sendResults.totalFailed}건 실패
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {sendResults.results?.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between rounded border p-2 ${
                    result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className='flex items-center gap-2'>
                    {result.success ? (
                      <CheckCircle className='h-4 w-4 text-green-600' />
                    ) : (
                      <AlertTriangle className='h-4 w-4 text-red-600' />
                    )}
                    <div>
                      <div className='text-sm font-medium'>{result.name}</div>
                      <div className='text-muted-foreground text-xs'>{result.phone}</div>
                    </div>
                  </div>
                  <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.message}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <MessageDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title={dialogTitle}
        description={dialogDescription}
      />
    </div>
  );
}
