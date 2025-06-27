import { NextRequest, NextResponse } from 'next/server';
import { getArtworksByUser } from '@/lib/artwork-service';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    // 디버깅을 위한 로그
    console.log('Available cookies:', request.cookies.getAll());
    console.log('Auth token:', token);

    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as {
      mb_id: string;
      mb_no: number;
      mb_level: number;
      mb_name: string;
    } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const userId = decoded.mb_id;
    const isAdmin = decoded.mb_level >= 10;

    const { products, counts } = await getArtworksByUser(userId, isAdmin);

    return NextResponse.json({
      success: true,
      data: {
        products,
        counts,
        user: {
          mb_id: decoded.mb_id,
          mb_name: decoded.mb_name,
          mb_level: decoded.mb_level,
        },
      },
    });
  } catch (error) {
    console.error('Error in my-udign API:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
}
