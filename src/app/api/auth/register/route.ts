import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { RegisterRequest } from '@/types/user';
import { sendWelcomeEmail, sendNewMemberNotification } from '@/lib/email';

export const POST = async (request: NextRequest) => {
  try {
    const body: RegisterRequest = await request.json();

    // 필수 필드 검증
    if (!body.mb_id || !body.mb_password || !body.mb_name || !body.mb_nick || !body.mb_email) {
      return NextResponse.json(
        { success: false, message: '필수 정보를 모두 입력해주세요.' },
        { status: 400 },
      );
    }

    // 아이디 형식 검증 (영문, 숫자만 허용, 3-20자)
    const idRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!idRegex.test(body.mb_id)) {
      return NextResponse.json(
        { success: false, message: '아이디는 영문, 숫자 조합으로 3-20자여야 합니다.' },
        { status: 400 },
      );
    }

    // 비밀번호 형식 검증 (최소 6자)
    if (body.mb_password.length < 6) {
      return NextResponse.json(
        { success: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 },
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.mb_email)) {
      return NextResponse.json(
        { success: false, message: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 },
      );
    }

    const result = await registerUser(body);

    if (result.success) {
      // 회원가입 성공 시 메일 발송
      try {
        // 신규 회원에게 축하 메일 발송
        await sendWelcomeEmail({
          email: body.mb_email,
          name: body.mb_name,
          id: body.mb_id,
        });

        // 관리자에게 신규 회원 알림 메일 발송
        await sendNewMemberNotification({
          email: body.mb_email,
          name: body.mb_name,
          id: body.mb_id,
          nick: body.mb_nick,
        });

        console.log('회원가입 메일 발송 완료:', body.mb_id);
      } catch (emailError) {
        // 메일 발송 실패는 로그만 남기고 회원가입은 정상 처리
        console.error('회원가입 메일 발송 실패:', emailError);
      }

      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
