import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { sendPasswordLostEmail } from '@/lib/email';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export const POST = async (request: NextRequest) => {
  try {
    const { mb_email } = await request.json();

    // 필수 필드 검증
    if (!mb_email) {
      return NextResponse.json(
        { success: false, message: '이메일 주소를 입력해주세요.' },
        { status: 400 },
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[0-9a-zA-Z_-]+@[0-9a-zA-Z_-]+\.[0-9a-zA-Z_-]+$/;
    if (!emailRegex.test(mb_email.trim())) {
      return NextResponse.json(
        { success: false, message: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 },
      );
    }

    // 해당 이메일을 가진 회원이 있는지 확인
    const members = (await executeQuery(
      'SELECT COUNT(*) as cnt FROM g5_member WHERE mb_email = ?',
      [mb_email],
    )) as unknown[];

    const memberCount = (members[0] as { cnt: number }).cnt;

    if (memberCount > 1) {
      return NextResponse.json(
        {
          success: false,
          message: '동일한 메일주소가 2개 이상 존재합니다. 관리자에게 문의하여 주십시오.',
        },
        { status: 400 },
      );
    }

    // 회원 정보 조회
    const memberData = (await executeQuery(
      'SELECT mb_no, mb_id, mb_name, mb_nick, mb_email, mb_datetime, mb_leave_date FROM g5_member WHERE mb_email = ?',
      [mb_email],
    )) as unknown[];

    if (memberData.length === 0) {
      return NextResponse.json(
        { success: false, message: '존재하지 않는 회원입니다.' },
        { status: 404 },
      );
    }

    const member = memberData[0] as {
      mb_no: number;
      mb_id: string;
      mb_name: string;
      mb_nick: string;
      mb_email: string;
      mb_datetime: string;
      mb_leave_date: string;
    };

    // 탈퇴한 회원인지 확인
    if (member.mb_leave_date && member.mb_leave_date !== '0000-00-00 00:00:00') {
      return NextResponse.json({ success: false, message: '탈퇴한 회원입니다.' }, { status: 400 });
    }

    // 관리자 계정인지 확인 (mb_level이 10인 경우 관리자로 가정)
    const adminCheck = (await executeQuery('SELECT mb_level FROM g5_member WHERE mb_id = ?', [
      member.mb_id,
    ])) as unknown[];

    if (adminCheck.length > 0 && (adminCheck[0] as { mb_level: number }).mb_level >= 10) {
      return NextResponse.json(
        { success: false, message: '관리자 아이디는 접근 불가합니다.' },
        { status: 403 },
      );
    }

    // 임시 비밀번호 생성 (6자리 숫자)
    const changePassword = Math.floor(100000 + Math.random() * 900000).toString();

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(changePassword);

    // 어떠한 회원정보도 포함되지 않은 일회용 난수 생성
    const mbNonce = crypto.randomBytes(16).toString('hex');

    // 임시비밀번호와 난수를 mb_lost_certify 필드에 저장
    const mbLostCertify = `${mbNonce} ${hashedPassword}`;

    await executeQuery('UPDATE g5_member SET mb_lost_certify = ? WHERE mb_id = ?', [
      mbLostCertify,
      member.mb_id,
    ]);

    // 인증 링크 생성
    const siteUrl =
      process.env.NODE_ENV === 'production' ? 'https://udign.vercel.app' : 'http://localhost:3000';
    const certifyUrl = `${siteUrl}/shop/reset-password?mb_no=${member.mb_no}&mb_nonce=${mbNonce}`;

    // 현재 시간
    const timestamp = new Date().toLocaleString('ko-KR');

    // 이메일 발송
    const emailSent = await sendPasswordLostEmail({
      memberName: member.mb_name,
      memberNick: member.mb_nick,
      memberId: member.mb_id,
      memberEmail: member.mb_email,
      changePassword: changePassword,
      certifyUrl: certifyUrl,
      siteName: 'UDIGN',
      siteUrl: siteUrl,
      timestamp: timestamp,
    });

    if (!emailSent) {
      return NextResponse.json(
        { success: false, message: '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${mb_email} 메일로 회원아이디와 비밀번호를 인증할 수 있는 메일이 발송되었습니다.`,
    });
  } catch (error) {
    console.error('Password lost API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 },
    );
  }
};
