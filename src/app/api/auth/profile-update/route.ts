import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

interface ProfileUpdateRequest {
  mb_name: string;
  mb_hp?: string;
  mb_password?: string;
  mb_mailling: boolean;
}

export const POST = async (request: NextRequest) => {
  try {
    // 요청 body 파싱
    const { mb_name, mb_hp, mb_password, mb_mailling }: ProfileUpdateRequest = await request.json();

    if (!mb_name) {
      return NextResponse.json(
        { success: false, message: '이름을 입력해주세요.' },
        { status: 400 },
      );
    }

    // 현재 로그인된 사용자 정보 확인
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 },
      );
    }

    // 휴대폰 번호 형식 검증
    if (mb_hp) {
      const phoneNumbers = mb_hp.replace(/[^0-9]/g, '');
      if (phoneNumbers.length !== 11 || !phoneNumbers.startsWith('01')) {
        return NextResponse.json(
          { success: false, message: '휴대폰 번호는 01로 시작하는 11자리 숫자로 입력해주세요.' },
          { status: 400 },
        );
      }
    }

    // 업데이트할 필드들 준비
    const updateFields: string[] = [];
    const updateValues: (string | number)[] = [];

    // 이름 업데이트 (필수)
    updateFields.push('mb_name = ?');
    updateValues.push(mb_name);

    // 휴대폰 번호 업데이트
    updateFields.push('mb_hp = ?');
    updateValues.push(mb_hp || '');

    // 광고성 정보 수신 동의 업데이트
    updateFields.push('mb_mailling = ?');
    updateValues.push(mb_mailling ? 1 : 0);

    // 비밀번호 업데이트 (선택적)
    if (mb_password && mb_password.trim()) {
      const hashedPassword = await hashPassword(mb_password);
      updateFields.push('mb_password = ?');
      updateValues.push(hashedPassword);
    }

    // WHERE 조건용 사용자 ID 추가
    updateValues.push(currentUser.mb_id);

    // SQL 쿼리 실행
    const query = `UPDATE g5_member SET ${updateFields.join(', ')} WHERE mb_id = ?`;

    try {
      await executeQuery(query, updateValues);
    } catch (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json(
        { success: false, message: '데이터베이스 업데이트 중 오류가 발생했습니다.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: '회원정보가 성공적으로 수정되었습니다.',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
