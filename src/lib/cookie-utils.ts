// 쿠키 설정 함수
export const setCookie = (name: string, value: string, hours: number) => {
  if (typeof window === 'undefined') return;

  const date = new Date();
  date.setTime(date.getTime() + hours * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

// 쿠키 가져오기 함수
export const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null;

  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

// 팝업 쿠키 이름 생성
export const getPopupCookieName = (popupId: number): string => {
  return `hd_pops_${popupId}`;
};

// 팝업이 이미 숨겨졌는지 확인
export const isPopupHidden = (popupId: number): boolean => {
  const cookieName = getPopupCookieName(popupId);
  return getCookie(cookieName) === '1';
};

// 팝업 숨김 설정
export const hidePopup = (popupId: number, hours: number) => {
  const cookieName = getPopupCookieName(popupId);
  setCookie(cookieName, '1', hours);
};
