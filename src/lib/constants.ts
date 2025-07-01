export const STATUS_GROUPS = {
  all: '전체',
  collection: '❤️ 디자인',
  review: '제작 검토',
  payment: '구매 진행',
  paymentCompleted: '주문 확정',
  making: '상품 제작',
  shipping: '배송 진행',
  completed: '수령 완료',
  cancelled: '취소/반품/품절',
} as const;

export const STATUS_MAPPING = {
  주문: '결제대기',
  입금: '결제완료',
  준비: '상품 제작',
  배송: '배송 진행',
  완료: '수령 완료',
  구매확정: '구매확정',
  취소: '주문취소',
  반품: '반품',
  품절: '품절',
} as const;
