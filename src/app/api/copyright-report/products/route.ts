import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';
import { ProductSearchResponse } from '@/types/copyright-report';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const ca_id = searchParams.get('ca_id') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // 카테고리 조건
    let categoryCondition = '';
    const params: (string | number)[] = [];
    
    if (ca_id) {
      categoryCondition = 'AND i.ca_id = ?';
      params.push(ca_id);
    }

    // 검색 조건
    let searchCondition = '';
    if (search) {
      searchCondition = 'AND i.it_name LIKE ?';
      params.push(`%${search}%`);
    }

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM g5_shop_item i
      LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
      WHERE i.it_use = 1
      ${categoryCondition}
      ${searchCondition}
    `;
    const countResult = await executeQuery(countQuery, params) as Array<{ total: number }>;
    const totalCount = countResult[0]?.total || 0;

    // 제품 목록 조회
    const query = `
      SELECT 
        i.it_id,
        i.it_name,
        i.it_img1,
        i.it_basic,
        i.ca_id,
        c.ca_name,
        i.it_1 as creator_id,
        i.it_2 as creator_name
      FROM g5_shop_item i
      LEFT JOIN g5_shop_category c ON i.ca_id = c.ca_id
      WHERE i.it_use = 1
      ${categoryCondition}
      ${searchCondition}
      ORDER BY i.it_time DESC
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, limit, offset];
    const products = await executeQuery(query, queryParams) as Array<{
      it_id: string;
      it_name: string;
      it_img1: string | null;
      it_basic: string;
      ca_id: string;
      ca_name: string | null;
      creator_id: string | null;
      creator_name: string | null;
    }>;

    const totalPages = Math.ceil(totalCount / limit);

    const response: ProductSearchResponse = {
      success: true,
      products: products.map((product) => ({
        it_id: product.it_id,
        it_name: product.it_name,
        it_img1: product.it_img1,
        it_basic: product.it_basic,
        ca_id: product.ca_id,
        ca_name: product.ca_name || '미분류',
        creator_id: product.creator_id || '',
        creator_name: product.creator_name || '',
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching products for copyright report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '제품 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 