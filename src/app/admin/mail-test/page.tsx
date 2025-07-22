'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Label } from '@/components/ui/primitives/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/primitives/card';

import { Send, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';

interface TestResult {
  success: boolean;
  sentEmails: string[];
  message: string;
}

export default function MailTestPage() {
  const [emails, setEmails] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);

    // 빈 이메일 필드 제거하고 콤마로 연결
    const validEmails = emails.filter((email) => email.trim() !== '');
    const emailString = validEmails.join(',');

    try {
      const response = await fetch('/api/admin/mail-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailString }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '메일 발송 중 오류가 발생했습니다.');
      }

      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        sentEmails: [],
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className='mb-6'>
        <h1 className='flex items-center text-2xl font-bold'>메일 테스트</h1>
        <p className='text-muted-foreground mt-2'>
          메일 서버가 정상적으로 동작하는지 확인할 수 있습니다.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>테스트 메일 발송</CardTitle>
            <CardDescription>
              아래 입력칸에 테스트 메일을 발송할 메일 주소를 입력하세요.
              <br />
              <strong>보내는 메일 주소:</strong> udign0401@gmail.com
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label>받는 메일 주소</Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={addEmailField}
                    className='flex items-center gap-1'
                  >
                    <Plus className='h-3 w-3' />
                    이메일 추가
                  </Button>
                </div>

                <div className='space-y-3'>
                  {emails.map((email, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <div className='flex-1'>
                        <Input
                          type='email'
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          placeholder={`이메일 주소 ${index + 1}`}
                          required={index === 0 || email.trim() !== ''}
                          className='w-full'
                        />
                      </div>
                      {emails.length > 1 && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => removeEmailField(index)}
                          className='flex h-9 w-9 items-center justify-center p-2 text-red-500 hover:bg-red-50 hover:text-red-700'
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <p className='text-muted-foreground text-sm'>
                  각 입력 필드에 하나의 이메일 주소만 입력하세요. 추가 버튼을 눌러 더 많은 이메일
                  주소를 입력할 수 있습니다.
                </p>
              </div>
              <Button type='submit' disabled={isLoading} className='w-full'>
                {isLoading ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className='h-4 w-4' />
                    테스트 메일 발송
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>안내사항</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3'>
              <AlertCircle className='mt-0.5 h-4 w-4 text-blue-600' />
              <p className='text-sm text-blue-700'>
                <strong>[메일검사]</strong> 라는 제목으로 테스트 메일을 발송합니다.
              </p>
            </div>

            <div className='text-muted-foreground space-y-2 text-sm'>
              <p>
                • 테스트 메일이 도착하지 않는다면 보내는 메일서버 혹은 받는 메일서버 중 문제가
                발생했을 가능성이 있습니다.
              </p>
              <p>• 보다 정확한 테스트를 원한다면 여러 곳으로 테스트 메일을 발송하시기 바랍니다.</p>
              <p>
                • 모든 메일이 도착하지 않는다면 메일 서버(sendmail server)의 오류일 가능성이 높으니,
                웹 서버관리자에게 문의하세요.
              </p>
              <p>• 도메인을 소유하고 있을 시 SPF, DKIM 설정이 필요할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {testResult && (
        <Card className='mt-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {testResult.success ? (
                <CheckCircle className='h-5 w-5 text-green-500' />
              ) : (
                <AlertCircle className='h-5 w-5 text-red-500' />
              )}
              발송 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className='space-y-4'>
                <div className='flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3'>
                  <CheckCircle className='mt-0.5 h-4 w-4 text-green-500' />
                  <p className='text-sm text-green-700'>
                    다음 {testResult.sentEmails.length}개의 메일 주소로 테스트 메일 발송이
                    완료되었습니다.
                  </p>
                </div>

                <div>
                  <h4 className='mb-2 font-medium'>발송된 메일 주소</h4>
                  <ul className='list-inside list-disc space-y-1'>
                    {testResult.sentEmails.map((emailAddr, index) => (
                      <li key={index} className='text-muted-foreground text-sm'>
                        {emailAddr}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className='flex items-start gap-2 rounded-md border border-orange-200 bg-orange-50 p-3'>
                  <AlertCircle className='mt-0.5 h-4 w-4 text-orange-600' />
                  <p className='text-sm text-orange-700'>
                    해당 주소로 테스트 메일이 도착했는지 확인해 주십시오. 메일이 도착하지 않는다면
                    스팸함도 확인해보세요.
                  </p>
                </div>
              </div>
            ) : (
              <div className='flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3'>
                <AlertCircle className='mt-0.5 h-4 w-4 text-red-500' />
                <p className='text-sm text-red-700'>{testResult.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
