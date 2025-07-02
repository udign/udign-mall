import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { action, item_id, rejection_reason } = body;

    // 유효성 검사
    if (!action || !item_id) {
      return NextResponse.json(
        { success: false, message: '필수 매개변수가 누락되었습니다.' },
        { status: 400 },
      );
    }

    if (!['approve', 'reject', 'toggle_review'].includes(action)) {
      return NextResponse.json({ success: false, message: '잘못된 액션입니다.' }, { status: 400 });
    }

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json(
        { success: false, message: '반려 사유를 입력해주세요.' },
        { status: 400 },
      );
    }

    // 상품 정보 확인
    const itemRows = (await executeQuery(
      'SELECT it_id, it_name FROM g5_shop_item WHERE it_id = ?',
      [item_id],
    )) as { it_id: string; it_name: string }[];

    if (itemRows.length === 0) {
      return NextResponse.json(
        { success: false, message: '상품을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const item = itemRows[0];
    let updateValue = '';
    let logAction = '';

    // 액션에 따른 처리
    switch (action) {
      case 'approve':
        updateValue = 'N'; // 심의 종료 (승인)
        logAction = 'approved';
        break;
      case 'reject':
        updateValue = 'R'; // 반려 (새로운 상태값)
        logAction = 'rejected';
        break;
      case 'toggle_review':
        // 현재 상태 확인 후 토글
        const currentRows = (await executeQuery('SELECT it_10 FROM g5_shop_item WHERE it_id = ?', [
          item_id,
        ])) as { it_10: string }[];
        const currentStatus = currentRows[0].it_10;
        updateValue = currentStatus === 'Y' ? 'N' : 'Y';
        logAction = updateValue === 'Y' ? 'in_review' : 'approved';
        break;
    }

    // 상품 상태 업데이트
    await executeQuery('UPDATE g5_shop_item SET it_10 = ? WHERE it_id = ?', [updateValue, item_id]);

    const actionTextMap: Record<string, string> = {
      approve: '승인',
      reject: '반려',
      toggle_review: updateValue === 'Y' ? '심의중으로 변경' : '심의 종료',
    };

    const actionText = actionTextMap[action];

    return NextResponse.json({
      success: true,
      message: `"${item.it_name}"이(가) ${actionText}되었습니다.`,
      data: {
        item_id,
        action: logAction,
        new_status: updateValue,
      },
    });
  } catch (error) {
    console.error('검수 처리 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
