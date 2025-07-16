// 팝업 장치 타입
export type PopupDevice = 'pc' | 'mobile' | 'both';

// 팝업 구분 타입
export type PopupDivision = 'comm' | 'shop' | 'both';

// 팝업 데이터 인터페이스
export interface Popup {
  nw_id: number;
  nw_division: PopupDivision;
  nw_device: PopupDevice;
  nw_begin_time: string; // datetime
  nw_end_time: string; // datetime
  nw_disable_hours: number;
  nw_left: number;
  nw_top: number;
  nw_height: number;
  nw_width: number;
  nw_subject: string;
  nw_content: string;
  nw_content_html: number; // 0 or 1
  created_at?: string;
  updated_at?: string;
}

// 팝업 목록 아이템 (목록에서 표시용)
export interface PopupListItem {
  nw_id: number;
  nw_subject: string;
  nw_device: PopupDevice;
  nw_division: PopupDivision;
  nw_begin_time: string;
  nw_end_time: string;
  nw_disable_hours: number;
  nw_left: number;
  nw_top: number;
  nw_width: number;
  nw_height: number;
  is_active: boolean; // 현재 활성화 상태
}

// 팝업 목록 응답 타입
export interface PopupListResponse {
  popups: PopupListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 팝업 생성/수정용 타입
export interface CreatePopupRequest {
  nw_division: PopupDivision;
  nw_device: PopupDevice;
  nw_begin_time: string;
  nw_end_time: string;
  nw_disable_hours: number;
  nw_left: number;
  nw_top: number;
  nw_height: number;
  nw_width: number;
  nw_subject: string;
  nw_content: string;
  nw_content_html: number;
}

export interface UpdatePopupRequest extends CreatePopupRequest {
  nw_id: number;
}

// 팝업 삭제 요청 타입
export interface DeletePopupRequest {
  nw_id: number;
}

// 팝업 장치 라벨
export const POPUP_DEVICE_LABELS: Record<PopupDevice, string> = {
  pc: 'PC',
  mobile: '모바일',
  both: '모두',
};

// 팝업 구분 라벨
export const POPUP_DIVISION_LABELS: Record<PopupDivision, string> = {
  comm: '커뮤니티',
  shop: '쇼핑몰',
  both: '커뮤니티와 쇼핑몰',
};

// 사용자 화면 팝업 표시용 타입
export interface DisplayPopup {
  nw_id: number;
  nw_subject: string;
  nw_content: string;
  nw_left: number;
  nw_top: number;
  nw_width: number;
  nw_height: number;
  nw_disable_hours: number;
}

// 데이터베이스 조회 결과 타입 (시간 유효성 포함)
export interface PopupQueryResult {
  nw_id: number;
  nw_subject: string;
  nw_content: string;
  nw_left: number;
  nw_top: number;
  nw_width: number;
  nw_height: number;
  nw_disable_hours: number;
  nw_begin_time: string;
  nw_end_time: string;
  nw_device: PopupDevice;
  nw_division: PopupDivision;
  is_time_valid: number; // 0 or 1
}

// 팝업 조회 응답 타입
export interface PopupDisplayResponse {
  success: boolean;
  popups: DisplayPopup[];
  error?: string;
}
