export type PaymentMethodType = 'CARD' | 'NAVERPAY' | 'TOSSPAY';

export interface PaymentInfo {
  orderId: string;
  orderName: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerMobilePhone?: string;
}

export interface PaymentItem {
  it_id: string;
  it_name: string;
  it_price: number;
  quantity: number;
  totalPrice: number;
  it_img1?: string;
}

export interface PaymentRequest {
  items: PaymentItem[];
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    detailAddress?: string;
    zipCode?: string;
  };
  paymentMethod: PaymentMethodType;
  totalAmount: number;
  orderId: string;
}

export interface PaymentResult {
  success: boolean;
  paymentKey?: string;
  orderId?: string;
  amount?: number;
  message?: string;
  error?: string;
}

export interface OrderInfo {
  od_id: string;
  od_name: string;
  od_email: string;
  od_hp?: string;
  od_zip1?: string;
  od_addr1?: string;
  od_addr2?: string;
  od_price: number;
  od_receipt_price: number;
  od_status: string;
  od_time: string;
  od_tno?: string;
  od_settle_case?: string;
  items: OrderItem[];
}

export interface OrderItem {
  ct_id: string;
  it_id: string;
  it_name: string;
  ct_price: number;
  ct_qty: number;
  ct_status: string;
  it_img1?: string;
}
