import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';
import { PERMISSION_CHECKS } from '@/lib/constants';

interface VendorData {
  mb_no: number;
  mb_id: string;
  mb_name: string;
  mb_level: number;
  vendor_name: string | null;
  vendor_class: string | null;
  vendor_representative: string | null;
  vendor_tel: string | null;
  vendor_email: string | null;
  vendor_fax: string | null;
  vendor_number: string | null;
  vendro_request_date: string | null;
  vendro_apply_date: string | null;
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number; mb_level: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (!PERMISSION_CHECKS.isAdmin(decoded.mb_level)) {
      return NextResponse.json(
        { success: false, message: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const searchType = searchParams.get('searchType') || 'mb_id';
    const stx = searchParams.get('stx') || '';
    const startDt = searchParams.get('startDt') || '';
    const endDt = searchParams.get('endDt') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // 기본 쿼리
    let countQuery = 'SELECT COUNT(*) as total FROM g5_member WHERE vendro_request_date IS NOT NULL';
    let dataQuery = `
      SELECT 
        mb_no,
        mb_id,
        mb_name,
        mb_level,
        vendor_name,
        vendor_class,
        vendor_representative,
        vendor_tel,
        vendor_email,
        vendor_fax,
        vendor_number,
        vendro_request_date,
        vendro_apply_date
      FROM g5_member 
      WHERE vendro_request_date IS NOT NULL
    `;

    const queryParams: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    // 검색 조건 추가
    if (status) {
      const statusCondition = ' AND mb_level = ?';
      countQuery += statusCondition;
      dataQuery += statusCondition;
      countParams.push(status);
      queryParams.push(status);
    }

    if (stx && searchType) {
      const searchCondition = searchType === 'mb_id' 
        ? ' AND mb_id LIKE ?' 
        : ' AND mb_name LIKE ?';
      const searchValue = `%${stx}%`;
      
      countQuery += searchCondition;
      dataQuery += searchCondition;
      countParams.push(searchValue);
      queryParams.push(searchValue);
    }

    if (startDt && !endDt) {
      const dateCondition = ' AND DATE(vendro_request_date) >= ?';
      countQuery += dateCondition;
      dataQuery += dateCondition;
      countParams.push(startDt);
      queryParams.push(startDt);
    } else if (!startDt && endDt) {
      const dateCondition = ' AND DATE(vendro_request_date) <= ?';
      countQuery += dateCondition;
      dataQuery += dateCondition;
      countParams.push(endDt);
      queryParams.push(endDt);
    } else if (startDt && endDt) {
      const dateCondition = ' AND DATE(vendro_request_date) BETWEEN ? AND ?';
      countQuery += dateCondition;
      dataQuery += dateCondition;
      countParams.push(startDt, endDt);
      queryParams.push(startDt, endDt);
    }

    // 전체 카운트 조회
    const countResult = await executeQuery(countQuery, countParams) as Array<{ total: number }>;
    const totalCount = countResult[0]?.total || 0;

    // 데이터 조회
    dataQuery += ' ORDER BY vendro_request_date DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const vendors = await executeQuery(dataQuery, queryParams) as VendorData[];

    return NextResponse.json({
      success: true,
      vendors,
      totalCount,
      page,
      limit,
    });
  } catch (error) {
    console.error('벤더 목록 조회 오류:', error);
    
    return NextResponse.json(
      { success: false, message: '벤더 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 