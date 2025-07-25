import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import { getImageUrl } from '@/lib/utils';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
  admin_review_status: 'Y' | 'N' | 'R' | string | null;
  current_likes: number;
  is_liked: number;
}

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

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    if (!q) {
      return NextResponse.json(
        {
          success: false,
          error: '검색어를 입력해주세요.',
        },
        { status: 400 },
      );
    }

    // 검색어 길이 제한 (최대 30글자)
    if (q.length > 30) {
      return NextResponse.json(
        {
          success: false,
          error: '검색어는 30글자 이내로 입력해주세요.',
        },
        { status: 400 },
      );
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
      // 토큰이 유효하지 않은 경우 무시 (비로그인 사용자)
    }

    // 검색어를 공백으로 분리
    const searchTerms = q.split(' ').filter((term) => term.trim().length > 0);

    if (searchTerms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 검색어를 입력해주세요.',
        },
        { status: 400 },
      );
    }

    // 매우 단순한 검색 방식: 문자열 직접 삽입 (임시 디버깅용)
    const searchPattern = searchTerms.join(' ');
    const escapedPattern = searchPattern.replace(/'/g, "''"); // SQL injection 방지

    // 전체 검색 결과 수 조회
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM g5_shop_item i
      WHERE i.it_use = '1' AND (
        i.it_name LIKE '%${escapedPattern}%' OR 
        i.it_explan LIKE '%${escapedPattern}%' OR 
        i.it_id LIKE '%${escapedPattern}%' OR 
        i.it_basic LIKE '%${escapedPattern}%'
      )
    `;

    const countResult = (await executeQuery(countQuery, [])) as [{ total_count: number }];
    const totalCount = countResult[0]?.total_count || 0;

    // 검색 결과 조회 (좋아요 상태 포함)
    let searchQuery;

    if (currentUserId) {
      // 로그인 상태: 사용자별 좋아요 상태 포함
      searchQuery = `
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
          i.it_10 as admin_review_status,
          COALESCE(like_count.cnt, 0) as current_likes,
          CASE WHEN user_like.it_id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM g5_shop_item i
        LEFT JOIN (
          SELECT it_id, COUNT(*) as cnt 
          FROM g5_shop_interrest 
          GROUP BY it_id
        ) like_count ON i.it_id = like_count.it_id
        LEFT JOIN g5_shop_interrest user_like ON i.it_id = user_like.it_id AND user_like.mb_id = '${currentUserId}'
        WHERE i.it_use = '1' AND (
          i.it_name LIKE '%${escapedPattern}%' OR 
          i.it_explan LIKE '%${escapedPattern}%' OR 
          i.it_id LIKE '%${escapedPattern}%' OR 
          i.it_basic LIKE '%${escapedPattern}%'
        )
        ORDER BY i.it_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // 비로그인 상태: 좋아요 상태 없이 조회 (중복 방지)
      searchQuery = `
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
          i.it_10 as admin_review_status,
          COALESCE(like_count.cnt, 0) as current_likes,
          0 as is_liked
        FROM g5_shop_item i
        LEFT JOIN (
          SELECT it_id, COUNT(*) as cnt 
          FROM g5_shop_interrest 
          GROUP BY it_id
        ) like_count ON i.it_id = like_count.it_id
        WHERE i.it_use = '1' AND (
          i.it_name LIKE '%${escapedPattern}%' OR 
          i.it_explan LIKE '%${escapedPattern}%' OR 
          i.it_id LIKE '%${escapedPattern}%' OR 
          i.it_basic LIKE '%${escapedPattern}%'
        )
        ORDER BY i.it_id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const searchResults = (await executeQuery(searchQuery, [])) as ProductRow[];

    // 결과 데이터 가공 (좋아요 상태 포함)
    const processedItems = searchResults.map((item) => ({
      it_id: item.it_id,
      it_name: item.it_name,
      it_basic: item.it_basic,
      it_cust_price: item.it_cust_price,
      it_price: item.it_price,
      it_img1: getImageUrl(item.it_img1),
      it_img2: getImageUrl(item.it_img2),
      it_img3: getImageUrl(item.it_img3),
      it_use_avg: item.it_use_avg,
      it_use_cnt: item.it_use_cnt,
      it_hit: item.it_hit,
      it_time: item.it_time,
      it_update_time: item.it_update_time,
      ca_id: item.ca_id,
      creator_id: item.creator_id,
      creator_name: item.creator_name,
      description: item.description,
      likes_count: (item.current_likes || 0).toString(),
      is_liked: Boolean(item.is_liked),
      current_likes: item.current_likes || 0,
      target_likes: item.target_likes || 100, // 기본값 100으로 설정
      it_4: item.target_likes, // 블러 처리 로직을 위한 it_4 추가
      _status_text: calculateProductStatus(item), // 상태 텍스트 추가
    }));

    return NextResponse.json({
      success: true,
      query: q,
      searchTerms: searchTerms,
      items: processedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
      _meta: {
        searchedAt: new Date().toISOString(),
        currentUserId: currentUserId || null,
      },
    });
  } catch (error) {
    console.error('검색 오류:', error);
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
