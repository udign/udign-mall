import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

interface JwtPayload {
  mb_id: string;
  [key: string]: unknown;
}

interface ProductCheckRow extends RowDataPacket {
  it_id: string;
}

interface CountRow extends RowDataPacket {
  cnt: number;
}

interface ProductRow extends RowDataPacket {
  it_name: string;
}

interface OrderRow extends RowDataPacket {
  order_number: number;
}

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ success: false, error: '상품 ID가 필요합니다.' }, { status: 400 });
    }

    // 현재 로그인한 사용자 정보 가져오기
    let currentUserId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;

      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        currentUserId = decoded.mb_id;
      }
    } catch {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    if (!currentUserId) {
      return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 상품이 존재하는지 확인
    const productCheckQuery = `
      SELECT it_id FROM g5_shop_item 
      WHERE it_id = ? AND it_use = '1'
    `;
    const productCheckResults = (await executeQuery(productCheckQuery, [
      productId,
    ])) as ProductCheckRow[];

    if (!productCheckResults[0]) {
      return NextResponse.json(
        { success: false, error: '존재하지 않는 상품입니다.' },
        { status: 404 },
      );
    }

    // 현재 좋아요 상태 확인
    const checkQuery = `
      SELECT COUNT(*) as cnt 
      FROM g5_shop_interrest 
      WHERE it_id = ? AND mb_id = ?
    `;

    const checkResults = (await executeQuery(checkQuery, [productId, currentUserId])) as CountRow[];
    const isCurrentlyLiked = checkResults[0]?.cnt > 0;

    let orderNumber: number | undefined;
    let productName: string | undefined;

    if (isCurrentlyLiked) {
      // 좋아요 취소
      await executeQuery('DELETE FROM g5_shop_interrest WHERE it_id = ? AND mb_id = ?', [
        productId,
        currentUserId,
      ]);
    } else {
      // 좋아요 추가
      const clientIp =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

      await executeQuery(
        'INSERT INTO g5_shop_interrest (it_id, mb_id, ir_time, ir_ip) VALUES (?, ?, NOW(), ?)',
        [productId, currentUserId, clientIp],
      );

      // 새로 좋아요를 추가한 경우 순번과 상품명 계산

      // 1. 상품명 조회
      const productQuery = `SELECT it_name FROM g5_shop_item WHERE it_id = ?`;
      const productResults = (await executeQuery(productQuery, [productId])) as ProductRow[];
      productName = productResults[0]?.it_name;

      // 2. 현재 사용자의 좋아요 순번 계산 (좋아요 등록 시간 기준 오름차순)
      const orderQuery = `
        SELECT COUNT(*) as order_number 
        FROM g5_shop_interrest 
        WHERE it_id = ? AND ir_time <= (
          SELECT ir_time 
          FROM g5_shop_interrest 
          WHERE mb_id = ? AND it_id = ?
        )
      `;
      const orderResults = (await executeQuery(orderQuery, [
        productId,
        currentUserId,
        productId,
      ])) as OrderRow[];
      orderNumber = orderResults[0]?.order_number;
    }

    // 업데이트된 좋아요 수 조회
    const countQuery = `
      SELECT COUNT(*) as cnt 
      FROM g5_shop_interrest 
      WHERE it_id = ?
    `;

    const countResults = (await executeQuery(countQuery, [productId])) as CountRow[];
    const currentLikes = countResults[0]?.cnt || 0;

    // 응답 객체 구성
    const response: {
      success: boolean;
      is_liked: boolean;
      current_likes: number;
      order_number?: number;
      product_name?: string;
    } = {
      success: true,
      is_liked: !isCurrentlyLiked,
      current_likes: currentLikes,
    };

    // 새로 좋아요를 추가한 경우에만 순번과 상품명 포함
    if (!isCurrentlyLiked && orderNumber && productName) {
      response.order_number = orderNumber;
      response.product_name = productName;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
