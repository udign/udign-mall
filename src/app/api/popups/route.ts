import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { DisplayPopup, PopupQueryResult } from '@/types/popup';

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const device = searchParams.get('device') || 'pc'; // pc 또는 mobile

    // 현재 활성화된 팝업 조회 (쇼핑몰용)
    const query = `SELECT 
      nw_id,
      nw_subject,
      nw_content,
      nw_left,
      nw_top,
      nw_width,
      nw_height,
      nw_disable_hours,
      nw_begin_time,
      nw_end_time,
      nw_device,
      nw_division,
      CASE 
        WHEN NOW() BETWEEN nw_begin_time AND nw_end_time THEN 1 
        ELSE 0 
      END as is_time_valid
    FROM g5_new_win 
    WHERE nw_device IN ('both', ?)
      AND nw_division IN ('shop', 'both')
    ORDER BY nw_id ASC`;

    const rows = (await executeQuery(query, [device])) as PopupQueryResult[];

    // 시간 조건을 만족하는 팝업만 필터링
    const activePopups = rows.filter((row) => row.is_time_valid === 1);

    // 최종 응답용 데이터 변환
    const finalPopups: DisplayPopup[] = activePopups.map((row) => ({
      nw_id: row.nw_id,
      nw_subject: row.nw_subject,
      nw_content: row.nw_content,
      nw_left: row.nw_left,
      nw_top: row.nw_top,
      nw_width: row.nw_width,
      nw_height: row.nw_height,
      nw_disable_hours: row.nw_disable_hours,
    }));

    return NextResponse.json({
      success: true,
      popups: finalPopups,
    });
  } catch (error) {
    console.error('팝업 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '팝업을 불러오는데 실패했습니다.' },
      { status: 500 },
    );
  }
};
