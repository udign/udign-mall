import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { Category, Product } from '@/types/product';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // 모든 카테고리 정보 가져오기 (임시로 첫 번째 카테고리 정보만 사용)
    const categoryQuery = `
      SELECT * FROM g5_shop_category 
      WHERE ca_use = '1'
      ORDER BY ca_id ASC
      LIMIT 1
    `;
    const categoryResult = (await executeQuery(categoryQuery, [])) as Category[];

    const category = categoryResult[0] || { ca_id: 'all', ca_name: '모든 작품' };

    // 모든 상품 가져오기 (필터링 제거)
    const itemsQuery = `
      SELECT 
        i.it_id,
        i.it_name,
        i.it_basic,
        i.it_cust_price,
        i.it_price,
        i.it_img1,
        i.it_img2,
        i.it_img3,
        i.it_use_avg,
        i.it_use_cnt,
        i.it_hit,
        i.it_time,
        i.it_update_time,
        i.ca_id,
        i.it_1 as creator_id,
        i.it_2 as creator_name,
        i.it_3 as description,
        i.it_4 as target_likes,
        COALESCE(like_count.cnt, 0) as current_likes
      FROM g5_shop_item i
      LEFT JOIN (
        SELECT it_id, COUNT(*) as cnt 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) like_count ON i.it_id = like_count.it_id
      WHERE i.it_use = '1'
      ORDER BY i.it_id DESC
    `;

    const allItems = (await executeQuery(itemsQuery, [])) as (Product &
      RowDataPacket & {
        target_likes: number;
        current_likes: number;
      })[];

    const totalCount = allItems.length;

    // 카테고리별 작품 개수 계산
    const categoryCountsQuery = `
      SELECT 
        c.ca_id,
        c.ca_name,
        COUNT(i.it_id) as item_count
      FROM g5_shop_category c
      LEFT JOIN g5_shop_item i ON i.ca_id LIKE CONCAT(c.ca_id, '%') AND i.it_use = '1'
      WHERE c.ca_use = '1' AND LENGTH(c.ca_id) = 2
      GROUP BY c.ca_id, c.ca_name
      ORDER BY c.ca_id
    `;

    const categoryCounts = (await executeQuery(categoryCountsQuery, [])) as {
      ca_id: string;
      ca_name: string;
      item_count: number;
    }[];

    // 정렬 적용 (it_id DESC - 최신순)
    const sortedItems = allItems.sort((a, b) => {
      return b.it_id.localeCompare(a.it_id);
    });

    // 페이지네이션 적용
    const paginatedItems = sortedItems.slice(offset, offset + limit);

    const processedItems = paginatedItems.map((item) => ({
      it_id: item.it_id,
      it_name: item.it_name,
      it_basic: item.it_basic,
      it_cust_price: item.it_cust_price,
      it_price: item.it_price,
      it_img1: item.it_img1
        ? `${process.env.NEXT_PUBLIC_VERCEL_BLOB_BASE_URL}/item/${item.it_img1}`
        : null,
      it_img2: item.it_img2
        ? `${process.env.NEXT_PUBLIC_VERCEL_BLOB_BASE_URL}/item/${item.it_img2}`
        : null,
      it_img3: item.it_img3
        ? `${process.env.NEXT_PUBLIC_VERCEL_BLOB_BASE_URL}/item/${item.it_img3}`
        : null,
      it_use_avg: item.it_use_avg,
      it_use_cnt: item.it_use_cnt,
      it_hit: item.it_hit,
      it_time: item.it_time,
      it_update_time: item.it_update_time,
      ca_id: item.ca_id,
      creator_id: item.creator_id,
      creator_name: item.creator_name,
      description: item.description,
      likes_count: item.current_likes, // current_likes를 likes_count로 매핑
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
      // 카테고리별 작품 개수 정보 추가
      categoryCounts: categoryCounts.reduce(
        (acc, cat) => {
          acc[cat.ca_id] = {
            name: cat.ca_name,
            count: cat.item_count,
          };
          return acc;
        },
        {} as Record<string, { name: string; count: number }>,
      ),
      // 모든 데이터 정보
      _meta: {
        mode: 'all',
        queriedAt: new Date().toISOString(),
        filteredByAccess: false,
        originalCount: totalCount,
        accessibleCount: totalCount,
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
