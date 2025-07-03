import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';

const SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 },
      );
    }

    // 토스페이먼츠 결제 승인 요청
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const paymentData = await response.json();

    if (!response.ok) {
      console.error('토스페이먼츠 승인 실패:', paymentData);
      return NextResponse.json(
        { success: false, error: '결제 승인에 실패했습니다.' },
        { status: 400 },
      );
    }

    // 데이터베이스에서 주문 상태 업데이트
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: '결제가 완료되었습니다.',
        paymentData: {
          orderId: paymentData.orderId,
          paymentKey: paymentData.paymentKey,
          amount: paymentData.totalAmount,
          method: paymentData.method,
          approvedAt: paymentData.approvedAt,
        },
      });
    } catch (error) {
      await connection.rollback();
      console.error('주문 상태 업데이트 실패:', error);
      return NextResponse.json(
        { success: false, error: '주문 상태 업데이트에 실패했습니다.' },
        { status: 500 },
      );
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('결제 승인 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
