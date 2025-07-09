import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';

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

    if (!decoded || !PERMISSION_CHECKS.isAdmin(decoded.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { itemId, action } = await request.json();

    if (!itemId || !action) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 },
      );
    }

    // 상품 존재 여부 확인
    const checkQuery = `SELECT it_id, it_name FROM g5_shop_item WHERE it_id = ? AND it_use = '1'`;
    const existingItems = (await executeQuery(checkQuery, [itemId])) as {
      it_id: string;
      it_name: string;
    }[];

    if (existingItems.length === 0) {
      return NextResponse.json(
        { success: false, message: '상품을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const item = existingItems[0];

    // 상태 업데이트
    let updateValue = '';
    let statusMessage = '';

    switch (action) {
      case 'payment':
        updateValue = 'N'; // 승인 (구매 진행 가능)
        statusMessage = '구매 진행 상태로 변경되었습니다';
        break;
      case 'review':
        updateValue = 'Y'; // 심의중으로 설정
        statusMessage = '제작 검토 상태로 변경되었습니다';
        break;
      default:
        return NextResponse.json(
          { success: false, message: '유효하지 않은 액션입니다.' },
          { status: 400 },
        );
    }

    // 데이터베이스 업데이트
    const updateQuery = `UPDATE g5_shop_item SET it_10 = ? WHERE it_id = ?`;
    await executeQuery(updateQuery, [updateValue, itemId]);

    // 로그 기록 (선택사항)
    const logQuery = `
      INSERT INTO admin_review_log (it_id, admin_id, action_type, action_value, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
      it_id = it_id
    `;

    try {
      await executeQuery(logQuery, [itemId, decoded.mb_id, action, updateValue]);
    } catch (logError) {
      // 로그 테이블이 없어도 메인 기능은 동작하도록 함
      console.warn('로그 기록 실패 (테이블이 존재하지 않을 수 있음):', logError);
    }

    return NextResponse.json({
      success: true,
      message: `"${item.it_name}" 상품이 ${statusMessage}`,
      data: {
        itemId: itemId,
        itemName: item.it_name,
        newStatus: updateValue,
        action: action,
      },
    });
  } catch (error) {
    console.error('상품 상태 변경 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
