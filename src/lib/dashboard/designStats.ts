import { executeQuery } from '@/lib/database';

export interface DesignStats {
  total: number;
  new: number;
  approved: number;
  review: number;
  payment: number;
  making: number;
}

// 디자인 통계를 가져오는 함수
export const getDesignStats = async (): Promise<DesignStats> => {
  try {
    // 1. 전체 - 모든 업로드된 작품 수 (it_name이 비어있지 않은 것들)
    const totalQuery = `
      SELECT COUNT(*) as count 
      FROM g5_shop_item 
      WHERE it_name != ''
    `;
    const totalResult = (await executeQuery(totalQuery)) as Array<{ count: number }>;
    const total = totalResult[0]?.count || 0;

    // 2. 신규 - 관리자 승인 안된 작품 (it_use = '0')
    const newQuery = `
      SELECT COUNT(*) as count 
      FROM g5_shop_item 
      WHERE it_name != '' AND it_use = '0'
    `;
    const newResult = (await executeQuery(newQuery)) as Array<{ count: number }>;
    const newItems = newResult[0]?.count || 0;

    // 3. 승인 - 관리자가 승인한 작품 (it_use = '1')
    const approvedQuery = `
      SELECT COUNT(*) as count 
      FROM g5_shop_item 
      WHERE it_name != '' AND it_use = '1'
    `;
    const approvedResult = (await executeQuery(approvedQuery)) as Array<{ count: number }>;
    const approved = approvedResult[0]?.count || 0;

    // 4. 제작검토 - 목표 좋아요 수 달성했거나 관리자가 심의중으로 설정한 작품
    const reviewQuery = `
      SELECT COUNT(DISTINCT it.it_id) as count
      FROM g5_shop_item it
      LEFT JOIN g5_shop_interrest ir ON it.it_id = ir.it_id
      WHERE it.it_name != '' 
        AND it.it_use = '1'
        AND (
          -- 관리자가 수동으로 심의중으로 설정
          it.it_10 = 'Y'
          OR 
          -- 목표 좋아요 수 달성
          (
            SELECT COUNT(*) 
            FROM g5_shop_interrest 
            WHERE it_id = it.it_id
          ) >= CAST(it.it_4 AS UNSIGNED)
        )
        -- 아직 주문이 없는 상품 (장바구니에 없거나 '쇼핑' 상태)
        AND NOT EXISTS (
          SELECT 1 
          FROM g5_shop_cart ct 
          WHERE ct.it_id = it.it_id 
            AND ct.ct_status NOT IN ('쇼핑', '취소', '반품', '품절')
        )
    `;
    const reviewResult = (await executeQuery(reviewQuery)) as Array<{ count: number }>;
    const review = reviewResult[0]?.count || 0;

    // 5. 결제 - 결제 관련 상태 ('주문', '입금')
    const paymentQuery = `
      SELECT COUNT(DISTINCT it.it_id) as count
      FROM g5_shop_item it
      INNER JOIN g5_shop_cart ct ON it.it_id = ct.it_id
      WHERE it.it_name != '' 
        AND it.it_use = '1'
        AND ct.ct_status IN ('주문', '입금')
    `;
    const paymentResult = (await executeQuery(paymentQuery)) as Array<{ count: number }>;
    const payment = paymentResult[0]?.count || 0;

    // 6. 제작 - 제작 중인 상품 ('준비' 상태)
    const makingQuery = `
      SELECT COUNT(DISTINCT it.it_id) as count
      FROM g5_shop_item it
      INNER JOIN g5_shop_cart ct ON it.it_id = ct.it_id
      WHERE it.it_name != '' 
        AND it.it_use = '1'
        AND ct.ct_status = '준비'
    `;
    const makingResult = (await executeQuery(makingQuery)) as Array<{ count: number }>;
    const making = makingResult[0]?.count || 0;

    return {
      total,
      new: newItems,
      approved,
      review,
      payment,
      making,
    };
  } catch (error) {
    console.error('Design stats error:', error);
    return {
      total: 0,
      new: 0,
      approved: 0,
      review: 0,
      payment: 0,
      making: 0,
    };
  }
};
