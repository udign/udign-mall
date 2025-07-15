// 교환/반품 상태 타입
export type ReturnStatus = 'pending' | 'approved' | 'completed' | 'rejected';

// 교환/반품 유형 타입
export type ReturnType = 'exchange' | 'return';

// 교환/반품 기본 정보 타입
export interface ReturnItem {
  return_id: number;
  od_id: string;
  mb_id: string | null;
  return_name: string;
  return_phone: string;
  return_type: ReturnType;
  return_reason: string;
  return_image: string | null;
  return_status: ReturnStatus;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
}

// 교환/반품 목록 조회용 타입 (주문 정보 포함)
export interface ReturnListItem extends ReturnItem {
  od_time: string;
  od_name: string;
  od_status: string;
  od_settle_case: string;
  od_receipt_price: number;
  od_cart_count: number;
  mb_name?: string | null;
}

// 교환/반품 목록 응답 타입
export interface ReturnListResponse {
  returns: ReturnListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  statusCounts: {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
  };
}

// 교환/반품 목록 조회 파라미터 타입
export interface ReturnListParams {
  page?: number;
  limit?: number;
  status?: ReturnStatus | '' | null;
  search?: string;
  searchField?: 'od_id' | 'return_name' | 'mb_id' | 'return_phone';
  sort?: string;
  order?: 'asc' | 'desc';
}

// 상태 표시명 매핑
export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '대기',
  approved: '승인',
  completed: '완료',
  rejected: '거부',
};

// 유형 표시명 매핑
export const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  exchange: '교환',
  return: '반품',
};

// 상태별 색상 클래스
export const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};
