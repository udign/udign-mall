import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { sendShippingProgressSMS, canSendSMS, getSMSSettings } from '@/lib/sms';

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

// 배송회사 목록 (PHP 시스템과 동일)
const DELIVERY_COMPANIES = [
  'CJ대한통운',
  '한진택배',
  '롯데택배',
  '우체국택배',
  '로젠택배',
  'CU편의점택배',
  'GS편의점택배',
  '경동택배',
  '대신택배',
  '일양로지스',
  '합동택배',
  'DHL',
  'FedEx',
  'UPS',
  '기타',
];

export const PUT = async (request: NextRequest, { params }: RouteParams) => {
  try {
    // 현재 사용자 인증 및 권한 확인
    const currentUser = await getCurrentUser();
    if (!currentUser || !PERMISSION_CHECKS.isAdmin(currentUser.mb_level)) {
      return NextResponse.json(
        { success: false, message: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    const { orderId } = await params;
    const body = await request.json();
    const { deliveryCompany, invoice } = body;

    // 입력값 검증
    if (!deliveryCompany || !invoice) {
      return NextResponse.json(
        {
          success: false,
          message: '배송회사와 송장번호를 모두 입력해주세요.',
        },
        { status: 400 },
      );
    }

    // 송장번호 형식 검증 (숫자와 하이픈만 허용)
    const invoicePattern = /^[0-9-]+$/;
    if (!invoicePattern.test(invoice)) {
      return NextResponse.json(
        {
          success: false,
          message: '송장번호는 숫자와 하이픈(-)만 입력 가능합니다.',
        },
        { status: 400 },
      );
    }

    // 주문 존재 여부 및 현재 상태 확인
    const orderCheckQuery = `
      SELECT DISTINCT o.od_id, o.od_tno, o.od_name, o.od_hp, o.od_status, o.od_invoice
      FROM g5_shop_order o
      WHERE o.od_id = ? OR o.od_tno = ?
    `;

    const orderResult = (await executeQuery(orderCheckQuery, [orderId, orderId])) as {
      od_id: string;
      od_tno: string;
      od_name: string;
      od_hp: string;
      od_status: string;
      od_invoice: string;
    }[];

    if (orderResult.length === 0) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 주문입니다.' },
        { status: 404 },
      );
    }

    const order = orderResult[0];
    const actualOrderId = order.od_tno || order.od_id; // od_tno 우선 사용

    // 현재 상태 확인
    const cartQuery = `
      SELECT ct_status, it_name 
      FROM g5_shop_cart 
      WHERE od_id = ?
      LIMIT 1
    `;

    const cartResult = (await executeQuery(cartQuery, [actualOrderId])) as {
      ct_status: string;
      it_name: string;
    }[];

    const currentStatus = cartResult.length > 0 ? cartResult[0].ct_status : order.od_status;

    // 이미 배송 완료된 주문은 수정 불가
    if (currentStatus === '완료' || currentStatus === '취소' || currentStatus === '반품' || currentStatus === '교환') {
      return NextResponse.json(
        {
          success: false,
          message: `${currentStatus} 상태의 주문은 배송 정보를 수정할 수 없습니다.`,
        },
        { status: 400 },
      );
    }

    // 배송 정보 업데이트
    const updateOrderQuery = `
      UPDATE g5_shop_order 
      SET od_delivery_company = ?, 
          od_invoice = ?, 
          od_invoice_time = NOW(),
          od_status = CASE WHEN od_status != '배송' AND od_status != '완료' THEN '배송' ELSE od_status END
      WHERE od_id = ?
    `;

    await executeQuery(updateOrderQuery, [deliveryCompany, invoice, order.od_id]);

    // 장바구니 상태도 '배송'으로 업데이트 (완료 상태가 아닌 경우만)
    if (currentStatus !== '배송' && currentStatus !== '완료') {
      const updateCartQuery = `
        UPDATE g5_shop_cart 
        SET ct_status = '배송' 
        WHERE od_id = ? AND ct_status NOT IN ('완료', '취소', '반품', '교환')
      `;
      await executeQuery(updateCartQuery, [actualOrderId]);

      // 재고 차감 (아직 차감하지 않은 경우)
      const stockCheckQuery = `
        SELECT ct_id, it_id, ct_qty, io_id, io_type, ct_stock_use
        FROM g5_shop_cart
        WHERE od_id = ?
      `;

      const stockItems = (await executeQuery(stockCheckQuery, [actualOrderId])) as {
        ct_id: number;
        it_id: string;
        ct_qty: number;
        io_id: string;
        io_type: number;
        ct_stock_use: number;
      }[];

      for (const item of stockItems) {
        if (!item.ct_stock_use) {
          // 재고 차감
          if (item.io_id) {
            // 옵션 상품 재고 차감
            await executeQuery(
              `UPDATE g5_shop_item_option 
               SET io_stock_qty = io_stock_qty - ? 
               WHERE it_id = ? AND io_id = ? AND io_type = ?`,
              [item.ct_qty, item.it_id, item.io_id, item.io_type],
            );
          } else {
            // 일반 상품 재고 차감
            await executeQuery(
              `UPDATE g5_shop_item 
               SET it_stock_qty = it_stock_qty - ? 
               WHERE it_id = ?`,
              [item.ct_qty, item.it_id],
            );
          }

          // 재고 사용 플래그 업데이트
          await executeQuery(
            `UPDATE g5_shop_cart SET ct_stock_use = 1 WHERE ct_id = ?`,
            [item.ct_id],
          );
        }
      }

      // SMS 발송 (상태가 변경된 경우에만)
      const sendSMSAsync = async () => {
        try {
          const smsEnabled = await canSendSMS();
          const smsSettings = await getSMSSettings();

          if (!smsEnabled || !smsSettings?.de_sms_use3 || !order.od_hp) {
            return;
          }

          await sendShippingProgressSMS({
            name: order.od_name,
            phone: order.od_hp,
            orderId: orderId,
            companyName: smsSettings.de_admin_company_name,
            deliveryCompany,
            invoice,
          });
        } catch (smsError) {
          console.error('🚨 배송 정보 등록 SMS 발송 오류:', smsError);
        }
      };

      // SMS 발송은 비동기적으로 처리
      sendSMSAsync();
    }

    return NextResponse.json({
      success: true,
      message: `배송 정보가 등록되었습니다.${currentStatus !== '배송' ? ' 주문 상태가 배송으로 변경되었습니다.' : ''}`,
      data: {
        orderId,
        deliveryCompany,
        invoice,
        statusChanged: currentStatus !== '배송',
        newStatus: currentStatus !== '배송' ? '배송' : currentStatus,
      },
    });
  } catch (error) {
    console.error('배송 정보 등록 오류:', error);
    return NextResponse.json(
      { success: false, message: '배송 정보 등록 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};

// 배송회사 목록 조회
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

    // 현재 배송 정보 조회
    const query = `
      SELECT od_delivery_company, od_invoice, od_invoice_time, od_status
      FROM g5_shop_order
      WHERE od_id = ? OR od_tno = ?
      LIMIT 1
    `;

    const result = (await executeQuery(query, [orderId, orderId])) as {
      od_delivery_company: string;
      od_invoice: string;
      od_invoice_time: string;
      od_status: string;
    }[];

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, message: '주문을 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        currentDelivery: {
          company: result[0].od_delivery_company || '',
          invoice: result[0].od_invoice || '',
          invoiceTime: result[0].od_invoice_time,
          status: result[0].od_status,
        },
        companies: DELIVERY_COMPANIES,
      },
    });
  } catch (error) {
    console.error('배송 정보 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '배송 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};