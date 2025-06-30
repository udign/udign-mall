import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { Category, Product } from '@/types/product';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

interface JwtPayload {
  mb_id: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('ca_id') || '10'; // 기본값: 패션 카테고리
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
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
      // 토큰이 유효하지 않은 경우 무시
    }

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

    // 상품 목록 가져오기 (접근 제한 로직 포함)
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
        i.it_10 as review_completed,
        COALESCE(like_count.cnt, 0) as current_likes,
        CASE WHEN user_like.mb_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
      FROM g5_shop_item i
      LEFT JOIN (
        SELECT it_id, COUNT(*) as cnt 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) like_count ON i.it_id = like_count.it_id
      LEFT JOIN g5_shop_interrest user_like ON i.it_id = user_like.it_id AND user_like.mb_id = ?
      WHERE i.ca_id LIKE ? AND i.it_use = '1' AND i.it_soldout = '0'
    `;

    // 카테고리 ID에 따른 LIKE 조건 설정
    const likePattern = categoryId + '%';
    const allItems = (await executeQuery(itemsQuery, [
      currentUserId || '',
      likePattern,
    ])) as (Product &
      RowDataPacket & {
        target_likes: number;
        review_days: number;
        manual_review: 'Y' | 'N';
        review_completed: 'Y' | 'N';
        current_likes: number;
        is_liked: number;
      })[];

    // 접근 제한 로직 적용하여 필터링
    const accessibleItems = allItems.filter((item) => {
      const targetCount = parseInt(String(item.target_likes)) || 0;
      const currentLikes = item.current_likes || 0;
      const goalAttainment = currentLikes >= targetCount;
      const isReviewCompleted = item.review_completed === 'N';
      const manualReview = item.manual_review === 'Y';
      const reviewDays = parseInt(String(item.review_days)) || 0;

      // 심의중 여부 확인
      let isUnderReview = false;
      if (!isReviewCompleted) {
        if (goalAttainment && !manualReview) {
          // 자동 심의: 목표 달성시 심의중
          isUnderReview = true;
        } else if (manualReview && reviewDays > 0) {
          // 수동 심의: 기간 확인 필요 (실제로는 첫 좋아요 시간을 확인해야 하지만, 여기서는 단순화)
          isUnderReview = goalAttainment;
        }
      }

      // 접근 권한 체크
      if (!currentUserId) {
        // 비회원인 경우 심의중/심의완료 상품 제외
        return !isReviewCompleted && !isUnderReview;
      } else {
        // 회원인 경우
        if (isReviewCompleted || isUnderReview) {
          // 심의 완료되었거나 심의중인 상품은 좋아요한 회원만
          return Boolean(item.is_liked);
        }
        // 컬렉션 상태는 모두 접근 가능
        return true;
      }
    });

    const totalAccessibleCount = accessibleItems.length;

    // 정렬 적용 (it_order, it_id DESC)
    const sortedItems = accessibleItems.sort((a, b) => {
      if (a.it_order !== b.it_order) {
        return a.it_order - b.it_order;
      }
      return b.it_id.localeCompare(a.it_id);
    });

    // 페이지네이션 적용
    const finalPaginatedItems = sortedItems.slice(offset, offset + limit);

    const processedItems = finalPaginatedItems.map((item) => ({
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
        totalCount: totalAccessibleCount,
        totalPages: Math.ceil(totalAccessibleCount / limit),
        hasNext: page * limit < totalAccessibleCount,
        hasPrev: page > 1,
      },
      // 실제 데이터 정보
      _meta: {
        mode: 'real',
        queriedAt: new Date().toISOString(),
        categoryId,
        filteredByAccess: true,
        originalCount: allItems.length,
        accessibleCount: totalAccessibleCount,
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
