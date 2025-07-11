// 주문 상태 타입
export type OrderStatus = '주문' | '입금' | '준비' | '배송' | '완료' | '취소' | '반품' | '품절';

// 배송비 타입
export type SendCostType = 0 | 1 | 2; // 0: 선불, 1: 착불, 2: 무료

// 주문 상품 정보
export interface OrderItem {
  ct_id: number;
  od_id: string;
  it_id: string;
  it_name: string;
  ct_qty: number;
  ct_price: number;
  ct_option: string;
  ct_status: OrderStatus;
  ct_send_cost: SendCostType;
  io_price: number;
  io_type: number;
}

// 주문 정보
export interface Order {
  od_id: string;
  mb_id: string;
  od_name: string;
  od_email: string;
  od_tel: string;
  od_hp: string;
  od_zip1: string;
  od_zip2: string;
  od_addr1: string;
  od_addr2: string;
  od_addr3: string;
  od_addr_jibeon: string;
  od_b_name: string;
  od_b_tel: string;
  od_b_hp: string;
  od_b_zip1: string;
  od_b_zip2: string;
  od_b_addr1: string;
  od_b_addr2: string;
  od_b_addr3: string;
  od_b_addr_jibeon: string;
  od_memo: string;
  od_status: OrderStatus;
  od_time: string;
  od_invoice: string;
  od_delivery_company: string;
  od_send_cost: number;
  od_send_cost2: number;
  od_cart_count: number;
  od_cart_price: number;
  od_receipt_price: number;
  od_shop_memo: string;
}

// 주문 출력용 데이터
export interface OrderPrintData {
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
  ct_send_cost_text: string; // 배송비 텍스트 (선불/착불/무료)
  full_address: string; // 전체 주소
  formatted_phone1: string; // 포맷된 전화번호1
  formatted_phone2: string; // 포맷된 전화번호2
}

// 주문 출력 요청 파라미터
export interface OrderPrintRequest {
  case: 1 | 2; // 1: 기간별, 2: 주문번호구간별
  ct_status?: OrderStatus | '' | 'all';
  csv: 'xlsx' | 'csv';
  fr_date?: string; // YYYYMMDD 형식
  to_date?: string; // YYYYMMDD 형식
  fr_od_id?: string; // 시작 주문번호
  to_od_id?: string; // 종료 주문번호
}

// 주문 출력 응답
export interface OrderPrintResponse {
  success: boolean;
  data?: OrderPrintData[];
  error?: string;
}

// 주문 통계
export interface OrderStats {
  totalOrders: number;
  statusCounts: Record<OrderStatus, number>;
  todayOrders: number;
  monthlyOrders: number;
}

// 주문 필터
export interface OrderFilter {
  case: 1 | 2;
  ct_status: OrderStatus | '' | 'all';
  fr_date: string;
  to_date: string;
  fr_od_id: string;
  to_od_id: string;
}

// 주문 출력 옵션
export interface OrderExportOption {
  format: 'xlsx' | 'csv';
  filename: string;
}

// CSV 헤더
export const CSV_HEADERS = [
  '우편번호',
  '주소',
  '이름',
  '전화1',
  '전화2',
  '상품명',
  '수량',
  '선택사항',
  '배송비',
  '상품코드',
  '주문번호',
  '운송장번호',
  '전하실말씀',
] as const;

// 주문 상태 옵션
export const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '주문', label: '주문' },
  { value: '입금', label: '입금' },
  { value: '준비', label: '준비' },
  { value: '배송', label: '배송' },
  { value: '완료', label: '완료' },
  { value: '취소', label: '취소' },
  { value: '반품', label: '반품' },
  { value: '품절', label: '품절' },
] as const;

// 배송비 타입 변환
export const getSendCostText = (sendCost: SendCostType): string => {
  switch (sendCost) {
    case 1:
      return '착불';
    case 2:
      return '무료';
    default:
      return '선불';
  }
};

// 전화번호 포맷팅
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';

  const cleaned = phone.replace(/[^0-9]/g, '');

  if (cleaned.startsWith('02')) {
    return cleaned.replace(/(\d{2})(\d{3,4})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.startsWith('01')) {
    return cleaned.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  } else {
    return cleaned.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3');
  }
};

// 주소 포맷팅
export const formatAddress = (addr1: string, addr2: string, addr3: string): string => {
  const parts = [addr1, addr2, addr3].filter(Boolean);
  return parts.join(' ');
};
