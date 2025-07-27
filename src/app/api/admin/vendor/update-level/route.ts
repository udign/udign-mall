import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';
import { PERMISSION_CHECKS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number; mb_level: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (!PERMISSION_CHECKS.isAdmin(decoded.mb_level)) {
      return NextResponse.json(
        { success: false, message: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { mode, mb_id, mb_level } = await request.json();

    if (!mode || !mb_id || !mb_level) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (mode === 'single') {
      // 단일 회원 등급 변경
      if (!Array.isArray(mb_id) || mb_id.length !== 1 || !Array.isArray(mb_level) || mb_level.length !== 1) {
        return NextResponse.json(
          { success: false, message: '잘못된 파라미터 형식입니다.' },
          { status: 400 }
        );
      }

      await executeQuery(
        'UPDATE g5_member SET mb_level = ?, vendro_apply_date = ? WHERE mb_id = ?',
        [mb_level[0], now, mb_id[0]]
      );

      return NextResponse.json({
        success: true,
        message: '성공적으로 변경되었습니다.',
      });
    } else if (mode === 'multi') {
      // 다중 회원 등급 일괄 변경
      if (!Array.isArray(mb_id) || !Array.isArray(mb_level) || mb_id.length !== mb_level.length) {
        return NextResponse.json(
          { success: false, message: '잘못된 파라미터 형식입니다.' },
          { status: 400 }
        );
      }

      // 트랜잭션으로 처리하면 좋지만, 현재는 개별 처리
      for (let i = 0; i < mb_id.length; i++) {
        await executeQuery(
          'UPDATE g5_member SET mb_level = ?, vendro_apply_date = ? WHERE mb_id = ?',
          [mb_level[i], now, mb_id[i]]
        );
      }

      return NextResponse.json({
        success: true,
        message: '성공적으로 변경되었습니다.',
      });
    } else {
      return NextResponse.json(
        { success: false, message: '올바른 경로로 이용해 주세요.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('벤더 등급 변경 오류:', error);
    
    return NextResponse.json(
      { success: false, message: '등급 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 