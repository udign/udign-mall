import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS, PAGINATION_CONFIG } from '@/lib/constants';
import { getConnection } from '@/lib/database';
import { OrderStatus } from '@/types/order';
import { getImageUrl } from '@/lib/utils';

// 주문 목록 조회용 타입
export interface OrderListItem {
  od_id: string;
  od_time: string;
  od_name: string;
  od_email: string;
  od_tel: string;
  od_hp: string;
  od_b_name: string;
  od_b_tel: string;
  od_b_hp: string;
  od_status: OrderStatus;
  od_settle_case: string;
  od_invoice: string;
  od_delivery_company: string;
  od_invoice_time: string;
  od_cart_price: number;
  od_receipt_price: number;
  od_cancel_price: number;
  od_coupon: number;
  od_cart_coupon: number;
  od_send_coupon: number;
  od_misu: number;
  od_cart_count: number;
  od_mobile: number;
  od_test: number;
  od_escrow: number;
  od_receipt_point: number;
  mb_id: string;
  member_order_count: number;
  items: OrderItemInfo[];
}

export interface OrderItemInfo {
  it_id: string;
  it_name: string;
  it_img1?: string | null;
}

interface DatabaseRow {
  od_id: string;
  od_time: string;
  od_name: string;
  od_email: string;
  od_tel: string;
  od_hp: string;
  od_b_name: string;
  od_b_tel: string;
  od_b_hp: string;
  od_status: OrderStatus;
  od_settle_case: string;
  od_invoice: string;
  od_delivery_company: string;
  od_invoice_time: string;
  od_cart_price: string | number;
  od_receipt_price: string | number;
  od_cancel_price: string | number;
  od_coupon: string | number;
  od_cart_coupon: string | number;
  od_send_coupon: string | number;
  od_misu: string | number;
  od_cart_count: string | number;
  od_mobile: string | number;
  od_test: string | number;
  od_escrow: string | number;
  od_receipt_point: string | number;
  mb_id: string;
  total_coupon: string | number;
}

interface CountResult {
  total: number;
}

interface MemberCountResult {
  count: number;
}

interface TotalResult {
  total_item_count: string | number | null;
  total_order_price: string | number | null;
  total_receipt_price: string | number | null;
  total_cancel_price: string | number | null;
  total_coupon_price: string | number | null;
  total_misu: string | number | null;
}

export const GET = async (request: NextRequest) => {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser();
    if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);

    // 기본 페이지네이션 파라미터만 처리
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || String(PAGINATION_CONFIG.ITEMS_PER_PAGE));

    const connection = await getConnection();

    try {
      // 전체 개수 조회
      const countSql = `SELECT COUNT(*) as total FROM g5_shop_order`;
      const [countResult] = await connection.execute(countSql);
      const totalCount = (countResult as CountResult[])[0].total;

      // 페이징 계산
      const offset = (page - 1) * limit;

      // 주문 목록 조회 (최신순)
      const orderSql = `
        SELECT 
          od_id, od_time, od_name, od_email, od_tel, od_hp,
          od_b_name, od_b_tel, od_b_hp, od_status, od_settle_case,
          od_invoice, od_delivery_company, od_invoice_time,
          od_cart_price, od_receipt_price, od_cancel_price,
          od_coupon, od_cart_coupon, od_send_coupon, od_misu,
          od_cart_count, od_mobile, od_test, od_escrow, od_receipt_point,
          mb_id,
          (od_cart_coupon + od_coupon + od_send_coupon) as total_coupon
        FROM g5_shop_order
        ORDER BY od_time DESC
        LIMIT ${offset}, ${limit}
      `;

      const [orderResult] = await connection.execute(orderSql);
      const orders = orderResult as DatabaseRow[];

      // 각 주문의 상품 정보 조회 및 회원 주문 횟수 조회
      const orderList: OrderListItem[] = [];

      for (const order of orders) {
        // 상품 정보 조회 (모든 주문 상태의 상품들 포함)
        const itemSql = `
          SELECT DISTINCT c.it_id, i.it_name, i.it_img1
          FROM g5_shop_cart c
          LEFT JOIN g5_shop_item i ON c.it_id = i.it_id
          WHERE c.od_id = (SELECT od_tno FROM g5_shop_order WHERE od_id = ?)
            AND c.ct_status IN ('주문', '입금', '준비', '배송', '완료', '구매확정', '취소', '반품', '품절')
          ORDER BY c.it_id ASC
        `;
        const [itemResult] = await connection.execute(itemSql, [order.od_id]);
        const itemsRaw = itemResult as { it_id: string; it_name: string; it_img1: string | null }[];

        // 이미지 URL을 완전한 URL로 변환
        const items: OrderItemInfo[] = itemsRaw.map((item) => ({
          ...item,
          it_img1: getImageUrl(item.it_img1),
        }));

        // 회원 주문 횟수 조회
        let memberOrderCount = 0;
        if (order.mb_id) {
          const memberCountSql = `SELECT COUNT(*) as count FROM g5_shop_order WHERE mb_id = ?`;
          const [memberResult] = await connection.execute(memberCountSql, [order.mb_id]);
          memberOrderCount = (memberResult as MemberCountResult[])[0].count;
        }

        orderList.push({
          ...order,
          od_cart_price: Number(order.od_cart_price) || 0,
          od_receipt_price: Number(order.od_receipt_price) || 0,
          od_cancel_price: Number(order.od_cancel_price) || 0,
          od_coupon: Number(order.od_coupon) || 0,
          od_cart_coupon: Number(order.od_cart_coupon) || 0,
          od_send_coupon: Number(order.od_send_coupon) || 0,
          od_misu: Number(order.od_misu) || 0,
          od_cart_count: Number(order.od_cart_count) || 0,
          od_mobile: Number(order.od_mobile) || 0,
          od_test: Number(order.od_test) || 0,
          od_escrow: Number(order.od_escrow) || 0,
          od_receipt_point: Number(order.od_receipt_point) || 0,
          member_order_count: memberOrderCount,
          items: items,
        });
      }

      // 합계 계산
      const totalSql = `
        SELECT 
          SUM(od_cart_count) as total_item_count,
          SUM(od_cart_price) as total_order_price,
          SUM(od_receipt_price) as total_receipt_price,
          SUM(od_cancel_price) as total_cancel_price,
          SUM(od_cart_coupon + od_coupon + od_send_coupon) as total_coupon_price,
          SUM(od_misu) as total_misu
        FROM g5_shop_order
      `;
      const [totalResult] = await connection.execute(totalSql);
      const totals = (totalResult as TotalResult[])[0];

      return NextResponse.json({
        success: true,
        data: {
          orders: orderList,
          pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
          },
          totals: {
            itemCount: Number(totals.total_item_count) || 0,
            orderPrice: Number(totals.total_order_price) || 0,
            receiptPrice: Number(totals.total_receipt_price) || 0,
            cancelPrice: Number(totals.total_cancel_price) || 0,
            couponPrice: Number(totals.total_coupon_price) || 0,
            misu: Number(totals.total_misu) || 0,
          },
        },
      });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('주문내역 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '주문내역 조회 중 오류가 발생했습니다.',
      },
      { status: 500 },
    );
  }
};
