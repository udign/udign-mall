import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const GET = async () => {
  try {
    // 전체 상품 수 조회 (사이트 노출 여부 상관없이)
    const allItemsRows = (await executeQuery('SELECT COUNT(*) as total FROM g5_shop_item')) as {
      total: number;
    }[];
    const allItems = allItemsRows[0].total;

    // 사이트 노출 승인된 상품 수 조회
    const approvedItemsRows = (await executeQuery(
      'SELECT COUNT(*) as total FROM g5_shop_item WHERE it_use = "1"',
    )) as { total: number }[];
    const approvedItems = approvedItemsRows[0].total;

    // 사이트 노출 반려된 상품 수 조회
    const rejectedItemsRows = (await executeQuery(
      'SELECT COUNT(*) as total FROM g5_shop_item WHERE it_use = "0"',
    )) as { total: number }[];
    const rejectedItems = rejectedItemsRows[0].total;

    // 기존 호환성을 위한 total (승인된 상품 수)
    const total = approvedItems;

    // 컬렉션: 목표 미달성 상품들
    const collectionRows = (await executeQuery(`
      SELECT COUNT(*) as collection 
      FROM g5_shop_item it
      LEFT JOIN (
        SELECT it_id, COUNT(*) as interest_count 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) interests ON it.it_id = interests.it_id
      WHERE it.it_use = "1" 
      AND COALESCE(interests.interest_count, 0) < CAST(it.it_4 AS UNSIGNED)
      AND (it.it_10 IS NULL OR it.it_10 = '')
    `)) as { collection: number }[];
    const collection = collectionRows[0].collection;

    // 제작 검토: 목표 달성했지만 아직 구매 진행 전 상품들
    const reviewRows = (await executeQuery(`
      SELECT COUNT(*) as review 
      FROM g5_shop_item it
      LEFT JOIN (
        SELECT it_id, COUNT(*) as interest_count 
        FROM g5_shop_interrest 
        GROUP BY it_id
      ) interests ON it.it_id = interests.it_id
      WHERE it.it_use = "1" 
      AND (
        (COALESCE(interests.interest_count, 0) >= CAST(it.it_4 AS UNSIGNED) AND (it.it_10 IS NULL OR it.it_10 = '')) OR
        (it.it_10 = 'Y') OR
        (it.it_10 = 'R')
      )
    `)) as { review: number }[];
    const review = reviewRows[0].review;

    // 구매 진행: it_10이 'N'인 상품들 (심의 종료)
    const paymentRows = (await executeQuery(
      'SELECT COUNT(*) as payment FROM g5_shop_item WHERE it_use = "1" AND it_10 = "N"',
    )) as { payment: number }[];
    const payment = paymentRows[0].payment;

    // 주문 확정: 결제완료 상태 주문들
    const paymentCompletedRows = (await executeQuery(`
      SELECT COUNT(DISTINCT it.it_id) as paymentCompleted
      FROM g5_shop_item it
      INNER JOIN g5_shop_cart ct ON it.it_id = ct.it_id
      INNER JOIN g5_shop_order od ON ct.od_id = od.od_id
      WHERE it.it_use = "1"
      AND ct.ct_status = '입금'
      AND ct.ct_status != '취소'
    `)) as { paymentCompleted: number }[];
    const paymentCompleted = paymentCompletedRows[0].paymentCompleted;

    // 상품 제작: 제작 중인 주문들
    const makingRows = (await executeQuery(`
      SELECT COUNT(DISTINCT it.it_id) as making
      FROM g5_shop_item it
      INNER JOIN g5_shop_cart ct ON it.it_id = ct.it_id
      INNER JOIN g5_shop_order od ON ct.od_id = od.od_id
      WHERE it.it_use = "1"
      AND ct.ct_status = '준비'
      AND ct.ct_status != '취소'
    `)) as { making: number }[];
    const making = makingRows[0].making;

    // 배송 진행: 배송 중인 주문들
    const shippingRows = (await executeQuery(`
      SELECT COUNT(DISTINCT it.it_id) as shipping
      FROM g5_shop_item it
      INNER JOIN g5_shop_cart ct ON it.it_id = ct.it_id
      INNER JOIN g5_shop_order od ON ct.od_id = od.od_id
      WHERE it.it_use = "1"
      AND ct.ct_status = '배송'
      AND ct.ct_status != '취소'
    `)) as { shipping: number }[];
    const shipping = shippingRows[0].shipping;

    // 수령 완료: 완료된 주문들
    const completedRows = (await executeQuery(`
      SELECT COUNT(DISTINCT it.it_id) as completed
      FROM g5_shop_item it
      INNER JOIN g5_shop_cart ct ON it.it_id = ct.it_id
      INNER JOIN g5_shop_order od ON ct.od_id = od.od_id
      WHERE it.it_use = "1"
      AND (ct.ct_status = '완료' OR ct.ct_status = '구매확정')
      AND ct.ct_status != '취소'
    `)) as { completed: number }[];
    const completed = completedRows[0].completed;

    // 취소/반품/품절: 취소된 주문들
    const cancelledRows = (await executeQuery(`
      SELECT COUNT(DISTINCT it.it_id) as cancelled
      FROM g5_shop_item it
      INNER JOIN g5_shop_cart ct ON it.it_id = ct.it_id
      INNER JOIN g5_shop_order od ON ct.od_id = od.od_id
      WHERE it.it_use = "1"
      AND (ct.ct_status = '취소' OR ct.ct_status = '반품' OR ct.ct_status = '품절')
    `)) as { cancelled: number }[];
    const cancelled = cancelledRows[0].cancelled;

    const stats = {
      all: total,
      allItems, // 전체 작품 수
      approvedItems, // 사이트 노출 승인된 작품 수
      rejectedItems, // 사이트 노출 반려된 작품 수
      collection,
      review,
      payment,
      paymentCompleted,
      making,
      shipping,
      completed,
      cancelled,
      // 기존 호환성을 위해 유지
      total,
      pending: review,
      in_review: review,
      approved: payment,
      rejected: 0,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('검수 통계 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
