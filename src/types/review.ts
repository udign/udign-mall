// 검수 시스템 관련 타입 정의

export interface OrderInfo {
  active_orders: number;
  total_orders: number;
  cancelled_orders: number;
  latest_order_status: string | null;
  has_active_orders: boolean;
  all_orders_cancelled: boolean;
}

export interface ReviewItem {
  it_id: string;
  it_name: string;
  it_img1: string;
  it_1: string; // 등록자/판매자 ID
  it_2: string; // 작가명
  it_3: string; // 작품설명
  it_4: number; // 좋아요 목표 수
  it_8: number; // 심의 기간(일)
  it_9: 'Y' | 'N'; // 수동 심의 여부
  it_10: 'Y' | 'N' | string; // 관리자 심의 토글 (Y: 심의중, N: 심의종료, R: 반려)
  it_time: string; // 등록일시
  it_use: '1' | '0'; // 사용 여부
  it_price: number; // 판매가격
  interest_count: number; // 현재 좋아요 수
  days_since_created: number; // 등록 후 경과일
  goal_achieved: boolean; // 목표 달성 여부
  review_status: ReviewStatus;
  order_info?: OrderInfo; // 주문 정보
}

export type ReviewStatus =
  | 'pending' // 검수 대기 (목표 달성, 심의 기간 도달)
  | 'in_review' // 심의중 (관리자 토글)
  | 'in_progress' // 진행중 (활성 주문 있음)
  | 'approved' // 승인
  | 'rejected' // 반려
  | 'collection' // 컬렉션 단계 (목표 미달성)
  | 'cancelled'; // 취소됨

export interface ReviewAction {
  action: 'payment' | 'review';
  item_ids: string[];
  admin_memo?: string;
}

export interface ReviewLog {
  log_id: string;
  it_id: string;
  admin_id: string;
  action: ReviewStatus;
  admin_memo?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface ReviewStats {
  all: number;
  allItems: number; // 전체 작품 수
  approvedItems: number; // 사이트 노출 승인된 작품 수
  rejectedItems: number; // 사이트 노출 반려된 작품 수
  total: number;
  pending: number;
  in_review: number;
  in_progress?: number;
  approved: number;
  rejected: number;
  collection: number;
  review: number;
  payment: number;
  paymentCompleted: number;
  making: number;
  shipping: number;
  completed: number;
  cancelled: number;
}

export interface ReviewFilters {
  status?: ReviewStatus | 'all';
  search?: string;
  date_from?: string;
  date_to?: string;
  admin_id?: string;
}

export interface AdminUser {
  mb_id: string;
  mb_name: string;
  mb_level: number;
  is_admin: boolean;
  is_super_admin: boolean;
}
