import { NextResponse } from 'next/server';

export const POST = async () => {
  try {
    const response = NextResponse.json(
      { success: true, message: '로그아웃되었습니다.' },
      { status: 200 },
    );

    // 쿠키에서 토큰 제거
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 즉시 만료
    });

    // 자동 로그인 쿠키도 제거
    response.cookies.set('ck_mb_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 즉시 만료
    });

    response.cookies.set('ck_auto', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 즉시 만료
    });

    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
