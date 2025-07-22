import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 이메일 유효성 검사 함수
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[0-9a-zA-Z_-]+@[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+$/;
  return emailRegex.test(email.trim());
};

// 메일 발송 함수
const sendTestEmail = async (toEmail: string): Promise<boolean> => {
  try {
    // Gmail SMTP 설정
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'udign0401@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail 앱 비밀번호가 필요합니다
      },
    });

    const currentTime = new Date().toLocaleString('ko-KR');

    const mailOptions = {
      from: '"유다인 관리자" <udign0401@gmail.com>',
      to: toEmail,
      subject: '[메일검사] 제목',
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 14px;">
          <h2 style="color: #333;">[메일검사] 내용</h2>
          <p>이 내용이 제대로 보인다면 보내는 메일 서버에는 이상이 없는것입니다.</p>
          <p><strong>발송 시간:</strong> ${currentTime}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            이 메일 주소로는 회신되지 않습니다.<br>
            이 메일은 유다인 관리자 페이지의 메일 테스트 기능으로 발송되었습니다.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('메일 발송 오류:', error);
    return false;
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: '이메일 주소를 입력해주세요.' },
        { status: 400 },
      );
    }

    // 이메일 주소를 콤마로 분리
    const emailList = email
      .split(',')
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0);

    if (emailList.length === 0) {
      return NextResponse.json(
        { success: false, message: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 },
      );
    }

    // 유효한 이메일 주소만 필터링
    const validEmails = emailList.filter(isValidEmail);

    if (validEmails.length === 0) {
      return NextResponse.json(
        { success: false, message: '유효한 이메일 주소가 없습니다.' },
        { status: 400 },
      );
    }

    // Gmail 앱 비밀번호 확인
    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message: 'Gmail 앱 비밀번호가 설정되지 않았습니다. 관리자에게 문의하세요.',
        },
        { status: 500 },
      );
    }

    // 각 이메일로 테스트 메일 발송
    const sentEmails: string[] = [];
    const failedEmails: string[] = [];

    for (const emailAddr of validEmails) {
      const success = await sendTestEmail(emailAddr);
      if (success) {
        sentEmails.push(emailAddr);
      } else {
        failedEmails.push(emailAddr);
      }
    }

    if (sentEmails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: '모든 메일 발송에 실패했습니다. 메일 서버 설정을 확인해주세요.',
        },
        { status: 500 },
      );
    }

    const message =
      failedEmails.length > 0
        ? `${sentEmails.length}개 주소로 발송 완료, ${failedEmails.length}개 주소 발송 실패`
        : '모든 메일 발송이 완료되었습니다.';

    return NextResponse.json({
      success: true,
      sentEmails,
      failedEmails,
      message,
    });
  } catch (error) {
    console.error('API 처리 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
