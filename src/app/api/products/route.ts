import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { Category, Product } from '@/types/product';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('ca_id') || '10'; // 기본값: 패션 카테고리
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // 카테고리 정보 가져오기
    const categoryQuery = `
      SELECT * FROM g5_shop_category 
      WHERE ca_id = ? AND ca_use = '1'
    `;
    const categoryResult = (await executeQuery(categoryQuery, [categoryId])) as Category[];

    if (categoryResult.length === 0) {
      return NextResponse.json({ error: '등록된 분류가 없습니다.' }, { status: 404 });
    }

    const category = categoryResult[0];

    // 상품 목록 가져오기 (카테고리별)
    const itemsQuery = `
      SELECT 
        it_id,
        it_name,
        it_basic,
        it_cust_price,
        it_price,
        it_img1,
        it_img2,
        it_img3,
        it_use_avg,
        it_use_cnt,
        it_hit,
        it_time,
        it_update_time,
        ca_id,
        it_1 as creator_id,
        it_2 as creator_name,
        it_3 as description,
        it_4 as likes_count
      FROM g5_shop_item 
      WHERE ca_id LIKE ? AND it_use = '1' AND it_soldout = '0'
      ORDER BY it_order, it_id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // 카테고리 ID에 따른 LIKE 조건 설정
    const likePattern = categoryId + '%';
    const items = (await executeQuery(itemsQuery, [likePattern])) as Product[];

    // 전체 상품 수 가져오기
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM g5_shop_item 
      WHERE ca_id LIKE ? AND it_use = '1' AND it_soldout = '0'
    `;
    const countResult = (await executeQuery(countQuery, [likePattern])) as { total: number }[];
    const totalCount = countResult[0].total;

    const processedItems = items.map((item) => ({
      ...item,
      it_img1: item.it_img1 ? `${process.env.VERCEL_BLOB_BASE_URL}/item/${item.it_img1}` : null,
      it_img2: item.it_img2 ? `${process.env.VERCEL_BLOB_BASE_URL}/item/${item.it_img2}` : null,
      it_img3: item.it_img3 ? `${process.env.VERCEL_BLOB_BASE_URL}/item/${item.it_img3}` : null,
    }));

    return NextResponse.json({
      success: true,
      category,
      items: processedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      // 실제 데이터 정보
      _meta: {
        mode: 'real',
        queriedAt: new Date().toISOString(),
        categoryId,
      },
    });
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '상품 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
