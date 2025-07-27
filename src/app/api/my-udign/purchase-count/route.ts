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

    // 구매 가능한 상품 수 조회
    // it_10 = 'N'이고 좋아요 목표를 달성한 상품들
    const query = `
      SELECT COUNT(DISTINCT ir.it_id) as purchase_count
      FROM g5_shop_interrest ir
      INNER JOIN g5_shop_item it ON ir.it_id = it.it_id
      LEFT JOIN (
        SELECT it_id, COUNT(*) as like_count 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) ic ON ir.it_id = ic.it_id
      LEFT JOIN (
        SELECT ct.it_id
        FROM g5_shop_cart ct
        INNER JOIN g5_shop_order od ON ct.od_id = od.od_tno
        WHERE ct.mb_id = ?
      ) cart ON ir.it_id = cart.it_id
      WHERE ir.mb_id = ?
        AND it.it_use = '1'
        AND it.it_10 = 'N'
        AND ic.like_count >= it.it_4
        AND cart.it_id IS NULL
    `;

    const result = await executeQuery(query, [decoded.mb_id, decoded.mb_id]) as PurchaseCountResult[];
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