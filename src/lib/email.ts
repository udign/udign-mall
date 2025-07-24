import nodemailer from 'nodemailer';
import { WelcomeEmailTemplate } from './email-templates/WelcomeEmailTemplate';
import { NewMemberNotificationTemplate } from './email-templates/NewMemberNotificationTemplate';
import { OrderCompleteCustomerTemplate } from './email-templates/OrderCompleteCustomerTemplate';
import { OrderCompleteAdminTemplate } from './email-templates/OrderCompleteAdminTemplate';
import {
  PasswordLostTemplate,
  PasswordLostEmailData,
} from './email-templates/PasswordLostTemplate';
import { OrderCompleteEmailData } from './email-templates/types';

// 이메일 설정 인터페이스
interface EmailConfig {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// 공통 사이트 설정
const SITE_NAME = 'UDIGN';
const SITE_URL =
  process.env.NODE_ENV === 'production' ? 'https://udign.vercel.app/shop' : 'http://localhost:3000';

// Gmail SMTP 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * 이메일 발송 함수
 */
export const sendEmail = async ({ to, subject, html, from }: EmailConfig): Promise<boolean> => {
  try {
    // 환경 변수 확인
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Gmail SMTP 설정이 누락되었습니다. .env.local 파일을 확인해주세요.');
      return false;
    }

    const mailOptions = {
      from: from || `UDIGN <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    return false;
  }
};

/**
 * 회원가입 축하 메일 (신규 회원용)
 */
export const sendWelcomeEmail = async (memberData: {
  email: string;
  name: string;
  id: string;
}): Promise<boolean> => {
  const html = WelcomeEmailTemplate({
    memberName: memberData.name,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });

  return await sendEmail({
    to: memberData.email,
    subject: `[${SITE_NAME}] 회원가입을 축하드립니다.`,
    html,
  });
};

/**
 * 신규 회원 가입 알림 메일 (관리자용)
 */
export const sendNewMemberNotification = async (memberData: {
  email: string;
  name: string;
  id: string;
  nick: string;
}): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error('관리자 이메일이 설정되지 않았습니다.');
    return false;
  }

  const html = NewMemberNotificationTemplate({
    memberName: memberData.name,
    memberId: memberData.id,
    memberNick: memberData.nick,
    memberEmail: memberData.email,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });

  return await sendEmail({
    to: adminEmail,
    subject: `[${SITE_NAME}] ${memberData.name} 님께서 회원으로 가입하셨습니다.`,
    html,
  });
};

/**
 * 주문 완료 메일 (주문자용)
 */
export const sendOrderCompleteCustomerEmail = async (
  orderData: OrderCompleteEmailData,
  customerEmail: string,
): Promise<boolean> => {
  const html = OrderCompleteCustomerTemplate({
    ...orderData,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });

  return await sendEmail({
    to: customerEmail,
    subject: `[${SITE_NAME}] 주문이 완료되었습니다 (주문번호: ${orderData.orderId})`,
    html,
  });
};

/**
 * 주문 완료 알림 메일 (관리자용)
 */
export const sendOrderCompleteAdminEmail = async (
  orderData: OrderCompleteEmailData,
): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error('관리자 이메일이 설정되지 않았습니다.');
    return false;
  }

  const html = OrderCompleteAdminTemplate({
    ...orderData,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });

  return await sendEmail({
    to: adminEmail,
    subject: `[${SITE_NAME}] 새 주문이 접수되었습니다 (${orderData.ordererInfo.name})`,
    html,
  });
};

/**
 * 비밀번호 찾기 메일 발송
 */
export const sendPasswordLostEmail = async (
  passwordLostData: PasswordLostEmailData,
): Promise<boolean> => {
  const html = PasswordLostTemplate({
    ...passwordLostData,
    siteName: SITE_NAME,
    siteUrl: SITE_URL,
  });

  return await sendEmail({
    to: passwordLostData.memberEmail,
    subject: `[${SITE_NAME}] 요청하신 회원정보 찾기 안내 메일입니다.`,
    html,
  });
};
