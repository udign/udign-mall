'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethodType } from '@/types/payment';
import { Button } from '@/components/ui/primitives/button';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import { CheckCircleIcon } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { formatDateOnly, formatTimeOnly } from '@/lib/utils';

interface PaymentData {
  orderId: string;
  paymentKey: string;
  amount: number;
  method: string;
  approvedAt: string;
}

interface OrderInfo {
  orderId: string;
  amount: number;
  customerName: string;
  orderDate: string;
  orderTime: string;
  paymentMethod: string;
  paymentKey: string;
}

const getPaymentMethodName = (method: PaymentMethodType | string): string => {
  const methodNames: { [key: string]: string } = {
    CARD: '신용카드',
    NAVERPAY: '네이버페이',
    TOSSPAY: '토스페이',
  };
  return methodNames[method] || method;
};

function PaymentSuccessContent() {
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(ROUTES.LOGIN);
      return;
    }

    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const paymentKey = searchParams.get('paymentKey');

    if (paymentKey && orderId && amount) {
      const confirmPayment = async () => {
        try {
          setIsProcessingOrder(true);

          // 토스페이먼츠 결제 승인 요청
          const response = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: parseInt(amount),
            }),
          });

          const result = await response.json();

          if (result.success) {
            const paymentData: PaymentData = result.paymentData;

            setOrderInfo({
              orderId: paymentData.orderId,
              amount: paymentData.amount,
              customerName: user?.mb_name || '',
              orderDate: formatDateOnly(paymentData.approvedAt),
              orderTime: formatTimeOnly(paymentData.approvedAt),
              paymentMethod: getPaymentMethodName(paymentData.method),
              paymentKey: paymentData.paymentKey,
            });
          } else {
            setError(result.error || '결제 승인에 실패했습니다.');
          }
        } catch (err) {
          console.error('결제 승인 처리 오류:', err);
          setError('결제 승인 처리 중 오류가 발생했습니다.');
        } finally {
          setIsProcessingOrder(false);
        }
      };

      confirmPayment();
    } else {
      setError('결제 정보가 누락되었습니다.');
      setIsProcessingOrder(false);
    }
  }, [authLoading, user, searchParams, router]);

  return authLoading || isProcessingOrder ? (
    <LoadingState message='결제 결과를 처리하는 중...' />
  ) : error ? (
    <ErrorState message={error} showGoHome={true} />
  ) : (
    <div className='bg-white'>
      <div className='mx-auto max-w-2xl px-6 py-16'>
        <div className='space-y-8 text-center'>
          <div className='flex justify-center'>
            <div className='flex h-20 w-20 items-center justify-center rounded-full bg-green-100'>
              <CheckCircleIcon className='h-12 w-12 text-green-600' />
            </div>
          </div>

          <div className='space-y-4'>
            <h1 className='text-3xl font-bold text-gray-900'>결제가 완료되었습니다!</h1>
            <p className='text-lg text-gray-600'>주문이 정상적으로 접수되었습니다.</p>
          </div>

          {orderInfo && (
            <div className='space-y-4 rounded-lg border border-gray-200 p-6 text-left'>
              <h2 className='mb-6 text-center text-lg font-semibold text-gray-900'>주문 정보</h2>

              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>주문번호</span>
                  <span className='font-medium'>{orderInfo.orderId}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>주문자</span>
                  <span className='font-medium'>{orderInfo.customerName}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>결제일시</span>
                  <span className='font-medium'>
                    {orderInfo.orderDate} {orderInfo.orderTime}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>결제수단</span>
                  <span className='font-medium'>{orderInfo.paymentMethod}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>결제키</span>
                  <span className='font-mono text-xs font-medium'>
                    {orderInfo.paymentKey.substring(0, 20)}...
                  </span>
                </div>
                <hr />
                <div className='flex justify-between text-lg font-bold'>
                  <span>결제 금액</span>
                  <span className='text-primary'>{orderInfo.amount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          )}

          <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <div className='space-y-1 text-sm text-blue-800'>
              <p>• 주문 내역은 마이페이지에서 확인하실 수 있습니다.</p>
              <p>• 배송 관련 문의는 고객센터로 연락해 주세요.</p>
              <p>• 영수증이 필요하신 경우 고객센터로 문의해 주세요.</p>
              <p>• 결제 관련 문의는 토스페이먼츠 고객센터 1899-4905로 연락해 주세요.</p>
            </div>
          </div>

          <div className='space-y-3'>
            <Button
              onClick={() => router.push(ROUTES.MY_UDIGN)}
              className='bg-primary hover:bg-primary/90 w-full text-white'
              size='lg'
            >
              주문 내역 확인
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push(ROUTES.SHOP)}
              className='w-full'
              size='lg'
            >
              쇼핑 계속하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingState message='결제 결과를 불러오는 중...' />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
