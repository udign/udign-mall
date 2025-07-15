import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { getConnection } from '@/lib/database';
import { ReturnListItem, ReturnListResponse, ReturnListParams } from '@/types/return';

// 데이터베이스 쿼리 결과 타입 정의
interface DatabaseReturnRow {
  return_id: number;
  od_id: string;
  mb_id: string | null;
  return_name: string;
  return_phone: string;
  return_type: string;
  return_reason: string;
  return_image: string | null;
  return_status: string;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
  od_time: string;
  od_name: string;
  od_status: string;
  od_settle_case: string;
  od_receipt_price: string | number;
  od_cart_count: string | number;
  mb_name: string | null;
}

interface StatusCountRow {
  return_status: string;
  count: number;
}

interface TotalCountRow {
  total: number;
}

// 쿼리 파라미터 파싱 함수
const parseQueryParams = (searchParams: URLSearchParams): ReturnListParams => {
  const params: ReturnListParams = {};

  // 페이지 번호
  const page = searchParams.get('page');
  if (page) {
    params.page = parseInt(page, 10);
  }

  // 페이지 크기
  const limit = searchParams.get('limit');
  if (limit) {
    params.limit = parseInt(limit, 10);
  }

  // 상태 필터
  const status = searchParams.get('status');
  if (status) {
    params.status = status as ReturnListParams['status'];
  }

  // 검색
  const search = searchParams.get('search');
  if (search) {
    params.search = search;
  }

  const searchField = searchParams.get('searchField');
  if (searchField) {
    params.searchField = searchField as ReturnListParams['searchField'];
  }

  // 정렬
  const sort = searchParams.get('sort');
  if (sort) {
    params.sort = sort;
  }

  const order = searchParams.get('order');
  if (order) {
    params.order = order as 'asc' | 'desc';
  }

  return params;
};

// WHERE 조건 구성 함수 - 파라미터 바인딩 없이 직접 값 삽입
const buildWhereClause = (params: ReturnListParams): string => {
  const conditions: string[] = [];

  // 상태 필터
  if (params.status && typeof params.status === 'string' && params.status.trim() !== '') {
    conditions.push(`r.return_status = '${params.status.replace(/'/g, "''")}'`);
  }

  // 검색 조건
  if (params.search && params.searchField) {
    const escapedSearch = params.search.replace(/'/g, "''");
    conditions.push(`r.${params.searchField} LIKE '%${escapedSearch}%'`);
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
};

// 정렬 조건 구성 함수
const buildOrderClause = (params: ReturnListParams): string => {
  const sort = params.sort || 'return_id';
  const order = params.order || 'desc';

  // 허용된 정렬 필드 체크
  const allowedSortFields = [
    'return_id',
    'created_at',
    'od_id',
    'return_name',
    'return_type',
    'return_status',
  ];
  const sortField = allowedSortFields.includes(sort) ? sort : 'return_id';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  return `ORDER BY r.${sortField} ${sortOrder}`;
};

// 상태별 개수 조회 함수
const getStatusCounts = async (
  connection: Awaited<ReturnType<typeof getConnection>>,
): Promise<ReturnListResponse['statusCounts']> => {
  // 전체 상태별 카운트 조회 (필터 없이)
  const countQuery = `
    SELECT 
      return_status,
      COUNT(*) as count
    FROM g5_shop_return r
    GROUP BY return_status
  `;

  const [statusRows] = await connection.execute(countQuery);

  const statusCounts = {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
  };

  // 전체 카운트 조회
  const totalQuery = `SELECT COUNT(*) as total FROM g5_shop_return`;
  const [totalRows] = await connection.execute(totalQuery);
  const totalRow = (totalRows as TotalCountRow[])[0];
  statusCounts.total = totalRow?.total || 0;

  // 상태별 카운트 설정
  (statusRows as StatusCountRow[]).forEach((row) => {
    statusCounts[row.return_status as keyof typeof statusCounts] = row.count;
  });

  return statusCounts;
};

export const GET = async (request: NextRequest) => {
  try {
    // 인증 체크
    const user = await getCurrentUser();
    if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = parseQueryParams(searchParams);

    // 페이지네이션 설정
    const page = Math.max(1, parseInt(String(params.page || 1), 10));
    const limit = Math.max(1, parseInt(String(params.limit || 20), 10));
    const offset = (page - 1) * limit;

    const connection = await getConnection();

    // WHERE 조건 구성
    const where = buildWhereClause(params);

    // 정렬 조건 구성
    const orderClause = buildOrderClause(params);

    // 메인 쿼리 - 파라미터 없이 먼저 시도
    const query = `
      SELECT 
        r.return_id,
        r.od_id,
        r.mb_id,
        r.return_name,
        r.return_phone,
        r.return_type,
        r.return_reason,
        r.return_image,
        r.return_status,
        r.admin_memo,
        r.created_at,
        r.updated_at,
        o.od_time,
        o.od_name,
        o.od_status,
        o.od_settle_case,
        o.od_receipt_price,
        o.od_cart_count,
        m.mb_name
      FROM g5_shop_return r
      LEFT JOIN g5_shop_order o ON r.od_id = o.od_id
      LEFT JOIN g5_member m ON r.mb_id = m.mb_id
      ${where}
      ${orderClause}
      LIMIT ${offset}, ${limit}
    `;

    const [rows] = await connection.execute(query);

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM g5_shop_return r
      LEFT JOIN g5_shop_order o ON r.od_id = o.od_id
      LEFT JOIN g5_member m ON r.mb_id = m.mb_id
      ${where}
    `;

    const [countRows] = await connection.execute(countQuery);
    const countRow = (countRows as TotalCountRow[])[0];
    const total = countRow?.total || 0;

    // 상태별 개수 조회
    const statusCounts = await getStatusCounts(connection);

    // 데이터 변환
    const returns: ReturnListItem[] = (rows as DatabaseReturnRow[]).map((row) => ({
      return_id: row.return_id,
      od_id: row.od_id,
      mb_id: row.mb_id,
      return_name: row.return_name,
      return_phone: row.return_phone,
      return_type: row.return_type as 'exchange' | 'return',
      return_reason: row.return_reason,
      return_image: row.return_image,
      return_status: row.return_status as 'pending' | 'approved' | 'completed' | 'rejected',
      admin_memo: row.admin_memo,
      created_at: row.created_at,
      updated_at: row.updated_at,
      od_time: row.od_time,
      od_name: row.od_name,
      od_status: row.od_status,
      od_settle_case: row.od_settle_case,
      od_receipt_price: Number(row.od_receipt_price) || 0,
      od_cart_count: Number(row.od_cart_count) || 0,
      mb_name: row.mb_name,
    }));

    const response: ReturnListResponse = {
      returns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('교환/반품 목록 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
};
