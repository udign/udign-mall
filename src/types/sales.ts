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

// 상품판매순위 관련 타입 추가
export interface ProductRankingItem {
  it_id: string;
  it_name: string;
  it_img1?: string;
  ca_id?: string;
  ca_name?: string;
  rank: number;
  shopping: number; // 쇼핑(장바구니)
  ordered: number; // 주문
  paid: number; // 입금
  preparing: number; // 준비
  shipped: number; // 배송
  completed: number; // 완료
  cancelled: number; // 취소
  returned: number; // 반품
  outOfStock: number; // 품절
  totalQty: number; // 합계
}

export interface ProductRankingQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  sortBy?:
    | 'shopping'
    | 'ordered'
    | 'paid'
    | 'preparing'
    | 'shipped'
    | 'completed'
    | 'cancelled'
    | 'returned'
    | 'outOfStock'
    | 'totalQty';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductRankingResponse {
  success: boolean;
  data?: ProductRankingItem[];
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  error?: string;
}

export interface ProductCategory {
  ca_id: string;
  ca_name: string;
  ca_order: number;
}
