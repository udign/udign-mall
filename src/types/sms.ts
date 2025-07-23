// SMS 전송 유형
export type SMSType = 'SMS' | 'LMS';

// 요금제 타입
export type PaymentType = 'A' | 'C'; // A: 충전제, C: 정액제

// 아이코드 사용자 정보
export interface IcodeUserInfo {
  code?: string; // 결과코드
  payment: PaymentType | '';
  coin: number;
  gpay?: string; // 고객의 건수 별 차감액 표시
}

// SMS 기본 설정
export interface SMSConfig {
  // SMS 사용 여부
  cf_sms_use: 'icode' | '';

  // SMS 전송 유형
  cf_sms_type: SMSType;

  // 아이코드 서버 정보
  cf_icode_server_ip: string;
  cf_icode_server_port: string;

  // 구버전 설정 (ID/PW 방식)
  cf_icode_id: string;
  cf_icode_pw: string;

  // 신버전 설정 (토큰키 방식)
  cf_icode_token_key: string;

  // 회신번호
  cf_phone: string;
}

// SMS 설정 폼 데이터
export interface SMSConfigFormData {
  cf_sms_type: SMSType;
  cf_icode_id: string;
  cf_icode_pw: string;
  cf_icode_token_key: string;
  cf_phone: string;
}

// SMS 설정 응답
export interface SMSConfigResponse {
  success: boolean;
  data?: SMSConfig;
  userInfo?: IcodeUserInfo;
  error?: string;
}

// SMS 설정 업데이트 요청
export interface SMSConfigUpdateRequest {
  cf_sms_type: SMSType;
  cf_icode_id: string;
  cf_icode_pw: string;
  cf_icode_token_key: string;
  cf_phone: string;
}

// SMS 설정 업데이트 응답
export interface SMSConfigUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// SMS 발송 메시지 정보
export interface SMSMessage {
  recv: string; // 수신번호
  send: string; // 발신번호
  cont: string; // 내용
}

// SMS 발송 요청
export interface SMSSendRequest {
  messages: SMSMessage[];
  type?: SMSType;
}

// SMS 발송 응답
export interface SMSSendResponse {
  success: boolean;
  results?: string[];
  error?: string;
}

// SMS 템플릿 변수
export const SMS_TEMPLATE_VARIABLES = [
  '이름',
  '주문번호',
  '주문금액',
  '회원아이디',
  '회사명',
  '입금액',
  '택배회사',
  '운송장번호',
] as const;

// SMS 기본 템플릿
export const SMS_DEFAULT_TEMPLATES = {
  ORDER_COMPLETE:
    '{이름}님의 주문이 완료되었습니다. 주문번호: {주문번호}, 금액: {주문금액}원 - {회사명}',
  PAYMENT_CONFIRM: '{이름}님의 입금이 확인되었습니다. 입금액: {입금액}원 - {회사명}',
  SHIPPING_START:
    '{이름}님의 상품이 발송되었습니다. 택배회사: {택배회사}, 운송장번호: {운송장번호} - {회사명}',
  MEMBER_JOIN: '{이름}님, {회사명}에 가입해주셔서 감사합니다.',
  BANK_TRANSFER_INFO: '{이름}님의 입금계좌입니다.\n금액:{입금액}원\n계좌:{계좌번호}\n{회사명}',
  ORDER_RECEIVED:
    '{이름}님의 주문이 접수되었습니다. 주문번호: {주문번호}, 금액: {주문금액}원 - {회사명}',
} as const;
