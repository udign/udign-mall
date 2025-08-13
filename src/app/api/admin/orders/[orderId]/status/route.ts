import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { OrderStatus } from '@/types/order';
import {
  sendProductionStartSMS,
  sendShippingProgressSMS,
  canSendSMS,
  getSMSSettings,
} from '@/lib/sms';

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

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
    const { status }: { status: OrderStatus } = body;

    // 상태 값 검증 - '입금', '준비'(상품제작), '배송'(배송진행) 또는 '완료'
    if (!['입금', '준비', '배송', '완료'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: '지원하지 않는 상태값입니다. 입금, 준비, 배송 또는 완료만 가능합니다.',
        },
        { status: 400 },
      );
    }

    // 주문 존재 여부 확인 및 현재 상태 조회
    // 주문 목록 API와 동일한 방식으로 조회
    const orderCheckQuery = `
      SELECT DISTINCT o.od_id, o.od_tno, o.od_name, o.od_hp, o.od_status
      FROM g5_shop_order o
      WHERE o.od_id = ? OR o.od_tno = ?
    `;

    const orderResult = (await executeQuery(orderCheckQuery, [orderId, orderId])) as {
      od_id: string;
      od_tno: string;
      od_name: string;
      od_hp: string;
      od_status: string;
    }[];

    if (orderResult.length === 0) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 주문입니다.' },
        { status: 404 },
      );
    }

    const order = orderResult[0];
    const actualOrderId = order.od_tno || order.od_id; // od_tno 우선 사용

    // 장바구니 상태 확인 (주문 목록 API와 동일한 방식)
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

    // 현재 상태가 이미 변경하려는 상태와 같은지 확인
    if (currentStatus === status) {
      const statusText =
        status === '입금' ? '결제완료' : 
        status === '준비' ? '상품제작' : 
        status === '배송' ? '배송진행' : '배송완료';
      return NextResponse.json(
        {
          success: false,
          message: `이미 ${statusText} 상태입니다.`,
        },
        { status: 400 },
      );
    }

    // 완료 상태로 변경 시 배송 정보 확인
    if (status === '완료') {
      // 송장번호가 없으면 완료 처리 불가
      const deliveryQuery = `
        SELECT od_invoice, od_delivery_company 
        FROM g5_shop_order 
        WHERE od_id = ?
      `;
      const deliveryResult = (await executeQuery(deliveryQuery, [order.od_id])) as {
        od_invoice: string;
        od_delivery_company: string;
      }[];

      if (deliveryResult.length === 0 || !deliveryResult[0].od_invoice) {
        return NextResponse.json(
          {
            success: false,
            message: '송장번호가 없으면 배송완료 처리할 수 없습니다. 먼저 송장번호를 입력해주세요.',
          },
          { status: 400 },
        );
      }
    }

    // 주문과 장바구니 상태 업데이트
    const updateOrderQuery = 'UPDATE g5_shop_order SET od_status = ? WHERE od_id = ?';
    const updateCartQuery = 'UPDATE g5_shop_cart SET ct_status = ? WHERE od_id = ?';

    await executeQuery(updateOrderQuery, [status, order.od_id]);
    await executeQuery(updateCartQuery, [status, actualOrderId]);

    // SMS 발송 (비동기적으로 처리하여 API 응답 속도 향상)
    const sendSMSAsync = async () => {
      try {
        // SMS 발송 가능 여부 확인
        const smsEnabled = await canSendSMS();
        const smsSettings = await getSMSSettings();

        if (!smsEnabled || !smsSettings?.de_sms_use3 || !order.od_hp) {
          return;
        }

        if (status === '준비') {
          // 상품제작 시작 SMS 발송
          await sendProductionStartSMS({
            name: order.od_name,
            phone: order.od_hp,
            orderId: orderId,
            companyName: smsSettings.de_admin_company_name,
          });
        } else if (status === '배송') {
          // 배송진행 SMS 발송
          await sendShippingProgressSMS({
            name: order.od_name,
            phone: order.od_hp,
            orderId: orderId,
            companyName: smsSettings.de_admin_company_name,
          });
        } else if (status === '완료') {
          // 배송완료 SMS 발송 (필요 시 추가 구현)
          // 현재는 배송완료 SMS는 발송하지 않음
        }
        // '입금' 상태로 변경 시에는 별도 SMS 발송하지 않음

        // SMS 발송 처리 완료
      } catch (smsError) {
        console.error('🚨 주문 상태 변경 SMS 발송 오류:', smsError);
      }
    };

    // SMS 발송은 비동기적으로 처리 (API 응답 속도 향상)
    sendSMSAsync();

    const statusText =
      status === '입금' ? '결제 완료' : 
      status === '준비' ? '상품 제작' : 
      status === '배송' ? '배송 진행' : '배송 완료';

    return NextResponse.json({
      success: true,
      message: `주문 상태가 ${statusText}로 변경되었습니다.${order.od_hp && status !== '입금' && status !== '완료' ? ' SMS가 발송됩니다.' : ''}`,
      data: {
        orderId,
        newStatus: status,
        statusText,
        customerName: order.od_name,
        customerPhone: order.od_hp,
        itemName: cartResult.length > 0 ? cartResult[0].it_name : '상품',
      },
    });
  } catch (error) {
    console.error('주문 상태 변경 오류:', error);
    return NextResponse.json(
      { success: false, message: '주문 상태 변경 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
