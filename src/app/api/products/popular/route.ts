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
  it_10: 'Y' | 'N' | 'R' | string | null; // admin_review_status
  current_likes: number;
  ca_name: string;
}

// 상태 계산 함수
const calculateProductStatus = (item: PopularProductRow): string => {
  const targetLikes = parseInt(item.it_4) || 0;
  const goalAttainment = item.current_likes >= targetLikes;

  // 1. 관리자 토글 최우선 처리
  if (item.it_10 === 'Y') {
    return '심의중';
  }

  // 2. 심의 종료 상태 처리
  if (item.it_10 === 'N') {
    return '구매 진행';
  }

  // 3. 반려 상태 처리
  if (item.it_10 === 'R') {
    return '반려';
  }

  // 4. 목표를 달성하지 않은 경우
  if (!goalAttainment) {
    return '컬렉션';
  }

  // 5. 목표를 달성한 경우 → 자동으로 심의중 상태
  if (goalAttainment) {
    return '제작 검토';
  }

  return '컬렉션';
};

export const GET = async () => {
  try {
    // 총 조회수 기준으로 상위 4개 작품 조회
    const popularProductsQuery = `
      SELECT 
        i.it_id,
        i.it_name,
        i.it_img1,
        i.it_img2,
        i.it_img3,
        i.it_img4,
        i.it_price,
        i.it_cust_price,
        i.it_hit,
        i.it_2,
        i.it_3,
        i.it_4,
        i.it_10,
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
      it_img2: getImageUrl(product.it_img2),
      it_img3: getImageUrl(product.it_img3),
      it_img4: getImageUrl(product.it_img4),
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
      it_4: parseInt(product.it_4) || 0, // 블러 처리 로직을 위한 it_4 추가
      _status_text: calculateProductStatus(product), // 상태 텍스트 추가
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
