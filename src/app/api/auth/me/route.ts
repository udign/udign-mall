import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';
import { User } from '@/types/user';

export const GET = async (request: NextRequest) => {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '인증 토큰이 없습니다.' },
        { status: 401 },
      );
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number; mb_level: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰입니다.' },
        { status: 401 },
      );
    }

    // 사용자 정보 조회
    const users = (await executeQuery(
      'SELECT mb_no, mb_id, mb_name, mb_nick, mb_email, mb_level, mb_datetime, mb_today_login, mb_login_ip FROM g5_member WHERE mb_id = ?',
      [decoded.mb_id],
    )) as unknown[];

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: '사용자를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const user = users[0] as User;

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Me API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
