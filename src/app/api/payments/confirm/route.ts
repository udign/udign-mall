import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { sendOrderCompleteCustomerEmail, sendOrderCompleteAdminEmail } from '@/lib/email';
import {
  OrderCompleteEmailData,
  OrderItem,
  PaymentInfo,
  OrdererInfo,
  DeliveryInfo,
} from '@/lib/email-templates/types';
import { RowDataPacket, Connection, FieldPacket } from 'mysql2/promise';
import { canSendSMS, getSMSSettings, sendOrderReceivedSMS } from '@/lib/sms';

const SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await request.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 },
      );
    }

    // 환경변수 확인
    if (!SECRET_KEY) {
      console.error('TOSS_PAYMENTS_SECRET_KEY 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { success: false, error: '결제 시스템 설정이 올바르지 않습니다.' },
        { status: 500 },
      );
    }

    // 토스페이먼츠 결제 승인 요청
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });

    const paymentData = await response.json();

    if (!response.ok) {
      console.error('토스페이먼츠 승인 실패:', paymentData);
      return NextResponse.json(
        { success: false, error: '결제 승인에 실패했습니다.' },
        { status: 400 },
      );
    }

    // 데이터베이스에서 주문 상태 업데이트
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      // 주문 테이블 업데이트
      await connection.execute(
        'UPDATE g5_shop_order SET od_status = ?, od_settle_case = ?, od_receipt_time = NOW() WHERE od_tno = ?',
        ['입금', paymentData.method, orderId],
      );

      // 장바구니 상태 업데이트 (주문 ID로 매칭)
      await connection.execute('UPDATE g5_shop_cart SET ct_status = ? WHERE od_id = ?', [
        '입금',
        orderId,
      ]);

      await connection.commit();

      // 결제 완료 후 메일 및 SMS 발송을 위한 주문 정보 조회 (새로운 연결 사용)
      try {
        const emailConnection = await getConnection();
        try {
          const orderEmailData = await getOrderDataForEmail(emailConnection, orderId);
          if (orderEmailData) {
            // 주문자에게 메일 발송 (주문자 이메일 사용)
            const [orderRows] = (await emailConnection.execute(
              'SELECT od_email, od_name, od_hp FROM g5_shop_order WHERE od_tno = ?',
              [orderId],
            )) as [RowDataPacket[], FieldPacket[]];

            if (orderRows && orderRows.length > 0) {
              const customerEmail = orderRows[0].od_email;
              const customerName = orderRows[0].od_name;
              const customerPhone = orderRows[0].od_hp;

              // 메일 발송
              await sendOrderCompleteCustomerEmail(orderEmailData, customerEmail);
              await sendOrderCompleteAdminEmail(orderEmailData);

              console.log('주문 완료 메일 발송 완료:', orderId);

              // SMS 발송 (결제 완료 후)
              try {
                const smsEnabled = await canSendSMS();
                const smsSettings = await getSMSSettings();

                if (smsEnabled && smsSettings && customerPhone) {
                  console.log('결제 완료 SMS 발송 시작:', {
                    orderId,
                    customerName,
                    customerPhone,
                    paymentMethod: paymentData.method,
                  });

                  // 결제 완료 SMS 발송
                  if (smsSettings.de_sms_use3) {
                    const orderSmsResult = await sendOrderReceivedSMS({
                      name: customerName,
                      phone: customerPhone,
                      orderId: orderId,
                      totalAmount: paymentData.totalAmount,
                      companyName: smsSettings.de_admin_company_name,
                    });

                    console.log('결제 완료 SMS 발송 결과:', orderSmsResult);
                  }
                } else {
                  console.log('SMS 발송 조건이 충족되지 않았습니다 (결제 완료):', {
                    smsEnabled,
                    hasSettings: !!smsSettings,
                    hasPhone: !!customerPhone,
                  });
                }
              } catch (smsError) {
                // SMS 발송 실패는 로그만 남기고 결제는 정상 처리
                console.error('결제 완료 SMS 발송 실패:', smsError);
              }
            }
          }
        } finally {
          await emailConnection.end();
        }
      } catch (emailError) {
        // 메일 발송 실패는 로그만 남기고 결제는 정상 처리
        console.error('주문 완료 메일 발송 실패:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: '결제가 완료되었습니다.',
        paymentData: {
          orderId: paymentData.orderId,
          paymentKey: paymentData.paymentKey,
          amount: paymentData.totalAmount,
          method: paymentData.method,
          approvedAt: paymentData.approvedAt,
        },
      });
    } catch (error) {
      await connection.rollback();
      console.error('주문 상태 업데이트 실패:', error);
      return NextResponse.json(
        { success: false, error: '주문 상태 업데이트에 실패했습니다.' },
        { status: 500 },
      );
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('결제 승인 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}

// 메일 발송을 위한 주문 데이터 조회 함수
async function getOrderDataForEmail(
  connection: Connection,
  orderId: string,
): Promise<OrderCompleteEmailData | null> {
  try {
    // 주문 정보 조회
    const [orderRows] = (await connection.execute(
      `
      SELECT 
        o.od_id, o.od_name, o.od_email, o.od_tel, o.od_hp,
        o.od_zip1, o.od_addr1, o.od_addr2, o.od_addr3,
        o.od_b_name, o.od_b_tel, o.od_b_hp, 
        o.od_b_zip1, o.od_b_addr1, o.od_b_addr2, o.od_b_addr3,
        o.od_memo, o.od_cart_price, o.od_send_cost, o.od_send_cost2,
        o.od_receipt_price, o.od_receipt_point, o.od_settle_case,
        o.od_bank_account, o.od_deposit_name, o.od_time, o.od_hope_date
      FROM g5_shop_order o 
      WHERE o.od_tno = ?
    `,
      [orderId],
    )) as [RowDataPacket[], FieldPacket[]];

    if (!orderRows || orderRows.length === 0) {
      console.error('주문 정보를 찾을 수 없습니다:', orderId);
      return null;
    }

    const order = orderRows[0];

    // 주문 상품 정보 조회
    const [cartRows] = (await connection.execute(
      `
      SELECT 
        c.it_id, c.it_name, c.ct_price, c.ct_qty,
        c.ct_option, i.it_img1
      FROM g5_shop_cart c
      LEFT JOIN g5_shop_item i ON c.it_id = i.it_id
      WHERE c.od_id = ?
      ORDER BY c.ct_id
    `,
      [orderId],
    )) as [RowDataPacket[], FieldPacket[]];

    // 주문 상품 데이터 변환
    const orderItems: OrderItem[] = cartRows.map((item: RowDataPacket) => ({
      it_id: item.it_id,
      it_name: item.it_name,
      it_price: parseInt(item.ct_price),
      it_option: item.ct_option || '',
      quantity: parseInt(item.ct_qty),
      subtotal_price: parseInt(item.ct_price) * parseInt(item.ct_qty),
      subtotal_point: 0, // 포인트 계산 로직이 필요하면 추가
      product_url:
        process.env.NODE_ENV === 'production'
          ? `https://udign.vercel.app/shop/product/${item.it_id}`
          : `http://localhost:3000/shop/product/${item.it_id}`,
      image_url: item.it_img1 || '',
    }));

    // 결제 정보
    const paymentInfo: PaymentInfo = {
      settle_case: order.od_settle_case || '',
      receipt_price: parseInt(order.od_receipt_price) || 0,
      receipt_point: parseInt(order.od_receipt_point) || 0,
      bank_account: order.od_bank_account || '',
      deposit_name: order.od_deposit_name || '',
    };

    // 주문자 정보
    const ordererInfo: OrdererInfo = {
      name: order.od_name,
      tel: order.od_tel || '',
      hp: order.od_hp || '',
      zipcode: order.od_zip1 || '',
      address1: order.od_addr1 || '',
      address2: order.od_addr2 || '',
      address3: order.od_addr3 || '',
      hope_date: order.od_hope_date || '',
    };

    // 배송지 정보
    const deliveryInfo: DeliveryInfo = {
      name: order.od_b_name || order.od_name,
      tel: order.od_b_tel || order.od_tel || '',
      hp: order.od_b_hp || order.od_hp || '',
      zipcode: order.od_b_zip1 || order.od_zip1 || '',
      address1: order.od_b_addr1 || order.od_addr1 || '',
      address2: order.od_b_addr2 || order.od_addr2 || '',
      address3: order.od_b_addr3 || order.od_addr3 || '',
      memo: order.od_memo || '',
    };

    // 총합 계산
    const totalPrice =
      parseInt(order.od_cart_price) +
      parseInt(order.od_send_cost || 0) +
      parseInt(order.od_send_cost2 || 0);
    const totalPoint = orderItems.reduce((sum, item) => sum + item.subtotal_point, 0);

    const orderEmailData: OrderCompleteEmailData = {
      siteName: 'UDIGN',
      siteUrl:
        process.env.NODE_ENV === 'production'
          ? 'https://udign.vercel.app/shop'
          : 'http://localhost:3000',
      orderId: order.od_id,
      orderDate: new Date(order.od_time).toLocaleString('ko-KR'),
      orderItems,
      sendCost: parseInt(order.od_send_cost) || 0,
      additionalSendCost: parseInt(order.od_send_cost2) || 0,
      totalPrice,
      totalPoint,
      paymentInfo,
      ordererInfo,
      deliveryInfo,
      adminPhone: '1577-4215', // 고객센터 전화번호
    };

    return orderEmailData;
  } catch (error) {
    console.error('주문 데이터 조회 오류:', error);
    return null;
  }
}
