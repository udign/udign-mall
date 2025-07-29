'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentMethodType } from '@/types/payment';
import { Button } from '@/components/ui/primitives/button';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import { CheckCircleIcon } from 'lucide-react';
import { ROUTES } from '@/lib/routes';
import { formatDateOnly, formatTimeOnly } from '@/lib/utils';
import { Dictionary } from '@/lib/dictionaries';

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

const getPaymentMethodName = (
  method: PaymentMethodType | string,
  dictionary: Dictionary,
): string => {
  const methodNames: { [key: string]: string } = {
    CARD: dictionary.checkout.creditCard,
    NAVERPAY: '네이버페이',
    TOSSPAY: '토스페이',
  };
  return methodNames[method] || method;
};

interface PaymentSuccessContentProps {
  dictionary: Dictionary;
}

export default function PaymentSuccessContent({ dictionary }: PaymentSuccessContentProps) {
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
              paymentMethod: getPaymentMethodName(paymentData.method, dictionary),
              paymentKey: paymentData.paymentKey,
            });
          } else {
            setError(result.error || dictionary.paymentSuccess.errors.approvalFailed);
          }
        } catch (err) {
          console.error('결제 승인 처리 오류:', err);
          setError(dictionary.paymentSuccess.errors.processingError);
        } finally {
          setIsProcessingOrder(false);
        }
      };

      confirmPayment();
    } else {
      setError(dictionary.paymentSuccess.errors.missingPaymentInfo);
      setIsProcessingOrder(false);
    }
  }, [authLoading, user, searchParams, router, dictionary]);

  return authLoading || isProcessingOrder ? (
    <LoadingState message={dictionary.paymentSuccess.processingResult} dictionary={dictionary} />
  ) : error ? (
    <ErrorState message={error} showGoHome={true} dictionary={dictionary} />
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
            <h1 className='text-3xl font-bold text-gray-900'>{dictionary.paymentSuccess.title}</h1>
            <p className='text-lg text-gray-600'>{dictionary.paymentSuccess.subtitle}</p>
          </div>

          {orderInfo && (
            <div className='space-y-4 rounded-lg border border-gray-200 p-6 text-left'>
              <h2 className='mb-6 text-center text-lg font-semibold text-gray-900'>
                {dictionary.paymentSuccess.orderInfo}
              </h2>

              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>{dictionary.paymentSuccess.orderId}</span>
                  <span className='font-medium'>{orderInfo.orderId}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>{dictionary.paymentSuccess.customer}</span>
                  <span className='font-medium'>{orderInfo.customerName}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>{dictionary.paymentSuccess.paymentDate}</span>
                  <span className='font-medium'>
                    {orderInfo.orderDate} {orderInfo.orderTime}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>{dictionary.paymentSuccess.paymentMethod}</span>
                  <span className='font-medium'>{orderInfo.paymentMethod}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>{dictionary.paymentSuccess.paymentKey}</span>
                  <span className='font-mono text-xs font-medium'>
                    {orderInfo.paymentKey.substring(0, 20)}...
                  </span>
                </div>
                <hr />
                <div className='flex justify-between text-lg font-bold'>
                  <span>{dictionary.paymentSuccess.paymentAmount}</span>
                  <span className='text-primary'>{orderInfo.amount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          )}

          <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <div className='space-y-1 text-sm text-blue-800'>
              <p>{dictionary.paymentSuccess.notices.orderHistory}</p>
              <p>{dictionary.paymentSuccess.notices.shippingInquiry}</p>
              <p>{dictionary.paymentSuccess.notices.receiptInquiry}</p>
              <p>{dictionary.paymentSuccess.notices.paymentInquiry}</p>
            </div>
          </div>

          <div className='space-y-3'>
            <Button
              onClick={() => router.push(ROUTES.MY_UDIGN)}
              className='bg-primary hover:bg-primary/90 w-full text-white'
              size='lg'
            >
              {dictionary.paymentSuccess.orderDetailsButton}
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push(ROUTES.SHOP)}
              className='w-full'
              size='lg'
            >
              {dictionary.paymentSuccess.continueShopping}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
