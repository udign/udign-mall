import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { PopupListResponse, PopupListItem, CreatePopupRequest } from '@/types/popup';
import { PERMISSION_CHECKS } from '@/lib/constants';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // 전체 팝업 개수 조회 (쇼핑몰만)
    const countResult = (await executeQuery(
      "SELECT COUNT(*) as total FROM g5_new_win WHERE nw_division IN ('shop', 'both')",
    )) as {
      total: number;
    }[];
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 팝업 목록 조회 (최신순, 쇼핑몰만)
    const limitClause = `LIMIT ${limit} OFFSET ${offset}`;
    const rows = (await executeQuery(
      `SELECT 
          nw_id,
          nw_subject,
          nw_device,
          nw_division,
          nw_begin_time,
          nw_end_time,
          nw_disable_hours,
          nw_left,
          nw_top,
          nw_width,
          nw_height,
          CASE 
            WHEN NOW() BETWEEN nw_begin_time AND nw_end_time THEN 1 
            ELSE 0 
          END as is_active
        FROM g5_new_win 
        WHERE nw_division IN ('shop', 'both')
        ORDER BY nw_id DESC 
        ${limitClause}`,
    )) as PopupListItem[];

    const popups: PopupListItem[] = rows.map((row) => ({
      nw_id: row.nw_id,
      nw_subject: row.nw_subject,
      nw_device: row.nw_device,
      nw_division: row.nw_division,
      nw_begin_time: row.nw_begin_time,
      nw_end_time: row.nw_end_time,
      nw_disable_hours: row.nw_disable_hours,
      nw_left: row.nw_left,
      nw_top: row.nw_top,
      nw_width: row.nw_width,
      nw_height: row.nw_height,
      is_active: Boolean(row.is_active),
    }));

    const response: PopupListResponse = {
      popups,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('팝업 목록 조회 오류:', error);
    return NextResponse.json({ error: '팝업 목록을 불러오는데 실패했습니다.' }, { status: 500 });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    // 현재 사용자 인증 및 권한 확인
    const currentUser = await getCurrentUser();
    if (!currentUser || !PERMISSION_CHECKS.isAdmin(currentUser.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const body: CreatePopupRequest = await request.json();

    // 필수 필드 검증
    if (!body.nw_subject || !body.nw_begin_time || !body.nw_end_time) {
      return NextResponse.json(
        { error: '제목, 시작일시, 종료일시는 필수 입력 항목입니다.' },
        { status: 400 },
      );
    }

    // 팝업 생성
    const result = await executeQuery(
      `INSERT INTO g5_new_win (
        nw_division, nw_device, nw_begin_time, nw_end_time, nw_disable_hours,
        nw_left, nw_top, nw_height, nw_width, nw_subject, nw_content, nw_content_html
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.nw_division,
        body.nw_device,
        body.nw_begin_time,
        body.nw_end_time,
        body.nw_disable_hours,
        body.nw_left,
        body.nw_top,
        body.nw_height,
        body.nw_width,
        body.nw_subject,
        body.nw_content,
        body.nw_content_html,
      ],
    );

    const insertResult = result as { insertId: number };

    return NextResponse.json(
      { message: '팝업이 성공적으로 생성되었습니다.', nw_id: insertResult.insertId },
      { status: 201 },
    );
  } catch (error) {
    console.error('팝업 생성 오류:', error);
    return NextResponse.json({ error: '팝업 생성에 실패했습니다.' }, { status: 500 });
  }
};
