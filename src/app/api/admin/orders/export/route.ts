import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { CSV_HEADERS, OrderPrintData } from '@/types/order';
import * as XLSX from 'xlsx';

// 주문내역 Excel/CSV 다운로드 API
export const POST = async (request: NextRequest) => {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser();
    if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { format, data } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ success: false, error: '데이터가 없습니다.' }, { status: 400 });
    }

    if (format === 'csv') {
      // CSV 형식으로 다운로드
      const csvContent = generateCSV(data);
      const filename = `orderlist-${new Date().toISOString().slice(0, 10)}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } else if (format === 'xlsx') {
      // Excel XLSX 형식으로 다운로드
      const excelBuffer = await generateExcel(data);
      const filename = `orderlist-${new Date().toISOString().slice(0, 10)}.xlsx`;

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 형식입니다.' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('주문내역 다운로드 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '주문내역 다운로드 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};

// CSV 생성 함수
const generateCSV = (data: OrderPrintData[]): string => {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  const headers = CSV_HEADERS.join(',');

  const rows = data.map((item) =>
    [
      `"${item.od_b_zip1}${item.od_b_zip2}"`,
      `"${item.full_address}"`,
      `"${item.od_b_name}"`,
      `"${item.formatted_phone1}"`,
      `"${item.formatted_phone2}"`,
      `"${item.it_name.replace(/"/g, '""')}"`,
      `"${item.ct_qty}"`,
      `"${item.ct_option.replace(/"/g, '""')}"`,
      `"${item.ct_send_cost_text}"`,
      `"${item.it_id}"`,
      `"${item.od_id}"`,
      `"${item.od_invoice}"`,
      `"${item.od_memo.replace(/"/g, '""')}"`,
    ].join(','),
  );

  return BOM + headers + '\n' + rows.join('\n');
};

// Excel XLSX 생성 함수
const generateExcel = async (data: OrderPrintData[]): Promise<Buffer> => {
  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 헤더와 데이터 준비
  const worksheetData = [
    [...CSV_HEADERS],
    ...data.map((item) => [
      `${item.od_b_zip1}${item.od_b_zip2}`,
      item.full_address,
      item.od_b_name,
      item.formatted_phone1,
      item.formatted_phone2,
      item.it_name,
      item.ct_qty.toString(),
      item.ct_option,
      item.ct_send_cost_text,
      item.it_id,
      item.od_id,
      item.od_invoice,
      item.od_memo,
    ]),
  ];

  // 워크시트 생성
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // 열 너비 설정
  const columnWidths = [
    { wch: 10 }, // 우편번호
    { wch: 30 }, // 주소
    { wch: 10 }, // 이름
    { wch: 15 }, // 전화1
    { wch: 15 }, // 전화2
    { wch: 25 }, // 상품명
    { wch: 8 }, // 수량
    { wch: 15 }, // 선택사항
    { wch: 10 }, // 배송비
    { wch: 15 }, // 상품코드
    { wch: 20 }, // 주문번호
    { wch: 15 }, // 운송장번호
    { wch: 30 }, // 전하실말씀
  ];

  worksheet['!cols'] = columnWidths;

  // 워크시트를 워크북에 추가
  XLSX.utils.book_append_sheet(workbook, worksheet, '주문내역');

  // Buffer로 변환
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};
