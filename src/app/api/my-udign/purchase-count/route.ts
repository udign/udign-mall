import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

interface PurchaseCountResult {
  purchase_count: number;
}

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
    } | null;

    if (!decoded || !decoded.mb_id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // 구매 가능한 상품 수 조회 - ProductDetail의 can_purchase 로직과 동일
    // 조건: it_10 = 'N' (심의 완료) && 로그인한 사용자가 관심있는 상품
    const query = `
      SELECT COUNT(DISTINCT ir.it_id) as purchase_count
      FROM g5_shop_interrest ir
      INNER JOIN g5_shop_item it ON ir.it_id = it.it_id
      WHERE ir.mb_id = ?
        AND it.it_use = '1'
        AND it.it_10 = 'N'
    `;

    const result = (await executeQuery(query, [decoded.mb_id])) as PurchaseCountResult[];
    const purchaseCount = result[0]?.purchase_count || 0;

    return NextResponse.json({
      success: true,
      data: {
        count: purchaseCount,
      },
    });
  } catch (error) {
    console.error('Error fetching purchase count:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
