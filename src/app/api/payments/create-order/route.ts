import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PaymentRequest } from '@/types/payment';
import { getConnection } from '@/lib/database';
import {
  canSendSMS,
  getSMSSettings,
  sendOrderReceivedSMS,
  sendBankTransferInfoSMS,
} from '@/lib/sms';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 정보 추출
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { mb_id: string };
      userId = decoded.mb_id;
    } catch {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 },
      );
    }

    const paymentRequest: PaymentRequest = await request.json();

    // 데이터베이스 연결
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      // MySQL strict mode에서 invalid date 처리를 위해 임시로 SQL_MODE 변경
      await connection.execute(
        "SET SESSION sql_mode = 'ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'",
      );

      // 주문 정보 생성 (필수 컬럼만 명시)
      const orderInsertQuery = `
        INSERT INTO g5_shop_order (
          od_id, mb_id, od_name, od_email, od_hp,
          od_zip1, od_addr1, od_addr2,
          od_cart_price, od_receipt_price, od_status,
          od_settle_case, od_tno, od_time, od_ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
      `;

      // od_id는 타임스탬프 기반 숫자 ID를 생성
      const numericOrderId = Date.now();

      const clientIp =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

      await connection.execute(orderInsertQuery, [
        numericOrderId,
        userId,
        paymentRequest.customerInfo.name,
        paymentRequest.customerInfo.email,
        paymentRequest.customerInfo.phone || '',
        paymentRequest.customerInfo.zipCode || '',
        paymentRequest.customerInfo.address || '',
        paymentRequest.customerInfo.detailAddress || '',
        paymentRequest.totalAmount,
        0, // 아직 결제 완료 전이므로 0
        '주문',
        paymentRequest.paymentMethod,
        paymentRequest.orderId, // UUID를 od_tno 필드에 저장
        clientIp,
      ]);

      // 장바구니 항목들을 주문 항목으로 추가
      for (const item of paymentRequest.items) {
        const cartInsertQuery = `
          INSERT INTO g5_shop_cart (
            od_id, mb_id, it_id, it_name, ct_price,
            ct_qty, ct_status, ct_time, ct_ip, ct_select
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `;

        await connection.execute(cartInsertQuery, [
          paymentRequest.orderId,
          userId,
          item.it_id,
          item.it_name,
          item.it_price,
          item.quantity,
          '주문',
          clientIp,
          1, // ct_select = 1 (선택됨)
        ]);
      }

      await connection.commit();

      // 주문 생성 성공 후 SMS 발송
      try {
        // SMS 발송 가능 여부 및 설정 확인
        const smsEnabled = await canSendSMS();
        const smsSettings = await getSMSSettings();

        if (smsEnabled && smsSettings && paymentRequest.customerInfo.phone) {
          // 무통장입금 SMS 발송 (de_sms_use2)
          // 실제 무통장입금(BANK_TRANSFER) 방식일 때만 발송
          const isBankTransfer = paymentRequest.paymentMethod === 'BANK_TRANSFER';

          if (smsSettings.de_sms_use2 && isBankTransfer) {
            // 무통장입금인 경우에만 주문접수 SMS 발송
            if (smsSettings.de_sms_use3) {
              await sendOrderReceivedSMS({
                name: paymentRequest.customerInfo.name,
                phone: paymentRequest.customerInfo.phone,
                orderId: paymentRequest.orderId,
                totalAmount: paymentRequest.totalAmount,
                companyName: smsSettings.de_admin_company_name,
              });
            }

            // 무통장입금 계좌정보 SMS 발송
            await sendBankTransferInfoSMS({
              name: paymentRequest.customerInfo.name,
              phone: paymentRequest.customerInfo.phone,
              amount: paymentRequest.totalAmount,
              bankAccount: smsSettings.bank_account || '계좌정보를 설정해주세요',
              companyName: smsSettings.de_admin_company_name,
            });
          }
        }
      } catch (smsError) {
        // SMS 발송 실패는 로그만 남기고 주문은 정상 처리
        console.error('주문 SMS 발송 실패:', smsError);
      }

      return NextResponse.json({
        success: true,
        orderId: paymentRequest.orderId,
        message: '주문이 생성되었습니다.',
      });
    } catch (error) {
      await connection.rollback();
      console.error('주문 생성 중 오류:', error);
      return NextResponse.json(
        { success: false, error: '주문 생성에 실패했습니다.' },
        { status: 500 },
      );
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
