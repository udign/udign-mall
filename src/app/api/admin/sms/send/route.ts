import { NextRequest, NextResponse } from 'next/server';
import { sendSMS, sendMultipleSMS, canSendSMS } from '@/lib/sms';
import { SMSSendRequest, SMSSendResponse } from '@/types/sms';

// 단일 SMS 발송
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // 단일 SMS 발송인지 다중 SMS 발송인지 구분
    if (body.messages && Array.isArray(body.messages)) {
      return await handleMultipleSMS(body as SMSSendRequest);
    } else {
      return await handleSingleSMS(body);
    }
  } catch (error) {
    console.error('SMS 발송 API 오류:', error);
    return NextResponse.json(
      { success: false, error: 'SMS 발송 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};

// 단일 SMS 발송 처리
const handleSingleSMS = async (body: { recipient: string; message: string; callback?: string }) => {
  try {
    // 필수 필드 검증
    if (!body.recipient || !body.message) {
      return NextResponse.json(
        { success: false, error: '수신번호와 메시지는 필수입니다.' },
        { status: 400 },
      );
    }

    // SMS 발송 가능 여부 확인
    const canSend = await canSendSMS();
    if (!canSend) {
      return NextResponse.json(
        { success: false, error: 'SMS 서비스가 설정되지 않았거나 비활성화되었습니다.' },
        { status: 400 },
      );
    }

    // SMS 발송
    const result = await sendSMS(body.recipient, body.message, body.callback);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        result: result.result,
      });
    } else {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error('단일 SMS 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: '단일 SMS 발송 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};

// 다중 SMS 발송 처리
const handleMultipleSMS = async (body: SMSSendRequest): Promise<NextResponse> => {
  try {
    // 필수 필드 검증
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: '발송할 메시지가 없습니다.' },
        { status: 400 },
      );
    }

    // 메시지 유효성 검증
    for (let i = 0; i < body.messages.length; i++) {
      const msg = body.messages[i];
      if (!msg.recv || !msg.cont) {
        return NextResponse.json(
          { success: false, error: `${i + 1}번째 메시지에 수신번호 또는 내용이 누락되었습니다.` },
          { status: 400 },
        );
      }
    }

    // SMS 발송 가능 여부 확인
    const canSend = await canSendSMS();
    if (!canSend) {
      return NextResponse.json(
        { success: false, error: 'SMS 서비스가 설정되지 않았거나 비활성화되었습니다.' },
        { status: 400 },
      );
    }

    // 다중 SMS 발송
    const result = await sendMultipleSMS(body.messages);

    const response: SMSSendResponse = {
      success: result.success,
      results: result.results,
      error: result.success ? undefined : result.message,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('다중 SMS 발송 오류:', error);
    return NextResponse.json(
      { success: false, error: '다중 SMS 발송 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};

// SMS 발송 상태 확인 (GET)
export const GET = async () => {
  try {
    const canSend = await canSendSMS();

    return NextResponse.json({
      success: true,
      canSend,
      message: canSend ? 'SMS 발송이 가능합니다.' : 'SMS 서비스가 설정되지 않았습니다.',
    });
  } catch (error) {
    console.error('SMS 상태 확인 오류:', error);
    return NextResponse.json(
      { success: false, error: 'SMS 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
