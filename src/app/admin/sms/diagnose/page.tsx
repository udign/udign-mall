'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { Button } from '@/components/ui/primitives/button';
import { Separator } from '@/components/ui/primitives/separator';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Settings,
  Database,
  Info,
} from 'lucide-react';

interface DiagnosisResult {
  timestamp: string;
  overall_status: string;
  issues: string[];
  warnings: string[];
  configs: {
    smsConfig?: {
      cf_sms_use: string;
      cf_sms_type: string;
      cf_phone: string;
      cf_icode_token_key: string;
      cf_icode_id: string;
    };
    smsSettings?: {
      de_sms_use2: boolean;
      de_sms_use3: boolean;
      bank_account: string;
      de_admin_company_name: string;
    };
    canSendSMS?: boolean;
    configColumns?: string[];
  };
  recommendations: string[];
}

export default function SMSDiagnosePage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/sms/diagnose');
      const result = await response.json();

      if (result.success) {
        setDiagnosis(result.diagnosis);
      } else {
        setError(result.error || 'SMS 진단에 실패했습니다.');
      }
    } catch (err) {
      console.error('SMS 진단 오류:', err);
      setError('SMS 진단 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnosis();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '정상':
        return (
          <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
            정상
          </span>
        );
      case '경고':
        return (
          <span className='inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800'>
            경고
          </span>
        );
      case '오류':
        return (
          <span className='inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800'>
            오류
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800'>
            {status}
          </span>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>SMS 진단</h1>
          <p className='text-gray-600'>무통장 입금 SMS 발송 상태를 진단합니다.</p>
        </div>
        <Button onClick={runDiagnosis} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '진단 중...' : '다시 진단'}
        </Button>
      </div>

      {error && (
        <Card className='border-red-200'>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='h-5 w-5' />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {diagnosis && !loading && (
        <>
          {/* 전체 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                전체 진단 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>진단 시간</span>
                  <span className='text-sm font-medium'>
                    {formatTimestamp(diagnosis.timestamp)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>전체 상태</span>
                  {getStatusBadge(diagnosis.overall_status)}
                </div>
                <div className='grid grid-cols-3 gap-4 text-center'>
                  <div className='space-y-2'>
                    <div className='text-2xl font-bold text-red-600'>{diagnosis.issues.length}</div>
                    <div className='text-sm text-gray-600'>오류</div>
                  </div>
                  <div className='space-y-2'>
                    <div className='text-2xl font-bold text-yellow-600'>
                      {diagnosis.warnings.length}
                    </div>
                    <div className='text-sm text-gray-600'>경고</div>
                  </div>
                  <div className='space-y-2'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {diagnosis.recommendations.length}
                    </div>
                    <div className='text-sm text-gray-600'>권장사항</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 오류 목록 */}
          {diagnosis.issues.length > 0 && (
            <Card className='border-red-200'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-red-700'>
                  <AlertTriangle className='h-5 w-5' />
                  오류 ({diagnosis.issues.length}개)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  {diagnosis.issues.map((issue, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-red-500' />
                      <span className='text-sm text-red-700'>{issue}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 경고 목록 */}
          {diagnosis.warnings.length > 0 && (
            <Card className='border-yellow-200'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-yellow-700'>
                  <AlertCircle className='h-5 w-5' />
                  경고 ({diagnosis.warnings.length}개)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  {diagnosis.warnings.map((warning, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-500' />
                      <span className='text-sm text-yellow-700'>{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 권장사항 */}
          {diagnosis.recommendations.length > 0 && (
            <Card className='border-blue-200'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-blue-700'>
                  <Info className='h-5 w-5' />
                  권장사항 ({diagnosis.recommendations.length}개)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-2'>
                  {diagnosis.recommendations.map((recommendation, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <CheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500' />
                      <span className='text-sm text-blue-700'>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* 설정 상세 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Database className='h-5 w-5' />
                설정 상세 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {/* SMS 기본 설정 */}
                {diagnosis.configs.smsConfig && (
                  <div>
                    <h4 className='mb-2 font-medium text-gray-900'>SMS 기본 설정</h4>
                    <div className='space-y-2 rounded-lg bg-gray-50 p-4'>
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <span className='text-gray-600'>SMS 사용:</span>
                          <span
                            className={`ml-2 font-medium ${
                              diagnosis.configs.smsConfig.cf_sms_use === 'icode'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {diagnosis.configs.smsConfig.cf_sms_use || '비활성화'}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-600'>SMS 타입:</span>
                          <span className='ml-2 font-medium'>
                            {diagnosis.configs.smsConfig.cf_sms_type}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-600'>회신번호:</span>
                          <span
                            className={`ml-2 font-medium ${
                              diagnosis.configs.smsConfig.cf_phone
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {diagnosis.configs.smsConfig.cf_phone || '설정되지 않음'}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-600'>인증방식:</span>
                          <span className='ml-2 font-medium'>
                            {diagnosis.configs.smsConfig.cf_icode_token_key
                              ? '토큰키'
                              : diagnosis.configs.smsConfig.cf_icode_id
                                ? 'ID/PW'
                                : '설정되지 않음'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SMS 사용 설정 */}
                {diagnosis.configs.smsSettings && (
                  <div>
                    <h4 className='mb-2 font-medium text-gray-900'>SMS 사용 설정</h4>
                    <div className='space-y-2 rounded-lg bg-gray-50 p-4'>
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <span className='text-gray-600'>무통장입금 SMS:</span>
                          <span
                            className={`ml-2 font-medium ${
                              diagnosis.configs.smsSettings.de_sms_use2
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {diagnosis.configs.smsSettings.de_sms_use2 ? '활성화' : '비활성화'}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-600'>일반주문 SMS:</span>
                          <span
                            className={`ml-2 font-medium ${
                              diagnosis.configs.smsSettings.de_sms_use3
                                ? 'text-green-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {diagnosis.configs.smsSettings.de_sms_use3 ? '활성화' : '비활성화'}
                          </span>
                        </div>
                        <div className='col-span-2'>
                          <span className='text-gray-600'>계좌번호:</span>
                          <span
                            className={`ml-2 font-medium ${
                              diagnosis.configs.smsSettings.bank_account &&
                              diagnosis.configs.smsSettings.bank_account !==
                                '계좌정보를 설정해주세요'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {diagnosis.configs.smsSettings.bank_account || '설정되지 않음'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className='mb-2 font-medium text-gray-900'>기타 정보</h4>
                  <div className='space-y-2 rounded-lg bg-gray-50 p-4'>
                    <div className='text-sm'>
                      <span className='text-gray-600'>SMS 발송 가능:</span>
                      <span
                        className={`ml-2 font-medium ${
                          diagnosis.configs.canSendSMS ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {diagnosis.configs.canSendSMS ? '예' : '아니오'}
                      </span>
                    </div>
                    {diagnosis.configs.configColumns && (
                      <div className='text-sm'>
                        <span className='text-gray-600'>설정 컬럼:</span>
                        <span className='ml-2 font-medium text-green-600'>
                          {diagnosis.configs.configColumns.length}개 확인됨
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 성공 메시지 */}
          {diagnosis.issues.length === 0 && diagnosis.warnings.length === 0 && (
            <Card className='border-green-200'>
              <CardContent className='pt-6'>
                <div className='flex items-center gap-2 text-green-600'>
                  <CheckCircle className='h-5 w-5' />
                  <span className='font-medium'>SMS 설정이 정상적으로 구성되어 있습니다!</span>
                </div>
                <p className='mt-2 text-sm text-green-600'>
                  무통장 입금 시 SMS가 정상적으로 발송됩니다.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
