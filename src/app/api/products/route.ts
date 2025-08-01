import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { Category } from '@/types/product';
import { RowDataPacket } from 'mysql2';
import { getImageUrl } from '@/lib/utils';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// 상태 계산 함수
const calculateProductStatus = (item: ProductRow): string => {
  const goalAttainment = item.current_likes >= item.target_likes;

  // 1. 관리자 토글 최우선 처리
  if (item.admin_review_status === 'Y') {
    return '심의중';
  }

  // 2. 심의 종료 상태 처리
  if (item.admin_review_status === 'N') {
    return '구매 진행';
  }

  // 3. 반려 상태 처리
  if (item.admin_review_status === 'R') {
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

interface JwtPayload {
  mb_id: string;
  [key: string]: unknown;
}

interface ProductRow extends RowDataPacket {
  it_id: string;
  it_name: string;
  it_basic: string;
  it_cust_price: number;
  it_price: number;
  it_img1: string;
  it_img2: string;
  it_img3: string;
  it_use_avg: number;
  it_use_cnt: number;
  it_hit: number;
  it_time: string;
  it_update_time: string;
  ca_id: string;
  creator_id: string;
  creator_name: string;
  description: string;
  target_likes: number;
  review_days: number;
  manual_review: 'Y' | 'N';
  admin_review_status: 'Y' | 'N' | 'R' | string | null;
  current_likes: number;
  is_liked: number;
}

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const categoryFilter = searchParams.get('ca_id') || searchParams.get('category'); // 1차 카테고리 필터 파라미터 (호환성 유지)
    const subCategoryFilter = searchParams.get('ca_id2') || searchParams.get('subcategory'); // 2차 카테고리 필터 파라미터 (호환성 유지)
    const thirdCategoryFilter = searchParams.get('ca_id3') || searchParams.get('thirdcategory'); // 3차 카테고리 필터 파라미터 (호환성 유지)
    const offset = (page - 1) * limit;

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
      // 토큰이 유효하지 않은 경우 무시 (비로그인 사용자)
    }

    // 카테고리 정보 가져오기
    let category: Category;
    if (categoryFilter) {
      const categoryQuery = `
        SELECT * FROM g5_shop_category 
        WHERE ca_use = '1' AND ca_id = ?
        LIMIT 1
      `;
      const categoryResult = (await executeQuery(categoryQuery, [categoryFilter])) as Category[];
      category = categoryResult[0] || { ca_id: categoryFilter, ca_name: '알 수 없는 카테고리' };
    } else {
      // 모든 카테고리 정보 가져오기 (임시로 첫 번째 카테고리 정보만 사용)
      const categoryQuery = `
        SELECT * FROM g5_shop_category 
        WHERE ca_use = '1'
        ORDER BY ca_id ASC
        LIMIT 1
      `;
      const categoryResult = (await executeQuery(categoryQuery, [])) as Category[];
      category = categoryResult[0] || { ca_id: 'all', ca_name: '모든 작품' };
    }

    // 카테고리별 상품 가져오기 (사용자별 좋아요 상태 포함)
    let categoryCondition = '';
    const queryParams = [currentUserId || ''];

    if (categoryFilter) {
      categoryCondition += ' AND i.ca_id = ?';
      queryParams.push(categoryFilter);
    }

    if (subCategoryFilter) {
      categoryCondition += ' AND i.ca_id2 = ?';
      queryParams.push(subCategoryFilter);
    }

    if (thirdCategoryFilter) {
      categoryCondition += ' AND TRIM(i.ca_id3) = ?';
      queryParams.push(thirdCategoryFilter);
    }

    // 3차 카테고리 필터링 테스트를 위한 간단한 쿼리
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
        i.it_8 as review_days,
        i.it_9 as manual_review,
        i.it_10 as admin_review_status,
        COALESCE(like_count.cnt, 0) as current_likes,
        CASE WHEN user_like.mb_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM g5_shop_item i
      LEFT JOIN (
        SELECT it_id, COUNT(*) as cnt 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) like_count ON i.it_id = like_count.it_id
      LEFT JOIN g5_shop_interrest user_like ON i.it_id = user_like.it_id AND user_like.mb_id = ?
      WHERE i.it_use = '1' ${categoryCondition}
      ORDER BY i.it_id DESC
    `;

    const allItems = (await executeQuery(itemsQuery, queryParams)) as ProductRow[];

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
      it_img1: getImageUrl(item.it_img1),
      it_img2: getImageUrl(item.it_img2),
      it_img3: getImageUrl(item.it_img3),
      it_img4: getImageUrl(item.it_img4),
      it_use_avg: item.it_use_avg,
      it_use_cnt: item.it_use_cnt,
      it_hit: item.it_hit,
      it_time: item.it_time,
      it_update_time: item.it_update_time,
      ca_id: item.ca_id,
      creator_id: item.creator_id,
      creator_name: item.creator_name,
      description: item.description,
      likes_count: item.current_likes.toString(), // current_likes를 likes_count로 매핑
      is_liked: Boolean(item.is_liked), // 사용자별 좋아요 상태 추가
      current_likes: item.current_likes, // 현재 좋아요 수 추가
      target_likes: item.target_likes, // 목표 좋아요 수 추가
      it_4: item.target_likes, // 블러 처리 로직을 위한 it_4 추가
      _status_text: calculateProductStatus(item), // 상태 텍스트 추가
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
        mode: categoryFilter ? 'category' : 'all',
        categoryFilter: categoryFilter || null,
        queriedAt: new Date().toISOString(),
        filteredByAccess: false,
        originalCount: totalCount,
        accessibleCount: totalCount,
        currentUserId: currentUserId || null,
      },
    });
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '상품 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
