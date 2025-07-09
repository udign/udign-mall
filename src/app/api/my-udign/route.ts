import { NextRequest, NextResponse } from 'next/server';
import { getArtworksByUser } from '@/lib/artwork-service';
import { verifyToken } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';

export const GET = async (request: NextRequest) => {
  try {
    const token = request.cookies.get('auth-token')?.value;

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
    const isAdmin = PERMISSION_CHECKS.isAdmin(decoded.mb_level);

    // URL 파라미터에서 페이지네이션 정보 추출
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tab = searchParams.get('tab') || 'all';

    const { products, counts, hasMore } = await getArtworksByUser(
      userId,
      isAdmin,
      page,
      limit,
      tab,
    );

    return NextResponse.json({
      success: true,
      data: {
        products,
        counts,
        hasMore,
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
};
