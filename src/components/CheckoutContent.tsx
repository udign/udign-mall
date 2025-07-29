'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentItem, PaymentRequest, PaymentMethodType } from '@/types/payment';
import { Button } from '@/components/ui/primitives/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/primitives/radio-group';
import { Label } from '@/components/ui/primitives/label';
import { Checkbox } from '@/components/ui/primitives/checkbox';
import LoadingState from '@/components/states/LoadingState';
import ErrorState from '@/components/states/ErrorState';
import MessageDialog from '@/components/ui/MessageDialog';
import Image from 'next/image';
import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type { TossPaymentsPayment } from '@tosspayments/tosspayments-sdk';
import { ROUTES } from '@/lib/routes';
import { Dictionary } from '@/lib/dictionaries';

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  detailAddress: string;
  zipCode: string;
}

interface MessageDialogState {
  title: string;
  description: string;
}

interface CheckoutContentProps {
  dictionary: Dictionary;
}

export default function CheckoutContent({ dictionary }: CheckoutContentProps) {
  const [payment, setPayment] = useState<TossPaymentsPayment | null>(null);
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
  const [selectedOptions, setSelectedOptions] = useState<
    Array<{
      io_id: string;
      option_display: string;
      io_price: number;
    }>
  >([]);
  const [messageDialogContent, setMessageDialogContent] = useState<MessageDialogState>({
    title: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const [isPaymentSystemLoading, setIsPaymentSystemLoading] = useState<boolean>(true);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState<boolean>(false);
  const [showMessageDialog, setShowMessageDialog] = useState<boolean>(false);
  const [termsAgreed, setTermsAgreed] = useState({
    finance: true,
    privacy: true,
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isLoading: authLoading } = useAuth();

  const orderId = useMemo(() => Date.now().toString(), []);

  const isPaymentDisabled =
    !customerInfo.name ||
    !customerInfo.email ||
    !customerInfo.phone ||
    !customerInfo.address ||
    !customerInfo.detailAddress ||
    !customerInfo.zipCode ||
    !payment ||
    isPaymentProcessing ||
    !termsAgreed.finance ||
    !termsAgreed.privacy;

  // 인증 상태 체크, 상품 정보 가져오기 및 구매자 정보 설정
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push(ROUTES.LOGIN);
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
    const optionIds = searchParams.get('optionIds')?.split(',') || [];

    const fetchItemInfo = async (itemId: string, quantity: number, optionIds: string[]) => {
      try {
        const response = await fetch(`/api/products/${itemId}`);
        const data = await response.json();

        if (data.success) {
          const { product } = data;
          const { it_id, it_name, it_price: basePrice, it_img1, options } = product;

          // 선택된 옵션들 찾기
          const selectedOptionsList = optionIds
            .map((optionId) =>
              options?.find(
                (opt: { io_id: string; option_display: string; io_price: number }) =>
                  opt.io_id === optionId,
              ),
            )
            .filter(
              (option): option is { io_id: string; option_display: string; io_price: number } =>
                option != null,
            );

          // 옵션 추가 금액 계산
          const optionTotalPrice = selectedOptionsList.reduce(
            (sum, option) => sum + option.io_price,
            0,
          );

          const totalPrice = (basePrice + optionTotalPrice) * quantity;

          const item: PaymentItem = {
            it_id,
            it_name,
            it_price: basePrice,
            quantity,
            totalPrice,
            it_img1,
          };

          setOrderItems([item]);
          setSelectedOptions(selectedOptionsList);
          setAmount((prev) => ({
            ...prev,
            value: totalPrice,
          }));
        } else {
          setError(dictionary.checkout.errors.failedToLoadProduct);
        }
      } catch (err) {
        console.error('상품 정보 조회 오류:', err);
        setError(dictionary.checkout.errors.serverError);
      }
    };

    if (itemId) {
      fetchItemInfo(itemId, quantity, optionIds);
    } else {
      setError(dictionary.checkout.errors.noProductInfo);
      setIsPaymentSystemLoading(false);
    }
  }, [authLoading, user, searchParams, router, dictionary]);

  // 결제 인스턴스 생성
  useEffect(() => {
    if (!user) return;

    const initializePayment = async () => {
      try {
        if (!CLIENT_KEY) {
          throw new Error(dictionary.checkout.errors.paymentSystemError);
        }

        const tossPayments = await loadTossPayments(CLIENT_KEY);

        const paymentInstance = tossPayments.payment({
          customerKey: 'By2OIT0GcNVub6nYuallA',
        });

        setPayment(paymentInstance);
        setIsPaymentSystemLoading(false);
      } catch (err) {
        console.error('토스페이먼츠 초기화 실패:', err);
        setError(dictionary.checkout.errors.paymentSystemError);
        setIsPaymentSystemLoading(false);
      }
    };

    initializePayment();
  }, [user, dictionary]);

  const getTotalAmount = () => {
    return orderItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  // 결제 요청
  const handlePayment = async () => {
    if (!payment || orderItems.length === 0 || isPaymentProcessing) return;

    setIsPaymentProcessing(true);
    let orderCreated = false;
    const currentOrderId = orderId;

    try {
      // 전화번호 형식 검증
      if (customerInfo.phone.length < 10 || customerInfo.phone.length > 11) {
        setMessageDialogContent({
          title: dictionary.checkout.messages.inputError,
          description: dictionary.checkout.errors.invalidPhone,
        });
        setShowMessageDialog(true);
        setIsPaymentProcessing(false);
        return;
      }

      const paymentRequest: PaymentRequest = {
        items: orderItems,
        customerInfo,
        paymentMethod: selectedPaymentMethod,
        totalAmount: getTotalAmount(),
        orderId: currentOrderId,
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

      orderCreated = true;

      // 무통장입금(BANK_TRANSFER) 방식은 바로 주문 완료 처리
      if (selectedPaymentMethod === 'BANK_TRANSFER') {
        setMessageDialogContent({
          title: dictionary.checkout.messages.orderCompleted,
          description: dictionary.checkout.messages.bankTransferCompleted,
        });
        setShowMessageDialog(true);
        setIsPaymentProcessing(false);

        // 주문 완료 후 마이페이지로 이동
        setTimeout(() => {
          router.push(ROUTES.MY_UDIGN);
        }, 2000);
        return;
      }

      // 토스페이먼츠 결제창 요청
      const basePaymentData = {
        orderId: currentOrderId,
        orderName:
          orderItems.length === 1
            ? orderItems[0].it_name
            : `${orderItems[0].it_name} 외 ${orderItems.length - 1}건`,
        successUrl: `${window.location.origin}/shop/checkout/success`,
        failUrl: `${window.location.origin}/shop/checkout/fail`,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name,
        customerMobilePhone: customerInfo.phone,
      };

      // 신용카드 결제만 토스페이먼츠 결제창 사용
      if (selectedPaymentMethod === 'CARD') {
        await payment.requestPayment({
          ...basePaymentData,
          method: 'CARD',
          amount: amount,
          card: {
            useEscrow: false,
            useCardPoint: false,
            useAppCardOnly: false,
          },
        });
      }
    } catch (err) {
      console.error('결제 요청 실패:', err);

      // 결제 취소/실패 시 생성된 주문 삭제
      if (orderCreated) {
        try {
          await fetch('/api/payments/cancel-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: currentOrderId }),
          });
        } catch (cleanupErr) {
          console.error('주문 정리 실패:', cleanupErr);
        }
      }

      const errorMessage =
        err instanceof Error ? err.message : dictionary.checkout.errors.paymentFailed;
      if (errorMessage.includes('취소되었습니다') || errorMessage.includes('canceled')) {
        setMessageDialogContent({
          title: dictionary.checkout.messages.paymentCancel,
          description: dictionary.checkout.errors.paymentCancelled,
        });
        setShowMessageDialog(true);
      } else {
        setMessageDialogContent({
          title: dictionary.checkout.messages.paymentFail,
          description: dictionary.checkout.errors.paymentFailed,
        });
        setShowMessageDialog(true);
      }

      setIsPaymentProcessing(false);
    }
  };

  return authLoading || isPaymentSystemLoading ? (
    <LoadingState message={dictionary.checkout.preparingPage} dictionary={dictionary} />
  ) : error ? (
    <ErrorState message={error} showGoHome={true} dictionary={dictionary} />
  ) : (
    <div className='min-h-screen bg-white'>
      <div className='px-6 py-8 sm:px-10'>
        <h1 className='mb-8 text-2xl font-bold text-gray-900'>{dictionary.checkout.title}</h1>

        <div className='grid gap-8 lg:grid-cols-2'>
          <div className='space-y-6'>
            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.checkout.orderProducts}
              </h2>
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
                          {dictionary.checkout.noImage}
                        </div>
                      )}
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-medium text-gray-900'>{item.it_name}</h3>
                      {selectedOptions.length > 0 && (
                        <div className='mt-1 space-y-1'>
                          {selectedOptions.map((option, index) => {
                            const optionValue =
                              option.option_display.split(' > ')[1] || option.option_display;
                            const groupName = option.option_display.split(' > ')[0] || '옵션';
                            return (
                              <p key={index} className='text-xs text-gray-500'>
                                {groupName}: {optionValue}
                                {option.io_price > 0 && (
                                  <span className='ml-1 text-blue-600'>
                                    (+{option.io_price.toLocaleString()}원)
                                  </span>
                                )}
                              </p>
                            );
                          })}
                        </div>
                      )}
                      <p className='text-sm text-gray-600'>
                        {item.it_price.toLocaleString()}원 × {item.quantity}개
                        {selectedOptions.length > 0 && (
                          <span className='ml-1 text-blue-600'>
                            + 옵션{' '}
                            {(
                              selectedOptions.reduce((sum, opt) => sum + opt.io_price, 0) *
                              item.quantity
                            ).toLocaleString()}
                            원
                          </span>
                        )}
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
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.checkout.deliveryInfo}
              </h2>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                      {dictionary.checkout.recipientName}{' '}
                      <span className='text-red-500'>{dictionary.checkout.required}</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                      {dictionary.checkout.contactNumber}{' '}
                      <span className='text-red-500'>{dictionary.checkout.required}</span>
                    </label>
                    <input
                      type='number'
                      required
                      value={customerInfo.phone}
                      onChange={(e) => {
                        const { value } = e.target;
                        if (value.length <= 11)
                          setCustomerInfo((prev) => ({ ...prev, phone: value }));
                      }}
                      placeholder={dictionary.checkout.contactPlaceholder}
                      className='focus:ring-primary w-full [appearance:textfield] rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                    />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>
                    {dictionary.checkout.email}{' '}
                    <span className='text-red-500'>{dictionary.checkout.required}</span>
                  </label>
                  <input
                    type='email'
                    required
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                  />
                </div>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                      {dictionary.checkout.zipCode}{' '}
                      <span className='text-red-500'>{dictionary.checkout.required}</span>
                    </label>
                    <input
                      type='number'
                      required
                      value={customerInfo.zipCode}
                      onChange={(e) => {
                        const { value } = e.target;
                        if (value.length <= 5)
                          setCustomerInfo((prev) => ({ ...prev, zipCode: value }));
                      }}
                      placeholder={dictionary.checkout.zipCodePlaceholder}
                      className='focus:ring-primary w-full [appearance:textfield] rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                    />
                  </div>
                  <div className='col-span-2'>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                      {dictionary.checkout.address}{' '}
                      <span className='text-red-500'>{dictionary.checkout.required}</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={customerInfo.address}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({ ...prev, address: e.target.value }))
                      }
                      className='focus:ring-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none'
                    />
                  </div>
                </div>
                <div>
                  <label className='mb-1 block text-sm font-medium text-gray-700'>
                    {dictionary.checkout.detailAddress}{' '}
                    <span className='text-red-500'>{dictionary.checkout.required}</span>
                  </label>
                  <input
                    type='text'
                    required
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
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.checkout.paymentMethod}
              </h2>
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethodType)}
                className='space-y-3'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='CARD' id='card' />
                  <Label htmlFor='card' className='cursor-pointer'>
                    {dictionary.checkout.creditCard}
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='BANK_TRANSFER' id='bank-transfer' />
                  <Label htmlFor='bank-transfer' className='cursor-pointer'>
                    {dictionary.checkout.bankTransfer}
                  </Label>
                </div>
              </RadioGroup>

              {selectedPaymentMethod === 'BANK_TRANSFER' && (
                <div className='mt-4 rounded-lg bg-blue-50 p-4'>
                  <h3 className='mb-2 font-medium text-blue-900'>
                    {dictionary.checkout.bankTransferInfo}
                  </h3>
                  <p className='text-sm text-blue-800'>
                    {dictionary.checkout.bankTransferGuide}
                    <br />
                    {dictionary.checkout.bankTransferGuideDetail}
                  </p>
                </div>
              )}
            </div>
            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.checkout.paymentAmount}
              </h2>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>{dictionary.checkout.productAmount}</span>
                  <span className='font-medium'>
                    {orderItems
                      .reduce((sum, item) => sum + item.it_price * item.quantity, 0)
                      .toLocaleString()}
                    원
                  </span>
                </div>
                {selectedOptions.length > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>{dictionary.checkout.optionAmount}</span>
                    <span className='font-medium text-blue-600'>
                      +
                      {(
                        selectedOptions.reduce((sum, opt) => sum + opt.io_price, 0) *
                        orderItems.reduce((sum, item) => sum + item.quantity, 0)
                      ).toLocaleString()}
                      원
                    </span>
                  </div>
                )}
                <div className='flex justify-between'>
                  <span className='text-gray-600'>{dictionary.checkout.shippingFee}</span>
                  <span className='font-medium'>{dictionary.checkout.free}</span>
                </div>
                <hr className='my-3' />
                <div className='flex justify-between text-lg font-bold'>
                  <span>{dictionary.checkout.totalAmount}</span>
                  <span className='text-primary'>{getTotalAmount().toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <div className='rounded-lg border border-gray-200 p-6'>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                {dictionary.checkout.termsAgreement}
              </h2>
              <div className='space-y-3'>
                <div className='flex cursor-pointer items-start space-x-3'>
                  <Checkbox
                    id='terms-finance'
                    checked={termsAgreed.finance}
                    onCheckedChange={(checked) =>
                      setTermsAgreed((prev) => ({ ...prev, finance: !!checked }))
                    }
                    className='mt-1'
                  />
                  <Label htmlFor='terms-finance' className='cursor-pointer'>
                    <div className='text-sm'>
                      <span className='font-medium text-gray-900'>
                        {dictionary.checkout.financeTerms}
                      </span>
                      <p className='mt-1 text-gray-600'>{dictionary.checkout.financeTermsDetail}</p>
                    </div>
                  </Label>
                </div>
                <div className='flex cursor-pointer items-start space-x-3'>
                  <Checkbox
                    id='terms-privacy'
                    checked={termsAgreed.privacy}
                    onCheckedChange={(checked) =>
                      setTermsAgreed((prev) => ({ ...prev, privacy: !!checked }))
                    }
                    className='mt-1'
                  />
                  <Label htmlFor='terms-privacy' className='cursor-pointer'>
                    <div className='text-sm'>
                      <span className='font-medium text-gray-900'>
                        {dictionary.checkout.privacyTerms}
                      </span>
                      <p className='mt-1 text-gray-600'>{dictionary.checkout.privacyTermsDetail}</p>
                    </div>
                  </Label>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <Button
                onClick={handlePayment}
                className='bg-primary hover:bg-primary/90 w-full text-white'
                size='lg'
                disabled={isPaymentDisabled}
              >
                {isPaymentProcessing
                  ? dictionary.checkout.processing
                  : dictionary.checkout.payButton.replace(
                      '{{amount}}',
                      getTotalAmount().toLocaleString(),
                    )}
              </Button>
              <Button
                variant='outline'
                onClick={() => router.back()}
                className='w-full'
                size='lg'
                disabled={isPaymentProcessing}
              >
                {dictionary.checkout.cancelButton}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        title={messageDialogContent.title}
        description={messageDialogContent.description}
        dictionary={dictionary}
      />
    </div>
  );
}
