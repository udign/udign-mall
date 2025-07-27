import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';
import { PERMISSION_CHECKS } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mb_no: string }> }
) {
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

    const { mb_no } = await params;

    // 벤더 정보 조회
    const vendorQuery = `
      SELECT 
        mb_no,
        mb_id,
        mb_name,
        mb_level,
        vendor_name,
        vendor_class,
        vendor_representative,
        vendor_tel,
        vendor_email,
        vendor_fax,
        vendor_number,
        vendor_introduction,
        mb_zip,
        mb_addr1,
        mb_addr2,
        mb_addr3,
        vendro_request_date,
        vendro_apply_date
      FROM g5_member 
      WHERE mb_no = ?
    `;

    const vendors = await executeQuery(vendorQuery, [mb_no]) as Array<{
      mb_no: number;
      mb_id: string;
      mb_name: string;
      mb_level: number;
      vendor_name: string | null;
      vendor_class: string | null;
      vendor_representative: string | null;
      vendor_tel: string | null;
      vendor_email: string | null;
      vendor_fax: string | null;
      vendor_number: string | null;
      vendor_introduction: string | null;
      mb_zip: string | null;
      mb_addr1: string | null;
      mb_addr2: string | null;
      mb_addr3: string | null;
      vendro_request_date: string | null;
      vendro_apply_date: string | null;
    }>;

    if (vendors.length === 0) {
      return NextResponse.json(
        { success: false, message: '벤더 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: vendors[0],
    });
  } catch (error) {
    console.error('벤더 상세 조회 오류:', error);
    
    return NextResponse.json(
      { success: false, message: '벤더 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 