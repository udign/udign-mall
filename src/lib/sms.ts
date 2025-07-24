import { executeQuery } from '@/lib/database';
import { SMSConfig, SMSMessage, SMS_DEFAULT_TEMPLATES } from '@/types/sms';
import { RowDataPacket } from 'mysql2';
import { Socket } from 'net';
import iconv from 'iconv-lite';

// 한글을 EUC-KR로 인코딩하는 함수 (PHP의 iconv_euckr와 동일)
const encodeToEucKr = (text: string): Buffer => {
  return iconv.encode(text, 'euc-kr');
};

// SMS 설정 가져오기
export const getSMSConfig = async (): Promise<SMSConfig | null> => {
  try {
    // g5_config 테이블에서 SMS 설정 조회
    const configRows = (await executeQuery(`
      SELECT *
      FROM g5_config
      LIMIT 1
    `)) as RowDataPacket[];

    if (configRows.length === 0) {
      return null;
    }

    const configData = configRows[0];

    // sms5_config 테이블에서 추가 설정 조회
    let smsConfigData: Record<string, string> = {};
    try {
      const smsRows = (await executeQuery(`
        SELECT cf_phone
        FROM sms5_config
        LIMIT 1
      `)) as RowDataPacket[];
      smsConfigData = smsRows[0] || {};
    } catch (error) {
      console.error('sms5_config 테이블 조회 중 오류:', error);
    }

    return {
      cf_sms_use: configData.cf_sms_use || '',
      cf_sms_type: configData.cf_sms_type || 'SMS',
      cf_icode_server_ip: configData.cf_icode_server_ip || '211.172.232.124',
      cf_icode_server_port: configData.cf_icode_server_port || '7295',
      cf_icode_id: configData.cf_icode_id || '',
      cf_icode_pw: configData.cf_icode_pw || '',
      cf_icode_token_key: configData.cf_icode_token_key || '',
      cf_phone: smsConfigData.cf_phone || configData.cf_phone || '',
    };
  } catch (error) {
    console.error('SMS 설정 조회 실패:', error);
    return null;
  }
};

// SMS 발송 가능 여부 확인
export const canSendSMS = async (): Promise<boolean> => {
  const config = await getSMSConfig();

  if (!config || config.cf_sms_use !== 'icode') {
    return false;
  }

  // 토큰키 방식인 경우 잔액 확인 없이 발송 가능
  if (config.cf_icode_token_key) {
    return true;
  }

  // ID/PW 방식인 경우 아이코드 사용자 정보 확인
  if (config.cf_icode_id && config.cf_icode_pw) {
    try {
      // 아이코드 API 호출하여 사용자 정보 조회
      const icodeApiUrl = `http://www.icodekorea.com/res/userinfo.php?userid=${encodeURIComponent(config.cf_icode_id.trim())}&userpw=${encodeURIComponent(config.cf_icode_pw.trim())}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(icodeApiUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const responseText = await response.text();
        const res = responseText.split(';');

        const userInfo = {
          code: res[0] || '',
          coin: parseInt(res[1]) || 0,
          payment: res[3] === 'A' || res[3] === 'C' ? res[3] : '',
        };

        // 아이코드 API 결과 코드 확인
        if (userInfo.code !== '0') {
          console.warn('아이코드 API 오류 코드:', userInfo.code);
          return false;
        }

        // 정액제인 경우 잔액과 관계없이 발송 가능
        if (userInfo.payment === 'C') {
          return true;
        }

        // 충전제인 경우 최소 잔액 확인 (기본값: 100원)
        if (userInfo.payment === 'A') {
          const minimumCoin = 100; // G5_ICODE_COIN과 동일한 값
          const hasSufficientBalance = userInfo.coin >= minimumCoin;

          if (!hasSufficientBalance) {
            console.warn(
              `❌ SMS 발송 불가: 잔액 부족 (현재: ${userInfo.coin}원, 필요: ${minimumCoin}원)`,
            );
          }

          return hasSufficientBalance;
        }

        return false;
      } else {
        console.error('아이코드 API 호출 실패:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('아이코드 사용자 정보 조회 오류:', error);
      return false;
    }
  }

  return false;
};

// SMS 사용 설정 확인 (PHP의 de_sms_use2, de_sms_use3과 동일)
export const getSMSSettings = async (): Promise<{
  de_sms_use2: boolean; // 무통장입금 SMS 사용 여부
  de_sms_use3: boolean; // 일반주문 SMS 사용 여부
  de_admin_company_name: string; // 회사명
  de_admin_company_tel: string; // 회사 전화번호
  de_sms_hp: string; // SMS 수신 전화번호
  bank_account?: string; // 무통장입금 계좌번호
} | null> => {
  try {
    // g5_config 테이블에서 기본 설정 조회 (컬럼이 없는 경우를 대비해 안전하게 조회)
    let config: Record<string, string> = {};

    try {
      const configRows = (await executeQuery(`
        SELECT de_sms_use2, de_sms_use3, de_admin_company_name, 
               de_admin_company_tel, de_sms_hp
        FROM g5_config
        LIMIT 1
      `)) as RowDataPacket[];

      if (configRows.length > 0) {
        config = configRows[0] as Record<string, string>;
      }
    } catch (columnError) {
      console.error('SMS 설정 컬럼 조회 중 오류:', columnError);
      // SMS 설정 컬럼이 존재하지 않는 경우 기본값 사용

      // SMS 관련 컬럼이 없는 경우 기본 설정 사용
      // SMS 기능을 사용하려면 최소한 아이코드 설정이 되어있어야 함
      const smsConfig = await getSMSConfig();
      if (!smsConfig || smsConfig.cf_sms_use !== 'icode') {
        return null;
      }

      // 기본값으로 SMS 사용 활성화
      config = {
        de_sms_use2: '1', // 무통장입금 SMS 기본 활성화
        de_sms_use3: '1', // 일반주문 SMS 기본 활성화
        de_admin_company_name: 'UDIGN',
        de_admin_company_tel: '',
        de_sms_hp: '',
      };
    }

    // g5_shop_default 테이블에서 계좌번호 조회
    let bankAccount = '';
    try {
      const defaultRows = (await executeQuery(`
        SELECT de_bank_account
        FROM g5_shop_default
        LIMIT 1
      `)) as RowDataPacket[];

      if (defaultRows.length > 0) {
        // PHP와 동일하게 첫 번째 계좌를 사용 (줄바꿈으로 구분된 경우)
        const accounts = defaultRows[0].de_bank_account?.split('\n') || [];
        bankAccount = accounts[0]?.trim() || '계좌정보를 설정해주세요';
      }
    } catch (error) {
      console.error('계좌번호 조회 중 오류:', error);
      bankAccount = '계좌정보를 설정해주세요';
    }

    // 기본값 설정 및 타입 변환
    return {
      de_sms_use2: config.de_sms_use2 === '1',
      de_sms_use3: config.de_sms_use3 === '1',
      de_admin_company_name: config.de_admin_company_name || 'UDIGN',
      de_admin_company_tel: config.de_admin_company_tel || '',
      de_sms_hp: config.de_sms_hp || '',
      bank_account: bankAccount,
    };
  } catch (error) {
    console.error('SMS 설정 조회 실패:', error);
    return null;
  }
};

// 전화번호 형식 검증
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

// 전화번호 정리 (하이픈 제거)
export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};

// SMS 메시지 길이 제한 (한글 기준)
export const truncateMessage = (message: string, maxBytes: number = 80): string => {
  let byteLength = 0;
  let truncated = '';

  for (let i = 0; i < message.length; i++) {
    const char = message[i];
    const charCode = char.charCodeAt(0);

    // 한글, 한자 등은 2바이트, 영문/숫자는 1바이트로 계산
    const charBytes = charCode > 127 ? 2 : 1;

    if (byteLength + charBytes > maxBytes) {
      break;
    }

    byteLength += charBytes;
    truncated += char;
  }

  return truncated;
};

// 실제 SMS 발송 함수
export const sendSMS = async (
  recipient: string,
  message: string,
  callback?: string,
): Promise<{ success: boolean; message: string; result?: string }> => {
  try {
    const config = await getSMSConfig();

    if (!config || config.cf_sms_use !== 'icode') {
      return { success: false, message: 'SMS 서비스가 활성화되지 않았습니다.' };
    }

    if (!config.cf_phone) {
      return { success: false, message: '회신번호가 설정되지 않았습니다.' };
    }

    // SMS 발송 가능 여부 확인 (잔액 포함)
    const canSend = await canSendSMS();
    if (!canSend) {
      // 더 구체적인 오류 메시지를 위해 추가 확인
      if (config.cf_icode_id && config.cf_icode_pw && !config.cf_icode_token_key) {
        try {
          const icodeApiUrl = `http://www.icodekorea.com/res/userinfo.php?userid=${encodeURIComponent(config.cf_icode_id.trim())}&userpw=${encodeURIComponent(config.cf_icode_pw.trim())}`;
          const response = await fetch(icodeApiUrl, { method: 'GET' });

          if (response.ok) {
            const responseText = await response.text();
            const res = responseText.split(';');
            const userInfo = {
              code: res[0] || '',
              coin: parseInt(res[1]) || 0,
              payment: res[3] === 'A' || res[3] === 'C' ? res[3] : '',
            };

            if (userInfo.payment === 'A' && userInfo.coin < 100) {
              return {
                success: false,
                message: `SMS 발송 불가: 잔액 부족 (현재 ${userInfo.coin}원, 최소 100원 필요)`,
              };
            }
          }
        } catch (error) {
          console.error('잔액 확인 중 오류:', error);
        }
      }
      return { success: false, message: 'SMS 발송 조건이 충족되지 않습니다.' };
    }

    // 전화번호 검증
    const cleanRecipient = cleanPhoneNumber(recipient);
    if (!validatePhoneNumber(cleanRecipient)) {
      return { success: false, message: '올바르지 않은 전화번호입니다.' };
    }

    const callbackNumber = callback || config.cf_phone;
    const cleanCallback = cleanPhoneNumber(callbackNumber);

    // 메시지 길이 제한
    const truncatedMessage = truncateMessage(message, config.cf_sms_type === 'LMS' ? 2000 : 80);

    // 토큰키 방식 사용
    if (config.cf_icode_token_key) {
      return await sendSMSWithToken(config, cleanRecipient, truncatedMessage, cleanCallback);
    }

    // ID/PW 방식 사용
    if (config.cf_icode_id && config.cf_icode_pw) {
      return await sendSMSWithCredentials(config, cleanRecipient, truncatedMessage, cleanCallback);
    }

    return { success: false, message: 'SMS 인증 정보가 설정되지 않았습니다.' };
  } catch (error) {
    console.error('SMS 발송 오류:', error);
    return { success: false, message: 'SMS 발송 중 오류가 발생했습니다.' };
  }
};

// 아이코드 오류 코드 해석
const parseIcodeErrorCode = (responseData: string): { success: boolean; message: string } => {
  // Error:XX 형식의 오류 코드 추출
  const errorMatch = responseData.match(/Error:(\d+)/);
  if (errorMatch) {
    const errorCode = errorMatch[1];

    switch (errorCode) {
      case '02':
        return { success: false, message: '형식이 잘못되어 전송이 실패하였습니다.' };
      case '23':
        return { success: false, message: '데이터를 다시 확인해 주시기 바랍니다.' };
      case '97':
        return { success: false, message: '잔여코인이 부족합니다.' };
      case '98':
        return { success: false, message: '사용기간이 만료되었습니다.' };
      case '99':
        return { success: false, message: '인증 받지 못하였습니다. 계정을 다시 확인해 주세요.' };
      default:
        return {
          success: false,
          message: `알 수 없는 오류로 전송이 실패하였습니다. (오류코드: ${errorCode})`,
        };
    }
  }

  return { success: false, message: '전송에 실패하였습니다.' };
};

// 토큰키 방식 SMS 발송
const sendSMSWithToken = async (
  config: SMSConfig,
  recipient: string,
  message: string,
  callback: string,
): Promise<{ success: boolean; message: string; result?: string }> => {
  return new Promise((resolve) => {
    try {
      // 토큰키 방식 SMS 발송 시작

      // JSON 패킷 구성
      const packet = {
        key: config.cf_icode_token_key,
        tel: recipient,
        cb: callback,
        msg: message,
        title: config.cf_sms_type === 'LMS' ? message.substring(0, 20) : '',
        date: '',
      };

      const packetData = JSON.stringify(packet);
      const packetLength = packetData.length.toString().padStart(4, '0');
      const fullPacket = `06${packetLength}${packetData}`;

      // 발송 패킷 생성 완료

      // TCP 소켓 연결
      const socket = new Socket();
      let responseData = '';

      socket.setTimeout(10000); // 10초 타임아웃

      socket.connect(9201, '211.172.232.124', () => {
        socket.write(fullPacket);
      });

      socket.on('data', (data) => {
        responseData += data.toString();

        // 응답 분석 (토큰키 방식)
        if (responseData.length >= 20) {
          const dest = recipient.padEnd(12, ' ');
          const expectedResponse = `0225  00${dest}`;
          if (responseData.substring(0, 20) === expectedResponse) {
            const resultCode = responseData.substring(20, 31);
            socket.destroy();
            resolve({
              success: true,
              message: 'SMS가 발송되었습니다.',
              result: `${recipient.trim()}:${resultCode}`,
            });
          } else {
            const errorResult = parseIcodeErrorCode(responseData);
            socket.destroy();
            resolve({
              success: false,
              message: errorResult.message,
              result: `${recipient.trim()}:실패`,
            });
          }
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          success: false,
          message: '아이코드 서버 연결 타임아웃',
          result: `${recipient.trim()}:타임아웃`,
        });
      });

      socket.on('error', () => {
        socket.destroy();
        resolve({
          success: false,
          message: '연결 오류',
          result: `${recipient.trim()}:연결오류`,
        });
      });

      socket.on('close', () => {
        // 연결 종료
      });
    } catch (error) {
      console.error('토큰키 방식 SMS 발송 오류:', error);
      resolve({ success: false, message: '토큰키 방식 SMS 발송에 실패했습니다.' });
    }
  });
};

// ID/PW 방식 SMS 발송
const sendSMSWithCredentials = async (
  config: SMSConfig,
  recipient: string,
  message: string,
  callback: string,
): Promise<{ success: boolean; message: string; result?: string }> => {
  return new Promise((resolve) => {
    try {
      // ID/PW 방식 SMS 발송 시작

      // 패킷 구성 (PHP와 동일한 방식)
      const id = config.cf_icode_id.padEnd(10, ' ');
      const pw = config.cf_icode_pw.padEnd(10, ' ');
      const dest = recipient.padEnd(11, ' ');
      const cb = callback.padEnd(11, ' ');
      const caller = ''.padEnd(10, ' ');
      const rsvTime = ''.padEnd(12, ' ');

      // 메시지를 EUC-KR로 인코딩 후 80바이트로 패딩 (PHP의 iconv_euckr와 동일)
      const encodedMessage = encodeToEucKr(message);
      const msgBytes = Buffer.alloc(80, ' '); // 80바이트 공백으로 초기화
      encodedMessage.copy(msgBytes, 0, 0, Math.min(encodedMessage.length, 80));

      // 패킷 앞부분은 ASCII로 구성
      const packetHeader = `01144 ${id}${pw}${dest}${cb}${caller}${rsvTime}`;
      const headerBuffer = Buffer.from(packetHeader, 'ascii');

      // 전체 패킷 조합
      const packet = Buffer.concat([headerBuffer, msgBytes]);

      // 발송 패킷 생성 완료

      // TCP 소켓 연결
      const socket = new Socket();
      let responseData = '';

      socket.setTimeout(10000); // 10초 타임아웃

      socket.connect(parseInt(config.cf_icode_server_port), config.cf_icode_server_ip, () => {
        socket.write(packet);
      });

      socket.on('data', (data) => {
        responseData += data.toString();

        // 응답 분석
        if (responseData.length >= 19) {
          const expectedResponse = `0223  00${dest}`;
          if (responseData.substring(0, 19) === expectedResponse) {
            const resultCode = responseData.substring(19, 29);
            socket.destroy();
            resolve({
              success: true,
              message: 'SMS가 발송되었습니다.',
              result: `${recipient.trim()}:${resultCode}`,
            });
          } else {
            const errorResult = parseIcodeErrorCode(responseData);
            socket.destroy();
            resolve({
              success: false,
              message: errorResult.message,
              result: `${recipient.trim()}:실패`,
            });
          }
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          success: false,
          message: '아이코드 서버 연결 타임아웃',
          result: `${recipient.trim()}:타임아웃`,
        });
      });

      socket.on('error', () => {
        socket.destroy();
        resolve({
          success: false,
          message: '연결 오류',
          result: `${recipient.trim()}:연결오류`,
        });
      });

      socket.on('close', () => {
        // 연결 종료
      });
    } catch (error) {
      console.error('ID/PW 방식 SMS 발송 오류:', error);
      resolve({ success: false, message: 'ID/PW 방식 SMS 발송에 실패했습니다.' });
    }
  });
};

// 다중 SMS 발송
export const sendMultipleSMS = async (
  messages: SMSMessage[],
): Promise<{ success: boolean; message: string; results: string[] }> => {
  const results: string[] = [];
  let successCount = 0;

  for (const msg of messages) {
    const result = await sendSMS(msg.recv, msg.cont, msg.send);
    if (result.success) {
      successCount++;
      results.push(result.result || `${msg.recv}:성공`);
    } else {
      results.push(`${msg.recv}:실패(${result.message})`);
    }
  }

  return {
    success: successCount > 0,
    message: `${successCount}건 성공, ${messages.length - successCount}건 실패`,
    results,
  };
};

// SMS 템플릿 변수 치환
export const replaceTemplateVariables = (
  template: string,
  variables: Record<string, string>,
): string => {
  let message = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), value);
  }

  return message;
};

// 회원가입 환영 SMS 발송
export const sendWelcomeSMS = async (userData: {
  name: string;
  phone: string;
  companyName?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const template = SMS_DEFAULT_TEMPLATES.MEMBER_JOIN;
    const message = replaceTemplateVariables(template, {
      이름: userData.name,
      회사명: userData.companyName || 'UDIGN',
    });

    return await sendSMS(userData.phone, message);
  } catch (error) {
    console.error('회원가입 SMS 발송 오류:', error);
    return { success: false, message: '회원가입 SMS 발송 중 오류가 발생했습니다.' };
  }
};

// 주문 접수 SMS 발송
export const sendOrderReceivedSMS = async (orderData: {
  name: string;
  phone: string;
  orderId: string;
  totalAmount: number;
  companyName?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const template = SMS_DEFAULT_TEMPLATES.ORDER_RECEIVED;
    const message = replaceTemplateVariables(template, {
      이름: orderData.name,
      주문번호: orderData.orderId,
      주문금액: orderData.totalAmount.toLocaleString(),
      회사명: orderData.companyName || 'UDIGN',
    });

    return await sendSMS(orderData.phone, message);
  } catch (error) {
    console.error('주문접수 SMS 발송 오류:', error);
    return { success: false, message: '주문접수 SMS 발송 중 오류가 발생했습니다.' };
  }
};

// 무통장입금 계좌정보 SMS 발송
export const sendBankTransferInfoSMS = async (orderData: {
  name: string;
  phone: string;
  amount: number;
  bankAccount: string;
  companyName?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const template = SMS_DEFAULT_TEMPLATES.BANK_TRANSFER_INFO;
    const message = replaceTemplateVariables(template, {
      이름: orderData.name,
      입금액: orderData.amount.toLocaleString(),
      계좌번호: orderData.bankAccount,
      회사명: orderData.companyName || 'UDIGN',
    });

    return await sendSMS(orderData.phone, message);
  } catch (error) {
    console.error('무통장입금 SMS 발송 오류:', error);
    return { success: false, message: '무통장입금 SMS 발송 중 오류가 발생했습니다.' };
  }
};

// 상품제작 시작 SMS 발송
export const sendProductionStartSMS = async (orderData: {
  name: string;
  phone: string;
  orderId: string;
  companyName?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const template = SMS_DEFAULT_TEMPLATES.PRODUCTION_START;
    const message = replaceTemplateVariables(template, {
      이름: orderData.name,
      주문번호: orderData.orderId,
      회사명: orderData.companyName || 'UDIGN',
    });

    return await sendSMS(orderData.phone, message);
  } catch (error) {
    console.error('상품제작 시작 SMS 발송 오류:', error);
    return { success: false, message: '상품제작 시작 SMS 발송 중 오류가 발생했습니다.' };
  }
};

// 배송진행 SMS 발송
export const sendShippingProgressSMS = async (orderData: {
  name: string;
  phone: string;
  orderId: string;
  companyName?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const template = SMS_DEFAULT_TEMPLATES.SHIPPING_PROGRESS;
    const message = replaceTemplateVariables(template, {
      이름: orderData.name,
      주문번호: orderData.orderId,
      회사명: orderData.companyName || 'UDIGN',
    });

    return await sendSMS(orderData.phone, message);
  } catch (error) {
    console.error('배송진행 SMS 발송 오류:', error);
    return { success: false, message: '배송진행 SMS 발송 중 오류가 발생했습니다.' };
  }
};
