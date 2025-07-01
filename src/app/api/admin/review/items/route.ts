import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// 데이터베이스 결과 타입 정의
interface DatabaseItem {
  it_id: string;
  it_name: string;
  it_img1: string;
  it_1: string;
  it_2: string;
  it_3: string;
  it_4: number;
  it_8: number;
  it_9: 'Y' | 'N';
  it_10: 'Y' | 'N' | string;
  it_time: string;
  it_use: '1' | '0';
  it_price: number;
  interest_count: number;
}

// 검수 상태 계산 함수 (udign-php 로직 참고)
const calculateReviewStatus = (item: DatabaseItem) => {
  const goalAttainment = item.interest_count >= item.it_4;
  const daysPassed = Math.floor(
    (Date.now() - new Date(item.it_time).getTime()) / (1000 * 60 * 60 * 24),
  );
  const reviewDays = parseInt(item.it_8.toString()) || 0;
  const manualReview = item.it_9 === 'Y';

  // 1. 관리자 토글 최우선 처리
  if (item.it_10 === 'Y') {
    return 'in_review'; // 심의중
  }

  // 2. 심의 종료 상태 처리
  if (item.it_10 === 'N') {
    return 'approved'; // 승인
  }

  // 3. 반려 상태 처리
  if (item.it_10 === 'R') {
    return 'rejected'; // 반려
  }

  // 4. 목표를 달성하지 않은 경우
  if (!goalAttainment) {
    return 'collection'; // 컬렉션
  }

  // 5. 목표를 달성한 경우 → 자동으로 심의중 상태
  if (goalAttainment) {
    // 수동 심의 모드이고 기간이 설정된 경우
    if (manualReview && reviewDays > 0 && daysPassed < reviewDays) {
      return 'collection'; // 아직 심의 기간 도래 전
    }
    // 자동 심의 모드 또는 수동 심의 기간 도래 → 심의중
    return 'in_review'; // 심의중
  }

  return 'collection';
};

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'pending';
    const search = searchParams.get('search') || '';

    const offset = (page - 1) * limit;

    // 기본 쿼리 - 상품과 좋아요 수 조인
    let baseQuery = `
      FROM g5_shop_item it
      LEFT JOIN (
        SELECT it_id, COUNT(*) as interest_count 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) interests ON it.it_id = interests.it_id
      WHERE it.it_use = "1"
    `;

    // 검색 조건 추가
    if (search) {
      baseQuery += ` AND (it.it_name LIKE '%${search}%' OR it.it_1 LIKE '%${search}%' OR it.it_2 LIKE '%${search}%')`;
    }

    // 상태별 필터링
    let statusCondition = '';
    switch (status) {
      case 'pending':
        // 목표 달성한 상품들 (관리자 심의중 설정 포함) - PHP 시스템과 동일한 로직
        statusCondition = `
          AND (
            (COALESCE(interests.interest_count, 0) >= CAST(it.it_4 AS UNSIGNED) AND (it.it_10 IS NULL OR it.it_10 = '')) OR
            (it.it_10 = 'Y')
          )
        `;
        break;
      case 'in_review':
        // 관리자가 명시적으로 심의중으로 설정한 상품들 또는 목표 달성 상품들
        statusCondition = `
          AND (
            (it.it_10 = 'Y') OR 
            (COALESCE(interests.interest_count, 0) >= CAST(it.it_4 AS UNSIGNED) AND (it.it_10 IS NULL OR it.it_10 = ''))
          )
        `;
        break;
      case 'approved':
        statusCondition = ` AND it.it_10 = 'N'`;
        break;
      case 'rejected':
        statusCondition = ` AND it.it_10 = 'R'`;
        break;
      case 'collection':
        statusCondition = `
          AND COALESCE(interests.interest_count, 0) < CAST(it.it_4 AS UNSIGNED)
        `;
        break;
      default:
        // 'all' 또는 기타
        break;
    }

    baseQuery += statusCondition;

    // 전체 개수 조회
    const countRows = (await executeQuery(`SELECT COUNT(*) as total ${baseQuery}`)) as {
      total: number;
    }[];
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // 실제 데이터 조회
    const selectQuery = `
      SELECT 
        it.it_id,
        it.it_name,
        it.it_img1,
        it.it_1,
        it.it_2,
        it.it_3,
        it.it_4,
        it.it_8,
        it.it_9,
        it.it_10,
        it.it_time,
        it.it_use,
        it.it_price,
        COALESCE(interests.interest_count, 0) as interest_count
      ${baseQuery}
      ORDER BY it.it_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const dataRows = (await executeQuery(selectQuery)) as DatabaseItem[];

    // 검수 상태 계산 및 추가 정보 처리
    const items = dataRows.map((item) => {
      const goalAttained = item.interest_count >= item.it_4;
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(item.it_time).getTime()) / (1000 * 60 * 60 * 24),
      );
      const reviewStatus = calculateReviewStatus(item);

      return {
        it_id: item.it_id,
        it_name: item.it_name,
        it_img1: item.it_img1,
        it_1: item.it_1,
        it_2: item.it_2,
        it_3: item.it_3,
        it_4: item.it_4,
        it_8: item.it_8,
        it_9: item.it_9,
        it_10: item.it_10,
        it_time: item.it_time,
        it_use: item.it_use,
        it_price: item.it_price,
        interest_count: item.interest_count,
        days_since_created: daysSinceCreated,
        goal_achieved: goalAttained,
        review_status: reviewStatus,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('검수 항목 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
