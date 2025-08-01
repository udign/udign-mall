export interface Interest {
  ir_id: string;
  it_id: string;
  mb_id: string;
  ir_time: string;
}

export interface ShopItem {
  it_id: string;
  it_name: string;
  it_img1: string;
  it_1: string;
  it_2: string;
  it_3: string;
  it_4: number; // 목표 좋아요 수
  it_8: number; // 심의 기간(일)
  it_9: 'Y' | 'N'; // 수동 심의 여부
  it_10: 'Y' | 'N'; // 관리자 심의 토글
  it_time: string;
  it_use: '1' | '0';
}

export interface CartItem {
  ct_id: string;
  it_id: string;
  od_id: string;
  ct_status: string;
  mb_id: string;
}

export interface Order {
  od_id: string;
  od_status: string;
  od_settle_case: string;
  od_invoice?: string;
  od_delivery_company?: string;
  mb_id: string;
  od_time: string;
}

export interface ReturnItem {
  return_id: string;
  od_id: string;
  return_status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  return_type: 'exchange' | 'return';
  admin_memo?: string;
  updated_at: string;
  mb_id: string;
}

export interface ArtworkStatus {
  it_id: string;
  it_name: string;
  it_img1: string;
  it_4: number;
  it_8: number;
  it_9: 'Y' | 'N';
  it_10: 'Y' | 'N';
  ir_id?: string;
  ir_time?: string;
  ct_status?: string;
  od_id?: string;
  od_settle_case?: string;
  od_status?: string;
  od_invoice?: string;
  od_delivery_company?: string;
  return_status?: string;
  return_type?: string;
  return_id?: string;
  admin_memo?: string;
  return_updated?: string;
  orderNumber?: number; // 좋아요 순번
  _goalAttainment: boolean;
  _status_text: string;
  _status_key: string;
  _iCount: number;
}

export type StatusKey =
  | 'all'
  | 'collection'
  | 'review'
  | 'payment'
  | 'paymentCompleted'
  | 'making'
  | 'shipping'
  | 'completed'
  | 'cancelled';

export interface StatusGroup {
  [key: string]: string;
}

export interface StatusCounts {
  [key: string]: number;
}

export interface ProductsByStatus {
  [key: string]: ArtworkStatus[];
}

export interface ArtworkItem {
  it_id: string;
  it_name: string;
  it_price: number;
  it_img1?: string;
  it_img2?: string;
  it_img3?: string;
  it_stock_qty: number;
  it_use: number;
  // ... 기존 필드들
}

// 작품 설정을 위한 추가 필드들
export interface ArtworkDetail extends ArtworkItem {
  it_1: string; // 판매자ID
  it_2: string; // 작가명
  it_3: string; // 작품설명
  it_4: number; // 목표 좋아요 수
  it_10: 'Y' | 'N'; // 관리자 심의 토글
  _iCount?: number; // 현재 좋아요 수
  it_order: number; // 출력순서
  it_soldout: number; // 품절여부
  it_point: number; // 포인트
  it_point_type: number; // 포인트 유형
  it_supply_point: number; // 추가옵션 포인트
  it_stock_sms: number; // 재입고 SMS 알림
  it_noti_qty: number; // 재고 통보수량
  it_buy_min_qty: number; // 최소구매수량
  it_buy_max_qty: number; // 최대구매수량
  it_notax: number; // 과세유형
  it_sell_email: string; // 판매자 이메일
  it_nocoupon: number; // 쿠폰적용안함
  ca_id: string; // 기본분류
  ca_id2: string; // 2차분류
  ca_id3: string; // 3차분류
  it_sc_type: number; // 배송비 유형
  it_sc_method: number; // 배송비 결제
  it_sc_price: number; // 기본배송비
  it_sc_minimum: number; // 무료배송 최소금액
  it_sc_qty: number; // 수량별 배송비
}

// 카테고리 타입
export interface Category {
  ca_id: string;
  ca_name: string;
  ca_order: number;
  ca_use: number;
  ca_stock_qty: number;
  ca_sell_email: string;
}

// 작품 수정 요청 타입
export interface UpdateArtworkRequest {
  it_name: string;
  it_1: string; // 판매자ID
  it_3: string; // 작품설명
  it_4: number; // 목표 좋아요 수
  it_price: number;
  it_order: number;
  it_use: number;
  it_soldout: number;
  it_point: number;
  it_point_type: number;
  it_supply_point: number;
  it_stock_qty: number;
  it_stock_sms: number;
  it_noti_qty: number;
  it_buy_min_qty: number;
  it_buy_max_qty: number;
  it_notax: number;
  it_sell_email: string;
  it_nocoupon: number;
  ca_id: string;
  ca_id2: string;
  ca_id3: string;
  it_sc_type: number;
  it_sc_method: number;
  it_sc_price: number;
  it_sc_minimum: number;
  it_sc_qty: number;
}
