import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getConnection } from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import { SMSConfig, SMSConfigUpdateRequest, IcodeUserInfo } from '@/types/sms';

// 설정 조회
export const GET = async () => {
  try {
    // 기본 설정값으로 초기화
    let configData: Record<string, string> = {};
    let smsConfigData: Record<string, string> = {};

    try {
      // g5_config 테이블에서 기본 설정 조회
      const configRows = (await executeQuery(`
        SELECT *
        FROM g5_config
        LIMIT 1
      `)) as RowDataPacket[];

      configData = configRows[0] || {};
    } catch (error) {
      console.log('g5_config 테이블 조회 중 오류:', error);
    }

    try {
      // sms5_config 테이블에서 SMS 설정 조회
      const smsRows = (await executeQuery(`
        SELECT cf_phone
        FROM sms5_config
        LIMIT 1
      `)) as RowDataPacket[];

      smsConfigData = smsRows[0] || {};
    } catch (error) {
      console.log('sms5_config 테이블 조회 중 오류:', error);
    }

    // 기본값 설정 (두 테이블의 데이터를 합침)
    const config: SMSConfig = {
      cf_sms_use: (configData.cf_sms_use as 'icode' | '') || '',
      cf_sms_type: (configData.cf_sms_type as 'SMS' | 'LMS') || 'SMS',
      cf_icode_server_ip: configData.cf_icode_server_ip || '211.172.232.124',
      cf_icode_server_port: configData.cf_icode_server_port || '7295',
      cf_icode_id: configData.cf_icode_id || 'sir_',
      cf_icode_pw: configData.cf_icode_pw || '',
      cf_icode_token_key: configData.cf_icode_token_key || '',
      cf_phone: smsConfigData.cf_phone || configData.cf_phone || '',
    };

    // 아이코드 사용자 정보 조회 (실제 API 호출)
    let userInfo: IcodeUserInfo = { payment: '', coin: 0 };

    if (config.cf_sms_use === 'icode' && config.cf_icode_id && config.cf_icode_pw) {
      try {
        // 아이코드 API 호출
        const icodeApiUrl = `http://www.icodekorea.com/res/userinfo.php?userid=${encodeURIComponent(config.cf_icode_id.trim())}&userpw=${encodeURIComponent(config.cf_icode_pw.trim())}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const icodeResponse = await fetch(icodeApiUrl, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (icodeResponse.ok) {
          const responseText = await icodeResponse.text();
          const res = responseText.split(';');

          userInfo = {
            code: res[0] || '', // 결과코드
            coin: parseInt(res[1]) || 0, // 고객 잔액 (충전제만 해당)
            gpay: res[2] || '', // 고객의 건수 별 차감액 표시 (충전제만 해당)
            payment: res[3] === 'A' || res[3] === 'C' ? res[3] : '', // 요금제 표시, A:충전제, C:정액제
          };
        } else {
          console.error('아이코드 API 호출 실패:', icodeResponse.status, icodeResponse.statusText);
        }
      } catch (error) {
        console.error('아이코드 API 호출 중 오류:', error);
        // 에러 발생 시 기본값 유지
      }
    }

    return NextResponse.json({
      success: true,
      data: config,
      userInfo,
    });
  } catch (error) {
    console.error('SMS 설정 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '설정 조회에 실패했습니다.' },
      { status: 500 },
    );
  }
};

// 설정 저장
export const POST = async (request: NextRequest) => {
  try {
    const body: SMSConfigUpdateRequest = await request.json();
    const { cf_sms_type, cf_icode_id, cf_icode_pw, cf_icode_token_key, cf_phone } = body;

    // 입력값 검증
    if (!cf_phone) {
      return NextResponse.json(
        { success: false, error: '회신번호는 필수 입력 항목입니다.' },
        { status: 400 },
      );
    }

    // 휴대폰 번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(cf_phone.replace(/[^0-9]/g, ''))) {
      return NextResponse.json(
        { success: false, error: '올바른 휴대폰 번호 형식이 아닙니다.' },
        { status: 400 },
      );
    }

    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      // SMS 관련 컬럼들을 g5_config 테이블에 추가 (없는 경우만)
      const smsColumns = [
        'cf_sms_use VARCHAR(10) NOT NULL DEFAULT ""',
        'cf_sms_type VARCHAR(10) NOT NULL DEFAULT ""',
        'cf_icode_server_ip VARCHAR(50) NOT NULL DEFAULT "211.172.232.124"',
        'cf_icode_server_port VARCHAR(10) NOT NULL DEFAULT "7295"',
        'cf_icode_id VARCHAR(50) NOT NULL DEFAULT ""',
        'cf_icode_pw VARCHAR(100) NOT NULL DEFAULT ""',
        'cf_icode_token_key VARCHAR(100) NOT NULL DEFAULT ""',
        'cf_phone VARCHAR(20) NOT NULL DEFAULT ""',
        'de_sms_use2 TINYINT(1) NOT NULL DEFAULT 0',
        'de_sms_use3 TINYINT(1) NOT NULL DEFAULT 0',
        'de_admin_company_name VARCHAR(100) NOT NULL DEFAULT "UDIGN"',
        'de_admin_company_tel VARCHAR(20) NOT NULL DEFAULT ""',
        'de_sms_hp VARCHAR(20) NOT NULL DEFAULT ""',
      ];

      for (const column of smsColumns) {
        try {
          await connection.execute(`ALTER TABLE g5_config ADD COLUMN ${column}`);
        } catch (error) {
          // 컬럼이 이미 존재하면 무시
          console.log(`컬럼 추가 시도 중 오류 (이미 존재할 수 있음): ${error}`);
        }
      }

      // SMS 설정 업데이트
      await connection.execute(
        `
        UPDATE g5_config SET
          cf_sms_use = 'icode',
          cf_sms_type = ?,
          cf_icode_id = ?,
          cf_icode_pw = ?,
          cf_icode_token_key = ?,
          cf_phone = ?,
          cf_icode_server_ip = '211.172.232.124',
          cf_icode_server_port = '7295',
          de_sms_use2 = 1,
          de_sms_use3 = 1,
          de_admin_company_name = 'UDIGN',
          de_admin_company_tel = ?,
          de_sms_hp = ?
        WHERE cf_id = 1
      `,
        [cf_sms_type, cf_icode_id, cf_icode_pw, cf_icode_token_key, cf_phone, cf_phone, cf_phone],
      );

      // sms5_config 테이블도 업데이트 시도
      try {
        await connection.execute(
          `
          INSERT INTO sms5_config (cf_phone, cf_datetime) 
          VALUES (?, NOW()) 
          ON DUPLICATE KEY UPDATE 
          cf_phone = VALUES(cf_phone),
          cf_datetime = NOW()
        `,
          [cf_phone],
        );
      } catch (error) {
        console.log('sms5_config 테이블 업데이트 시도 중 오류:', error);
      }

      await connection.commit();
      await connection.end();

      return NextResponse.json({
        success: true,
        message: 'SMS 설정이 성공적으로 저장되었습니다.',
      });
    } catch (error) {
      await connection.rollback();
      await connection.end();
      throw error;
    }
  } catch (error) {
    console.error('SMS 설정 저장 실패:', error);
    return NextResponse.json(
      { success: false, error: '설정 저장에 실패했습니다.' },
      { status: 500 },
    );
  }
};
