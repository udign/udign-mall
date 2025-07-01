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
