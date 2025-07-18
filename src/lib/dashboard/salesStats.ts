import { executeQuery } from '@/lib/database';
import dayjs from 'dayjs';

export interface MonthlySalesData {
  month: string; // '2025-01' 형식
  month_name: string; // '1월' 형식
  total_sales: number; // 총 매출 (od_receipt_price)
  order_count: number; // 주문 수
  avg_order_value: number; // 평균 주문 금액
}

export interface SalesStats {
  monthly_data: MonthlySalesData[];
  total_yearly_sales: number;
  total_yearly_orders: number;
  avg_order_value: number; // 평균 주문 금액
  best_month: {
    name: string;
    amount: number;
  };
  worst_month: {
    name: string;
    amount: number;
  };
}

// 매출 통계를 가져오는 함수 (지정된 연도의 1월~12월)
export const getSalesStats = async (year?: number): Promise<SalesStats> => {
  try {
    const currentYear = year || dayjs().year();

    // 월별 매출 데이터 조회
    const monthlySalesQuery = `
      SELECT 
        DATE_FORMAT(od_time, '%Y-%m') as month,
        SUM(od_receipt_price) as total_sales,
        COUNT(od_id) as order_count
      FROM g5_shop_order 
      WHERE YEAR(od_time) = ?
        AND od_receipt_price > 0
      GROUP BY DATE_FORMAT(od_time, '%Y-%m')
      ORDER BY month ASC
    `;

    const monthlyResults = (await executeQuery(monthlySalesQuery, [currentYear])) as Array<{
      month: string;
      total_sales: string | number;
      order_count: number;
    }>;

    // 1월부터 12월까지 전체 데이터 생성 (데이터가 없는 월은 0으로)
    const monthlyData: MonthlySalesData[] = [];
    const monthNames = [
      '1월',
      '2월',
      '3월',
      '4월',
      '5월',
      '6월',
      '7월',
      '8월',
      '9월',
      '10월',
      '11월',
      '12월',
    ];

    for (let i = 1; i <= 12; i++) {
      const monthStr = `${currentYear}-${i.toString().padStart(2, '0')}`;
      const existingData = monthlyResults.find((item) => item.month === monthStr);

      // 문자열로 반환되는 total_sales를 숫자로 변환
      const totalSales = existingData ? Number(existingData.total_sales) || 0 : 0;
      const orderCount = existingData?.order_count || 0;
      const avgOrderValue = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

      monthlyData.push({
        month: monthStr,
        month_name: monthNames[i - 1],
        total_sales: totalSales,
        order_count: orderCount,
        avg_order_value: avgOrderValue,
      });
    }

    // 전체 통계 계산
    const totalYearlySales = monthlyData.reduce((sum, item) => sum + item.total_sales, 0);
    const totalYearlyOrders = monthlyData.reduce((sum, item) => sum + item.order_count, 0);
    const avgOrderValue =
      totalYearlyOrders > 0 ? Math.round(totalYearlySales / totalYearlyOrders) : 0;

    // 최고/최저 매출 월 찾기
    const salesWithData = monthlyData.filter((item) => item.total_sales > 0);
    let bestMonth = { name: '', amount: 0 };
    let worstMonth = { name: '', amount: 0 };

    if (salesWithData.length > 0) {
      const maxSales = Math.max(...salesWithData.map((item) => item.total_sales));
      const minSales = Math.min(...salesWithData.map((item) => item.total_sales));

      const bestMonthData = salesWithData.find((item) => item.total_sales === maxSales);
      const worstMonthData = salesWithData.find((item) => item.total_sales === minSales);

      bestMonth = {
        name: bestMonthData?.month_name || '',
        amount: bestMonthData?.total_sales || 0,
      };
      worstMonth = {
        name: worstMonthData?.month_name || '',
        amount: worstMonthData?.total_sales || 0,
      };
    }

    return {
      monthly_data: monthlyData,
      total_yearly_sales: totalYearlySales,
      total_yearly_orders: totalYearlyOrders,
      avg_order_value: avgOrderValue,
      best_month: bestMonth,
      worst_month: worstMonth,
    };
  } catch (error) {
    console.error('Sales stats error:', error);
    return {
      monthly_data: [],
      total_yearly_sales: 0,
      total_yearly_orders: 0,
      avg_order_value: 0,
      best_month: { name: '', amount: 0 },
      worst_month: { name: '', amount: 0 },
    };
  }
};
