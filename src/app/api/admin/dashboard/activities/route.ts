import { NextResponse } from 'next/server';

export const GET = async () => {
  try {
    // 임시 데이터 - 실제로는 DB에서 조회
    const activities = [
      {
        id: '1',
        type: 'member' as const,
        title: '새 회원 가입',
        description: 'user123님이 회원가입했습니다.',
        time: '5분 전',
      },
      {
        id: '2',
        type: 'order' as const,
        title: '새 주문 접수',
        description: '주문번호 ORD001234가 접수되었습니다.',
        time: '15분 전',
      },
      {
        id: '3',
        type: 'review' as const,
        title: '검수 완료',
        description: '상품 "디자인 아트워크"가 승인되었습니다.',
        time: '1시간 전',
      },
      {
        id: '4',
        type: 'member' as const,
        title: '회원 탈퇴',
        description: 'user456님이 탈퇴했습니다.',
        time: '2시간 전',
      },
    ];

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('최근 활동 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
