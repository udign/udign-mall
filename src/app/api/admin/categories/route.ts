import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// 카테고리 목록 조회
export const GET = async () => {
  try {
    const rows = await executeQuery(`
      SELECT ca_id, ca_name, ca_order, ca_use, ca_stock_qty, ca_sell_email
      FROM g5_shop_category 
      ORDER BY ca_order, ca_id
    `);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: '카테고리 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
