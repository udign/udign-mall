import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { verifyPassword } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export const POST = async (request: NextRequest) => {
  try {
    // 요청 body 파싱
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, message: '비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    // 현재 로그인된 사용자 정보 확인
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    // 데이터베이스에서 사용자의 비밀번호 조회
    const query = 'SELECT mb_password FROM g5_member WHERE mb_id = ?';
    const users = (await executeQuery(query, [currentUser.mb_id])) as unknown[];

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: '사용자를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const user = users[0] as { mb_password: string };

    // 비밀번호 확인
    const isPasswordValid = await verifyPassword(password, user.mb_password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: '비밀번호가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 확인되었습니다.',
    });
  } catch (error) {
    console.error('Password confirm error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
