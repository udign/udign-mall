import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { AdminUser, MemberListParams } from '@/types/user';
import { PAGINATION_CONFIG, PERMISSION_CHECKS } from '@/lib/constants';

export const GET = async (request: NextRequest) => {
  try {
    // 현재 사용자 인증 및 권한 확인
    const currentUser = await getCurrentUser();
    if (!currentUser || !PERMISSION_CHECKS.isAdmin(currentUser.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = PAGINATION_CONFIG.ITEMS_PER_PAGE;

    const params: MemberListParams = {
      page,
      limit,
      sortBy: searchParams.get('sortBy') || 'mb_datetime',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // 기본 쿼리
    const baseQuery = `
      SELECT 
        mb_no,
        mb_id,
        mb_name,
        mb_nick,
        mb_email,
        mb_hp,
        mb_tel,
        mb_level,
        mb_datetime,
        mb_today_login,
        mb_login_ip,
        mb_leave_date,
        mb_intercept_date,
        mb_certify,
        mb_adult,
        mb_email_certify,
        mb_sms,
        mb_mailling,
        mb_open,
        mb_point,
        CASE 
          WHEN mb_leave_date IS NOT NULL AND mb_leave_date != '' THEN 'leave'
          WHEN mb_intercept_date IS NOT NULL AND mb_intercept_date != '' THEN 'blocked'
          ELSE 'normal'
        END as mb_status
      FROM g5_member
    `;

    // WHERE 조건 구성
    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];

    // 권한에 따른 추가 제한 (슈퍼 관리자가 아닌 경우)
    if (!PERMISSION_CHECKS.isSuperAdmin(currentUser.mb_level)) {
      whereConditions.push('mb_level <= ?');
      queryParams.push(currentUser.mb_level);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 전체 카운트 쿼리
    const countQuery = `
      SELECT COUNT(*) as total
      FROM g5_member
      ${whereClause}
    `;

    const countResult = (await executeQuery(countQuery, queryParams)) as { total: number }[];
    const totalCount = countResult[0]?.total || 0;

    // 페이징 계산
    const totalPages = Math.ceil(totalCount / limit);
    const offset = Math.max(0, (page - 1) * limit);

    // 정렬 및 페이징 추가 (LIMIT, OFFSET을 직접 쿼리에 삽입)
    const orderBy = `ORDER BY ${params.sortBy} ${params.sortOrder?.toUpperCase()}`;
    const limitClause = `LIMIT ${limit} OFFSET ${offset}`;

    const finalQuery = `
      ${baseQuery}
      ${whereClause}
      ${orderBy}
      ${limitClause}
    `;

    // 회원 목록 조회
    const members = (await executeQuery(finalQuery, queryParams)) as AdminUser[];

    // 응답 데이터 구성
    return NextResponse.json({
      success: true,
      data: {
        members,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error('회원 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '회원 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
