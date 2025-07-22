// 주문 상품 정보
export interface OrderItem {
  it_id: string;
  it_name: string;
  it_price: number;
  it_option?: string;
  quantity: number;
  subtotal_price: number;
  subtotal_point: number;
  product_url?: string;
  image_url?: string;
}

// 결제 정보
export interface PaymentInfo {
  settle_case: string; // 결제방식 (신용카드, 계좌이체, 무통장입금 등)
  receipt_price: number; // 입금액
  receipt_point: number; // 포인트 사용액
  bank_account?: string; // 계좌번호 (계좌이체의 경우)
  deposit_name?: string; // 입금자명 (계좌이체의 경우)
}

// 주문자 정보
export interface OrdererInfo {
  name: string;
  tel?: string;
  hp?: string;
  zipcode?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  hope_date?: string; // 희망배송일
}

// 배송지 정보
export interface DeliveryInfo {
  name: string;
  tel?: string;
  hp?: string;
  zipcode?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  memo?: string; // 전하실 말씀
}

// 주문 완료 메일 데이터
export interface OrderCompleteEmailData {
  siteName: string;
  siteUrl: string;
  orderId: string;
  orderDate: string;
  orderItems: OrderItem[];
  sendCost: number; // 배송비
  additionalSendCost: number; // 추가배송비
  totalPrice: number; // 주문합계
  totalPoint: number; // 포인트합계
  paymentInfo: PaymentInfo;
  ordererInfo: OrdererInfo;
  deliveryInfo: DeliveryInfo;
  adminPhone?: string; // 고객센터 전화번호
}
