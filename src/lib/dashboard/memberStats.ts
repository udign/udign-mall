import { executeQuery } from '@/lib/database';

export interface MemberStats {
  total: number; // 전체 회원 수
  newMembers: number; // 신규 회원 수 (최근 30일)
  designMembers: number; // 디자인 등록 회원 수
}

// 회원 통계를 가져오는 함수
export const getMemberStats = async (): Promise<MemberStats> => {
  try {
    // 1. 전체 회원 수 (탈퇴하지 않은 회원만)
    const totalQuery = `
      SELECT COUNT(*) as count 
      FROM g5_member 
      WHERE mb_leave_date = '' 
        OR mb_leave_date IS NULL 
        OR mb_leave_date = '0000-00-00'
    `;
    const totalResult = (await executeQuery(totalQuery)) as Array<{ count: number }>;
    const total = totalResult[0]?.count || 0;

    // 2. 신규 회원 수 (최근 30일)
    const newMembersQuery = `
      SELECT COUNT(*) as count 
      FROM g5_member 
      WHERE (mb_leave_date = '' OR mb_leave_date IS NULL OR mb_leave_date = '0000-00-00')
        AND mb_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const newMembersResult = (await executeQuery(newMembersQuery)) as Array<{ count: number }>;
    const newMembers = newMembersResult[0]?.count || 0;

    // 3. 디자인 등록 회원 수 (상품을 등록한 회원들)
    const designMembersQuery = `
      SELECT COUNT(DISTINCT m.mb_id) as count
      FROM g5_member m
      INNER JOIN g5_shop_item i ON m.mb_id = i.it_1
      WHERE (m.mb_leave_date = '' OR m.mb_leave_date IS NULL OR m.mb_leave_date = '0000-00-00')
        AND i.it_name != ''
    `;
    const designMembersResult = (await executeQuery(designMembersQuery)) as Array<{
      count: number;
    }>;
    const designMembers = designMembersResult[0]?.count || 0;

    return {
      total,
      newMembers,
      designMembers,
    };
  } catch (error) {
    console.error('Member stats error:', error);
    return {
      total: 0,
      newMembers: 0,
      designMembers: 0,
    };
  }
};
