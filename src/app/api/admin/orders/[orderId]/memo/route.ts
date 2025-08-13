import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !PERMISSION_CHECKS.isAdmin(currentUser.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { orderId } = await params;
    const body = await request.json();
    const { shopMemo } = body;

    // 주문 존재 여부 확인
    const orderCheckQuery = `
      SELECT od_id, od_tno 
      FROM g5_shop_order 
      WHERE od_id = ? OR od_tno = ?
      LIMIT 1
    `;

    const orderResult = (await executeQuery(orderCheckQuery, [orderId, orderId])) as {
      od_id: string;
      od_tno: string;
    }[];

    if (orderResult.length === 0) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 주문입니다.' },
        { status: 404 },
      );
    }

    const order = orderResult[0];

    // 관리자 메모 업데이트
    const updateQuery = `
      UPDATE g5_shop_order 
      SET od_shop_memo = ?
      WHERE od_id = ?
    `;

    await executeQuery(updateQuery, [shopMemo || '', order.od_id]);

    return NextResponse.json({
      success: true,
      message: '관리자 메모가 저장되었습니다.',
      data: {
        orderId: order.od_id,
        shopMemo,
      },
    });
  } catch (error) {
    console.error('메모 저장 오류:', error);
    return NextResponse.json(
      { success: false, message: '메모 저장 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};