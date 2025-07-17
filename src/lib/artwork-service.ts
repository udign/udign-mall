import { executeQuery } from '@/lib/database';
import { ArtworkStatus, ProductsByStatus, StatusCounts } from '@/types/artwork';
import { STATUS_GROUPS, STATUS_MAPPING } from '@/lib/constants';
import { getImageUrl } from '@/lib/utils';

export const getArtworksByUser = async (
  userId: string,
  isAdmin: boolean = false,
  page: number = 1,
  limit: number = 10,
  tab: string = 'all',
): Promise<{
  products: ProductsByStatus;
  counts: StatusCounts;
  hasMore: boolean;
}> => {
  try {
    // 기본 쿼리 설정
    let sqlCommon = '';
    let sqlSearch = '';
    let sqlSelect = '';
    let sqlOrder = '';

    if (isAdmin) {
      // 관리자는 전체 아이템 보기
      sqlCommon = `
        FROM g5_shop_item it
        LEFT JOIN g5_shop_interrest ir ON it.it_id = ir.it_id AND ir.mb_id = ?
        LEFT JOIN (
          SELECT ct.it_id, ct.ct_status, ct.ct_id, ct.od_id
          FROM g5_shop_cart ct
          INNER JOIN g5_shop_order od ON ct.od_id = od.od_tno
          WHERE ct.mb_id = ?
          AND CONCAT(od.od_time, '-', LPAD(ct.ct_id, 10, '0')) = (
            SELECT MAX(CONCAT(od2.od_time, '-', LPAD(ct2.ct_id, 10, '0')))
            FROM g5_shop_cart ct2
            INNER JOIN g5_shop_order od2 ON ct2.od_id = od2.od_tno
            WHERE ct2.it_id = ct.it_id AND ct2.mb_id = ?
          )
        ) cart ON it.it_id = cart.it_id
        LEFT JOIN (
          SELECT r.od_id, r.return_status, r.admin_memo, r.return_type, r.return_id, r.updated_at
          FROM g5_shop_return r
          WHERE r.mb_id = ?
        ) ret ON cart.od_id = ret.od_id
        LEFT JOIN (
          SELECT od.od_id, od.od_tno, od.od_status, od.od_settle_case, od.od_invoice, od.od_delivery_company
          FROM g5_shop_order od
          WHERE od.mb_id = ?
        ) ord ON cart.od_id = ord.od_tno
      `;

      sqlSearch = `
        WHERE it.it_name != ''
        AND it.it_use = '1'
      `;

      sqlOrder = 'ORDER BY it.it_time DESC';
    } else {
      // 일반 회원은 자신이 좋아요한 아이템만 보기
      sqlCommon = `
        FROM g5_shop_interrest ir
        LEFT JOIN g5_shop_item it ON ir.it_id = it.it_id
        LEFT JOIN (
          SELECT ct.it_id, ct.ct_status, ct.ct_id, ct.od_id
          FROM g5_shop_cart ct
          INNER JOIN g5_shop_order od ON ct.od_id = od.od_tno
          WHERE ct.mb_id = ?
          AND CONCAT(od.od_time, '-', LPAD(ct.ct_id, 10, '0')) = (
            SELECT MAX(CONCAT(od2.od_time, '-', LPAD(ct2.ct_id, 10, '0')))
            FROM g5_shop_cart ct2
            INNER JOIN g5_shop_order od2 ON ct2.od_id = od2.od_tno
            WHERE ct2.it_id = ct.it_id AND ct2.mb_id = ?
          )
        ) cart ON ir.it_id = cart.it_id
        LEFT JOIN (
          SELECT r.od_id, r.return_status, r.admin_memo, r.return_type, r.return_id, r.updated_at
          FROM g5_shop_return r
          WHERE r.mb_id = ?
        ) ret ON cart.od_id = ret.od_id
        LEFT JOIN (
          SELECT od.od_id, od.od_tno, od.od_status, od.od_settle_case, od.od_invoice, od.od_delivery_company
          FROM g5_shop_order od
          WHERE od.mb_id = ?
        ) ord ON cart.od_id = ord.od_tno
      `;

      sqlSearch = `
        WHERE ir.mb_id = ?
        AND it.it_name != ''
        AND it.it_use = '1'
      `;

      sqlOrder = 'ORDER BY ir.ir_time DESC';
    }

    sqlSelect = `
      SELECT it.it_name, it.it_1, it.it_2, it.it_3, it.it_4, it.it_img1, it.it_10,
             it.it_8, it.it_9, it.it_id,
             ir.ir_id, ir.mb_id as ir_mb_id, ir.ir_time,
             cart.ct_status, cart.od_id, 
             ret.return_status, ret.admin_memo, ret.return_type, ret.return_id, ret.updated_at as return_updated,
             ord.od_settle_case, ord.od_status, ord.od_invoice, ord.od_delivery_company
    `;

    // 전체 데이터 쿼리 실행 (상태 결정을 위해)
    const allQuery = `${sqlSelect} ${sqlCommon} ${sqlSearch} ${sqlOrder}`;
    const params = isAdmin
      ? [userId, userId, userId, userId, userId]
      : [userId, userId, userId, userId, userId];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allResults = (await executeQuery(allQuery, params)) as any[];

    // 상태별 데이터 분류
    const allProductsByStatus: ProductsByStatus = {
      all: [],
      collection: [],
      review: [],
      payment: [],
      paymentCompleted: [],
      making: [],
      shipping: [],
      completed: [],
      cancelled: [],
    };

    for (const row of allResults) {
      // 좋아요 수 계산
      const countQuery = `SELECT COUNT(*) as cnt FROM g5_shop_interrest WHERE it_id = ?`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const countResult = (await executeQuery(countQuery, [row.it_id])) as any[];
      const iCount = countResult[0]?.cnt || 0;
      const goalAttainment = iCount >= row.it_4;

      // 사용자의 좋아요 순번 조회 (해당 사용자가 좋아요를 눌렀을 때만)
      let orderNumber: number | undefined;
      if (row.ir_id) {
        const orderQuery = `
          SELECT COUNT(*) as order_number 
          FROM g5_shop_interrest 
          WHERE it_id = ? AND ir_time <= ?
        `;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderResult = (await executeQuery(orderQuery, [row.it_id, row.ir_time])) as any[];
        orderNumber = orderResult[0]?.order_number || 1;
      }

      // 상태 결정 로직
      const statusInfo = determineStatus(row, goalAttainment);

      const artworkStatus: ArtworkStatus = {
        ...row,
        it_img1: getImageUrl(row.it_img1) || '',
        orderNumber: orderNumber,
        _goalAttainment: goalAttainment,
        _status_text: statusInfo.statusText,
        _status_key: statusInfo.statusKey,
        _iCount: iCount,
      };

      // 상태별 그룹화
      allProductsByStatus[statusInfo.statusKey].push(artworkStatus);
      allProductsByStatus.all.push(artworkStatus);
    }

    // 상태별 카운트 계산
    const counts: StatusCounts = {};
    Object.keys(STATUS_GROUPS).forEach((key) => {
      counts[key] = allProductsByStatus[key].length;
    });

    // 탭별 페이지네이션 적용
    const targetProducts = allProductsByStatus[tab] || [];
    const offset = (page - 1) * limit;
    const paginatedProducts = targetProducts.slice(offset, offset + limit);
    const hasMore = targetProducts.length > offset + limit;

    // 페이지네이션된 결과를 ProductsByStatus 형태로 변환
    const products: ProductsByStatus = {
      all: [],
      collection: [],
      review: [],
      payment: [],
      paymentCompleted: [],
      making: [],
      shipping: [],
      completed: [],
      cancelled: [],
    };

    // 해당 탭에만 페이지네이션된 데이터 할당
    products[tab] = paginatedProducts;

    return { products, counts, hasMore };
  } catch (error) {
    console.error('Error fetching artworks:', error);
    throw error;
  }
};

const determineStatus = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
  goalAttainment: boolean,
): { statusKey: string; statusText: string } => {
  let statusKey = 'collection';
  let statusText = '컬렉션';

  // 관리자가 설정한 심의 기간 체크
  const reviewDays = row.it_8 || 0;
  const manualReview = row.it_9 === 'Y';

  // 좋아요한 시간으로부터 경과일 계산
  const currentTimestamp = new Date().getTime();
  const interestTimestamp = new Date(row.ir_time).getTime();
  const daysPassed = Math.floor((currentTimestamp - interestTimestamp) / (1000 * 60 * 60 * 24));

  // 1. 장바구니 상태가 있는 경우 (주문 진행 중) - 최우선 처리
  if (row.ct_status) {
    const mappedStatus =
      STATUS_MAPPING[row.ct_status as keyof typeof STATUS_MAPPING] || row.ct_status;
    statusText = mappedStatus;

    // 원본 상태값으로 직접 매핑
    switch (row.ct_status) {
      case '완료':
        statusKey = 'completed';
        statusText = '수령 완료';
        break;
      case '준비':
        statusKey = 'making';
        statusText = '상품 제작';
        break;
      case '배송':
        statusKey = 'shipping';
        statusText = '배송 진행';
        break;
      case '주문':
        statusKey = 'payment';
        statusText = '결제대기';
        break;
      case '입금':
        statusKey = 'paymentCompleted';
        statusText = '결제완료';
        break;
      case '구매확정':
        statusKey = 'completed';
        statusText = '구매확정';
        break;
      case '취소':
        statusKey = 'cancelled';
        statusText = '주문취소';
        break;
      case '반품':
        statusKey = 'cancelled';
        statusText = '반품';
        break;
      case '품절':
        statusKey = 'cancelled';
        statusText = '품절';
        break;
      case '쇼핑':
        if (goalAttainment) {
          if (manualReview && reviewDays > 0 && daysPassed >= reviewDays) {
            statusKey = 'review';
            statusText = '심의중';
          } else {
            statusKey = 'review';
            statusText = '심의중';
          }
        } else {
          statusKey = 'collection';
          statusText = '컬렉션';
        }
        break;
      default:
        statusKey = 'review';
        break;
    }
  }
  // 2. 관리자 토글 처리
  else if (row.it_10 === 'Y') {
    statusKey = 'review';
    statusText = '심의중';
  } else if (row.it_10 === 'N') {
    statusKey = 'payment';
    statusText = '구매 진행';
  }
  // 3. 목표를 달성하지 않은 경우
  else if (!goalAttainment) {
    statusKey = 'collection';
    statusText = '컬렉션';
  }
  // 4. 목표를 달성한 경우
  else if (goalAttainment) {
    if (manualReview && reviewDays > 0 && daysPassed >= reviewDays) {
      statusKey = 'review';
      statusText = '심의중';
    } else {
      statusKey = 'review';
      statusText = '심의중';
    }
  }

  // 취소/반품/품절 상태 체크
  if (['주문취소', '반품', '품절'].includes(statusText) || row.return_status === 'cancelled') {
    statusKey = 'cancelled';
    statusText = row.return_status === 'cancelled' ? '반품취소' : statusText;
  }

  return { statusKey, statusText };
};

export const toggleInterest = async (
  userId: string,
  itemId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    // 현재 관심 상태 확인
    const checkQuery = `SELECT ir_id FROM g5_shop_interrest WHERE mb_id = ? AND it_id = ?`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (await executeQuery(checkQuery, [userId, itemId])) as any[];

    if (existing.length > 0) {
      // 관심 삭제
      const deleteQuery = `DELETE FROM g5_shop_interrest WHERE mb_id = ? AND it_id = ?`;
      await executeQuery(deleteQuery, [userId, itemId]);
      return { success: true, message: '관심 상품에서 제거되었습니다.' };
    } else {
      // 관심 추가
      const insertQuery = `INSERT INTO g5_shop_interrest (mb_id, it_id, ir_time) VALUES (?, ?, NOW())`;
      await executeQuery(insertQuery, [userId, itemId]);
      return { success: true, message: '관심 상품에 추가되었습니다.' };
    }
  } catch (error) {
    console.error('Error toggling interest:', error);
    return { success: false, message: '처리 중 오류가 발생했습니다.' };
  }
};

export const cancelOrder = async (
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cancelMemo: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    // orderId가 숫자형 od_id라고 가정하고 직접 사용
    const numericOrderId = parseInt(orderId, 10);

    if (isNaN(numericOrderId)) {
      return { success: false, message: '유효하지 않은 주문 ID입니다.' };
    }

    // 주문 상태 업데이트 (숫자형 od_id 사용)
    const updateQuery = `UPDATE g5_shop_order SET od_status = '취소' WHERE od_id = ?`;
    await executeQuery(updateQuery, [numericOrderId]);

    // 장바구니 상태 업데이트 (숫자형 od_id 사용)
    const updateCartQuery = `UPDATE g5_shop_cart SET ct_status = '취소' WHERE od_id = ?`;
    await executeQuery(updateCartQuery, [numericOrderId]);

    return { success: true, message: '주문이 취소되었습니다.' };
  } catch (error) {
    console.error('Error canceling order:', error);
    return { success: false, message: '주문 취소 중 오류가 발생했습니다.' };
  }
};

export const confirmPurchase = async (
  orderId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    // orderId가 숫자형 od_id라고 가정하고 직접 사용
    const numericOrderId = parseInt(orderId, 10);

    if (isNaN(numericOrderId)) {
      return { success: false, message: '유효하지 않은 주문 ID입니다.' };
    }

    // 주문 상태 업데이트 (숫자형 od_id 사용)
    const updateQuery = `UPDATE g5_shop_order SET od_status = '구매확정' WHERE od_id = ?`;
    await executeQuery(updateQuery, [numericOrderId]);

    // 장바구니 상태 업데이트 (숫자형 od_id 사용)
    const updateCartQuery = `UPDATE g5_shop_cart SET ct_status = '구매확정' WHERE od_id = ?`;
    await executeQuery(updateCartQuery, [numericOrderId]);

    return { success: true, message: '구매가 확정되었습니다.' };
  } catch (error) {
    console.error('Error confirming purchase:', error);
    return { success: false, message: '구매 확정 중 오류가 발생했습니다.' };
  }
};

export const submitReturn = async (data: {
  orderId: string;
  name: string;
  phone: string;
  returnType: 'exchange' | 'return';
  reason: string;
  userId: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const insertQuery = `
      INSERT INTO g5_shop_return (od_id, mb_id, return_type, return_status, customer_name, customer_phone, reason, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?, ?, NOW(), NOW())
    `;

    await executeQuery(insertQuery, [
      data.orderId,
      data.userId,
      data.returnType,
      data.name,
      data.phone,
      data.reason,
    ]);

    return { success: true, message: '교환/반품 신청이 완료되었습니다.' };
  } catch (error) {
    console.error('Error submitting return:', error);
    return { success: false, message: '교환/반품 신청 중 오류가 발생했습니다.' };
  }
};
