import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
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

    // 벤더 정보 조회
    const vendorInfo = await executeQuery(
      `SELECT 
        vendor_name,
        vendor_class,
        vendor_representative,
        vendor_tel,
        vendor_email,
        vendor_fax,
        vendor_number,
        mb_zip as vendor_postcode,
        mb_addr1 as vendor_address,
        mb_addr2 as vendor_address_detail,
        vendor_introduction,
        vendro_request_date,
        vendro_update_date,
        vendro_apply_date
      FROM g5_member 
      WHERE mb_id = ?`,
      [decoded.mb_id]
    ) as any[];

    if (vendorInfo.length === 0) {
      return NextResponse.json(
        { success: false, message: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const vendor = vendorInfo[0];

    // 벤더 정보가 없는 경우 빈 객체 반환
    if (!vendor.vendor_name) {
      return NextResponse.json({
        success: true,
        vendor_name: null,
      });
    }

    return NextResponse.json({
      success: true,
      ...vendor,
    });
  } catch (error) {
    console.error('벤더 정보 조회 오류:', error);
    
    return NextResponse.json(
      { success: false, message: '벤더 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 