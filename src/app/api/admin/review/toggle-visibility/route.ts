import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export const POST = async (request: NextRequest) => {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    const decoded = verifyToken(token) as {
      mb_id: string;
      mb_no: number;
      mb_level: number;
      mb_name: string;
    } | null;

    if (!decoded || decoded.mb_level < 10) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { itemId, visibility } = await request.json();

    if (!itemId || !visibility) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 },
      );
    }

    // visibility 값 검증
    if (visibility !== '0' && visibility !== '1') {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 노출 상태 값입니다.' },
        { status: 400 },
      );
    }

    // 상품 존재 여부 확인
    const checkQuery = `SELECT it_id, it_name, it_use FROM g5_shop_item WHERE it_id = ?`;
    const existingItems = (await executeQuery(checkQuery, [itemId])) as {
      it_id: string;
      it_name: string;
      it_use: '1' | '0';
    }[];

    if (existingItems.length === 0) {
      return NextResponse.json(
        { success: false, message: '작품을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const item = existingItems[0];

    // it_use 필드 업데이트
    const updateQuery = `UPDATE g5_shop_item SET it_use = ? WHERE it_id = ?`;
    const updateResult = await executeQuery(updateQuery, [visibility, itemId]);

    // 업데이트 후 실제 값 확인
    const verifyQuery = `SELECT it_id, it_name, it_use FROM g5_shop_item WHERE it_id = ?`;
    const verifyResults = (await executeQuery(verifyQuery, [itemId])) as {
      it_id: string;
      it_name: string;
      it_use: '1' | '0';
    }[];

    const updatedItem = verifyResults[0];

    const statusMessage =
      visibility === '1' ? '사이트에 노출되도록 설정되었습니다' : '사이트에서 숨김 처리되었습니다';

    // 로그 기록 (선택사항)
    const logQuery = `
      INSERT INTO admin_review_log (it_id, admin_id, action_type, action_value, created_at)
      VALUES (?, ?, 'visibility_toggle', ?, NOW())
      ON DUPLICATE KEY UPDATE
      it_id = it_id
    `;

    try {
      await executeQuery(logQuery, [itemId, decoded.mb_id, visibility]);
    } catch (logError) {
      // 로그 테이블이 없어도 메인 기능은 동작하도록 함
      console.warn('로그 기록 실패 (테이블이 존재하지 않을 수 있음):', logError);
    }

    return NextResponse.json({
      success: true,
      message: `"${item.it_name}" 작품이 ${statusMessage}`,
      data: {
        itemId: itemId,
        itemName: item.it_name,
        newVisibility: visibility,
        previousVisibility: item.it_use,
        actualVisibility: updatedItem.it_use,
        updateResult: updateResult,
      },
    });
  } catch (error) {
    console.error('사이트 노출 상태 변경 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
