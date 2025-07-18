import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { getSalesStats } from '@/lib/dashboard/salesStats';

export const GET = async (request: NextRequest) => {
  try {
    // 현재 사용자 인증 및 권한 확인
    const currentUser = await getCurrentUser();
    if (!currentUser || !PERMISSION_CHECKS.isAdmin(currentUser.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    // URL 파라미터에서 연도 추출 (기본값: 현재 연도)
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // 연도 유효성 검사
    if (isNaN(year) || year < 2020 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 연도입니다.' },
        { status: 400 },
      );
    }

    // 매출 통계 조회
    const salesStats = await getSalesStats(year);

    return NextResponse.json({
      success: true,
      data: salesStats,
    });
  } catch (error) {
    console.error('매출 통계 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '매출 통계를 가져오는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
