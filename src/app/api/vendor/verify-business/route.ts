import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { vendor_number } = await request.json();

    if (!vendor_number) {
      return NextResponse.json(
        { valid: false, message: '사업자등록번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사업자등록번호 형식 검증 (10자리 숫자)
    const cleanNumber = vendor_number.replace(/[^0-9]/g, '');
    if (cleanNumber.length !== 10) {
      return NextResponse.json(
        { valid: false, message: '사업자등록번호는 10자리 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    // 공공데이터포털 API 호출
    const apiKey = "LSq0rveaq45qfqcRgBkM6s8YbdxuBIV53ZE%2FdTy7ZpMWXVuyosBinM78e5ZXaSiDlXdBOarx2w13nnIvd8i32Q%3D%3D";
    const apiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        b_no: [cleanNumber],
      }),
    });

    if (!response.ok) {
      throw new Error('API 호출 실패');
    }

    const data = await response.json();

    // API 응답 확인
    if (data.status_code === 'OK' && data.data && data.data.length > 0) {
      const businessInfo = data.data[0];
      
      // 사업자 상태 확인 (01: 계속사업자, 02: 휴업자, 03: 폐업자)
      if (businessInfo.b_stt_cd === '01') {
        return NextResponse.json({
          valid: true,
          message: '유효한 사업자등록번호입니다.',
          businessInfo: {
            taxType: businessInfo.tax_type,
            status: businessInfo.b_stt,
          },
        });
      } else {
        return NextResponse.json({
          valid: false,
          message: `사업자 상태: ${businessInfo.b_stt || '확인 불가'}`,
        });
      }
    }

    return NextResponse.json({
      valid: false,
      message: '사업자등록번호를 확인할 수 없습니다.',
    });
  } catch (error) {
    console.error('사업자등록번호 검증 오류:', error);
    
    return NextResponse.json(
      { valid: false, message: '사업자등록번호 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 