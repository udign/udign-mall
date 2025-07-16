import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  // Vercel Storage의 이미지 URL 생성
  return `${process.env.VERCEL_BLOB_BASE_URL}/item/${imagePath}`;
};

// 파일 확장자 추출 함수
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || 'jpg';
};

// URL에서 item/ 이후의 경로를 추출하는 함수 (예: item/1737134574/main.jpg → 1737134574/main.jpg)
export const getFilenameFromUrl = (url: string): string => {
  const itemIndex = url.indexOf('/item/');
  if (itemIndex !== -1) {
    return url.substring(itemIndex + 6); // '/item/' 이후 부분 반환
  }
  // fallback: 기존 방식
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1];
};

// 주문번호 포맷팅 함수
export const formatOrderId = (odId: string | number): string => {
  const odIdStr = String(odId);
  if (odIdStr.length === 16) {
    return `${odIdStr.substring(0, 8)}-${odIdStr.substring(8)}`;
  }
  return `${odIdStr.substring(0, 6)}-${odIdStr.substring(6)}`;
};

// 날짜 포맷팅 함수 (YYYY-MM-DD HH:mm 형태)
export const formatDate = (dateString: string): string => {
  return dayjs(dateString).locale('ko').format('YYYY-MM-DD HH:mm');
};

// 날짜만 포맷팅 함수 (YYYY-MM-DD 형태)
export const formatDateOnly = (dateString: string): string => {
  return dayjs(dateString).locale('ko').format('YYYY-MM-DD');
};

// 시간만 포맷팅 함수 (HH:mm 형태)
export const formatTimeOnly = (dateString: string): string => {
  return dayjs(dateString).locale('ko').format('HH:mm');
};

// Date 객체를 YYYY-MM-DD HH:MM:SS 형식으로 포맷
export const formatDateTime = (date: Date): string => {
  return dayjs(date).locale('ko').format('YYYY-MM-DD HH:mm:ss');
};

// 텍스트 자르기 함수
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
