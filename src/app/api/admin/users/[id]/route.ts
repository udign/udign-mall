import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { RowDataPacket } from 'mysql2';

interface UserDetailResponse extends RowDataPacket {
  mb_no: number;
  mb_id: string;
  mb_name: string;
  mb_nick: string;
  mb_email: string;
  mb_hp: string | null;
  mb_tel: string | null;
  mb_level: number;
  mb_datetime: string;
  mb_today_login: string | null;
  mb_login_ip: string | null;
  mb_leave_date: string | null;
  mb_intercept_date: string | null;
  mb_certify: string;
  mb_adult: number;
  mb_email_certify: string;
  mb_sms: number;
  mb_mailling: number;
  mb_open: number;
  mb_point: number;
  mb_memo: string | null;
  mb_status: 'leave' | 'blocked' | 'normal';
}

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  try {
    // 현재 사용자 인증 및 권한 확인
    const currentUser = await getCurrentUser();
    if (!currentUser || !PERMISSION_CHECKS.isAdmin(currentUser.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 ID가 필요합니다.' },
        { status: 400 },
      );
    }

    // 특정 사용자 정보 조회
    const query = `
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
        mb_memo,
        CASE 
          WHEN mb_leave_date IS NOT NULL AND mb_leave_date != '' THEN 'leave'
          WHEN mb_intercept_date IS NOT NULL AND mb_intercept_date != '' THEN 'blocked'
          ELSE 'normal'
        END as mb_status
      FROM g5_member
      WHERE mb_id = ?
    `;

    const result = await executeQuery(query, [userId]);
    const users = result as UserDetailResponse[];

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: '사용자를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const user: UserDetailResponse = users[0];

    // 응답 데이터 구성
    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '사용자 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
