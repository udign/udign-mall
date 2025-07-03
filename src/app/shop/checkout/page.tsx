'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentItem, PaymentRequest, PaymentMethodType } from '@/types/payment';
import { Button } from '@/components/ui/primitives/button';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type {
  WidgetSelectedPaymentMethod,
  WidgetPaymentMethodWidget,
  WidgetAgreementWidget,
  TossPaymentsWidgets,
} from '@tosspayments/tosspayments-sdk';

const clientKey = 'test_gck_EP59LybZ8B9gD7oZaa7kr6GYo7pR';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  detailAddress: string;
  zipCode: string;
}

export default function CheckoutPage() {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [paymentMethodsWidget, setPaymentMethodsWidget] =
    useState<WidgetPaymentMethodWidget | null>(null);
  const [agreementWidget, setAgreementWidget] = useState<WidgetAgreementWidget | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('CARD');
  const [amount, setAmount] = useState({
    currency: 'KRW',
    value: 0,
  });

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    detailAddress: '',
    zipCode: '',
  });
  const [orderItems, setOrderItems] = useState<PaymentItem[]>([]);

  const [isPaymentSystemLoading, setIsPaymentSystemLoading] = useState<boolean>(true);
  const [isPaymentWidgetReady, setIsPaymentWidgetReady] = useState<boolean>(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false);
  const [isAgreementAccepted, setIsAgreementAccepted] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isLoading: authLoading } = useAuth();

  const orderId = useMemo(() => uuidv4(), []);

  // 인증 상태 체크, 상품 정보 가져오기 및 구매자 정보 설정
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/shop/login');
      return;
    }

    setCustomerInfo((prev) => ({
      ...prev,
      name: user.mb_name || '',
      email: user.mb_email || '',
      phone: user.mb_hp || '',
    }));

    const itemId = searchParams.get('itemId');
    const quantity = parseInt(searchParams.get('quantity') || '1');

    const fetchItemInfo = async (itemId: string, quantity: number) => {
      try {
        const response = await fetch(`/api/products/${itemId}`);
        const data = await response.json();

        if (data.success) {
          const { product } = data;
          const { it_id, it_name, it_price, it_img1 } = product;
          const totalPrice = product.it_price * quantity;
          const item: PaymentItem = {
            it_id,
            it_name,
            it_price,
            quantity,
            totalPrice,
            it_img1,
          };

          setOrderItems([item]);
          setAmount((prev) => ({
            ...prev,
            value: totalPrice,
          }));
        } else {
          setError('상품 정보를 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('상품 정보 조회 오류:', err);
        setError('서버 오류가 발생했습니다.');
      }
    };

    if (itemId) {
      fetchItemInfo(itemId, quantity);
    } else {
      setError('상품 정보가 없습니다.');
      setIsPaymentSystemLoading(false);
    }
  }, [authLoading, user, searchParams, router]);

  // 결제 위젯 인스턴스 생성
  useEffect(() => {
    if (!user) return;

    const initializePaymentWidget = async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey);

        const widgetInstance = tossPayments.widgets({
          customerKey: 'By2OIT0GcNVub6nYuallA',
        });

        setWidgets(widgetInstance);
        setIsPaymentSystemLoading(false);
      } catch (err) {
        console.error('토스페이먼츠 초기화 실패:', err);
        setError('결제 시스템을 불러올 수 없습니다.');
        setIsPaymentSystemLoading(false);
      }
    };

    initializePaymentWidget();
  }, [user]);

  // 결제 위젯 렌더링
  useEffect(() => {
    if (!widgets || amount.value <= 0) return;

    const renderPaymentWidget = async () => {
      try {
        // 기존 위젯이 있다면 먼저 정리
        if (paymentMethodsWidget) {
          await paymentMethodsWidget.destroy();
          setPaymentMethodsWidget(null);
        }
        if (agreementWidget) {
          await agreementWidget.destroy();
          setAgreementWidget(null);
        }

        // 위젯 상태 초기화
        setIsPaymentWidgetReady(false);

        // 주문의 결제 금액 설정
        await widgets.setAmount(amount);

        // 결제 UI 렌더링
        const paymentMethodWidgetInstance = await widgets.renderPaymentMethods({
          selector: '#payment-methods',
          variantKey: 'DEFAULT',
        });

        // 이용약관 UI 렌더링
        const agreementWidgetInstance = await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });

        paymentMethodWidgetInstance.on(
          'paymentMethodSelect',
          (selectedPaymentMethod: WidgetSelectedPaymentMethod) => {
            const method = selectedPaymentMethod.code as PaymentMethodType;
            setSelectedPaymentMethod(method);
          },
        );

        agreementWidgetInstance.on('agreementStatusChange', (agreementStatus) => {
          setIsAgreementAccepted(agreementStatus.agreedRequiredTerms);
        });

        setPaymentMethodsWidget(paymentMethodWidgetInstance);
        setAgreementWidget(agreementWidgetInstance);
        setIsPaymentWidgetReady(true);
      } catch (err) {
        console.error('결제 위젯 렌더링 실패:', err);
        setError('결제 위젯 렌더링에 실패했습니다.');
      }
    };

    renderPaymentWidget();
  }, [widgets, amount.value]);

  const cleanupWidgets = useCallback(async () => {
    if (paymentMethodsWidget) {
      await paymentMethodsWidget.destroy();
      setPaymentMethodsWidget(null);
    }
    if (agreementWidget) {
      await agreementWidget.destroy();
      setAgreementWidget(null);
    }
  }, [paymentMethodsWidget, agreementWidget]);

  useEffect(() => {
    return () => {
      cleanupWidgets();
    };
  }, [cleanupWidgets]);

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  // 결제 요청
  const handlePayment = async () => {
    if (!widgets || orderItems.length === 0 || isPaymentProcessing || !isAgreementAccepted) return;

    setIsPaymentProcessing(true);

    try {
      const paymentRequest: PaymentRequest = {
        items: orderItems,
        customerInfo,
        paymentMethod: selectedPaymentMethod,
        totalAmount: getTotalAmount(),
        orderId,
      };

      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentRequest),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error || '주문 생성에 실패했습니다.');
      }

      // 토스페이먼츠 결제 요청
      await widgets.requestPayment({
        orderId: orderId,
        orderName:
          orderItems.length === 1
            ? orderItems[0].it_name
            : `${orderItems[0].it_name} 외 ${orderItems.length - 1}건`,
        successUrl: `${window.location.origin}/shop/checkout/success`,
        failUrl: `${window.location.origin}/shop/checkout/fail`,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerMobilePhone: customerInfo.phone,
      });
    } catch (err) {
      console.error('결제 요청 실패:', err);
      alert('결제 요청에 실패했습니다.');
      setIsPaymentProcessing(false);
    }
  };

  return authLoading || isPaymentSystemLoading ? (
    <LoadingState message='결제 페이지를 준비하는 중...' />
  ) : error ? (
    <ErrorState message={error} showGoHome={true} />
  ) : (
    <div className='min-h-screen bg-white'>
      <div className='px-6 py-8 sm:px-10'>
        <h1 className='mb-8 text-2xl font-bold text-gray-900'>주문/결제</h1>

        <div className='grid gap-8 lg:grid-cols-2'>
          <div className='space-y-6'>
            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>주문 상품</h2>
              <div className='space-y-4'>
                {orderItems.map((item) => (
                  <div key={item.it_id} className='flex items-center gap-4'>
                    <div className='h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200'>
                      {item.it_img1 ? (
                        <Image
                          src={item.it_img1}
                          alt={item.it_name}
                          width={80}
                          height={80}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center text-xs text-gray-400'>
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-medium text-gray-900'>{item.it_name}</h3>
                      <p className='text-sm text-gray-600'>
                        {item.it_price.toLocaleString()}원 × {item.quantity}개
                      </p>
                      <p className='text-primary text-lg font-semibold'>
                        {item.totalPrice.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>배송 정보</h2>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>받는 분</label>
                    <input
                      type='text'
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>연락처</label>
                    <input
                      type='tel'
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                    />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>이메일</label>
                  <input
                    type='email'
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                  />
                </div>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>우편번호</label>
                    <input
                      type='text'
                      value={customerInfo.zipCode}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({ ...prev, zipCode: e.target.value }))
                      }
                      className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                    />
                  </div>
                  <div className='col-span-2'>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>주소</label>
                    <input
                      type='text'
                      value={customerInfo.address}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))
                      }
                      className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                    />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>상세 주소</label>
                  <input
                    type='text'
                    value={customerInfo.detailAddress}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, detailAddress: e.target.value }))
                    }
                    className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-6'>
            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>결제 수단</h2>
              <div id='payment-methods' />
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>결제 금액</h2>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>상품 금액</span>
                  <span className='font-medium'>{getTotalAmount().toLocaleString()}원</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>배송비</span>
                  <span className='font-medium'>무료</span>
                </div>
                <hr className='my-3' />
                <div className='flex justify-between text-lg font-bold'>
                  <span>총 결제 금액</span>
                  <span className='text-primary'>{getTotalAmount().toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>이용약관 동의</h2>
              <div id='agreement' />
            </div>

            <div className='space-y-3'>
              <Button
                onClick={handlePayment}
                className='bg-primary hover:bg-primary/90 w-full text-white'
                size='lg'
                disabled={
                  !customerInfo.name ||
                  !customerInfo.email ||
                  !customerInfo.phone ||
                  !isPaymentWidgetReady ||
                  !isAgreementAccepted ||
                  isPaymentProcessing
                }
              >
                {isPaymentProcessing
                  ? '결제 처리 중...'
                  : `${getTotalAmount().toLocaleString()}원 결제하기`}
              </Button>
              <Button
                variant='outline'
                onClick={() => router.back()}
                className='w-full'
                size='lg'
                disabled={isPaymentProcessing}
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
