import { NextRequest, NextResponse } from 'next/server';
import { submitReturn } from '@/lib/artwork-service';
import { verifyToken } from '@/lib/auth';

export const POST = async (request: NextRequest) => {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number; mb_level: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { orderId, name, phone, returnType, reason } = await request.json();

    if (!orderId || !name || !phone || !returnType || !reason) {
      return NextResponse.json({ error: '모든 필드가 필요합니다.' }, { status: 400 });
    }

    const result = await submitReturn({
      orderId,
      name,
      phone,
      returnType,
      reason,
      userId: decoded.mb_id as string,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in return API:', error);
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
