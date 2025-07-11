import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
