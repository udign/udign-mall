import { NextRequest, NextResponse } from 'next/server';
import { loginUser, generateAutoLoginKey } from '@/lib/auth';
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

      // 자동 로그인이 활성화된 경우 자동 로그인 쿠키 설정
      if (body.auto_login && result.user) {
        const userAgent = request.headers.get('user-agent') || '';

        // 사용자 정보를 다시 조회하여 비밀번호 해시를 가져옴
        const autoLoginKey = generateAutoLoginKey(userAgent, result.autoLoginKey || '');

        // 자동 로그인 쿠키 설정 (31일간 유지)
        response.cookies.set('ck_mb_id', result.user.mb_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 31 * 24 * 60 * 60, // 31일
        });

        response.cookies.set('ck_auto', autoLoginKey, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 31 * 24 * 60 * 60, // 31일
        });
      }

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
