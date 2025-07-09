export interface SalesData {
  date: string; // 주문년도/월/일
  orderCount: number; // 주문수
  orderprice: number; // 주문합계 (od_cart_price + od_send_cost + od_send_cost2)
  couponPrice: number; // 쿠폰 (od_cart_coupon + od_coupon + od_send_coupon)
  receiptBank: number; // 무통장
  receiptVbank: number; // 가상계좌
  receiptIche: number; // 계좌이체
  receiptCard: number; // 카드입금
  receiptEasy: number; // 간편결제
  receiptHp: number; // 휴대폰
  receiptPoint: number; // 포인트입금
  orderCancel: number; // 주문취소
  misu: number; // 미수금
}

export interface SalesDetail {
  status: string;
  count: number;
  amount: number;
}

export interface DailySalesData extends SalesData {
  date: string; // YYYY-MM-DD format
}

export interface MonthlySalesData extends SalesData {
  date: string; // YYYY-MM format
  dailyData?: DailySalesData[];
}

export interface YearlySalesData extends SalesData {
  date: string; // YYYY format
  monthlyData?: MonthlySalesData[];
}

export interface SalesQueryParams {
  type: 'daily' | 'period' | 'monthly' | 'yearly';
  date?: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startMonth?: string; // YYYY-MM
  endMonth?: string; // YYYY-MM
  startYear?: string; // YYYY
  endYear?: string; // YYYY
}

export interface SalesTotals {
  orderCount: number;
  orderprice: number;
  couponPrice: number;
  receiptBank: number;
  receiptVbank: number;
  receiptIche: number;
  receiptCard: number;
  receiptEasy: number;
  receiptHp: number;
  receiptPoint: number;
  orderCancel: number;
  misu: number;
}

export interface SalesResponse {
  success: boolean;
  data?: SalesData[];
  totals?: SalesTotals;
  error?: string;
}

export interface SalesStatus {
  shopping: number;
  ordered: number;
  paid: number;
  preparing: number;
  shipped: number;
  completed: number;
  cancelled: number;
  returned: number;
  outOfStock: number;
}

export interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  statusBreakdown: SalesStatus;
}
