import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PERMISSION_CHECKS } from '@/lib/constants';
import { SMSTestRequest, SMSTestResponse, SMSTestResult } from '@/types/sms';
import { sendSMS, canSendSMS, getSMSConfig } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const user = await getCurrentUser();
    if (!user || !PERMISSION_CHECKS.isAdmin(user.mb_level)) {
      return NextResponse.json(
        { success: false, error: '관리자 권한이 필요합니다.' },
        { status: 403 },
      );
    }

    // 요청 데이터 파싱
    const body: SMSTestRequest = await request.json();
    const { message, recipients, replyNumber, scheduled } = body;

    // 입력값 검증
    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: '메시지 내용이 필요합니다.' },
        { status: 400 },
      );
    }

    if (!recipients?.length) {
      return NextResponse.json({ success: false, error: '수신자가 필요합니다.' }, { status: 400 });
    }

    if (!replyNumber?.trim()) {
      return NextResponse.json(
        { success: false, error: '회신번호가 필요합니다.' },
        { status: 400 },
      );
    }

    // 예약 전송인 경우 현재는 지원하지 않음을 알림
    if (scheduled) {
      return NextResponse.json(
        { success: false, error: '예약 전송 기능은 현재 테스트 환경에서 지원하지 않습니다.' },
        { status: 400 },
      );
    }

    // 휴대폰 번호 형식 검증
    const phoneRegex = /^01[016789][0-9]{3,4}[0-9]{4}$/;
    const invalidPhones = recipients.filter(
      (r) => !phoneRegex.test(r.phone.replace(/[^0-9]/g, '')),
    );

    if (invalidPhones.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `올바르지 않은 휴대폰 번호가 있습니다: ${invalidPhones.map((p) => p.phone).join(', ')}`,
        },
        { status: 400 },
      );
    }

    // SMS 설정 확인
    const config = await getSMSConfig();
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'SMS 설정을 불러올 수 없습니다.' },
        { status: 500 },
      );
    }

    // SMS 사용 가능 여부 확인
    if (config.cf_sms_use !== 'icode') {
      return NextResponse.json(
        { success: false, error: 'SMS 기능이 비활성화되어 있습니다.' },
        { status: 400 },
      );
    }

    // 인증 정보 확인
    const hasOldCredentials = config.cf_icode_id && config.cf_icode_pw;
    const hasTokenKey = config.cf_icode_token_key;

    if (!hasOldCredentials && !hasTokenKey) {
      return NextResponse.json(
        { success: false, error: 'SMS 인증 정보가 설정되지 않았습니다.' },
        { status: 400 },
      );
    }

    // SMS 발송 가능 여부 확인 (잔액 등)
    const canSend = await canSendSMS();
    if (!canSend) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMS 발송 조건이 충족되지 않았습니다. 아이코드 계정 상태를 확인해주세요.',
        },
        { status: 400 },
      );
    }

    // 실제 SMS 발송
    const results: SMSTestResult[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const recipient of recipients) {
      try {
        // 개인화 메시지 처리
        const personalizedMessage = message.replace(/{이름}/g, recipient.name);

        // 실제 SMS 발송
        const result = await sendSMS(recipient.phone, personalizedMessage, replyNumber);

        if (result.success) {
          results.push({
            phone: recipient.phone,
            name: recipient.name,
            success: true,
            code: result.result?.split(':')[1] || '성공',
            message: `${recipient.phone}로 전송 완료`,
          });
          totalSent++;
        } else {
          results.push({
            phone: recipient.phone,
            name: recipient.name,
            success: false,
            code: 'Error',
            message: result.message,
          });
          totalFailed++;
        }

        // 각 SMS 발송 간 1초 대기 (서버 부하 방지)
        if (recipients.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`SMS 발송 오류 (${recipient.phone}):`, error);
        results.push({
          phone: recipient.phone,
          name: recipient.name,
          success: false,
          code: 'Error',
          message: '전송 중 오류가 발생했습니다.',
        });
        totalFailed++;
      }
    }

    // 응답 반환
    const response: SMSTestResponse = {
      success: totalSent > 0,
      results,
      totalSent,
      totalFailed,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('SMS 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: 'SMS 발송 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
}
