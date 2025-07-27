import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

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

    const data = await request.json();
    const { mode, ...vendorData } = data;

    // 필수 필드 검증
    const requiredFields = [
      'vendor_name',
      'vendor_class',
      'vendor_representative',
      'vendor_tel',
      'vendor_email',
      'vendor_number',
      'vendor_postcode',
      'vendor_address',
    ];

    for (const field of requiredFields) {
      if (!vendorData[field]) {
        return NextResponse.json(
          { success: false, message: `${field}는 필수 입력 항목입니다.` },
          { status: 400 }
        );
      }
    }

    // 이미 등록된 사업자등록번호인지 확인 (본인 제외)
    const existing = await executeQuery(
      'SELECT mb_id FROM g5_member WHERE vendor_number = ? AND mb_id != ?',
      [vendorData.vendor_number, decoded.mb_id]
    ) as Array<{ mb_id: string }>;

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: '이미 등록된 사업자등록번호입니다.' },
        { status: 400 }
      );
    }

    // 날짜 필드 설정
    const dateField = mode === 'create' ? 'vendro_request_date' : 'vendro_update_date';
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // UPDATE 쿼리 실행
    const updateQuery = `
      UPDATE g5_member 
      SET 
        vendor_name = ?,
        vendor_class = ?,
        vendor_representative = ?,
        vendor_tel = ?,
        vendor_email = ?,
        vendor_fax = ?,
        vendor_number = ?,
        mb_zip = ?,
        mb_addr1 = ?,
        mb_addr2 = ?,
        vendor_introduction = ?,
        ${dateField} = ?
      WHERE mb_id = ?
    `;

    const updateValues = [
      vendorData.vendor_name,
      vendorData.vendor_class,
      vendorData.vendor_representative,
      vendorData.vendor_tel,
      vendorData.vendor_email,
      vendorData.vendor_fax || '',
      vendorData.vendor_number,
      vendorData.vendor_postcode,
      vendorData.vendor_address,
      vendorData.vendor_address_detail || '',
      vendorData.vendor_introduction || '',
      now,
      decoded.mb_id,
    ];

    await executeQuery(updateQuery, updateValues);

    return NextResponse.json({
      success: true,
      message: mode === 'create' ? '벤더 정보가 등록되었습니다.' : '벤더 정보가 수정되었습니다.',
    });
  } catch (error) {
    console.error('벤더 등록 오류:', error);
    
    return NextResponse.json(
      { success: false, message: '벤더 정보 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 