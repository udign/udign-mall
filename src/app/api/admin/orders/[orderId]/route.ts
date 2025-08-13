import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

export const GET = async (request: NextRequest, { params }: RouteParams) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !PERMISSION_CHECKS.isAdmin(currentUser.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { orderId } = await params;

    // 주문 정보 조회
    const orderQuery = `
      SELECT 
        o.*,
        m.mb_name, m.mb_email as member_email, m.mb_hp as member_hp
      FROM g5_shop_order o
      LEFT JOIN g5_member m ON o.mb_id = m.mb_id
      WHERE o.od_id = ? OR o.od_tno = ?
      LIMIT 1
    `;

    const orderResult = await executeQuery(orderQuery, [orderId, orderId]) as Array<{
      od_id: string;
      od_tno: string;
      od_time: string;
      od_status: string;
      od_settle_case: string;
      od_test: number;
      od_mobile: number;
      od_pg: string;
      od_name: string;
      od_email: string;
      od_tel: string;
      od_hp: string;
      od_zip: string;
      od_addr1: string;
      od_addr2: string;
      od_addr3: string;
      od_b_name: string;
      od_b_tel: string;
      od_b_hp: string;
      od_b_zip: string;
      od_b_addr1: string;
      od_b_addr2: string;
      od_b_addr3: string;
      od_delivery_company: string;
      od_invoice: string;
      od_invoice_time: string;
      od_memo: string;
      od_shop_memo: string;
      od_cart_price: number;
      od_send_cost: number;
      od_send_cost2: number;
      od_receipt_price: number;
      od_receipt_point: number;
      od_refund_price: number;
      od_cancel_price: number;
      od_coupon: number;
      od_misu: number;
      mb_id: string;
      mb_name: string;
      mb_email: string;
      member_email: string;
      member_hp: string;
    }>;

    if (orderResult.length === 0) {
      return NextResponse.json(
        { success: false, message: '주문을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const order = orderResult[0];
    const actualOrderId = order.od_tno || order.od_id;

    // 주문 상품 조회
    const itemsQuery = `
      SELECT 
        c.it_id, c.it_name, c.ct_option, c.ct_qty, 
        c.ct_price, c.ct_point, c.ct_status, c.io_price,
        c.io_id, c.io_type, c.cp_price,
        i.it_img1, i.it_img2, i.it_img3
      FROM g5_shop_cart c
      LEFT JOIN g5_shop_item i ON c.it_id = i.it_id
      WHERE c.od_id = ?
      ORDER BY c.ct_id
    `;

    const itemsResult = await executeQuery(itemsQuery, [actualOrderId]) as Array<{
      it_id: string;
      it_name: string;
      ct_option: string;
      ct_qty: number;
      ct_price: number;
      ct_point: number;
      ct_status: string;
      io_price: number;
      io_id: string;
      io_type: number;
      cp_price: number;
      it_img1: string;
      it_img2: string;
      it_img3: string;
    }>;

    // 이미지 URL 처리
    const items = itemsResult.map(item => ({
      ...item,
      it_img1: item.it_img1 ? 
        (item.it_img1.startsWith('http') ? item.it_img1 : 
         item.it_img1.startsWith('/') ? item.it_img1 : 
         `/data/item/${item.it_img1}`) : null,
    }));

    const orderDetail = {
      // 주문 정보
      od_id: order.od_id,
      od_tno: order.od_tno,
      od_time: order.od_time,
      od_status: order.od_status,
      od_settle_case: order.od_settle_case,
      od_test: order.od_test,
      od_mobile: order.od_mobile,
      od_pg: order.od_pg,
      
      // 주문자 정보
      od_name: order.od_name,
      od_email: order.od_email,
      od_tel: order.od_tel,
      od_hp: order.od_hp,
      od_zip: order.od_zip,
      od_addr1: order.od_addr1,
      od_addr2: order.od_addr2,
      od_addr3: order.od_addr3,
      
      // 받는분 정보
      od_b_name: order.od_b_name,
      od_b_tel: order.od_b_tel,
      od_b_hp: order.od_b_hp,
      od_b_zip: order.od_b_zip,
      od_b_addr1: order.od_b_addr1,
      od_b_addr2: order.od_b_addr2,
      od_b_addr3: order.od_b_addr3,
      
      // 배송 정보
      od_delivery_company: order.od_delivery_company,
      od_invoice: order.od_invoice,
      od_invoice_time: order.od_invoice_time,
      od_memo: order.od_memo,
      od_shop_memo: order.od_shop_memo,
      
      // 금액 정보
      od_cart_price: order.od_cart_price,
      od_send_cost: order.od_send_cost,
      od_send_cost2: order.od_send_cost2,
      od_receipt_price: order.od_receipt_price,
      od_receipt_point: order.od_receipt_point,
      od_refund_price: order.od_refund_price,
      od_cancel_price: order.od_cancel_price,
      od_coupon: order.od_coupon,
      od_misu: order.od_misu,
      
      // 주문 상품
      items,
    };

    return NextResponse.json({
      success: true,
      data: orderDetail,
    });
  } catch (error) {
    console.error('주문 상세 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '주문 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};