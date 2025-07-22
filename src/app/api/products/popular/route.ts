import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import { getImageUrl } from '@/lib/utils';

interface PopularProductRow extends RowDataPacket {
  it_id: string;
  it_name: string;
  it_img1: string;
  it_price: number;
  it_cust_price: number;
  it_hit: number;
  it_2: string; // 작가명
  it_3: string; // 작품설명
  it_4: string; // 목표 인원
  current_likes: number;
  ca_name: string;
}

export const GET = async () => {
  try {
    // 총 조회수 기준으로 상위 4개 작품 조회
    const popularProductsQuery = `
      SELECT 
        i.it_id,
        i.it_name,
        i.it_img1,
        i.it_price,
        i.it_cust_price,
        i.it_hit,
        i.it_2,
        i.it_3,
        i.it_4,
        c.ca_name,
        COALESCE(like_count.cnt, 0) as current_likes
      FROM g5_shop_item i
      LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
      LEFT JOIN (
        SELECT it_id, COUNT(*) as cnt 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) like_count ON i.it_id = like_count.it_id
      WHERE i.it_use = '1'
      ORDER BY i.it_hit DESC
      LIMIT 4
    `;

    const popularProducts = (await executeQuery(popularProductsQuery, [])) as PopularProductRow[];

    const formattedProducts = popularProducts.map((product) => ({
      it_id: product.it_id,
      it_name: product.it_name || '',
      it_img1: getImageUrl(product.it_img1),
      it_price:
        typeof product.it_price === 'string' ? parseInt(product.it_price) : product.it_price || 0,
      it_cust_price:
        typeof product.it_cust_price === 'string'
          ? parseInt(product.it_cust_price)
          : product.it_cust_price || 0,
      it_hit: product.it_hit || 0,
      creator_name: product.it_2 || '',
      description: product.it_3 || '',
      target_likes: parseInt(product.it_4) || 0,
      current_likes: product.current_likes || 0,
      ca_name: product.ca_name || '',
    }));

    return NextResponse.json({
      success: true,
      products: formattedProducts,
    });
  } catch (error) {
    console.error('인기 작품 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
