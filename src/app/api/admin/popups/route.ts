import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { PopupListResponse, PopupListItem, CreatePopupRequest } from '@/types/popup';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { put, del, list } from '@vercel/blob';

// 임시 폴더의 이미지를 정식 팝업 폴더로 이동하는 함수
const moveImagesFromTempToPopup = async (tempPopupId: string, popupId: number, content: string) => {
  try {
    // 임시 폴더의 이미지 목록 조회
    const { blobs } = await list({
      prefix: `popup/${tempPopupId}/`,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    let updatedContent = content;

    // 각 이미지를 새로운 경로로 복사하고 HTML 내용 업데이트
    for (const blob of blobs) {
      const oldUrl = blob.url;
      const fileName = blob.pathname.split('/').pop();

      if (fileName) {
        // 이미지 데이터 가져오기
        const response = await fetch(oldUrl);
        const imageData = await response.blob();

        // 새로운 경로로 업로드
        const newBlob = await put(`popup/${popupId}/${fileName}`, imageData, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        // HTML 내용에서 이미지 URL 교체
        updatedContent = updatedContent.replace(
          new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          newBlob.url,
        );

        // 임시 이미지 삭제
        await del(oldUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      }
    }

    return updatedContent;
  } catch (error) {
    console.error('이미지 이동 중 오류:', error);
    return content; // 오류 시 원본 내용 반환
  }
};

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

    const body: CreatePopupRequest & { tempPopupId?: string } = await request.json();

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
    const popupId = insertResult.insertId;

    // 임시 폴더의 이미지를 정식 폴더로 이동
    let finalContent = body.nw_content;
    if (body.tempPopupId && body.nw_content) {
      finalContent = await moveImagesFromTempToPopup(body.tempPopupId, popupId, body.nw_content);

      // 이미지 경로가 변경된 경우 팝업 내용 업데이트
      if (finalContent !== body.nw_content) {
        await executeQuery('UPDATE g5_new_win SET nw_content = ? WHERE nw_id = ?', [
          finalContent,
          popupId,
        ]);
      }
    }

    return NextResponse.json(
      { message: '팝업이 성공적으로 생성되었습니다.', nw_id: popupId },
      { status: 201 },
    );
  } catch (error) {
    console.error('팝업 생성 오류:', error);
    return NextResponse.json({ error: '팝업 생성에 실패했습니다.' }, { status: 500 });
  }
};
