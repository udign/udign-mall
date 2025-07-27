import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';
import { CopyrightReportResponse } from '@/types/copyright-report';

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number } | null;
    if (!decoded || !decoded.mb_id) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    // 요청 데이터 파싱
    const body = await request.json();
    const { sg_id, sg_desc } = body;

    if (!sg_id || !sg_desc) {
      return NextResponse.json(
        { 
          success: false, 
          error: '필수 정보가 누락되었습니다.' 
        },
        { status: 400 }
      );
    }

    // 신고 데이터 파싱
    let reportData;
    try {
      reportData = JSON.parse(sg_desc);
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: '신고 데이터 형식이 올바르지 않습니다.' 
        },
        { status: 400 }
      );
    }

    if (!reportData.content || reportData.content.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: '신고 내용을 입력해주세요.' 
        },
        { status: 400 }
      );
    }

    // 제품 정보 확인
    const productQuery = `
      SELECT it_id, it_1 as creator_id 
      FROM g5_shop_item 
      WHERE it_id = ? AND it_use = 1
    `;
    const products = await executeQuery(productQuery, [sg_id]) as Array<{
      it_id: string;
      creator_id: string | null;
    }>;
    
    if (!products || products.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '존재하지 않는 제품입니다.' 
        },
        { status: 404 }
      );
    }

    const product = products[0];

    // 자신의 제품인지 확인
    if (product.creator_id === decoded.mb_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '자신의 제품은 신고할 수 없습니다.' 
        },
        { status: 400 }
      );
    }

    // 중복 신고 확인
    const duplicateQuery = `
      SELECT id 
      FROM g5_na_singo 
      WHERE mb_id = ? 
        AND sg_table = 'products' 
        AND sg_id = ? 
        AND sg_flag = 3
    `;
    const duplicates = await executeQuery(duplicateQuery, [decoded.mb_id, sg_id]) as Array<{ id: number }>;
    
    if (duplicates && duplicates.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: '이미 신고한 제품입니다.' 
        },
        { status: 400 }
      );
    }

    // 신고 등록
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const insertQuery = `
      INSERT INTO g5_na_singo (
        mb_id,
        sg_flag,
        sg_table,
        sg_id,
        sg_parent,
        sg_type,
        sg_desc,
        wr_time,
        sg_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      decoded.mb_id,      // mb_id
      3,                  // sg_flag (제품 신고)
      'products',         // sg_table
      sg_id,              // sg_id (제품 ID)
      0,                  // sg_parent
      6,                  // sg_type (저작권 침해)
      sg_desc,            // sg_desc (JSON 문자열)
      now,                // wr_time
      now                 // sg_time
    ];

    await executeQuery(insertQuery, params);

    const response: CopyrightReportResponse = {
      success: true,
      message: '저작권 침해 신고가 접수되었습니다.',
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error submitting copyright report:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '신고 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 