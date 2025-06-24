import { NextRequest, NextResponse } from 'next/server';
import { verifyAutoLoginCookie, generateToken } from '@/lib/auth';

export const POST = async (request: NextRequest) => {
  try {
    // 자동 로그인 쿠키 확인
    const mbId = request.cookies.get('ck_mb_id')?.value;
    const autoKey = request.cookies.get('ck_auto')?.value;
    const userAgent = request.headers.get('user-agent') || '';

    if (!mbId || !autoKey) {
      return NextResponse.json(
        { success: false, message: '자동 로그인 정보가 없습니다.' },
        { status: 401 },
      );
    }

    // 자동 로그인 쿠키 검증
    const user = await verifyAutoLoginCookie(mbId, autoKey, userAgent);

    if (!user) {
      // 유효하지 않은 쿠키는 삭제
      const response = NextResponse.json(
        { success: false, message: '자동 로그인 정보가 유효하지 않습니다.' },
        { status: 401 },
      );

      response.cookies.delete('ck_mb_id');
      response.cookies.delete('ck_auto');

      return response;
    }

    // 새로운 세션 토큰 생성
    const token = generateToken(user);

    // 응답에 새 토큰 설정
    const response = NextResponse.json(
      {
        success: true,
        message: '자동 로그인 성공',
        user,
      },
      { status: 200 },
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24시간
    });

    return response;
  } catch (error) {
    console.error('Auto login API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
