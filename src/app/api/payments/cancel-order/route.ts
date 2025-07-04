import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getConnection } from '@/lib/database';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { mb_id: string };
      userId = decoded.mb_id;
    } catch {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 },
      );
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: '주문 ID가 필요합니다.' }, { status: 400 });
    }

    // 데이터베이스 연결
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      // 먼저 해당 주문이 현재 사용자의 것인지 확인
      const [orderRows] = (await connection.execute(
        'SELECT od_id, mb_id FROM g5_shop_order WHERE od_tno = ? AND mb_id = ?',
        [orderId, userId],
      )) as RowDataPacket[];

      if (!orderRows || orderRows.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: '삭제할 수 있는 주문이 없습니다.' },
          { status: 404 },
        );
      }

      // 장바구니 항목들 삭제
      await connection.execute('DELETE FROM g5_shop_cart WHERE od_id = ? AND mb_id = ?', [
        orderId,
        userId,
      ]);

      // 주문 삭제
      await connection.execute('DELETE FROM g5_shop_order WHERE od_tno = ? AND mb_id = ?', [
        orderId,
        userId,
      ]);

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: '주문이 취소되었습니다.',
      });
    } catch (error) {
      await connection.rollback();
      console.error('주문 취소 중 오류:', error);
      return NextResponse.json(
        { success: false, error: '주문 취소에 실패했습니다.' },
        { status: 500 },
      );
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
