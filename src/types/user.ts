export interface User {
  mb_no: number;
  mb_id: string;
  mb_name: string;
  mb_nick: string;
  mb_email: string;
  mb_hp: string;
  mb_level: number;
  mb_datetime: string;
  mb_today_login: string;
  mb_login_ip: string;
}

// 관리자 페이지용 확장된 회원 정보
export interface AdminUser extends User {
  mb_tel?: string;
  mb_leave_date?: string;
  mb_intercept_date?: string;
  mb_status: 'normal' | 'leave' | 'blocked';
  mb_certify?: string;
  mb_adult?: boolean;
  mb_email_certify?: boolean;
  mb_sms?: boolean;
  mb_mailling?: boolean;
  mb_open?: boolean;
  mb_point?: number;
}

// 회원 상태 변경 요청
export interface UpdateMemberStatusRequest {
  mb_id: string;
  status: 'normal' | 'leave' | 'blocked';
}

// 회원 목록 조회 파라미터
export interface MemberListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 회원 목록 응답
export interface MemberListResponse {
  members: AdminUser[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface LoginRequest {
  mb_id: string;
  password: string;
  auto_login?: boolean;
}

export interface RegisterRequest {
  mb_id: string;
  mb_password: string;
  mb_name: string;
  mb_nick: string;
  mb_email: string;
  mb_hp?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  autoLoginKey?: string;
}
