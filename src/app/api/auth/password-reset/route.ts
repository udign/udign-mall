import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const POST = async (request: NextRequest) => {
  try {
    const { mb_no, mb_nonce } = await request.json();

    // 필수 필드 검증
    if (!mb_no || !mb_nonce) {
      return NextResponse.json({ success: false, message: '잘못된 접근입니다.' }, { status: 400 });
    }

    // 회원 정보 조회 (회원번호로 조회)
    const memberData = (await executeQuery(
      'SELECT mb_id, mb_lost_certify FROM g5_member WHERE mb_no = ?',
      [mb_no],
    )) as unknown[];

    if (memberData.length === 0) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 회원입니다.' },
        { status: 404 },
      );
    }

    const member = memberData[0] as {
      mb_id: string;
      mb_lost_certify: string;
    };

    // mb_lost_certify 필드가 충분한 길이인지 확인 (nonce 32자 + 공백 1자 = 최소 33자)
    if (!member.mb_lost_certify || member.mb_lost_certify.length < 33) {
      return NextResponse.json(
        { success: false, message: '인증 정보가 유효하지 않습니다.' },
        { status: 400 },
      );
    }

    // 인증 링크는 한번만 처리가 되게 한다
    await executeQuery('UPDATE g5_member SET mb_lost_certify = ? WHERE mb_no = ?', ['', mb_no]);

    // 인증을 위한 난수가 제대로 넘어온 경우 임시비밀번호를 실제 비밀번호로 바꿔준다
    const storedNonce = member.mb_lost_certify.substring(0, 32);
    const newPasswordHash = member.mb_lost_certify.substring(33);

    if (mb_nonce === storedNonce) {
      // 새 비밀번호 해시로 업데이트
      await executeQuery('UPDATE g5_member SET mb_password = ? WHERE mb_no = ?', [
        newPasswordHash,
        mb_no,
      ]);

      return NextResponse.json({
        success: true,
        message:
          '비밀번호가 변경되었습니다. 회원아이디와 변경된 비밀번호로 로그인 하시기 바랍니다.',
      });
    } else {
      return NextResponse.json(
        { success: false, message: '인증 정보가 올바르지 않습니다.' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Password reset API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
