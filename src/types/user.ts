export interface User {
  mb_no: number;
  mb_id: string;
  mb_name: string;
  mb_nick: string;
  mb_email: string;
  mb_level: number;
  mb_datetime: string;
  mb_today_login: string;
  mb_login_ip: string;
}

export interface LoginRequest {
  mb_id: string;
  password: string;
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
}
