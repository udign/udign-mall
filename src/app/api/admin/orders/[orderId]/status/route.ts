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

    console.log('주문 상태 변경 요청:', { orderId, status, orderIdType: typeof orderId });

    // 상태 값 검증 - '준비'(상품제작) 또는 '배송'(배송진행)만 허용
    if (!['준비', '배송'].includes(status)) {
      return NextResponse.json(
        { success: false, message: '지원하지 않는 상태값입니다. 준비 또는 배송만 가능합니다.' },
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

    console.log('주문 조회 쿼리 실행:', { query: orderCheckQuery, orderId });

    const orderResult = (await executeQuery(orderCheckQuery, [orderId, orderId])) as {
      od_id: string;
      od_tno: string;
      od_name: string;
      od_hp: string;
      od_status: string;
    }[];

    console.log('주문 조회 결과:', orderResult);

    if (orderResult.length === 0) {
      // 주문이 존재하지 않는 경우 추가 디버깅
      const allOrdersQuery = `SELECT od_id, od_tno FROM g5_shop_order LIMIT 5`;
      const sampleOrders = await executeQuery(allOrdersQuery);
      console.log('샘플 주문 ID들:', sampleOrders);

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
      return NextResponse.json(
        {
          success: false,
          message: `이미 ${status === '준비' ? '상품제작' : '배송진행'} 상태입니다.`,
        },
        { status: 400 },
      );
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
          console.log('SMS 발송 조건이 충족되지 않음:', {
            smsEnabled,
            smsUse3: smsSettings?.de_sms_use3,
            hasPhone: !!order.od_hp,
          });
          return;
        }

        console.log(`주문 상태 변경 SMS 발송 시작 - 주문ID: ${orderId}, 상태: ${status}`);

        let smsResult;
        if (status === '준비') {
          // 상품제작 시작 SMS 발송
          smsResult = await sendProductionStartSMS({
            name: order.od_name,
            phone: order.od_hp,
            orderId: orderId,
            companyName: smsSettings.de_admin_company_name,
          });
        } else if (status === '배송') {
          // 배송진행 SMS 발송
          smsResult = await sendShippingProgressSMS({
            name: order.od_name,
            phone: order.od_hp,
            orderId: orderId,
            companyName: smsSettings.de_admin_company_name,
          });
        }

        if (smsResult?.success) {
          console.log(`✅ 주문 상태 변경 SMS 발송 완료: ${orderId} → ${status}`);
        } else {
          console.error(`❌ 주문 상태 변경 SMS 발송 실패:`, smsResult?.message);
        }
      } catch (smsError) {
        console.error('🚨 주문 상태 변경 SMS 발송 오류:', smsError);
      }
    };

    // SMS 발송은 비동기적으로 처리 (API 응답 속도 향상)
    sendSMSAsync();

    const statusText = status === '준비' ? '상품 제작' : '배송 진행';

    return NextResponse.json({
      success: true,
      message: `주문 상태가 ${statusText}로 변경되었습니다.${order.od_hp ? ' SMS가 발송됩니다.' : ''}`,
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
