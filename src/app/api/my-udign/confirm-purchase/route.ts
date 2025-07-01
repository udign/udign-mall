import { NextRequest, NextResponse } from 'next/server';
import { confirmPurchase } from '@/lib/artwork-service';
import { verifyToken } from '@/lib/auth';

export const POST = async (request: NextRequest) => {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: '주문 ID가 필요합니다.' }, { status: 400 });
    }

    const result = await confirmPurchase(orderId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in confirm purchase API:', error);
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
