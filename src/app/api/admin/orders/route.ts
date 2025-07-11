import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { getConnection } from '@/lib/database';
import {
  OrderPrintData,
  OrderPrintRequest,
  getSendCostText,
  formatPhoneNumber,
  formatAddress,
  OrderStatus,
  SendCostType,
} from '@/types/order';

// 주문 데이터 타입 정의
interface OrderRow {
  od_id: string;
  od_b_zip1: string;
  od_b_zip2: string;
  od_b_addr1: string;
  od_b_addr2: string;
  od_b_addr3: string;
  od_b_addr_jibeon: string;
  od_b_name: string;
  od_b_tel: string;
  od_b_hp: string;
  it_name: string;
  ct_qty: number;
  it_id: string;
  od_memo: string;
  od_invoice: string;
  ct_option: string;
  ct_send_cost: SendCostType;
  it_sc_type: number;
}

interface SumRow {
  price: number;
  qty: number;
}

// 주문내역 조회 API
export const GET = async (request: NextRequest) => {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser();
    if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const caseParam = parseInt(searchParams.get('case') || '1') as 1 | 2;
    const ctStatusParam = searchParams.get('ct_status') || '';
    const csvParam = (searchParams.get('csv') as 'xlsx' | 'csv') || 'xlsx';
    const frDateParam = searchParams.get('fr_date') || '';
    const toDateParam = searchParams.get('to_date') || '';
    const frOdIdParam = searchParams.get('fr_od_id') || '';
    const toOdIdParam = searchParams.get('to_od_id') || '';

    const params: OrderPrintRequest = {
      case: caseParam,
      ct_status: ctStatusParam === 'all' ? '' : (ctStatusParam as OrderStatus | ''),
      csv: csvParam,
      fr_date: frDateParam,
      to_date: toDateParam,
      fr_od_id: frOdIdParam,
      to_od_id: toOdIdParam,
    };

    // 입력값 검증
    if (params.case === 1) {
      if (!params.fr_date || !params.to_date) {
        return NextResponse.json(
          { success: false, error: '날짜 범위를 입력해주세요.' },
          { status: 400 },
        );
      }
    } else if (params.case === 2) {
      if (!params.fr_od_id || !params.to_od_id) {
        return NextResponse.json(
          { success: false, error: '주문번호 범위를 입력해주세요.' },
          { status: 400 },
        );
      }
    }

    const connection = await getConnection();

    try {
      // SQL 쿼리 구성
      let sql = `
        SELECT 
          a.od_id, 
          a.od_b_zip1, 
          a.od_b_zip2, 
          a.od_b_addr1, 
          a.od_b_addr2, 
          a.od_b_addr3, 
          a.od_b_addr_jibeon, 
          a.od_b_name, 
          a.od_b_tel, 
          a.od_b_hp, 
          b.it_name, 
          b.ct_qty, 
          b.it_id, 
          a.od_memo, 
          a.od_invoice, 
          b.ct_option, 
          b.ct_send_cost, 
          b.it_sc_type
        FROM g5_shop_order a 
        JOIN g5_shop_cart b ON a.od_id = b.od_id 
        WHERE 1=1
      `;

      const queryParams: (string | number)[] = [];

      if (params.case === 1 && params.fr_date && params.to_date) {
        // 기간별 검색
        const frDate = params.fr_date.replace(/[^0-9]/g, '');
        const toDate = params.to_date.replace(/[^0-9]/g, '');

        // YYYYMMDD 형식을 YYYY-MM-DD 형식으로 변환
        const formattedFrDate = `${frDate.substring(0, 4)}-${frDate.substring(4, 6)}-${frDate.substring(6, 8)}`;
        const formattedToDate = `${toDate.substring(0, 4)}-${toDate.substring(4, 6)}-${toDate.substring(6, 8)}`;

        sql += ` AND a.od_time BETWEEN ? AND ?`;
        queryParams.push(`${formattedFrDate} 00:00:00`, `${formattedToDate} 23:59:59`);
      } else if (params.case === 2 && params.fr_od_id && params.to_od_id) {
        // 주문번호 구간별 검색
        sql += ` AND a.od_id BETWEEN ? AND ?`;
        queryParams.push(params.fr_od_id, params.to_od_id);
      }

      if (params.ct_status) {
        sql += ` AND b.ct_status = ?`;
        queryParams.push(params.ct_status);
      }

      sql += ` ORDER BY a.od_time ASC, b.it_id, b.io_type, b.ct_id`;

      const [rows] = await connection.execute(sql, queryParams);
      const orderData = rows as OrderRow[];

      if (orderData.length === 0) {
        return NextResponse.json({
          success: false,
          error: '출력할 내역이 없습니다.',
        });
      }

      // 데이터 변환
      const printData: OrderPrintData[] = [];
      const processedItems = new Set<string>();

      for (const row of orderData) {
        const itemKey = `${row.od_id}_${row.it_id}`;

        // 배송비 계산 (중복 처리 방지)
        let sendCostText = getSendCostText(row.ct_send_cost as SendCostType);

        if (!processedItems.has(itemKey)) {
          // 조건부 무료 배송 계산
          if (row.it_sc_type === 2) {
            const [sumRows] = await connection.execute(
              `
              SELECT 
                SUM(IF(io_type = 1, (io_price * ct_qty), ((ct_price + io_price) * ct_qty))) as price,
                SUM(ct_qty) as qty
              FROM g5_shop_cart
              WHERE it_id = ? AND od_id = ?
            `,
              [row.it_id, row.od_id],
            );

            const sumResult = sumRows as SumRow[];
            if (sumResult.length > 0) {
              // 조건부 무료 배송 로직은 실제 비즈니스 로직에 맞게 구현
              // 여기서는 단순히 가격이 일정 금액 이상이면 무료로 처리
              const totalPrice = sumResult[0].price || 0;
              if (totalPrice >= 50000) {
                // 5만원 이상 무료배송 (예시)
                sendCostText = '무료';
              }
            }
          }

          processedItems.add(itemKey);
        }

        // 주소 포맷팅
        const fullAddress = formatAddress(
          row.od_b_addr1 || '',
          row.od_b_addr2 || '',
          row.od_b_addr3 || '',
        );

        // 전화번호 포맷팅
        const formattedPhone1 = formatPhoneNumber(row.od_b_tel || '');
        const formattedPhone2 = formatPhoneNumber(row.od_b_hp || '');

        const printItem: OrderPrintData = {
          od_id: row.od_id,
          od_b_zip1: row.od_b_zip1 || '',
          od_b_zip2: row.od_b_zip2 || '',
          od_b_addr1: row.od_b_addr1 || '',
          od_b_addr2: row.od_b_addr2 || '',
          od_b_addr3: row.od_b_addr3 || '',
          od_b_addr_jibeon: row.od_b_addr_jibeon || '',
          od_b_name: row.od_b_name || '',
          od_b_tel: row.od_b_tel || '',
          od_b_hp: row.od_b_hp || '',
          it_name: row.it_name || '',
          ct_qty: row.ct_qty || 0,
          it_id: row.it_id || '',
          od_memo: row.od_memo || '',
          od_invoice: row.od_invoice || '',
          ct_option: row.ct_option || '',
          ct_send_cost: row.ct_send_cost || 0,
          ct_send_cost_text: sendCostText,
          full_address: fullAddress,
          formatted_phone1: formattedPhone1,
          formatted_phone2: formattedPhone2,
        };

        printData.push(printItem);
      }

      return NextResponse.json({
        success: true,
        data: printData,
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('주문내역 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '주문내역 조회 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
