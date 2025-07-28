'use client';

import { usePathname } from 'next/navigation';
import { i18n } from '../../i18n.config';

export const useLocalePath = () => {
  const pathname = usePathname();

  // 현재 경로에서 언어 코드 추출
  const getCurrentLocale = () => {
    const segments = pathname.split('/');
    const locale = segments[1];

    // 타입 안전한 방식으로 체크
    if (locale === 'ko' || locale === 'en') {
      return locale;
    }

    return i18n.defaultLocale;
  };

  // 경로에 현재 언어 추가
  const addLocalePath = (path: string) => {
    const currentLocale = getCurrentLocale();

    // 이미 언어가 포함된 경우 그대로 반환
    if (path.startsWith(`/${currentLocale}/`)) {
      return path;
    }

    // 절대 경로가 아닌 경우 처리
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    return `/${currentLocale}${path}`;
  };

  return addLocalePath;
};
