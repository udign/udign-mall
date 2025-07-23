import { NextResponse } from 'next/server';
import { getSMSConfig, getSMSSettings, canSendSMS } from '@/lib/sms';
import { executeQuery } from '@/lib/database';
import { RowDataPacket } from 'mysql2';

export const GET = async () => {
  try {
    const diagnosis = {
      timestamp: new Date().toISOString(),
      overall_status: '정상',
      issues: [] as string[],
      warnings: [] as string[],
      configs: {},
      recommendations: [] as string[],
    };

    // 1. SMS 기본 설정 확인
    const smsConfig = await getSMSConfig();
    diagnosis.configs = { ...diagnosis.configs, smsConfig };

    if (!smsConfig) {
      diagnosis.issues.push('SMS 설정을 불러올 수 없습니다');
      diagnosis.overall_status = '오류';
    } else {
      // SMS 사용 여부 확인
      if (smsConfig.cf_sms_use !== 'icode') {
        diagnosis.issues.push('SMS 사용이 비활성화되어 있습니다 (cf_sms_use가 icode가 아님)');
        diagnosis.overall_status = '오류';
      }

      // 인증 정보 확인
      if (!smsConfig.cf_icode_token_key && (!smsConfig.cf_icode_id || !smsConfig.cf_icode_pw)) {
        diagnosis.issues.push('아이코드 인증 정보가 설정되지 않았습니다 (토큰키 또는 ID/PW 필요)');
        diagnosis.overall_status = '오류';
      }

      // 회신번호 확인
      if (!smsConfig.cf_phone) {
        diagnosis.issues.push('회신번호가 설정되지 않았습니다');
        diagnosis.overall_status = '오류';
      }
    }

    // 2. SMS 사용 설정 확인
    const smsSettings = await getSMSSettings();
    diagnosis.configs = { ...diagnosis.configs, smsSettings };

    if (!smsSettings) {
      diagnosis.issues.push('SMS 사용 설정을 불러올 수 없습니다');
      diagnosis.overall_status = '오류';
    } else {
      // 무통장입금 SMS 사용 여부 확인
      if (!smsSettings.de_sms_use2) {
        diagnosis.issues.push('무통장입금 SMS 사용이 비활성화되어 있습니다 (de_sms_use2 = false)');
        diagnosis.overall_status = '오류';
      }

      // 일반주문 SMS 사용 여부 확인
      if (!smsSettings.de_sms_use3) {
        diagnosis.warnings.push('일반주문 SMS 사용이 비활성화되어 있습니다 (de_sms_use3 = false)');
      }

      // 계좌번호 확인
      if (!smsSettings.bank_account || smsSettings.bank_account === '계좌정보를 설정해주세요') {
        diagnosis.issues.push('무통장입금 계좌번호가 설정되지 않았습니다');
        diagnosis.overall_status = '오류';
      }
    }

    // 3. SMS 발송 가능 여부 확인
    const canSend = await canSendSMS();
    diagnosis.configs = { ...diagnosis.configs, canSendSMS: canSend };

    if (!canSend) {
      diagnosis.issues.push('SMS 발송이 불가능한 상태입니다');
      diagnosis.overall_status = '오류';
    }

    // 4. 데이터베이스 테이블 구조 확인
    try {
      // g5_config 테이블의 SMS 관련 컬럼 확인
      const configColumns = (await executeQuery(`
        SHOW COLUMNS FROM g5_config 
        WHERE Field IN ('cf_sms_use', 'cf_icode_id', 'cf_icode_pw', 'cf_icode_token_key', 'cf_phone', 'de_sms_use2', 'de_sms_use3')
      `)) as RowDataPacket[];

      const missingColumns = [];
      const requiredColumns = [
        'cf_sms_use',
        'cf_icode_id',
        'cf_icode_pw',
        'cf_icode_token_key',
        'cf_phone',
        'de_sms_use2',
        'de_sms_use3',
      ];

      for (const col of requiredColumns) {
        if (!configColumns.find((c) => c.Field === col)) {
          missingColumns.push(col);
        }
      }

      if (missingColumns.length > 0) {
        diagnosis.issues.push(
          `g5_config 테이블에 필요한 컬럼이 없습니다: ${missingColumns.join(', ')}`,
        );
        diagnosis.overall_status = '오류';
      }

      diagnosis.configs = {
        ...diagnosis.configs,
        configColumns: configColumns.map((c) => c.Field),
      };
    } catch (error) {
      diagnosis.issues.push(`g5_config 테이블 구조 확인 실패: ${error}`);
      diagnosis.overall_status = '오류';
    }

    // 5. g5_shop_default 테이블 계좌정보 확인
    try {
      const bankAccountRows = (await executeQuery(`
        SELECT de_bank_account FROM g5_shop_default LIMIT 1
      `)) as RowDataPacket[];

      if (bankAccountRows.length === 0) {
        diagnosis.issues.push('g5_shop_default 테이블에 데이터가 없습니다');
        diagnosis.overall_status = '오류';
      } else {
        const bankAccount = bankAccountRows[0].de_bank_account;
        if (!bankAccount || bankAccount.trim() === '') {
          diagnosis.issues.push('g5_shop_default 테이블의 de_bank_account가 비어있습니다');
          diagnosis.overall_status = '오류';
        }
      }
    } catch (error) {
      diagnosis.issues.push(`g5_shop_default 테이블 확인 실패: ${error}`);
      diagnosis.overall_status = '오류';
    }

    // 권장사항 생성
    if (diagnosis.issues.length > 0) {
      diagnosis.recommendations.push('관리자 페이지 > SMS 설정에서 아이코드 인증정보를 입력하세요');
      diagnosis.recommendations.push(
        '관리자 페이지 > 쇼핑몰 설정에서 무통장입금 계좌번호를 설정하세요',
      );
    }

    if (smsConfig?.cf_icode_id && smsConfig?.cf_icode_pw && !smsConfig?.cf_icode_token_key) {
      diagnosis.warnings.push('구형 ID/PW 방식을 사용 중입니다. 토큰키 방식 사용을 권장합니다');
      diagnosis.recommendations.push('아이코드 사이트에서 토큰키를 발급받아 설정하세요');
    }

    return NextResponse.json({
      success: true,
      diagnosis,
    });
  } catch (error) {
    console.error('SMS 진단 실패:', error);
    return NextResponse.json(
      { success: false, error: 'SMS 진단 중 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
