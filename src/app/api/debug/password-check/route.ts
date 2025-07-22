import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyPassword, hashPassword } from '@/lib/auth';

export const POST = async (request: NextRequest) => {
  try {
    const { mb_id, password } = await request.json();

    if (!mb_id) {
      return NextResponse.json(
        { success: false, message: '아이디를 입력해주세요.' },
        { status: 400 },
      );
    }

    // 회원 정보 조회
    const memberData = (await executeQuery(
      'SELECT mb_id, mb_password, mb_lost_certify FROM g5_member WHERE mb_id = ?',
      [mb_id],
    )) as unknown[];

    if (memberData.length === 0) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 회원입니다.' },
        { status: 404 },
      );
    }

    const member = memberData[0] as {
      mb_id: string;
      mb_password: string;
      mb_lost_certify: string;
    };

    const debugInfo: Record<string, unknown> = {
      mb_id: member.mb_id,
      stored_password_hash: member.mb_password,
      stored_password_length: member.mb_password.length,
      stored_password_starts_with: member.mb_password.substring(0, 10) + '...',
      mb_lost_certify: member.mb_lost_certify,
      mb_lost_certify_length: member.mb_lost_certify.length,
      password_verification: password ? await verifyPassword(password, member.mb_password) : null,
    };

    // 테스트: 입력된 비밀번호를 해시화해서 저장된 해시와 비교
    if (password) {
      const newHash = await hashPassword(password);
      debugInfo.new_hash_for_input = newHash;
      debugInfo.new_hash_matches_stored = newHash === member.mb_password;
    }

    return NextResponse.json({
      success: true,
      debug_info: debugInfo,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
