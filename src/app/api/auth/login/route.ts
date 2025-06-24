import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { LoginRequest } from '@/types/user';

export const POST = async (request: NextRequest) => {
  try {
    const body: LoginRequest = await request.json();

    // 필수 필드 검증
    if (!body.mb_id || !body.password) {
      return NextResponse.json(
        { success: false, message: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 },
      );
    }

    const result = await loginUser(body);

    if (result.success) {
      // 쿠키에 토큰 설정
      const response = NextResponse.json(result, { status: 200 });
      response.cookies.set('auth-token', result.token || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 24시간
      });

      return response;
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
