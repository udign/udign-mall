import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ko from '@/locales/ko.json';
import en from '@/locales/en.json';

const resources = {
  ko: {
    translation: ko,
  },
  en: {
    translation: en,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'ko', // 초기 언어를 명시적으로 한국어로 설정
  fallbackLng: 'ko',
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
  },
  // SSR 호환성을 위해 언어 감지 비활성화
  react: {
    useSuspense: false,
  },
});

export default i18n;
