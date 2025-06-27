import { NextRequest, NextResponse } from 'next/server';
import { toggleInterest } from '@/lib/artwork-service';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number; mb_level: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
    }

    const result = await toggleInterest(decoded.mb_id as string, itemId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in interest toggle API:', error);
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
