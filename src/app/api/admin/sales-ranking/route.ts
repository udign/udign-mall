import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { ProductRankingQueryParams, ProductRankingItem, ProductCategory } from '@/types/sales';
import { executeQuery } from '@/lib/database';
import { getImageUrl } from '@/lib/utils';

// 데이터베이스 쿼리 결과 타입 정의
interface RankingQueryResult {
  it_id: string;
  it_name: string;
  it_img1: string | null;
  ca_id: string;
  ca_name: string;
  shopping: number;
  ordered: number;
  paid: number;
  preparing: number;
  shipped: number;
  completed: number;
  cancelled: number;
  returned: number;
  outOfStock: number;
  totalQty: number;
}

interface CountQueryResult {
  totalCount: number;
}

interface CategoryQueryResult {
  ca_id: string;
  ca_name: string;
  ca_order: number;
}

export const POST = async (request: NextRequest) => {
  try {
    const user = await getCurrentUser();

    // 관리자 권한 체크
    if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const params: ProductRankingQueryParams = await request.json();

    // 기본값 설정
    const page = params.page || 1;
    const limit = params.limit || 20;
    const sortBy = params.sortBy || 'totalQty';
    const sortOrder = params.sortOrder || 'desc';
    const offset = (page - 1) * limit;

    // WHERE 조건 구성
    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];

    // 기간 필터
    if (params.startDate && params.endDate) {
      whereConditions.push('a.ct_time BETWEEN ? AND ?');
      queryParams.push(`${params.startDate} 00:00:00`, `${params.endDate} 23:59:59`);
    }

    // 카테고리 필터
    if (params.categoryId) {
      whereConditions.push('b.ca_id LIKE ?');
      queryParams.push(`${params.categoryId}%`);
    }

    const whereClause = whereConditions.length > 0 ? `AND ${whereConditions.join(' AND ')}` : '';

    // 안전한 정렬 컬럼명 가져오기
    const sortColumn = getSortColumn(sortBy);
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // 메인 쿼리 - 상품별 판매 데이터 집계
    const mainSql = `
      SELECT 
        a.it_id,
        b.it_name,
        b.it_img1,
        b.ca_id,
        c.ca_name,
        SUM(IF(a.ct_status = '쇼핑', a.ct_qty, 0)) as shopping,
        SUM(IF(a.ct_status = '주문', a.ct_qty, 0)) as ordered,
        SUM(IF(a.ct_status = '입금', a.ct_qty, 0)) as paid,
        SUM(IF(a.ct_status = '준비', a.ct_qty, 0)) as preparing,
        SUM(IF(a.ct_status = '배송', a.ct_qty, 0)) as shipped,
        SUM(IF(a.ct_status = '완료', a.ct_qty, 0)) as completed,
        SUM(IF(a.ct_status = '취소', a.ct_qty, 0)) as cancelled,
        SUM(IF(a.ct_status = '반품', a.ct_qty, 0)) as returned,
        SUM(IF(a.ct_status = '품절', a.ct_qty, 0)) as outOfStock,
        SUM(a.ct_qty) as totalQty
      FROM g5_shop_cart a 
      INNER JOIN g5_shop_item b ON a.it_id = b.it_id
      LEFT JOIN g5_shop_category c ON b.ca_id = c.ca_id
      WHERE 1=1 ${whereClause}
      GROUP BY a.it_id, b.it_name, b.it_img1, b.ca_id, c.ca_name
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ${limit} OFFSET ${offset}
    `;

    // 전체 개수 조회 쿼리
    const countSql = `
      SELECT COUNT(DISTINCT a.it_id) as totalCount
      FROM g5_shop_cart a 
      INNER JOIN g5_shop_item b ON a.it_id = b.it_id
      WHERE 1=1 ${whereClause}
    `;

    // 쿼리 실행
    const [mainResults, countResults] = await Promise.all([
      executeQuery(mainSql, queryParams),
      executeQuery(countSql, queryParams),
    ]);

    const countData = countResults as CountQueryResult[];
    const mainData = mainResults as RankingQueryResult[];

    const totalCount = countData[0]?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // 결과 데이터 변환
    const rankingData: ProductRankingItem[] = mainData.map((row, index) => ({
      it_id: row.it_id,
      it_name: row.it_name,
      it_img1: getImageUrl(row.it_img1) || '',
      ca_id: row.ca_id,
      ca_name: row.ca_name,
      rank: offset + index + 1,
      shopping: Number(row.shopping) || 0,
      ordered: Number(row.ordered) || 0,
      paid: Number(row.paid) || 0,
      preparing: Number(row.preparing) || 0,
      shipped: Number(row.shipped) || 0,
      completed: Number(row.completed) || 0,
      cancelled: Number(row.cancelled) || 0,
      returned: Number(row.returned) || 0,
      outOfStock: Number(row.outOfStock) || 0,
      totalQty: Number(row.totalQty) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        rankingData,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('상품판매순위 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '상품판매순위 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};

// 카테고리 목록 조회 API
export const GET = async () => {
  try {
    const user = await getCurrentUser();

    // 관리자 권한 체크
    if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const sql = `
      SELECT ca_id, ca_name, ca_order 
      FROM g5_shop_category 
      ORDER BY ca_order, ca_id
    `;

    const results = (await executeQuery(sql)) as CategoryQueryResult[];

    const categories: ProductCategory[] = results.map((row) => ({
      ca_id: row.ca_id,
      ca_name: row.ca_name,
      ca_order: Number(row.ca_order) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};

// 정렬 컬럼 매핑 함수
const getSortColumn = (sortBy: string): string => {
  const columnMap: Record<string, string> = {
    shopping: 'shopping',
    ordered: 'ordered',
    paid: 'paid',
    preparing: 'preparing',
    shipped: 'shipped',
    completed: 'completed',
    cancelled: 'cancelled',
    returned: 'returned',
    outOfStock: 'outOfStock',
    totalQty: 'totalQty',
  };

  return columnMap[sortBy] || 'totalQty';
};
