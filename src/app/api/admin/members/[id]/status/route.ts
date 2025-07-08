import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { UpdateMemberStatusRequest } from '@/types/user';

interface RouteParams {
  params: {
    id: string;
  };
}

export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  try {
    // 현재 사용자 인증 및 권한 확인
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.mb_level < 10) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    const { id } = params;
    const body: UpdateMemberStatusRequest = await request.json();
    const { status } = body;

    // 상태 값 검증
    if (!['normal', 'leave', 'blocked'].includes(status)) {
      return NextResponse.json({ error: '유효하지 않은 상태값입니다.' }, { status: 400 });
    }

    // 대상 회원 존재 여부 확인
    const memberCheckQuery = 'SELECT mb_id, mb_level FROM g5_member WHERE mb_id = ?';
    const memberResult = (await executeQuery(memberCheckQuery, [id])) as {
      mb_id: string;
      mb_level: number;
    }[];

    if (memberResult.length === 0) {
      return NextResponse.json({ error: '존재하지 않는 회원입니다.' }, { status: 404 });
    }

    const targetMember = memberResult[0];

    // 권한 확인: 자신보다 높은 레벨의 회원은 수정할 수 없음 (슈퍼 관리자 제외)
    if (currentUser.mb_level < 10 && targetMember.mb_level >= currentUser.mb_level) {
      return NextResponse.json({ error: '해당 회원을 수정할 권한이 없습니다.' }, { status: 403 });
    }

    // 상태에 따른 업데이트 쿼리 구성
    let updateQuery: string;
    let updateParams: (string | null)[];

    const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    switch (status) {
      case 'normal':
        // 정상 상태로 변경 (탈퇴일, 차단일 모두 초기화)
        updateQuery = `
          UPDATE g5_member 
          SET mb_leave_date = NULL, mb_intercept_date = NULL 
          WHERE mb_id = ?
        `;
        updateParams = [id];
        break;

      case 'leave':
        // 탈퇴 상태로 변경
        updateQuery = `
          UPDATE g5_member 
          SET mb_leave_date = ?, mb_intercept_date = NULL 
          WHERE mb_id = ?
        `;
        updateParams = [currentDate, id];
        break;

      case 'blocked':
        // 차단 상태로 변경
        updateQuery = `
          UPDATE g5_member 
          SET mb_intercept_date = ?, mb_leave_date = NULL 
          WHERE mb_id = ?
        `;
        updateParams = [currentDate, id];
        break;

      default:
        return NextResponse.json({ error: '유효하지 않은 상태값입니다.' }, { status: 400 });
    }

    // 상태 업데이트 실행
    await executeQuery(updateQuery, updateParams);

    // 업데이트된 회원 정보 조회
    const updatedMemberQuery = `
      SELECT 
        mb_id,
        mb_name,
        mb_nick,
        mb_leave_date,
        mb_intercept_date,
        CASE 
          WHEN mb_leave_date IS NOT NULL AND mb_leave_date != '' THEN 'leave'
          WHEN mb_intercept_date IS NOT NULL AND mb_intercept_date != '' THEN 'blocked'
          ELSE 'normal'
        END as mb_status
      FROM g5_member 
      WHERE mb_id = ?
    `;

    const updatedMember = (await executeQuery(updatedMemberQuery, [id])) as {
      mb_id: string;
      mb_name: string;
      mb_nick: string;
      mb_leave_date: string | null;
      mb_intercept_date: string | null;
      mb_status: string;
    }[];

    if (updatedMember.length === 0) {
      return NextResponse.json({ error: '회원 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: '회원 상태가 성공적으로 변경되었습니다.',
      member: updatedMember[0],
    });
  } catch (error) {
    console.error('회원 상태 변경 오류:', error);
    return NextResponse.json({ error: '회원 상태 변경 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
