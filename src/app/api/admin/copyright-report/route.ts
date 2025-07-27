import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { executeQuery } from '@/lib/database';

interface CopyrightReportData {
  content: string;
  evidence_urls: string[];
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as { mb_id: string; mb_no: number; mb_level: number } | null;
    if (!decoded || !decoded.mb_id || decoded.mb_level < 10) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // 조건 구성
    const whereConditions = ['s.sg_flag = 3', 's.sg_type = 6']; // 제품 신고, 저작권 침해
    const params: (string | number)[] = [];

    if (dateFrom) {
      whereConditions.push('DATE(s.sg_time) >= ?');
      params.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(s.sg_time) <= ?');
      params.push(dateTo);
    }

    if (search) {
      whereConditions.push('(m.mb_name LIKE ? OR i.it_name LIKE ? OR creator.mb_name LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.join(' AND ');

    // 전체 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM g5_na_singo s
      LEFT JOIN g5_member m ON s.mb_id = m.mb_id
      LEFT JOIN g5_shop_item i ON s.sg_id = i.it_id
      LEFT JOIN g5_member creator ON i.it_1 = creator.mb_id
      WHERE ${whereClause}
    `;
    const countResult = await executeQuery(countQuery, params) as Array<{ total: number }>;
    const totalCount = countResult[0]?.total || 0;

    // 목록 조회
    const query = `
      SELECT 
        s.id,
        s.mb_id as reporter_id,
        m.mb_name as reporter_name,
        s.sg_id as product_id,
        i.it_name as product_name,
        i.it_img1 as product_image,
        i.it_1 as creator_id,
        creator.mb_name as creator_name,
        s.sg_desc,
        s.sg_time
      FROM g5_na_singo s
      LEFT JOIN g5_member m ON s.mb_id = m.mb_id
      LEFT JOIN g5_shop_item i ON s.sg_id = i.it_id
      LEFT JOIN g5_member creator ON i.it_1 = creator.mb_id
      WHERE ${whereClause}
      ORDER BY s.sg_time DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limit, offset];
    const reports = await executeQuery(query, queryParams) as Array<{
      id: number;
      reporter_id: string;
      reporter_name: string | null;
      product_id: string;
      product_name: string | null;
      product_image: string | null;
      creator_id: string | null;
      creator_name: string | null;
      sg_desc: string;
      sg_time: string;
    }>;

    // 신고 데이터 가공
    const processedReports = reports.map((report) => {
      let reportData: CopyrightReportData = { content: '', evidence_urls: [] };
      
      try {
        if (report.sg_desc) {
          reportData = JSON.parse(report.sg_desc);
        }
      } catch {
        // JSON 파싱 실패시 원본 텍스트 사용
        reportData.content = report.sg_desc || '';
      }

      return {
        id: report.id,
        reporter_id: report.reporter_id,
        reporter_name: report.reporter_name || '알 수 없음',
        product_id: report.product_id,
        product_name: report.product_name || '삭제된 제품',
        product_image: report.product_image,
        creator_id: report.creator_id,
        creator_name: report.creator_name || '알 수 없음',
        content: reportData.content,
        evidence_urls: reportData.evidence_urls || [],
        reported_at: report.sg_time,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      reports: processedReports,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching copyright reports:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '신고 목록을 불러오는 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 