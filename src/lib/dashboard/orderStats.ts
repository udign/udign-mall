import { executeQuery } from '@/lib/database';

export interface OrderStats {
  waitingPayment: number; // 입금 대기 중
  paymentCompleted: number; // 결제완료
  shipping: number; // 배송중
  delivered: number; // 배송완료
  cancelled: number; // 취소주문
  exchanged: number; // 교환주문
  returned: number; // 반품주문
}

// 주문 통계를 가져오는 함수
export const getOrderStats = async (): Promise<OrderStats> => {
  console.log('🔄 주문 통계 조회 중...', new Date().toISOString());

  try {
    // 1. 입금 대기 중 ('주문' 상태)
    const waitingPaymentQuery = `
      SELECT COUNT(DISTINCT od.od_id) as count
      FROM g5_shop_order od
      INNER JOIN g5_shop_cart ct ON od.od_id = ct.od_id
      WHERE ct.ct_status = '주문'
    `;
    const waitingPaymentResult = (await executeQuery(waitingPaymentQuery)) as Array<{
      count: number;
    }>;
    const waitingPayment = waitingPaymentResult[0]?.count || 0;

    // 2. 결제완료 ('입금' 상태)
    const paymentCompletedQuery = `
      SELECT COUNT(DISTINCT od.od_id) as count
      FROM g5_shop_order od
      INNER JOIN g5_shop_cart ct ON od.od_id = ct.od_id
      WHERE ct.ct_status = '입금'
    `;
    const paymentCompletedResult = (await executeQuery(paymentCompletedQuery)) as Array<{
      count: number;
    }>;
    const paymentCompleted = paymentCompletedResult[0]?.count || 0;

    // 3. 배송중 ('배송' 상태)
    const shippingQuery = `
      SELECT COUNT(DISTINCT od.od_id) as count
      FROM g5_shop_order od
      INNER JOIN g5_shop_cart ct ON od.od_id = ct.od_id
      WHERE ct.ct_status = '배송'
    `;
    const shippingResult = (await executeQuery(shippingQuery)) as Array<{ count: number }>;
    const shipping = shippingResult[0]?.count || 0;

    // 4. 배송완료 ('완료' 또는 '구매확정' 상태)
    const deliveredQuery = `
      SELECT COUNT(DISTINCT od.od_id) as count
      FROM g5_shop_order od
      INNER JOIN g5_shop_cart ct ON od.od_id = ct.od_id
      WHERE ct.ct_status IN ('완료', '구매확정')
    `;
    const deliveredResult = (await executeQuery(deliveredQuery)) as Array<{ count: number }>;
    const delivered = deliveredResult[0]?.count || 0;

    // 5. 취소주문 ('취소' 상태)
    const cancelledQuery = `
      SELECT COUNT(DISTINCT od.od_id) as count
      FROM g5_shop_order od
      INNER JOIN g5_shop_cart ct ON od.od_id = ct.od_id
      WHERE ct.ct_status = '취소'
    `;
    const cancelledResult = (await executeQuery(cancelledQuery)) as Array<{ count: number }>;
    const cancelled = cancelledResult[0]?.count || 0;

    // 6. 교환주문 ('교환' 상태)
    const exchangedQuery = `
      SELECT COUNT(DISTINCT od.od_id) as count
      FROM g5_shop_order od
      INNER JOIN g5_shop_cart ct ON od.od_id = ct.od_id
      WHERE ct.ct_status = '교환'
    `;
    const exchangedResult = (await executeQuery(exchangedQuery)) as Array<{ count: number }>;
    const exchanged = exchangedResult[0]?.count || 0;

    // 7. 반품주문 ('반품' 상태)
    const returnedQuery = `
      SELECT COUNT(DISTINCT od.od_id) as count
      FROM g5_shop_order od
      INNER JOIN g5_shop_cart ct ON od.od_id = ct.od_id
      WHERE ct.ct_status = '반품'
    `;
    const returnedResult = (await executeQuery(returnedQuery)) as Array<{ count: number }>;
    const returned = returnedResult[0]?.count || 0;

    return {
      waitingPayment,
      paymentCompleted,
      shipping,
      delivered,
      cancelled,
      exchanged,
      returned,
    };
  } catch (error) {
    console.error('Order stats error:', error);
    return {
      waitingPayment: 0,
      paymentCompleted: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
      exchanged: 0,
      returned: 0,
    };
  }
};
