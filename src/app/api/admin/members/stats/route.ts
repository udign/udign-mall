import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

interface MemberStats {
  totalMembers: number;
  adminMembers: number;
  excellentMembers: number;
  regularMembers: number;
  basicMembers: number;
}

export const GET = async () => {
  try {
    // 현재 사용자 인증 및 권한 확인
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.mb_level < 10) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    // 회원 레벨별 통계 쿼리 (탈퇴한 회원 포함)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_members,
        SUM(CASE WHEN mb_level >= 10 THEN 1 ELSE 0 END) as admin_members,
        SUM(CASE WHEN mb_level >= 5 AND mb_level < 10 THEN 1 ELSE 0 END) as excellent_members,
        SUM(CASE WHEN mb_level >= 2 AND mb_level < 5 THEN 1 ELSE 0 END) as regular_members,
        SUM(CASE WHEN mb_level < 2 THEN 1 ELSE 0 END) as basic_members
      FROM g5_member
    `;

    const result = (await executeQuery(statsQuery)) as Array<{
      total_members: number;
      admin_members: number;
      excellent_members: number;
      regular_members: number;
      basic_members: number;
    }>;

    const stats: MemberStats = {
      totalMembers: result[0]?.total_members || 0,
      adminMembers: result[0]?.admin_members || 0,
      excellentMembers: result[0]?.excellent_members || 0,
      regularMembers: result[0]?.regular_members || 0,
      basicMembers: result[0]?.basic_members || 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('회원 통계 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '회원 통계를 가져오는 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
