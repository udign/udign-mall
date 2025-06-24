import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from './database';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/** 비밀번호를 bcrypt로 해시화하여 안전하게 저장할 수 있도록 변환 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/** 입력된 비밀번호와 해시된 비밀번호를 비교하여 일치 여부 확인 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// 사용자 정보를 기반으로 JWT 토큰을 생성하여 인증에 사용
export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      mb_no: user.mb_no,
      mb_id: user.mb_id,
      mb_level: user.mb_level,
    },
    JWT_SECRET,
    { expiresIn: '24h' },
  );
};

// JWT 토큰의 유효성을 검증하고 토큰에 담긴 사용자 정보를 반환
export const verifyToken = (token: string): unknown => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

// 새로운 사용자를 데이터베이스에 등록하고 회원가입 처리
export const registerUser = async (userData: RegisterRequest): Promise<AuthResponse> => {
  try {
    // 중복 아이디 체크
    const existingUser = (await executeQuery('SELECT mb_id FROM g5_member WHERE mb_id = ?', [
      userData.mb_id,
    ])) as unknown[];

    if (existingUser.length > 0) {
      return {
        success: false,
        message: '이미 사용중인 아이디입니다.',
      };
    }

    // 중복 이메일 체크
    const existingEmail = (await executeQuery('SELECT mb_email FROM g5_member WHERE mb_email = ?', [
      userData.mb_email,
    ])) as unknown[];

    if (existingEmail.length > 0) {
      return {
        success: false,
        message: '이미 사용중인 이메일입니다.',
      };
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(userData.mb_password);

    // 사용자 등록 - 모든 필수 필드 포함
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const today = new Date().toISOString().slice(0, 10);

    await executeQuery(
      `INSERT INTO g5_member (
        mb_id, mb_password, mb_name, mb_nick, mb_nick_date, mb_email, mb_homepage,
        mb_level, mb_sex, mb_birth, mb_tel, mb_hp, mb_certify, mb_adult, mb_dupinfo,
        mb_zip, mb_zip1, mb_zip2, mb_addr1, mb_addr2, mb_addr3, mb_addr_jibeon,
        mb_signature, mb_recommend, mb_point, mb_today_login, mb_login_ip, mb_datetime, mb_ip,
        mb_leave_date, mb_intercept_date, mb_email_certify2, mb_memo, mb_lost_certify,
        mb_mailling, mb_sms, mb_open, mb_open_date, mb_profile, mb_memo_call, mb_memo_cnt, mb_scrap_cnt,
        mb_1, mb_2, mb_3, mb_4, mb_5, mb_6, mb_7, mb_8, mb_9, mb_10,
        as_per, as_noti, as_msg, as_exp, as_level, as_max, as_chadan
      ) VALUES (
        ?, ?, ?, ?, ?, ?, '',
        2, '', '', '', ?, '', 0, '',
        '', '', '', '', '', '', '',
        '', '', 0, ?, '', ?, ?,
        '', '', '', '', '',
        0, 0, 0, ?, '', '', 0, 0,
        '', '', '', '', '', '', '', '', '', '',
        0, 0, 0, 0, 1, 0, ''
      )`,
      [
        userData.mb_id,
        hashedPassword,
        userData.mb_name,
        userData.mb_nick,
        today,
        userData.mb_email,
        userData.mb_hp || '',
        now, // mb_today_login
        now, // mb_datetime
        '127.0.0.1',
        today, // mb_open_date
      ],
    );

    // 등록된 사용자 정보 조회
    const newUser = (await executeQuery('SELECT * FROM g5_member WHERE mb_id = ?', [
      userData.mb_id,
    ])) as unknown[];

    if (newUser.length > 0) {
      const user = newUser[0] as User;
      const token = generateToken(user);

      return {
        success: true,
        message: '회원가입이 완료되었습니다.',
        user,
        token,
      };
    }

    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    };
  }
};

// 사용자 로그인을 처리하고 인증 토큰을 발급
export const loginUser = async (loginData: LoginRequest): Promise<AuthResponse> => {
  try {
    // 사용자 조회
    const users = (await executeQuery('SELECT * FROM g5_member WHERE mb_id = ?', [
      loginData.mb_id,
    ])) as unknown[];

    if (users.length === 0) {
      return {
        success: false,
        message: '존재하지 않는 아이디입니다.',
      };
    }

    const user = users[0] as User & { mb_password: string };

    // 비밀번호 확인
    const isPasswordValid = await verifyPassword(loginData.password, user.mb_password);

    if (!isPasswordValid) {
      return {
        success: false,
        message: '비밀번호가 일치하지 않습니다.',
      };
    }

    // 로그인 정보 업데이트
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await executeQuery('UPDATE g5_member SET mb_today_login = ?, mb_login_ip = ? WHERE mb_id = ?', [
      now,
      '127.0.0.1',
      loginData.mb_id,
    ]);

    // 비밀번호 제외한 사용자 정보
    const userWithoutPassword: User = {
      mb_no: user.mb_no,
      mb_id: user.mb_id,
      mb_name: user.mb_name,
      mb_nick: user.mb_nick,
      mb_email: user.mb_email,
      mb_level: user.mb_level,
      mb_datetime: user.mb_datetime,
      mb_today_login: user.mb_today_login,
      mb_login_ip: user.mb_login_ip,
    };
    const token = generateToken(userWithoutPassword);

    return {
      success: true,
      message: '로그인 성공',
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
    };
  }
};
