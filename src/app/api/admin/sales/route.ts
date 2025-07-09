import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { SalesQueryParams, SalesResponse, SalesData, SalesTotals } from '@/types/sales';
import { executeQuery } from '@/lib/database';
import dayjs from 'dayjs';

export const POST = async (request: NextRequest) => {
  try {
    const user = await getCurrentUser();

    // 관리자 권한 체크
    if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const params: SalesQueryParams = await request.json();
    let salesData: SalesData[] = [];

    switch (params.type) {
      case 'daily':
        salesData = await getDailySales(params.date || dayjs().format('YYYY-MM-DD'));
        break;
      case 'period':
        salesData = await getPeriodSales(
          params.startDate || dayjs().startOf('month').format('YYYY-MM-DD'),
          params.endDate || dayjs().format('YYYY-MM-DD'),
        );
        break;
      case 'monthly':
        salesData = await getMonthlySales(
          params.startMonth || dayjs().startOf('year').format('YYYY-MM'),
          params.endMonth || dayjs().format('YYYY-MM'),
        );
        break;
      case 'yearly':
        salesData = await getYearlySales(
          params.startYear || String(dayjs().year() - 1),
          params.endYear || String(dayjs().year()),
        );
        break;
      default:
        return NextResponse.json(
          { success: false, error: '잘못된 조회 타입입니다.' },
          { status: 400 },
        );
    }

    // 합계 계산
    const totals: SalesTotals = salesData.reduce(
      (totals, item) => ({
        orderCount: totals.orderCount + item.orderCount,
        orderprice: totals.orderprice + item.orderprice,
        couponPrice: totals.couponPrice + item.couponPrice,
        receiptBank: totals.receiptBank + item.receiptBank,
        receiptVbank: totals.receiptVbank + item.receiptVbank,
        receiptIche: totals.receiptIche + item.receiptIche,
        receiptCard: totals.receiptCard + item.receiptCard,
        receiptEasy: totals.receiptEasy + item.receiptEasy,
        receiptHp: totals.receiptHp + item.receiptHp,
        receiptPoint: totals.receiptPoint + item.receiptPoint,
        orderCancel: totals.orderCancel + item.orderCancel,
        misu: totals.misu + item.misu,
      }),
      {
        orderCount: 0,
        orderprice: 0,
        couponPrice: 0,
        receiptBank: 0,
        receiptVbank: 0,
        receiptIche: 0,
        receiptCard: 0,
        receiptEasy: 0,
        receiptHp: 0,
        receiptPoint: 0,
        orderCancel: 0,
        misu: 0,
      },
    );

    const response: SalesResponse = {
      success: true,
      data: salesData,
      totals: totals,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('매출 데이터 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '매출 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};

// 빈 매출 데이터 생성 함수
const createEmptySalesData = (date: string): SalesData => {
  return {
    date,
    orderCount: 0,
    orderprice: 0,
    couponPrice: 0,
    receiptBank: 0,
    receiptVbank: 0,
    receiptIche: 0,
    receiptCard: 0,
    receiptEasy: 0,
    receiptHp: 0,
    receiptPoint: 0,
    orderCancel: 0,
    misu: 0,
  };
};

const getDailySales = async (date: string): Promise<SalesData[]> => {
  const sql = `
    SELECT 
      DATE(od_time) as date,
      COUNT(od_id) as orderCount,
      SUM(od_cart_price + od_send_cost + IFNULL(od_send_cost2, 0)) as orderprice,
      SUM(od_cart_coupon + od_coupon + od_send_coupon) as couponPrice,
      SUM(IF(od_settle_case = '무통장', od_receipt_price, 0)) as receiptBank,
      SUM(IF(od_settle_case = '가상계좌', od_receipt_price, 0)) as receiptVbank,
      SUM(IF(od_settle_case = '계좌이체', od_receipt_price, 0)) as receiptIche,
      SUM(IF(od_settle_case = '신용카드', od_receipt_price, 0)) as receiptCard,
      SUM(IF(od_settle_case IN ('간편결제', 'KAKAOPAY', 'lpay', 'inicis_payco', 'inicis_kakaopay', '삼성페이'), od_receipt_price, 0)) as receiptEasy,
      SUM(IF(od_settle_case = '휴대폰', od_receipt_price, 0)) as receiptHp,
      SUM(od_receipt_point) as receiptPoint,
      SUM(od_cancel_price) as orderCancel,
      SUM(od_misu) as misu
    FROM g5_shop_order 
    WHERE DATE(od_time) = ?
    GROUP BY DATE(od_time)
    ORDER BY date
  `;

  const results = (await executeQuery(sql, [date])) as any[];

  // 데이터가 없으면 빈 데이터 반환
  if (results.length === 0) {
    return [createEmptySalesData(date)];
  }

  return results.map((row: any) => ({
    date: row.date,
    orderCount: Number(row.orderCount) || 0,
    orderprice: Number(row.orderprice) || 0,
    couponPrice: Number(row.couponPrice) || 0,
    receiptBank: Number(row.receiptBank) || 0,
    receiptVbank: Number(row.receiptVbank) || 0,
    receiptIche: Number(row.receiptIche) || 0,
    receiptCard: Number(row.receiptCard) || 0,
    receiptEasy: Number(row.receiptEasy) || 0,
    receiptHp: Number(row.receiptHp) || 0,
    receiptPoint: Number(row.receiptPoint) || 0,
    orderCancel: Number(row.orderCancel) || 0,
    misu: Number(row.misu) || 0,
  }));
};

const getPeriodSales = async (startDate: string, endDate: string): Promise<SalesData[]> => {
  const sql = `
    SELECT 
      DATE(od_time) as date,
      COUNT(od_id) as orderCount,
      SUM(od_cart_price + od_send_cost + IFNULL(od_send_cost2, 0)) as orderprice,
      SUM(od_cart_coupon + od_coupon + od_send_coupon) as couponPrice,
      SUM(IF(od_settle_case = '무통장', od_receipt_price, 0)) as receiptBank,
      SUM(IF(od_settle_case = '가상계좌', od_receipt_price, 0)) as receiptVbank,
      SUM(IF(od_settle_case = '계좌이체', od_receipt_price, 0)) as receiptIche,
      SUM(IF(od_settle_case = '신용카드', od_receipt_price, 0)) as receiptCard,
      SUM(IF(od_settle_case IN ('간편결제', 'KAKAOPAY', 'lpay', 'inicis_payco', 'inicis_kakaopay', '삼성페이'), od_receipt_price, 0)) as receiptEasy,
      SUM(IF(od_settle_case = '휴대폰', od_receipt_price, 0)) as receiptHp,
      SUM(od_receipt_point) as receiptPoint,
      SUM(od_cancel_price) as orderCancel,
      SUM(od_misu) as misu
    FROM g5_shop_order 
    WHERE DATE(od_time) BETWEEN ? AND ?
    GROUP BY DATE(od_time)
    ORDER BY date
  `;

  const results = (await executeQuery(sql, [startDate, endDate])) as any[];
  const salesMap = new Map<string, SalesData>();

  // 실제 데이터를 맵에 저장
  results.forEach((row: any) => {
    salesMap.set(row.date, {
      date: row.date,
      orderCount: Number(row.orderCount) || 0,
      orderprice: Number(row.orderprice) || 0,
      couponPrice: Number(row.couponPrice) || 0,
      receiptBank: Number(row.receiptBank) || 0,
      receiptVbank: Number(row.receiptVbank) || 0,
      receiptIche: Number(row.receiptIche) || 0,
      receiptCard: Number(row.receiptCard) || 0,
      receiptEasy: Number(row.receiptEasy) || 0,
      receiptHp: Number(row.receiptHp) || 0,
      receiptPoint: Number(row.receiptPoint) || 0,
      orderCancel: Number(row.orderCancel) || 0,
      misu: Number(row.misu) || 0,
    });
  });

  // 설정한 기간의 모든 날짜 생성
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const salesData: SalesData[] = [];

  let current = start;
  while (current.isBefore(end) || current.isSame(end)) {
    const dateStr = current.format('YYYY-MM-DD');
    const data = salesMap.get(dateStr) || createEmptySalesData(dateStr);
    salesData.push(data);
    current = current.add(1, 'day');
  }

  return salesData;
};

const getMonthlySales = async (startMonth: string, endMonth: string): Promise<SalesData[]> => {
  const sql = `
    SELECT 
      DATE_FORMAT(od_time, '%Y-%m') as date,
      COUNT(od_id) as orderCount,
      SUM(od_cart_price + od_send_cost + IFNULL(od_send_cost2, 0)) as orderprice,
      SUM(od_cart_coupon + od_coupon + od_send_coupon) as couponPrice,
      SUM(IF(od_settle_case = '무통장', od_receipt_price, 0)) as receiptBank,
      SUM(IF(od_settle_case = '가상계좌', od_receipt_price, 0)) as receiptVbank,
      SUM(IF(od_settle_case = '계좌이체', od_receipt_price, 0)) as receiptIche,
      SUM(IF(od_settle_case = '신용카드', od_receipt_price, 0)) as receiptCard,
      SUM(IF(od_settle_case IN ('간편결제', 'KAKAOPAY', 'lpay', 'inicis_payco', 'inicis_kakaopay', '삼성페이'), od_receipt_price, 0)) as receiptEasy,
      SUM(IF(od_settle_case = '휴대폰', od_receipt_price, 0)) as receiptHp,
      SUM(od_receipt_point) as receiptPoint,
      SUM(od_cancel_price) as orderCancel,
      SUM(od_misu) as misu
    FROM g5_shop_order 
    WHERE DATE_FORMAT(od_time, '%Y-%m') BETWEEN ? AND ?
    GROUP BY DATE_FORMAT(od_time, '%Y-%m')
    ORDER BY date
  `;

  const results = (await executeQuery(sql, [startMonth, endMonth])) as any[];
  const salesMap = new Map<string, SalesData>();

  // 실제 데이터를 맵에 저장
  results.forEach((row: any) => {
    salesMap.set(row.date, {
      date: row.date,
      orderCount: Number(row.orderCount) || 0,
      orderprice: Number(row.orderprice) || 0,
      couponPrice: Number(row.couponPrice) || 0,
      receiptBank: Number(row.receiptBank) || 0,
      receiptVbank: Number(row.receiptVbank) || 0,
      receiptIche: Number(row.receiptIche) || 0,
      receiptCard: Number(row.receiptCard) || 0,
      receiptEasy: Number(row.receiptEasy) || 0,
      receiptHp: Number(row.receiptHp) || 0,
      receiptPoint: Number(row.receiptPoint) || 0,
      orderCancel: Number(row.orderCancel) || 0,
      misu: Number(row.misu) || 0,
    });
  });

  // 설정한 기간의 모든 월 생성
  const start = dayjs(startMonth);
  const end = dayjs(endMonth);
  const salesData: SalesData[] = [];

  let current = start;
  while (current.isBefore(end) || current.isSame(end)) {
    const monthStr = current.format('YYYY-MM');
    const data = salesMap.get(monthStr) || createEmptySalesData(monthStr);
    salesData.push(data);
    current = current.add(1, 'month');
  }

  return salesData;
};

const getYearlySales = async (startYear: string, endYear: string): Promise<SalesData[]> => {
  // 기존 PHP와 동일한 방식: 모든 데이터를 가져와서 JavaScript에서 집계
  const sql = `
    SELECT 
      od_id,
      SUBSTRING(od_time, 1, 4) as od_date,
      od_settle_case,
      od_receipt_price,
      od_receipt_point,
      od_cart_price,
      od_cancel_price,
      od_misu,
      od_send_cost,
      IFNULL(od_send_cost2, 0) as od_send_cost2,
      (od_cart_price + od_send_cost + IFNULL(od_send_cost2, 0)) as orderprice,
      (od_cart_coupon + od_coupon + od_send_coupon) as couponprice
    FROM g5_shop_order 
    WHERE SUBSTRING(od_time, 1, 4) BETWEEN ? AND ?
    ORDER BY od_time DESC
  `;

  const results = (await executeQuery(sql, [startYear, endYear])) as any[];

  // 디버깅을 위한 로그
  console.log('Total records found:', results.length);
  console.log('Sample records:', results.slice(0, 5));

  // 설정한 기간의 모든 연도 생성
  const salesData: SalesData[] = [];
  const start = parseInt(startYear);
  const end = parseInt(endYear);

  for (let year = start; year <= end; year++) {
    salesData.push(createEmptySalesData(year.toString()));
  }

  // 실제 데이터로 업데이트
  results.forEach((row: any) => {
    const year = row.od_date;
    const yearIndex = parseInt(year) - start;

    if (yearIndex >= 0 && yearIndex < salesData.length) {
      const data = salesData[yearIndex];
      data.orderCount++;
      data.orderprice += Number(row.orderprice) || 0;
      data.couponPrice += Number(row.couponprice) || 0;
      data.receiptPoint += Number(row.od_receipt_point) || 0;
      data.orderCancel += Number(row.od_cancel_price) || 0;
      data.misu += Number(row.od_misu) || 0;

      // 결제수단별 분류 (PHP와 정확히 동일)
      const settleCase = row.od_settle_case;
      const receiptPrice = Number(row.od_receipt_price) || 0;

      if (settleCase === '무통장') {
        data.receiptBank += receiptPrice;
      } else if (settleCase === '가상계좌') {
        data.receiptVbank += receiptPrice;
      } else if (settleCase === '계좌이체') {
        data.receiptIche += receiptPrice;
      } else if (settleCase === '신용카드') {
        data.receiptCard += receiptPrice;
      } else if (settleCase === '휴대폰') {
        data.receiptHp += receiptPrice;
      } else if (
        ['간편결제', 'KAKAOPAY', 'lpay', 'inicis_payco', 'inicis_kakaopay', '삼성페이'].includes(
          settleCase,
        )
      ) {
        data.receiptEasy += receiptPrice;
      }
    }
  });

  return salesData;
};
