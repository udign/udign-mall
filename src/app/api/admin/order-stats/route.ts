import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { getOrderStats } from '@/lib/dashboard/orderStats';

export const GET = async () => {
  try {
    // 현재 사용자 인증 및 권한 확인
    const currentUser = await getCurrentUser();
    if (!currentUser || !PERMISSION_CHECKS.isAdmin(currentUser.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    // 주문 통계 조회
    const orderStats = await getOrderStats();

    return NextResponse.json({
      success: true,
      data: orderStats,
    });
  } catch (error) {
    console.error('주문 통계 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '주문 통계를 가져오는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
