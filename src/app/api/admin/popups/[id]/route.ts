import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const DELETE = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const popupId = parseInt((await params).id, 10);

    if (isNaN(popupId)) {
      return NextResponse.json({ error: '유효하지 않은 팝업 ID입니다.' }, { status: 400 });
    }

    // 팝업 존재 여부 확인
    const existingPopup = await executeQuery('SELECT nw_id FROM g5_new_win WHERE nw_id = ?', [
      popupId,
    ]);

    if (!Array.isArray(existingPopup) || existingPopup.length === 0) {
      return NextResponse.json({ error: '팝업을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팝업 삭제
    await executeQuery('DELETE FROM g5_new_win WHERE nw_id = ?', [popupId]);

    return NextResponse.json({ success: true, message: '팝업이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('팝업 삭제 오류:', error);
    return NextResponse.json({ error: '팝업 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
};

// 개별 팝업 조회 (편집용)
export const GET = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const popupId = parseInt((await params).id, 10);

    if (isNaN(popupId)) {
      return NextResponse.json({ error: '유효하지 않은 팝업 ID입니다.' }, { status: 400 });
    }

    const result = await executeQuery('SELECT * FROM g5_new_win WHERE nw_id = ?', [popupId]);

    if (!Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ error: '팝업을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('팝업 조회 오류:', error);
    return NextResponse.json({ error: '팝업 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
};

// 개별 팝업 수정
export const PUT = async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const popupId = parseInt((await params).id, 10);

    if (isNaN(popupId)) {
      return NextResponse.json({ error: '유효하지 않은 팝업 ID입니다.' }, { status: 400 });
    }

    const data = await request.json();

    // 팝업 존재 여부 확인
    const existingPopup = await executeQuery('SELECT nw_id FROM g5_new_win WHERE nw_id = ?', [
      popupId,
    ]);

    if (!Array.isArray(existingPopup) || existingPopup.length === 0) {
      return NextResponse.json({ error: '팝업을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 팝업 정보 업데이트
    await executeQuery(
      `UPDATE g5_new_win SET 
        nw_division = ?, 
        nw_device = ?, 
        nw_begin_time = ?, 
        nw_end_time = ?, 
        nw_disable_hours = ?, 
        nw_left = ?, 
        nw_top = ?, 
        nw_height = ?, 
        nw_width = ?, 
        nw_subject = ?, 
        nw_content = ?, 
        nw_content_html = ?
       WHERE nw_id = ?`,
      [
        data.nw_division,
        data.nw_device,
        data.nw_begin_time,
        data.nw_end_time,
        data.nw_disable_hours,
        data.nw_left,
        data.nw_top,
        data.nw_height,
        data.nw_width,
        data.nw_subject,
        data.nw_content,
        data.nw_content_html,
        popupId,
      ],
    );

    return NextResponse.json({ success: true, message: '팝업이 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('팝업 수정 오류:', error);
    return NextResponse.json({ error: '팝업 수정 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
