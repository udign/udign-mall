import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 토큰 확인
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: '인증이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_level: number; mb_id: string } | null;

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰입니다.' },
        { status: 401 },
      );
    }

    // 관리자 권한 확인 (mb_level >= 10)
    if (decoded.mb_level < 10) {
      return NextResponse.json(
        { success: false, message: '관리자만 접근 가능합니다.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { it_id, it_10 } = body;

    if (!it_id) {
      return NextResponse.json({ success: false, message: '상품 ID가 없습니다.' }, { status: 400 });
    }

    if (!['Y', 'N'].includes(it_10)) {
      return NextResponse.json(
        { success: false, message: '잘못된 상태값입니다.' },
        { status: 400 },
      );
    }

    // 상품 정보 확인
    const items = (await executeQuery('SELECT it_id, it_name FROM g5_shop_item WHERE it_id = ?', [
      it_id,
    ])) as { it_id: string; it_name: string }[];

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, message: '상품을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const item = items[0];

    // 심의 상태 업데이트
    await executeQuery('UPDATE g5_shop_item SET it_10 = ? WHERE it_id = ?', [it_10, it_id]);

    const statusText = it_10 === 'Y' ? '심의중' : '심의종료';

    return NextResponse.json({
      success: true,
      message: `'${item.it_name}' 상품이 ${statusText} 상태로 변경되었습니다.`,
      data: {
        it_id,
        it_10,
        statusText,
      },
    });
  } catch (error) {
    console.error('관리자 심의 상태 변경 실패:', error);
    return NextResponse.json(
      { success: false, message: '상태 변경에 실패했습니다.' },
      { status: 500 },
    );
  }
}
